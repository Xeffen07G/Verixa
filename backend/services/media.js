const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Real Media Intelligence Pipeline Foundation.
 * Handles frame extraction, metadata analysis, and preprocessing.
 */

async function extractKeyFrames(videoPath, outputDir, frameCount = 5) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: frameCount,
        folder: outputDir,
        size: '1280x?',
        filename: 'frame-%i.jpg'
      })
      .on('end', () => {
        const frames = fs.readdirSync(outputDir).map(f => path.join(outputDir, f));
        resolve(frames);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      });
  });
}

async function analyzeMediaMetadata(mediaPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(mediaPath, (err, metadata) => {
      if (err) return reject(err);
      resolve({
        format: metadata.format,
        streams: metadata.streams,
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate
      });
    });
  });
}

module.exports = {
  extractKeyFrames,
  analyzeMediaMetadata
};
