import { useState, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export function useVerify() {
  const [stage, setStage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [claims, setClaims] = useState([]);
  const [overallScore, setOverallScore] = useState(null);
  const [aiDetection, setAiDetection] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(null);

  const addLog = (msg) => setLogs(prev => [...prev, { msg, ts: Date.now() }]);

  const verify = useCallback(async (text, detectAI = false) => {
    setIsLoading(true);
    setError(null);
    setClaims([]);
    setOverallScore(null);
    setAiDetection(null);
    setLogs([]);
    setStage('extracting');

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, detectAI }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Verification failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            let data;
            try { data = JSON.parse(jsonStr); }
            catch (e) { continue; }

            switch (data.event) {
              case 'stage':
                setStage(data.stage);
                if (data.message) addLog(data.message);
                break;
              case 'log':
                addLog(data.message);
                break;
              case 'result':
                setClaims(data.claims || []);
                setOverallScore(data.overallScore);
                if (data.aiDetection) setAiDetection(data.aiDetection);
                setStage('done');
                break;
              case 'error':
                throw new Error(data.message || 'Unknown error');
              default:
                break;
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong. Check your API keys.');
        setStage(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStage(null);
    setLogs([]);
    setClaims([]);
    setOverallScore(null);
    setAiDetection(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStage(null);
  }, []);

  return { stage, logs, claims, overallScore, aiDetection, error, isLoading, verify, cancel, reset };
}
