import { useState, useCallback, useRef } from 'react';

import { BASE } from '../utils/api';

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
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 120000); // 2 min timeout
      
      console.log("VERIFY SUBMIT:", { text, detectAI });
      const response = await fetch(`${BASE}/api/verify?stream=true`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ text, detectAI }),
        signal: abortRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Evidence retrieval temporarily unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value, { stream: true });
        console.log("VERIFY STREAM CHUNK:", decodedChunk);
        buffer += decodedChunk;
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
                setStage(data.stage || 'extracting');
                if (data.message) addLog(data.message);
                break;
              case 'log':
                if (data.message) addLog(data.message);
                break;
              case 'claims_extracted':
                if (Array.isArray(data.claims)) {
                    setClaims(data.claims.map(c => ({ claim: c, verdict: 'Pending', reasoning: 'Analyzing evidence...', sources: [] })));
                }
                break;
              case 'claim_verified':
                setClaims(prev => {
                  const next = Array.isArray(prev) ? [...prev] : [];
                  if (data.claim) {
                      if (next[data.index]) next[data.index] = data.claim;
                      else next.push(data.claim);
                  }
                  return next;
                });
                break;
              case 'result':
                console.log("VERIFY FINAL:", data);
                setClaims(Array.isArray(data.claims) ? data.claims : []);
                setOverallScore(typeof data.overallScore === 'number' ? data.overallScore : 0);
                if (data.aiDetection) setAiDetection(data.aiDetection);
                setStage('done');
                break;
              case 'error':
                throw new Error('Forensic analysis interrupted. Please retry.');
              default:
                break;
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Evidence retrieval temporarily unavailable.');
        setStage(null);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
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
