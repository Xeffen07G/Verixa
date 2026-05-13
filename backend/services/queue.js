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

// 2. Define Worker (Temporarily disabled for stabilization)
/*
const worker = new Worker('ingestion', async (job) => {
  // worker logic here
}, { connection });
*/

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = { ingestionQueue };
