const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');
const IngestionJob = require('../models/IngestionJob');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const PROCESS_TYPE = process.env.PROCESS_TYPE || 'api';

const connection = new IORedis(REDIS_URL, { 
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// 1. Define Queues
const extractQueue = new Queue('extract', { connection });
const chunkQueue = new Queue('chunk', { connection });
const embedQueue = new Queue('embed', { connection });
const indexQueue = new Queue('index', { connection });

// Legacy export for API compatibility
const ingestionQueue = extractQueue;

// 2. Multi-Stage Pipeline Workers
if (PROCESS_TYPE === 'worker') {
  const { parsePDF, createChunks } = require('./ingestion');
  const { addChunkToRAG, generateEmbedding } = require('../utils/rag');

  console.log(`[Worker] Initializing Staged Pipeline (Extract -> Chunk -> Embed -> Index)...`);

  // --- STAGE 1: EXTRACTION ---
  const extractWorker = new Worker('extract', async (job) => {
    const { documentId, filename, path } = job.data;
    const tStart = Date.now();
    
    await IngestionJob.findOneAndUpdate({ documentId }, { status: 'extracting', stage: 'extraction', progress: 10 });
    
    const buffer = fs.readFileSync(path);
    let text = "";
    if (filename.toLowerCase().endsWith('.pdf')) {
      const pages = await parsePDF(buffer);
      text = pages.map(p => p.text).join('\n\n');
    } else {
      text = buffer.toString('utf-8');
    }

    const duration = Date.now() - tStart;
    await IngestionJob.findOneAndUpdate({ documentId }, { 
      'timing.extraction': duration,
      progress: 25 
    });

    // Chain to next stage
    await chunkQueue.add('chunk', { documentId, filename, text, path }, { removeOnComplete: true });
    return { textLength: text.length };
  }, { connection, concurrency: 2 });

  // --- STAGE 2: CHUNKING ---
  const chunkWorker = new Worker('chunk', async (job) => {
    const { documentId, text, path } = job.data;
    const tStart = Date.now();
    
    await IngestionJob.findOneAndUpdate({ documentId }, { status: 'chunking', stage: 'chunking' });

    // Safeguard: Truncate massive files
    const truncatedText = text.slice(0, 500000); // 500k chars limit
    const chunks = createChunks([{ text: truncatedText }]);
    
    // Safeguard: Max 500 chunks
    const safeChunks = chunks.slice(0, 500);

    const duration = Date.now() - tStart;
    await IngestionJob.findOneAndUpdate({ documentId }, { 
      chunksCount: safeChunks.length,
      'timing.chunking': duration,
      progress: 50
    });

    // Chain to next stage (passing chunks as data)
    await embedQueue.add('embed', { documentId, chunks: safeChunks, path }, { removeOnComplete: true });
    return { chunks: safeChunks.length };
  }, { connection, concurrency: 2 });

  // --- STAGE 3: EMBEDDING ---
  const embedWorker = new Worker('embed', async (job) => {
    const { documentId, chunks, path } = job.data;
    const tStart = Date.now();
    
    await IngestionJob.findOneAndUpdate({ documentId }, { status: 'embedding', stage: 'embedding' });

    const embeddedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i].text);
      embeddedChunks.push({ ...chunks[i], embedding });
      await job.updateProgress(Math.round((i / chunks.length) * 100));
    }

    const duration = Date.now() - tStart;
    await IngestionJob.findOneAndUpdate({ documentId }, { 
      'timing.embedding': duration,
      progress: 75
    });

    await indexQueue.add('index', { documentId, embeddedChunks, path }, { removeOnComplete: true });
    return { embedded: embeddedChunks.length };
  }, { connection, concurrency: 1 }); // Embeddings are CPU heavy, limit concurrency

  // --- STAGE 4: INDEXING ---
  const indexWorker = new Worker('index', async (job) => {
    const { documentId, embeddedChunks, path } = job.data;
    const tStart = Date.now();
    
    await IngestionJob.findOneAndUpdate({ documentId }, { status: 'indexing', stage: 'indexing' });

    const Knowledge = require('../models/Knowledge');
    for (const chunk of embeddedChunks) {
      await Knowledge.create({
        id: `${documentId}_${Date.now()}_${Math.random()}`,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: { ...chunk.metadata, documentId }
      });
    }

    const duration = Date.now() - tStart;
    await IngestionJob.findOneAndUpdate({ documentId }, { 
      status: 'completed',
      progress: 100,
      'timing.indexing': duration,
      'timing.end': new Date()
    });

    if (path && fs.existsSync(path)) try { fs.unlinkSync(path); } catch(e) {}
    console.log(`[Worker] Pipeline finished for ${documentId}`);
    return { indexed: embeddedChunks.length };
  }, { connection, concurrency: 4 });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('[Worker] Graceful shutdown initiated...');
    await extractWorker.close();
    await chunkWorker.close();
    await embedWorker.close();
    await indexWorker.close();
    await connection.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { ingestionQueue, extractQueue, chunkQueue, embedQueue, indexQueue };
