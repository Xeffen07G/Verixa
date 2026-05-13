const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { parsePDF, createChunks } = require('./ingestion');
const { addChunkToRAG } = require('../utils/rag');
const graphService = require('./graph');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log(`[Redis] Attempting connection to: ${REDIS_URL.split('@')[1] || 'localhost'}`);

const connection = new IORedis(REDIS_URL, { 
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

connection.on('connect', () => console.log('[Redis] Connected successfully'));
connection.on('error', (err) => console.error('[Redis] Connection Error:', err.message));

// 1. Define Ingestion Queue
const ingestionQueue = new Queue('ingestion', { connection });

const fs = require('fs');

// 2. Define Worker
const worker = new Worker('ingestion', async (job) => {
  console.log(`[Worker] Job Started: ${job.id} (${job.data.filename})`);
  const { documentId, filename, path, metadata } = job.data;
  console.log(`[Worker] Processing document: ${filename} (Path: ${path})`);

  try {
    // 1. Give the Express event loop a breath
    await new Promise(r => setTimeout(r, 500));

    if (!fs.existsSync(path)) throw new Error(`File not found: ${path}`);
    const buffer = fs.readFileSync(path);
    const pages = await parsePDF(buffer);
    const chunks = createChunks(pages);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${documentId}_${i}`;
      
      /*
      // Disable RAG indexing for verification phase
      await addChunkToRAG(chunkId, chunks[i].text, {
        ...metadata,
        documentId,
        filename,
        page: chunks[i].metadata.page,
        index: i
      });
      */
      
      /* 
      // Build Intelligence Graph (Disabled temporarily for performance mitigation)
      await graphService.extractIntelligence(chunkId, chunks[i].text, documentId);
      */

      // Update progress
      await job.updateProgress(Math.round((i / chunks.length) * 100));
    }


    console.log(`[Worker] Completed: ${filename}`);
    
    // Cleanup temporary file
    if (fs.existsSync(path)) fs.unlinkSync(path);

    return { 
      status: 'completed', 
      chunks: chunks.length, 
      documentId,
      text: pages.map(p => p.text).join('\n\n')
    };
  } catch (err) {
    console.error(`[Worker] Failed: ${filename}`, err);
    throw err;
  } finally {
    if (path && fs.existsSync(path)) {
      try { fs.unlinkSync(path); } catch (e) {}
    }
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = { ingestionQueue };
