let ingestionQueue = null;
let queues = {};

const REDIS_URL = process.env.REDIS_URL;
const PROCESS_TYPE = process.env.PROCESS_TYPE || 'api';
const SAFE_MODE = process.env.SAFE_MODE === 'true';

// 1. Lazy-loaded Redis & Queues
if (!SAFE_MODE && REDIS_URL) {
  try {
    const { Queue } = require('bullmq');
    const IORedis = require('ioredis');

    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      }
    });

    queues = {
      extract: new Queue('extract', { connection }),
      chunk: new Queue('chunk', { connection }),
      embed: new Queue('embed', { connection }),
      index: new Queue('index', { connection }),
      extractDLQ: new Queue('extractDLQ', { connection }),
      chunkDLQ: new Queue('chunkDLQ', { connection }),
      embedDLQ: new Queue('embedDLQ', { connection }),
      indexDLQ: new Queue('indexDLQ', { connection })
    };

    ingestionQueue = queues.extract;

    console.log('✅ Redis connection established.');
  } catch (err) {
    console.error('❌ Critical Redis/BullMQ failure:', err.message);
  }
} else {
  console.log(`[Queue] Running in ${SAFE_MODE ? 'SAFE_MODE' : 'NO_REDIS'} mode.`);

  ingestionQueue = {
    add: async () => ({
      id: 'mock_job_' + Date.now()
    })
  };
}

/**
 * Orchestrator
 */
async function transitionToNextStage(documentId, nextStage, data = {}) {
  const jobRecord = await IngestionJob.findOneAndUpdate(
    { documentId },
    {
      stage: nextStage,
      status: nextStage === 'completed'
        ? 'completed'
        : nextStage + 'ing'
    },
    { new: true }
  );

  if (nextStage !== 'completed') {
    const nextQueue = queues[nextStage];

    const job = await nextQueue.add(
      nextStage,
      { documentId, ...data },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );

    jobRecord.jobId = job.id;
    await jobRecord.save();
  }
}

/**
 * DLQ Handler
 */
async function moveToDLQ(stage, job, err) {
  const { documentId } = job.data;

  console.error(`[DLQ] Stage ${stage} failed:`, err.message);

  await IngestionJob.findOneAndUpdate(
    { documentId },
    {
      status: 'failed',
      error: err.message
    }
  );

  await queues[`${stage}DLQ`].add(stage, {
    ...job.data,
    error: err.message,
    failedAt: new Date()
  });
}

// 2. Workers
if (PROCESS_TYPE === 'worker' && !SAFE_MODE && REDIS_URL) {

  const fs = require('fs');
  const IngestionJob = require('../models/IngestionJob');
  const IngestionChunk = require('../models/IngestionChunk');

  const { Worker } = require('bullmq');
  const IORedis = require('ioredis');

  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    tls: {
      rejectUnauthorized: false
    },
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    }
  });

  console.log('✅ Worker Redis initialized');

  // YOUR EXISTING WORKER CODE CONTINUES HERE...
}

module.exports = {
  ingestionQueue,
  ...queues
};