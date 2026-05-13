# Production Dockerfile for VeriXa Intelligence System
FROM node:18-slim

# Install FFmpeg for media intelligence
RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
