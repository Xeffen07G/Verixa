import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVerify } from '../hooks/useVerify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VERDICT_CONFIG = {
  'True':           { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)',   label: 'Verified True'  },
  'False':          { color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.2)',  label: 'Verified False' },
  'Partially True': { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',   label: 'Partially True' },
  'Unverifiable':   { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',  border: 'rgba(156,163,175,0.2)',  label: 'Unverifiable'   },
};

const STAGES = ['extracting', 'searching', 'verifying', 'done'];

const DARK = {
  bg: '#0a0a0f', surface: 'rgba(16,16,23,0.6)',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.05)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
  topbar: 'rgba(10,10,15,0.9)', panelFooter: 'rgba(10,10,15,0.6)',
  inputBg: 'rgba(255,255,255,0.03)', inputBorder: 'rgba(255,255,255,0.08)',
  logBg: 'rgba(255,255,255,0.02)', emptyColor: 'rgba(245,243,239,0.3)',
};

const LIGHT = {
  bg: '#f5f4f0', surface: 'rgba(255,255,255,0.9)',
  border: 'rgba(0,0,0,0.08)', border2: 'rgba(0,0,0,0.05)',
  text: '#111111', text2: '#444444', text3: '#888888',
  topbar: 'rgba(245,244,240,0.95)', panelFooter: 'rgba(245,244,240,0.9)',
  inputBg: 'rgba(255,255,255,0.9)', inputBorder: 'rgba(0,0,0,0.12)',
  logBg: 'rgba(0,0,0,0.03)', emptyColor: 'rgba(30,30,30,0.25)',
};

function highlightText(text, claims) {
  if (!claims || claims.length === 0) return [{ text, highlight: null }];
  let segments = [{ text, highlight: null }];
  claims.forEach((claim) => {
    const words = claim.claim.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const newSegs = [];
    segments.forEach((seg) => {
      if (seg.highlight) { newSegs.push(seg); return; }
      let lastIdx = 0; let found = false;
      const lower = seg.text.toLowerCase();
      for (let len = Math.min(words.length, 6); len >= 3; len--) {
        for (let s = 0; s <= words.length - len; s++) {
          const phrase = words.slice(s, s + len).join(' ');
          const idx = lower.indexOf(phrase, lastIdx);
          if (idx !== -1) {
            if (idx > lastIdx) newSegs.push({ text: seg.text.slice(lastIdx, idx), highlight: null });
            newSegs.push({ text: seg.text.slice(idx, idx + phrase.length), highlight: claim.verdict });
            lastIdx = idx + phrase.length; found = true;
          }
        }
      }
      if (lastIdx < seg.text.length) newSegs.push({ text: seg.text.slice(lastIdx), highlight: null });
      if (!found) newSegs.push(seg);
    });
    segments = newSegs;
  });
  return segments;
}

function HighlightedText({ text, claims, theme }) {
  const segs = highlightText(text, claims);
  return (
    <p style={{ fontSize: 13, lineHeight: 1.8, color: theme.text2, margin: 0, whiteSpace: 'pre-wrap' }}>
      {segs.map((seg, i) => {
        if (!seg.highlight) return <span key={i}>{seg.text}</span>;
        const cfg = VERDICT_CONFIG[seg.highlight];
        return <mark key={i} style={{ background: cfg?.bg, color: cfg?.color, borderBottom: `2px solid ${cfg?.border}`, borderRadius: 3, padding: '0 2px' }}>{seg.text}</mark>;
      })}
    </p>
  );
}

