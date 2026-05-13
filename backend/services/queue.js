const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const PROCESS_TYPE = process.env.PROCESS_TYPE || 'api'; // 'api' or 'worker'

const connection = new IORedis(REDIS_URL, { 
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// 1. Ingestion Queue (Always active for Producer)
const ingestionQueue = new Queue('ingestion', { connection });

// 2. Worker (Only active in Worker process)
if (PROCESS_TYPE === 'worker') {
  const { parsePDF, createChunks } = require('./ingestion');
  const { addChunkToRAG } = require('../utils/rag');
  
  console.log(`[Worker] Initializing background ingestion worker...`);
  
  const worker = new Worker('ingestion', async (job) => {
    const { documentId, filename, path, metadata } = job.data;
    console.log(`[Worker] Processing: ${filename}`);

    try {
      if (!fs.existsSync(path)) throw new Error(`File not found: ${path}`);
      const buffer = fs.readFileSync(path);
      
      let content = "";
      let chunks = [];

      if (filename.toLowerCase().endsWith('.pdf')) {
        const pages = await parsePDF(buffer);
        content = pages.map(p => p.text).join('\n\n');
        chunks = createChunks(pages);
      } else {
        content = buffer.toString('utf-8');
        chunks = [{ text: content, metadata: { page: 1 } }];
      }

      for (let i = 0; i < chunks.length; i++) {
        await addChunkToRAG(`${documentId}_${i}`, chunks[i].text, {
          ...metadata,
          documentId,
          filename,
          page: chunks[i].metadata.page,
          index: i
        });
        await job.updateProgress(Math.round((i / chunks.length) * 100));
      }

      console.log(`[Worker] Completed: ${filename}`);
      if (fs.existsSync(path)) fs.unlinkSync(path);

      return { status: 'completed', documentId, text: content };
    } catch (err) {
      console.error(`[Worker] Failed: ${filename}`, err);
      if (path && fs.existsSync(path)) fs.unlinkSync(path);
      throw err;
    }
  }, { connection, concurrency: 1 });

  worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
  worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed successfully`));
}

module.exports = { ingestionQueue };
