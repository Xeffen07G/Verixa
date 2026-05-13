const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');
const IngestionJob = require('../models/IngestionJob');
const IngestionChunk = require('../models/IngestionChunk');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const PROCESS_TYPE = process.env.PROCESS_TYPE || 'api';

const connection = new IORedis(REDIS_URL, { 
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// 1. Define Standard Queues & DLQs
const queues = {
  extract: new Queue('extract', { connection }),
  chunk: new Queue('chunk', { connection }),
  embed: new Queue('embed', { connection }),
  index: new Queue('index', { connection }),
  // Dead Letter Queues
  extractDLQ: new Queue('extractDLQ', { connection }),
  chunkDLQ: new Queue('chunkDLQ', { connection }),
  embedDLQ: new Queue('embedDLQ', { connection }),
  indexDLQ: new Queue('indexDLQ', { connection })
};

const ingestionQueue = queues.extract;

/**
 * Orchestrator: Transitions job to next stage via DB state update and queue enqueuing.
 */
async function transitionToNextStage(documentId, nextStage, data = {}) {
  const jobRecord = await IngestionJob.findOneAndUpdate(
    { documentId }, 
    { stage: nextStage, status: nextStage === 'completed' ? 'completed' : nextStage + 'ing' },
    { new: true }
  );

  if (nextStage !== 'completed') {
    const nextQueue = queues[nextStage];
    const job = await nextQueue.add(nextStage, { documentId, ...data }, { 
      removeOnComplete: true, 
      attempts: 3, 
      backoff: { type: 'exponential', delay: 5000 } 
    });
    jobRecord.jobId = job.id;
    await jobRecord.save();
  }
}

/**
 * DLQ Handler: Moves terminal failures to the appropriate DLQ
 */
async function moveToDLQ(stage, job, err) {
  const { documentId } = job.data;
  console.error(`[DLQ] Stage ${stage} failed for ${documentId}:`, err.message);
  
  await IngestionJob.findOneAndUpdate({ documentId }, { status: 'failed', error: err.message });
  await queues[`${stage}DLQ`].add(stage, { ...job.data, error: err.message, failedAt: new Date() });
}

// 2. Staged Pipeline Workers
if (PROCESS_TYPE === 'worker') {
  const { parsePDF, createChunks } = require('./ingestion');
  const { generateEmbedding } = require('../utils/rag');

  console.log(`[Worker] Initializing DB-Driven Pipeline with DLQ protection...`);

  // --- STAGE 1: EXTRACTION ---
  const extractWorker = new Worker('extract', async (job) => {
    const { documentId, filename, path } = job.data;
    const tStart = Date.now();
    
    const buffer = fs.readFileSync(path);
    let text = "";
    if (filename.toLowerCase().endsWith('.pdf')) {
      const pages = await parsePDF(buffer);
      text = pages.map(p => p.text).join('\n\n');
    } else {
      text = buffer.toString('utf-8');
    }

    await IngestionJob.findOneAndUpdate({ documentId }, { 'timing.extraction': Date.now() - tStart, progress: 25 });
    await transitionToNextStage(documentId, 'chunk', { filename, text, path });
  }, { connection, concurrency: 2 });

  // --- STAGE 2: CHUNKING ---
  const chunkWorker = new Worker('chunk', async (job) => {
    const { documentId, text, path } = job.data;
    const tStart = Date.now();
    
    const chunks = createChunks([{ text: text.slice(0, 500000) }]).slice(0, 500);

    // Persist chunks separately to keep IngestionJob light
    await IngestionChunk.deleteMany({ documentId }); // Clean retry
    await IngestionChunk.insertMany(chunks.map((c, i) => ({
      documentId,
      chunkIndex: i,
      text: c.text,
      metadata: c.metadata
    })));

    await IngestionJob.findOneAndUpdate({ documentId }, { 
      chunksCount: chunks.length,
      'timing.chunking': Date.now() - tStart,
      progress: 50
    });

    await transitionToNextStage(documentId, 'embed', { path });
  }, { connection, concurrency: 2 });

  // --- STAGE 3: EMBEDDING ---
  const embedWorker = new Worker('embed', async (job) => {
    const { documentId, path } = job.data;
    const tStart = Date.now();
    
    const chunks = await IngestionChunk.find({ documentId, status: 'pending' }).sort({ chunkIndex: 1 });
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i].text);
      chunks[i].embedding = embedding;
      chunks[i].status = 'embedded';
      await chunks[i].save();
      await job.updateProgress(Math.round((i / chunks.length) * 100));
    }

    await IngestionJob.findOneAndUpdate({ documentId }, { 
      'timing.embedding': Date.now() - tStart,
      progress: 75
    });

    await transitionToNextStage(documentId, 'index', { path });
  }, { connection, concurrency: 1 });

  // --- STAGE 4: INDEXING ---
  const indexWorker = new Worker('index', async (job) => {
    const { documentId, path } = job.data;
    const tStart = Date.now();
    
    const embeddedChunks = await IngestionChunk.find({ documentId, status: 'embedded' });
    const Knowledge = require('../models/Knowledge');
    
    for (const chunk of embeddedChunks) {
      await Knowledge.create({
        id: `${documentId}_${chunk.chunkIndex}`,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: { ...chunk.metadata, documentId }
      });
      chunk.status = 'indexed';
      await chunk.save();
    }

    await IngestionJob.findOneAndUpdate({ documentId }, { 
      'timing.indexing': Date.now() - tStart,
      'timing.end': new Date()
    });

    await transitionToNextStage(documentId, 'completed', { path });
    if (path && fs.existsSync(path)) try { fs.unlinkSync(path); } catch(e) {}
  }, { connection, concurrency: 4 });

  // Error handling for DLQ routing
  [extractWorker, chunkWorker, embedWorker, indexWorker].forEach(worker => {
    worker.on('failed', (job, err) => {
      if (job.attemptsMade >= job.opts.attempts) {
        moveToDLQ(worker.name, job, err);
      }
    });
  });

  // Stale Job Detector (Every 5 minutes)
  setInterval(async () => {
    const staleTime = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
    const stuckJobs = await IngestionJob.find({
      status: { $in: ['extracting', 'chunking', 'embedding', 'indexing'] },
      updatedAt: { $lt: staleTime }
    });

    for (const job of stuckJobs) {
      console.warn(`[Watchdog] Marking job ${job.documentId} as STALE`);
      job.status = 'failed';
      job.error = 'Job stuck or timed out';
      await job.save();
    }
  }, 5 * 60 * 1000);

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('[Worker] Shutdown...');
    await Promise.all([extractWorker.close(), chunkWorker.close(), embedWorker.close(), indexWorker.close()]);
    await connection.quit();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { ingestionQueue, ...queues };