function ClaimTimeline({ claims, theme }) {
  const order = ['False', 'Partially True', 'Unverifiable', 'True'];
  const sorted = [...claims].sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.text3, marginBottom: 16 }}>Claim Timeline — Most Problematic First</p>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, #c9a96e, rgba(201,169,110,0.1))' }} />
        {sorted.map((claim, i) => {
          const cfg = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG['Unverifiable'];
          return (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, position: 'relative' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 3, marginLeft: -19, boxShadow: `0 0 8px ${cfg.color}40`, border: `2px solid ${cfg.border}` }} />
              <div style={{ flex: 1, padding: '10px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.8 }}>{claim.verdict}</span>
                  <span style={{ fontSize: 10, color: theme.text3 }}>{claim.confidence_score}% confidence</span>
                  {claim.conflicting_sources && <span style={{ fontSize: 10, color: '#fbbf24' }}>Conflicting</span>}
                </div>
                <p style={{ fontSize: 12, color: theme.text2, margin: 0, lineHeight: 1.5 }}>{claim.claim}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineProgress({ stage, theme }) {
  const labels = ['Extracting Claims', 'Retrieving Evidence', 'Verifying', 'Complete'];
  const idx = STAGES.indexOf(stage);
  return (
    <div style={{ padding: '24px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {labels.map((label, i) => {
          const done = i < idx || stage === 'done', active = i === idx && stage !== 'done';
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#c9a96e' : active ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${done || active ? '#c9a96e' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', zIndex: 1 }}>
                  {done ? <span style={{ fontSize: 11, color: '#0a0a0f', fontWeight: 700 }}>✓</span> : active ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a96e', display: 'block', animation: 'pulse-gold 1.2s infinite' }} /> : null}
                </div>
                <span style={{ fontSize: 10, color: done || active ? '#c9a96e' : theme.text3, letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' }}>{label}</span>
              </div>
              {i < labels.length - 1 && <div style={{ flex: 1, height: 1, background: i < idx ? '#c9a96e' : theme.border, marginTop: -18, transition: 'background 0.5s' }} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function getCredibility(url = '') {
  const high = ['wikipedia.org', 'reuters.com', 'bbc.com', 'who.int', 'cdc.gov', 'nasa.gov', 'nature.com', 'pubmed', '.gov', '.edu'];
  const medium = ['theguardian.com', 'nytimes.com', 'washingtonpost.com', 'apnews.com', 'bloomberg.com', 'forbes.com', 'techcrunch.com'];
  const lower = url.toLowerCase();
  if (high.some(d => lower.includes(d))) return { score: 90, label: 'High', color: '#4ade80' };
  if (medium.some(d => lower.includes(d))) return { score: 70, label: 'Medium', color: '#fbbf24' };
  return { score: 45, label: 'Low', color: '#f87171' };
}

function ClaimCard({ claim, index, theme }) {
  const [open, setOpen] = useState(false);
  const cfg = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG['Unverifiable'];
  const conf = parseInt(claim.confidence_score) || 0;
  const confColor = conf >= 75 ? '#4ade80' : conf >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ border: `1px solid ${open ? cfg.border : theme.border}`, borderRadius: 12, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.22s', background: theme.surface }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14, background: open ? cfg.bg : 'transparent', transition: 'background 0.22s' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 1, fontFamily: 'DM Mono, monospace' }}>{String(index + 1).padStart(2, '0')}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, color: theme.text, lineHeight: 1.55 }}>{claim.claim}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: 0.8, textTransform: 'uppercase' }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: confColor, fontWeight: 600 }}>{conf}% confidence</span>
            {claim.conflicting_sources && <span style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(251,191,36,0.08)', padding: '2px 8px', borderRadius: 4 }}>Conflicting sources</span>}
          </div>
        </div>
        <span style={{ color: theme.text3, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none', marginTop: 3 }}>▶</span>
      </div>
      {open && (
        <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${cfg.border}`, background: 'rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 13, color: theme.text2, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>{claim.reasoning}</p>
          {claim.sources?.length > 0 && (
            <div>
              <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.text3, marginBottom: 10 }}>Sources and Credibility</p>
              {claim.sources.map((src, j) => {
                const cred = getCredibility(src.url);
                return (
                  <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '10px 12px', background: theme.inputBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
                    <span style={{ color: '#c9a96e', fontSize: 10, marginTop: 2, flexShrink: 0 }}>◆</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: 12, color: theme.text, fontWeight: 500 }}>{src.title}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cred.color, background: `${cred.color}15`, padding: '2px 8px', borderRadius: 999, border: `1px solid ${cred.color}40`, whiteSpace: 'nowrap' }}>{cred.label} · {cred.score}%</span>
                      </div>
                      {src.snippet && <p style={{ margin: '3px 0 4px', fontSize: 11, color: theme.text3, lineHeight: 1.5 }}>{src.snippet}</p>}
                      <div style={{ height: 3, borderRadius: 2, background: theme.border, marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${cred.score}%`, background: cred.color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                      {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#c9a96e', opacity: 0.7 }}>View source →</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccuracyDonut({ score }) {
  const r = 42, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="7" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 300, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Score</span>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onLoad, onDelete, theme }) {
  if (history.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.text3, fontSize: 13 }}>
      No verification history yet.<br />Run a verification to see it here.
    </div>
  );
  return (
    <div>
      {history.map((item, i) => {
        const score = item.overallScore;
        const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171';
        return (
          <div key={i} style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 8, background: theme.surface, cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: theme.text3, fontFamily: 'DM Mono, monospace' }}>{new Date(item.timestamp).toLocaleString()}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(i); }} style={{ fontSize: 10, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
              </div>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: theme.text2, lineHeight: 1.4 }}>{item.text.slice(0, 100)}{item.text.length > 100 ? '...' : ''}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {Object.entries(item.verdictCounts || {}).map(([v, c]) => {
                const cfg = VERDICT_CONFIG[v]; if (!cfg) return null;
                return <span key={v} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700 }}>{c} {v}</span>;
              })}
            </div>
            <button onClick={() => onLoad(item)} style={{ fontSize: 11, color: '#c9a96e', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Load Report →</button>
          </div>
        );
      })}
    </div>
  );
}

function exportToPDF(claims, overallScore, text) {
  const verdictEmoji = { True: '✓', False: '✗', 'Partially True': '~', Unverifiable: '?' };
  const html = `<html><head><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#1a1a1a;line-height:1.6;}h1{font-size:32px;font-weight:300;border-bottom:2px solid #c9a96e;padding-bottom:12px;}.score{font-size:48px;font-weight:300;color:${overallScore >= 70 ? '#166534' : overallScore >= 40 ? '#92400e' : '#991b1b'}}.claim{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;}.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;margin-bottom:8px;}.reasoning{font-style:italic;color:#555;font-size:13px;margin-top:6px;}.source{font-size:11px;color:#888;margin-top:4px;}</style></head><body><h1>VeriXa Accuracy Report</h1><p style="color:#666">Generated: ${new Date().toLocaleString()} · ${claims.length} claims analyzed</p><div class="score">${overallScore}%</div><p style="color:#666;margin-top:4px;margin-bottom:24px;">Overall Accuracy Score</p><p style="background:#f9f9f9;padding:12px;border-radius:6px;font-size:13px;color:#444">${text.slice(0, 300)}${text.length > 300 ? '...' : ''}</p><h2 style="font-weight:400;font-size:20px;margin-bottom:16px;">Claims Analysis</h2>${claims.map((c, i) => `<div class="claim"><div class="badge" style="background:${VERDICT_CONFIG[c.verdict]?.bg || '#f3f4f6'};color:${VERDICT_CONFIG[c.verdict]?.color || '#374151'}">${verdictEmoji[c.verdict] || '?'} ${c.verdict}</div><strong>${i + 1}. ${c.claim}</strong><div class="reasoning">${c.reasoning}</div><div class="source">Confidence: ${c.confidence_score}%${c.conflicting_sources ? ' · Conflicting sources detected' : ''}</div>${c.sources?.length ? `<div class="source">Sources: ${c.sources.map(s => s.title).join(' · ')}</div>` : ''}</div>`).join('')}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 800); }
}

export default function VerifyPage() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [detectAI, setDetectAI] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [activeView, setActiveView] = useState('cards');
  const [darkMode, setDarkMode] = useState(true);
  const [leftTab, setLeftTab] = useState('input');
  const [listening, setListening] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('verixa_history') || '[]'); } catch { return []; }
  });

  const recognitionRef = useRef(null);
  const logRef = useRef(null);
  const T = darkMode ? DARK : LIGHT;

  const { stage, logs, claims, overallScore, aiDetection, error, isLoading, verify, reset } = useVerify();

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (stage === 'done' && claims.length > 0) {
      const entry = {
        text, claims, overallScore, aiDetection,
        timestamp: new Date().toISOString(),
        verdictCounts: claims.reduce((acc, c) => { acc[c.verdict] = (acc[c.verdict] || 0) + 1; return acc; }, {}),
      };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      try { localStorage.setItem('verixa_history', JSON.stringify(updated)); } catch {}
    }
  }, [stage]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input is only supported in Chrome browser.'); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const verdictCounts = claims.reduce((acc, c) => { acc[c.verdict] = (acc[c.verdict] || 0) + 1; return acc; }, {});

  async function handleFetchUrl() {
    if (!url.trim()) return;
    setFetchingUrl(true);
    try {
      const res = await axios.post(`${API_URL}/api/url`, { url: url.trim() });
      setText(res.data.content); setInputMode('text');
    } catch (e) { alert('Failed to fetch URL: ' + (e.response?.data?.error || e.message)); }
    finally { setFetchingUrl(false); }
  }

  async function handlePdfUpload(file) {
    setUploadingPdf(true); setPdfInfo(null);
    try {
      const formData = new FormData(); formData.append('pdf', file);
      const res = await fetch(`${API_URL}/api/pdf`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PDF upload failed');
      setText(data.text); setPdfInfo(data); setInputMode('text');
    } catch (e) { alert('PDF Error: ' + e.message); }
    finally { setUploadingPdf(false); }
  }

  function handleRun() {
    if (!text.trim() || text.trim().length < 30) return;
    setActiveView('cards'); setLeftTab('input');
    verify(text.trim(), detectAI);
  }

  function loadFromHistory(item) {
    setText(item.text); setLeftTab('input');
  }

  function deleteHistory(i) {
    const updated = history.filter((_, idx) => idx !== i);
    setHistory(updated);
    try { localStorage.setItem('verixa_history', JSON.stringify(updated)); } catch {}
  }

  const tabBtn = (active) => ({
    flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
    background: active ? 'rgba(201,169,110,0.12)' : 'transparent',
    color: active ? '#c9a96e' : T.text3, transition: 'all 0.18s',
  });

  const viewBtn = (active) => ({
    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600,
    background: active ? 'rgba(201,169,110,0.15)' : T.inputBg,
    color: active ? '#c9a96e' : T.text3, transition: 'all 0.18s',
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>
      <style>{`
        @media (max-width: 768px) { .verify-main { grid-template-columns: 1fr !important; } }
        textarea:focus { outline: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse-gold { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)} 70%{box-shadow:0 0 0 8px rgba(248,113,113,0)} }
      `}</style>

      {/* TOPBAR */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.topbar, backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, transition: 'all 0.3s' }}>
        <Link to="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: 1, textDecoration: 'none' }}>VeriXa</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {stage === 'done' && claims.length > 0 && (
            <button onClick={() => exportToPDF(claims, overallScore, text)} style={{ padding: '6px 16px', borderRadius: 6, background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Export PDF
            </button>
          )}
          {stage === 'done' && (
            <button onClick={reset} style={{ padding: '6px 16px', borderRadius: 6, background: 'transparent', border: `1px solid ${T.border}`, color: T.text3, fontSize: 12, cursor: 'pointer' }}>New Analysis</button>
          )}
          <Link to="/image" style={{ padding: '6px 16px', borderRadius: 6, background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', color: '#c9a96e', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>Image Verify</Link>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '6px 12px', borderRadius: 6, background: T.inputBg, border: `1px solid ${T.border}`, color: T.text2, fontSize: 14, cursor: 'pointer' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: 11, color: T.text3, letterSpacing: 1.5 }}>BETA</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: 0 }} className="verify-main">

        {/* LEFT PANEL */}
        <div style={{ borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden', transition: 'all 0.3s' }}>
          <div style={{ padding: '0 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 0 }}>
            {[{ id: 'input', label: 'Input' }, { id: 'history', label: `History${history.length > 0 ? ` (${history.length})` : ''}` }].map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)} style={{ flex: 1, padding: '16px 0', background: 'none', border: 'none', borderBottom: leftTab === t.id ? '2px solid #c9a96e' : '2px solid transparent', color: leftTab === t.id ? '#c9a96e' : T.text3, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>

          {leftTab === 'history' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <HistoryPanel history={history} onLoad={loadFromHistory} onDelete={deleteHistory} theme={T} />
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[{ id: 'text', label: 'Plain Text' }, { id: 'url', label: 'URL' }, { id: 'pdf', label: 'PDF' }].map(m => (
                    <button key={m.id} style={tabBtn(inputMode === m.id)} onClick={() => setInputMode(m.id)}>{m.label}</button>
                  ))}
                </div>

                {inputMode === 'pdf' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ border: '2px dashed rgba(201,169,110,0.3)', borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(201,169,110,0.02)' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') await handlePdfUpload(f); }}
                      onClick={() => document.getElementById('pdf-input').click()}>
                      <div style={{ fontSize: 28, marginBottom: 8, color: '#c9a96e' }}>⬡</div>
                      <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>{uploadingPdf ? 'Extracting text...' : 'Click or drag PDF here'}</p>
                      <p style={{ fontSize: 11, color: T.text3, marginTop: 4, opacity: 0.6 }}>Max 10MB · text-based PDFs only</p>
                    </div>
                    <input id="pdf-input" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handlePdfUpload(f); }} />
                    {pdfInfo && <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, fontSize: 12, color: '#4ade80' }}>Loaded: {pdfInfo.filename} — {pdfInfo.pages} pages</div>}
                  </div>
                )}

                {inputMode === 'url' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/article..."
                        style={{ flex: 1, padding: '10px 12px', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
                      <button onClick={handleFetchUrl} disabled={fetchingUrl} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.06)', color: '#c9a96e', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {fetchingUrl ? '...' : 'Fetch'}
                      </button>
                    </div>
                    {text && <p style={{ fontSize: 11, color: '#4ade80', marginTop: 6 }}>Content loaded</p>}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder="Paste your article, essay, or any text containing factual claims..."
                    style={{ width: '100%', minHeight: 180, padding: '14px 14px 40px 14px', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.text, fontSize: 13, lineHeight: 1.65, resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    disabled={isLoading}
                    onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.3)'}
                    onBlur={e => e.target.style.borderColor = T.inputBorder} />
                  <button onClick={listening ? stopListening : startListening}
                    style={{ position: 'absolute', bottom: 10, right: 10, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: listening ? '#f87171' : 'rgba(201,169,110,0.15)', color: listening ? '#fff' : '#c9a96e', animation: listening ? 'mic-pulse 1.5s infinite' : 'none', transition: 'all 0.2s', letterSpacing: 0.5 }}>
                    {listening ? 'Stop' : 'Go Voice'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: listening ? '#f87171' : T.text3 }}>{listening ? 'Listening... click Stop to finish' : ''}</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{text.length.toLocaleString()} chars</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                  <button style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: detectAI ? '#c9a96e' : T.inputBorder, position: 'relative', border: 'none', transition: 'background 0.2s', flexShrink: 0 }} onClick={() => setDetectAI(!detectAI)}>
                    <div style={{ position: 'absolute', top: 3, left: detectAI ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                  <span style={{ fontSize: 12, color: T.text3 }}>AI-generated text detection</span>
                </div>

                {stage && stage !== 'done' && <PipelineProgress stage={stage} theme={T} />}
              </div>

              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.panelFooter, transition: 'all 0.3s' }}>
                <button style={{ width: '100%', padding: '13px', borderRadius: 10, background: isLoading ? 'rgba(201,169,110,0.2)' : 'linear-gradient(135deg, #c9a96e, #a07b42)', border: 'none', color: isLoading ? '#c9a96e' : '#0a0a0f', fontSize: 13, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: 0.8, transition: 'all 0.22s' }}
                  onClick={handleRun} disabled={isLoading || !text.trim()}>
                  {isLoading ? 'Verifying...' : 'Run Verification'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT RESULTS PANEL */}
        <div style={{ flex: 1, height: 'calc(100vh - 56px)', overflowY: 'auto', padding: '28px 32px', background: T.bg, transition: 'all 0.3s' }}>
          {!stage && claims.length === 0 && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 16 }}>
              <div style={{ fontSize: 40, opacity: 0.15, color: '#c9a96e' }}>◉</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 28, color: T.emptyColor }}>Awaiting verification</div>
              <div style={{ fontSize: 13, color: T.text3, maxWidth: 320, lineHeight: 1.6 }}>Enter any text, URL, or PDF — VeriXa will extract every verifiable claim and cross-reference it against the web.</div>
            </div>
          )}

          {error && <div style={{ padding: 16, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 20 }}>Error: {error}</div>}

          {logs.length > 0 && stage !== 'done' && (
            <div ref={logRef} style={{ padding: '12px 16px', background: T.logBg, borderRadius: 8, maxHeight: 100, overflowY: 'auto', marginBottom: 20, border: `1px solid ${T.border}` }}>
              {logs.map((l, i) => <p key={i} style={{ margin: '2px 0', fontSize: 11, color: T.text3, fontFamily: 'DM Mono, monospace' }}>› {l.msg}</p>)}
            </div>
          )}

          {claims.length > 0 && (
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: 26, color: T.text, marginBottom: 4 }}>Accuracy Report</div>
                  <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>{claims.length} claims analyzed</p>
                </div>
                <AccuracyDonut score={overallScore} />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {Object.entries(verdictCounts).map(([verdict, count]) => {
                  const cfg = VERDICT_CONFIG[verdict]; if (!cfg) return null;
                  return <div key={verdict} style={{ padding: '5px 14px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: 6 }}><span>{count}</span><span>{verdict}</span></div>;
                })}
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {[{ id: 'cards', label: 'Claim Cards' }, { id: 'timeline', label: 'Timeline' }, { id: 'highlight', label: 'Word Highlight' }].map(v => (
                  <button key={v.id} style={viewBtn(activeView === v.id)} onClick={() => setActiveView(v.id)}>{v.label}</button>
                ))}
              </div>

              {aiDetection && (
                <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.15)', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 8 }}>AI Origin Analysis</div>
                  <p style={{ fontSize: 12, color: T.text3, margin: '0 0 8px' }}>{aiDetection.assessment}</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[['AI Generated', aiDetection.ai_probability, '#f87171'], ['Human Written', aiDetection.human_probability, '#4ade80']].map(([label, val, color]) => (
                      <div key={label} style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: T.text3 }}>{label}</span>
                          <span style={{ fontSize: 11, color, fontWeight: 600 }}>{val}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, background: color, transition: 'width 1s ease', borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'cards' && claims.map((c, i) => <ClaimCard key={i} claim={c} index={i} theme={T} />)}
              {activeView === 'timeline' && <ClaimTimeline claims={claims} theme={T} />}
              {activeView === 'highlight' && (
                <div style={{ padding: '16px 20px', borderRadius: 10, background: T.inputBg, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 12 }}>Legend</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    {Object.entries(VERDICT_CONFIG).map(([verdict, cfg]) => (
                      <mark key={verdict} style={{ background: cfg.bg, color: cfg.color, borderBottom: `2px solid ${cfg.border}`, borderRadius: 3, padding: '0 6px', fontSize: 11, fontWeight: 700 }}>{verdict}</mark>
                    ))}
                  </div>
                  <HighlightedText text={text} claims={claims} theme={T} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}