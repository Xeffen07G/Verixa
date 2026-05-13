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
    const tStart = Date.now();
    const memStart = process.memoryUsage();
    
    console.log(`[Worker] JOB START: ${filename} (ID: ${job.id})`);
    console.log(`[Worker] Memory Start: RSS=${Math.round(memStart.rss/1024/1024)}MB, Heap=${Math.round(memStart.heapUsed/1024/1024)}MB`);

    try {
      if (!fs.existsSync(path)) throw new Error(`File not found: ${path}`);
      const buffer = fs.readFileSync(path);
      
      // Stage 1: Extraction
      const tExtract = Date.now();
      await job.updateProgress(10);
      let content = "";
      let chunks = [];

      if (filename.toLowerCase().endsWith('.pdf')) {
        const pages = await parsePDF(buffer);
        content = pages.map(p => p.text).join('\n\n');
        
        // Stage 2: Chunking
        await job.updateProgress(30);
        chunks = createChunks(pages);
      } else {
        content = buffer.toString('utf-8');
        chunks = [{ text: content, metadata: { page: 1 } }];
        await job.updateProgress(30);
      }
      const dExtract = Date.now() - tExtract;
      console.log(`[Worker] Extraction & Chunking complete (${dExtract}ms)`);

      // Stage 3: Embedding & Indexing
      const tIndex = Date.now();
      for (let i = 0; i < chunks.length; i++) {
        await addChunkToRAG(`${documentId}_${i}`, chunks[i].text, {
          ...metadata,
          documentId,
          filename,
          page: chunks[i].metadata.page,
          index: i
        });
        
        const prog = Math.min(30 + Math.round((i / chunks.length) * 70), 99);
        await job.updateProgress(prog);
      }
      const dIndex = Date.now() - tIndex;
      console.log(`[Worker] Indexing complete (${dIndex}ms) for ${chunks.length} chunks`);

      const totalTime = Date.now() - tStart;
      const memEnd = process.memoryUsage();
      console.log(`[Worker] JOB COMPLETE: ${filename} in ${totalTime}ms`);
      console.log(`[Worker] Memory Change: RSS=${Math.round((memEnd.rss - memStart.rss)/1024/1024)}MB`);

      if (fs.existsSync(path)) fs.unlinkSync(path);
      return { status: 'completed', documentId, chunks: chunks.length, time: totalTime };
    } catch (err) {
      console.error(`[Worker] JOB FAILED: ${filename}`, err);
      if (path && fs.existsSync(path)) try { fs.unlinkSync(path); } catch(e) {}
      throw err;
    }
  }, { 
    connection, 
    concurrency: 1,
    lockDuration: 300000, // 5 min timeout for heavy PDFs
  });

  worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
  worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} finalized.`));
}

module.exports = { ingestionQueue };
