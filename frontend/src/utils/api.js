import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch and extract text content from a URL
 */
export async function fetchUrl(url) {
  const res = await api.post('/api/url', { url });
  return res.data;
}

/**
 * Health check
 */
export async function healthCheck() {
  const res = await api.get('/api/health');
  return res.data;
}

export default api;
