const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { parsePDF, createChunks } = require('./ingestion');
const { addChunkToRAG } = require('../utils/rag');
const graphService = require('./graph');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// 1. Define Ingestion Queue
const ingestionQueue = new Queue('ingestion', { connection });

// 2. Define Worker
const worker = new Worker('ingestion', async (job) => {
  const { documentId, filename, buffer, metadata } = job.data;
  console.log(`[Worker] Processing document: ${filename} (${documentId})`);

  try {
    const pages = await parsePDF(Buffer.from(buffer));
    const chunks = createChunks(pages);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${documentId}_${i}`;
      await addChunkToRAG(chunkId, chunks[i].text, {
        ...metadata,
        documentId,
        filename,
        page: chunks[i].metadata.page,
        index: i
      });
      
      // Build Intelligence Graph (Don't await to keep ingestion fast, but for now we do for reliability)
      await graphService.extractIntelligence(chunkId, chunks[i].text, documentId);

      // Update progress
      await job.updateProgress(Math.round((i / chunks.length) * 100));
    }


    console.log(`[Worker] Completed: ${filename}`);
    return { status: 'completed', chunks: chunks.length, documentId };
  } catch (err) {
    console.error(`[Worker] Failed: ${filename}`, err);
    throw err;
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = { ingestionQueue };
