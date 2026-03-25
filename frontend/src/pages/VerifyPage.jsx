import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useVerify } from '../hooks/useVerify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const VERDICT_CONFIG = {
  'True':           { color: '#166534', bg: '#dcfce7', border: '#bbf7d0', icon: '✓', label: 'Verified True',   short: 'TRUE'    },
  'False':          { color: '#991b1b', bg: '#fee2e2', border: '#fecaca', icon: '✕', label: 'Verified False',  short: 'FALSE'   },
  'Partially True': { color: '#92400e', bg: '#fef3c7', border: '#fde68a', icon: '~', label: 'Partially True',  short: 'PARTIAL' },
  'Unverifiable':   { color: '#374151', bg: '#f3f4f6', border: '#e5e7eb', icon: '?', label: 'Unverifiable',    short: 'UNCLEAR' },
};

const STAGES = ['extracting', 'searching', 'verifying', 'done'];

const DARK = {
  bg: '#0a0a0f', surface: '#13131a', surface2: '#1a1a24',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.04)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
  topbar: 'rgba(10,10,15,0.95)', panelFooter: 'rgba(10,10,15,0.8)',
  inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.1)',
  logBg: 'rgba(255,255,255,0.02)', emptyColor: 'rgba(245,243,239,0.2)',
  cardBg: '#13131a', cardBorder: 'rgba(255,255,255,0.06)',
  accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
};

const LIGHT = {
  bg: '#e8e5de', surface: '#f0ede6', surface2: '#ddd9d0',
  border: 'rgba(0,0,0,0.12)', border2: 'rgba(0,0,0,0.06)',
  text: '#0d0d0d', text2: '#2a2a2a', text3: '#555555',
  topbar: 'rgba(232,229,222,0.95)', panelFooter: 'rgba(232,229,222,0.9)',
  inputBg: '#f5f3ed', inputBorder: 'rgba(0,0,0,0.14)',
  logBg: 'rgba(0,0,0,0.03)', emptyColor: 'rgba(30,30,30,0.25)',
  cardBg: '#f0ede6', cardBorder: 'rgba(0,0,0,0.08)',
  accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
};

function ScoreBanner({ score, claims }) {
  const color = score >= 70 ? '#166534' : score >= 40 ? '#92400e' : '#991b1b';
  const bg = score >= 70 ? 'linear-gradient(135deg, #14532d, #166534)' : score >= 40 ? 'linear-gradient(135deg, #78350f, #92400e)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)';
  const label = score >= 70 ? 'Mostly Accurate' : score >= 40 ? 'Mixed Accuracy' : 'Mostly Inaccurate';
  const trueCount = claims.filter(c => c.verdict === 'True').length;
  const falseCount = claims.filter(c => c.verdict === 'False').length;
  const partialCount = claims.filter(c => c.verdict === 'Partially True').length;
  const unclearCount = claims.filter(c => c.verdict === 'Unverifiable').length;

  return (
    <div style={{ background: bg, borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' }}>Accuracy Report</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, color: '#fff', lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', fontFamily: 'Cormorant Garamond, serif' }}>%</span>
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { count: trueCount, label: 'True', color: '#4ade80' },
              { count: falseCount, label: 'False', color: '#f87171' },
              { count: partialCount, label: 'Partial', color: '#fbbf24' },
              { count: unclearCount, label: 'Unclear', color: '#d1d5db' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, minWidth: 60 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>{item.count}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: 'rgba(255,255,255,0.7)', borderRadius: 3, transition: 'width 1.5s ease' }} />
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim, index, theme }) {
  const [open, setOpen] = useState(false);
  const cfg = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG['Unverifiable'];

  function getCredibilityLabel(url = '') {
    const high = ['wikipedia.org', 'reuters.com', 'bbc.com', 'who.int', 'cdc.gov', 'nasa.gov', '.gov', '.edu'];
    const medium = ['theguardian.com', 'nytimes.com', 'apnews.com', 'bloomberg.com'];
    const lower = url.toLowerCase();
    if (high.some(d => lower.includes(d))) return { label: 'Authoritative', color: '#166534', bg: '#dcfce7' };
    if (medium.some(d => lower.includes(d))) return { label: 'Reputable', color: '#92400e', bg: '#fef3c7' };
    return { label: 'General', color: '#374151', bg: '#f3f4f6' };
  }

  return (
    <div style={{ borderRadius: 14, marginBottom: 12, overflow: 'hidden', border: `1.5px solid ${open ? cfg.border : theme.cardBorder}`, background: theme.cardBg, transition: 'all 0.22s', boxShadow: open ? `0 4px 24px rgba(0,0,0,0.1)` : 'none' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16, background: open ? cfg.bg : 'transparent', transition: 'background 0.22s' }}>

        {/* Verdict badge */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 1 }}>
          <span style={{ fontSize: 16, color: cfg.color, fontWeight: 700, lineHeight: 1 }}>{cfg.icon}</span>
          <span style={{ fontSize: 7, color: cfg.color, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>{cfg.short}</span>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: 15, color: theme.text, lineHeight: 1.55, fontWeight: 500, fontFamily: 'Cormorant Garamond, serif' }}>{claim.claim}</p>
          <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600, background: cfg.bg, padding: '2px 10px', borderRadius: 999, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
        </div>

        <span style={{ color: theme.text3, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: 12, marginTop: 14, flexShrink: 0 }}>▼</span>
      </div>

      {open && (
        <div style={{ padding: '0 24px 24px', background: cfg.bg + '80' }}>
          <div style={{ height: 1, background: cfg.border, marginBottom: 16 }} />

          {/* Reasoning */}
          <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.75, margin: '0 0 20px', fontStyle: 'italic' }}>{claim.reasoning}</p>

          {/* Sources */}
          {claim.sources?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.text3, margin: '0 0 12px', fontWeight: 600 }}>Evidence Sources</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {claim.sources.map((src, j) => {
                  const cred = getCredibilityLabel(src.url);
                  return (
                    <div key={j} style={{ padding: '12px 16px', background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{src.title}</span>
                          <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 999, background: cred.bg, color: cred.color, fontWeight: 700 }}>{cred.label}</span>
                        </div>
                        {src.snippet && <p style={{ fontSize: 12, color: theme.text3, margin: 0, lineHeight: 1.5 }}>{src.snippet}</p>}
                        {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.accent, marginTop: 4, display: 'inline-block' }}>Read source →</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnimatedLoadingBar({ active, color, height = 3, borderRadius = 4, style = {}, indeterminate = false, progress = null }) {
  const defaultColor = '#c9a96e';
  const barColor = color || defaultColor;
  if (!active) return null;
  return (
    <div style={{ width: '100%', height, borderRadius, background: `${color}1a` || 'rgba(201,169,110,0.1)', overflow: 'hidden', position: 'relative', ...style }}>
      {indeterminate ? (
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%', borderRadius, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, animation: 'loading-shimmer 1.5s ease-in-out infinite' }} />
      ) : (
        <div style={{
          height: '100%', borderRadius,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: progress != null ? `${progress}%` : undefined,
          animation: progress == null ? 'loading-progress 12s ease-out forwards' : undefined,
          boxShadow: `0 0 8px ${color}60`,
          transition: progress != null ? 'width 0.5s ease' : undefined,
        }} />
      )}
    </div>
  );
}

function PipelineProgress({ stage, theme, darkMode }) {
  const labels = ['Extracting', 'Searching', 'Verifying', 'Done'];
  const idx = STAGES.indexOf(stage);
  const progressMap = { extracting: 15, searching: 45, verifying: 75, done: 100 };
  const progress = progressMap[stage] || (stage === 'done' ? 100 : 0);
  const currentLabel = labels[idx] || (stage === 'done' ? 'Complete' : 'Processing');

  return (
    <div style={{ padding: '20px 0 8px' }}>
      {/* Animated progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: theme.accent, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
            {currentLabel}...
          </span>
          <span style={{ fontSize: 10, color: theme.text3, fontFamily: 'DM Mono, monospace' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: 4, borderRadius: 4, background: theme.accentMuted, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.accent}, #e8d5a3, ${theme.accent})`,
            backgroundSize: '200% 100%',
            width: `${progress}%`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: stage !== 'done' ? 'loading-glow 2s ease-in-out infinite, bar-pulse 1.5s ease-in-out infinite' : 'none',
            boxShadow: `0 0 10px ${theme.accent}66`,
          }} />
        </div>
      </div>

      {/* Step circles */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {labels.map((label, i) => {
          const done = i < idx || stage === 'done', active = i === idx && stage !== 'done';
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? theme.accent : active ? theme.accentMuted : theme.surface2, border: `2px solid ${done || active ? theme.accent : theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: active ? `0 0 12px ${theme.accent}4d` : 'none' }}>
                  {done ? <span style={{ fontSize: 12, color: darkMode ? '#0a0a0f' : '#fff', fontWeight: 800 }}>✓</span> : active ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, display: 'block', animation: 'pulse-gold 1.2s infinite' }} /> : null}
                </div>
                <span style={{ fontSize: 9, color: done || active ? theme.accent : theme.text3, letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase', fontWeight: done || active ? 600 : 400 }}>{label}</span>
              </div>
              {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: i < idx ? theme.accent : theme.border, marginTop: -16, transition: 'background 0.5s', borderRadius: 1 }} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onLoad, onDelete, theme }) {
  if (history.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.text3, fontSize: 13 }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◉</div>
      No verifications yet.<br />Run one to see it here.
    </div>
  );
  return (
    <div>
      {history.map((item, i) => {
        const score = item.overallScore;
        const color = score >= 70 ? '#166534' : score >= 40 ? '#92400e' : '#991b1b';
        const bg = score >= 70 ? '#dcfce7' : score >= 40 ? '#fef3c7' : '#fee2e2';
        return (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${theme.cardBorder}`, marginBottom: 10, background: theme.cardBg, transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${theme.accent}4d`}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.cardBorder}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: theme.text3 }}>{new Date(item.timestamp).toLocaleString()}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, background: bg, padding: '2px 10px', borderRadius: 999 }}>{score}%</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(i); }} style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: theme.text2, lineHeight: 1.5 }}>{item.text?.slice(0, 90)}{item.text?.length > 90 ? '...' : ''}</p>
            <button onClick={() => onLoad(item)} style={{ fontSize: 11, color: theme.accent, background: theme.accentMuted, border: `1px solid ${theme.accent}33`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Load →</button>
          </div>
        );
      })}
    </div>
  );
}

function exportToPDF(claims, overallScore, text) {
  const html = `<html><head><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#1a1a1a;line-height:1.6;}h1{font-size:28px;font-weight:300;border-bottom:2px solid #c9a96e;padding-bottom:12px;color:#0a0a0f}.score{font-size:56px;font-weight:300;color:${overallScore>=70?'#166534':overallScore>=40?'#92400e':'#991b1b'}}.claim{border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:14px;}.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700;margin-bottom:8px}.reasoning{color:#555;font-size:13px;margin-top:8px;line-height:1.6}.source{font-size:11px;color:#888;margin-top:6px}</style></head><body><h1>VeriXa Accuracy Report</h1><p style="color:#666;margin-bottom:4px">Generated ${new Date().toLocaleString()} · ${claims.length} claims</p><div class="score">${overallScore}%</div><p style="color:#666;margin:4px 0 28px">${overallScore>=70?'Mostly Accurate':overallScore>=40?'Mixed Accuracy':'Mostly Inaccurate'}</p>${claims.map((c,i)=>`<div class="claim"><div class="badge" style="background:${VERDICT_CONFIG[c.verdict]?.bg};color:${VERDICT_CONFIG[c.verdict]?.color}">${VERDICT_CONFIG[c.verdict]?.icon} ${c.verdict}</div><strong style="font-size:15px;display:block;margin-bottom:6px">${i+1}. ${c.claim}</strong><div class="reasoning">${c.reasoning}</div>${c.sources?.length?`<div class="source">Sources: ${c.sources.map(s=>s.title).join(' · ')}</div>`:''}</div>`).join('')}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 800);
}

export default function VerifyPage() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [detectAI, setDetectAI] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };
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
    if (!SR) { alert('Voice input is only supported in Chrome.'); return; }
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
    if (!text.trim() || text.trim().length < 5) return;
    setLeftTab('input');
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
    flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    background: active ? T.accentMuted : 'transparent',
    color: active ? T.accent : T.text3, transition: 'all 0.18s',
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', paddingTop: 60, transition: 'background 0.3s', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) { .verify-main { grid-template-columns: 1fr !important; } .left-panel { height: auto !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); } }
        textarea:focus { outline: none; }
        ::selection { background: rgba(140,100,40,0.7); color: #fff; }
        ::-moz-selection { background: rgba(140,100,40,0.7); color: #fff; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse-gold { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes mic-pulse { 0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4); transform: scale(1); } 50% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); transform: scale(1.05); } 100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); transform: scale(1); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
        @keyframes loading-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes loading-progress {
          0% { width: 0%; }
          20% { width: 25%; }
          40% { width: 45%; }
          60% { width: 65%; }
          80% { width: 80%; }
          95% { width: 92%; }
          100% { width: 92%; }
        }
        @keyframes loading-glow {
          0%, 100% { box-shadow: 0 0 4px ${T.accent}4d; }
          50% { box-shadow: 0 0 12px ${T.accent}99, 0 0 24px ${T.accent}33; }
        }
        @keyframes bar-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme}>
        {stage === 'done' && claims.length > 0 && (
          <button onClick={() => exportToPDF(claims, overallScore, text)}
            style={{ padding: '7px 18px', borderRadius: 8, background: T.accentMuted, border: `1px solid ${T.accent}4d`, color: T.accent, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            Export PDF
          </button>
        )}
        {stage === 'done' && (
          <button onClick={reset}
            style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.text3, fontSize: 12, cursor: 'pointer' }}>
            New
          </button>
        )}
      </Navbar>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 0 }} className="verify-main">

        {/* LEFT PANEL */}
        <div className="left-panel" style={{ borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden', background: T.surface, transition: 'all 0.3s' }}>

          {/* Tabs */}
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 4 }}>
            {[{ id: 'input', label: 'Input' }, { id: 'history', label: `History${history.length > 0 ? ` (${history.length})` : ''}` }].map(t => (
              <button key={t.id} onClick={() => setLeftTab(t.id)} style={tabBtn(leftTab === t.id)}>{t.label}</button>
            ))}
          </div>

          {leftTab === 'history' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <HistoryPanel history={history} onLoad={loadFromHistory} onDelete={deleteHistory} theme={T} />
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                {/* Input mode tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: T.surface2, borderRadius: 10, padding: 4 }}>
                  {[{ id: 'text', label: 'Text' }, { id: 'url', label: 'URL' }, { id: 'pdf', label: 'PDF' }].map(m => (
                    <button key={m.id} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: inputMode === m.id ? T.surface : 'transparent', color: inputMode === m.id ? T.text : T.text3, transition: 'all 0.18s', boxShadow: inputMode === m.id ? `0 1px 4px rgba(0,0,0,0.1)` : 'none' }}
                      onClick={() => setInputMode(m.id)}>{m.label}</button>
                  ))}
                </div>

                {/* PDF */}
                {inputMode === 'pdf' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ border: `2px dashed ${uploadingPdf ? 'rgba(201,169,110,0.5)' : 'rgba(201,169,110,0.3)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: uploadingPdf ? 'wait' : 'pointer', background: uploadingPdf ? 'rgba(201,169,110,0.04)' : 'rgba(201,169,110,0.02)', transition: 'all 0.3s' }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') await handlePdfUpload(f); }}
                      onClick={() => !uploadingPdf && document.getElementById('pdf-input').click()}>
                      <div style={{ fontSize: 24, marginBottom: 8, color: T.accent }}>{uploadingPdf ? '⟳' : '⬡'}</div>
                      <p style={{ fontSize: 13, color: uploadingPdf ? T.accent : T.text3, margin: 0, fontWeight: uploadingPdf ? 500 : 400 }}>{uploadingPdf ? 'Extracting text from PDF...' : 'Click or drag PDF here'}</p>
                      <p style={{ fontSize: 11, color: T.text3, marginTop: 4, opacity: 0.6 }}>Max 10MB</p>
                      <AnimatedLoadingBar active={uploadingPdf} indeterminate height={3} style={{ marginTop: 14, borderRadius: 6 }} />
                    </div>
                    <input id="pdf-input" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handlePdfUpload(f); }} />
                    {pdfInfo && <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, fontSize: 12, color: '#4ade80' }}>Loaded: {pdfInfo.filename}</div>}
                  </div>
                )}

                {/* URL */}
                {inputMode === 'url' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/article..."
                        style={{ flex: 1, padding: '10px 14px', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.text, fontSize: 13, outline: 'none' }} />
                      <button onClick={handleFetchUrl} disabled={fetchingUrl}
                        style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.accent}4d`, background: fetchingUrl ? `${T.accent}26` : T.accentMuted, color: T.accent, fontSize: 12, fontWeight: 600, cursor: fetchingUrl ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        {fetchingUrl ? 'Fetching...' : 'Fetch'}
                      </button>
                    </div>
                    <AnimatedLoadingBar active={fetchingUrl} indeterminate height={3} style={{ marginTop: 8, borderRadius: 6 }} />
                    {!fetchingUrl && text && <p style={{ fontSize: 11, color: '#4ade80', marginTop: 6 }}>Content loaded</p>}
                  </div>
                )}

                {/* Textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder="Paste your article, essay, or any text with facts..."
                    style={{ width: '100%', minHeight: 200, padding: '14px 14px 44px', background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 12, color: T.text, fontSize: 13, lineHeight: 1.7, resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    disabled={isLoading}
                    onFocus={e => e.target.style.borderColor = `${T.accent}66`}
                    onBlur={e => e.target.style.borderColor = T.inputBorder} />
                  <button onClick={listening ? stopListening : startListening}
                    style={{ 
                      position: 'absolute', bottom: 12, right: 12, 
                      padding: '8px 20px', borderRadius: 10, 
                      border: listening ? '1.5px solid #ff4d4d' : '1.5px solid rgba(201, 169, 110, 0.3)', 
                      background: listening ? 'rgba(255, 77, 77, 0.15)' : 'rgba(201, 169, 110, 0.08)', 
                      color: listening ? '#ff4d4d' : '#c9a96e', 
                      cursor: 'pointer', fontSize: 11, fontWeight: 700, 
                      backdropFilter: 'blur(8px)',
                      animation: listening ? 'mic-pulse 2s infinite' : 'none', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      letterSpacing: 0.5,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                    onMouseEnter={e => {
                      if (!listening) {
                        e.currentTarget.style.background = 'rgba(201, 169, 110, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(201, 169, 110, 0.6)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!listening) {
                        e.currentTarget.style.background = 'rgba(201, 169, 110, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(201, 169, 110, 0.3)';
                      }
                    }}
                  >
                    {listening ? <span style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ff4d4d', marginRight: 4}} /> : <span style={{ fontSize: 14 }}>🎙️</span>}
                    {listening ? 'Stop' : 'Go Voice'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: listening ? '#f87171' : 'transparent' }}>Listening...</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{text.length.toLocaleString()} chars</span>
                </div>

                {/* AI Detection Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 14px', background: T.surface2, borderRadius: 10 }}>
                  <button style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: detectAI ? T.accent : T.inputBorder, position: 'relative', border: 'none', transition: 'background 0.2s', flexShrink: 0 }} onClick={() => setDetectAI(!detectAI)}>
                    <div style={{ position: 'absolute', top: 3, left: detectAI ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: T.text, fontWeight: 500 }}>AI Text Detection</p>
                    <p style={{ margin: 0, fontSize: 10, color: T.text3 }}>Detect if text was AI generated</p>
                  </div>
                </div>

                {stage && stage !== 'done' && <PipelineProgress stage={stage} theme={T} darkMode={darkMode} />}

                {/* Live logs */}
                {logs.length > 0 && stage !== 'done' && (
                  <div ref={logRef} style={{ marginTop: 12, padding: '10px 14px', background: T.logBg, borderRadius: 8, maxHeight: 80, overflowY: 'auto', border: `1px solid ${T.border}` }}>
                    {logs.map((l, i) => <p key={i} style={{ margin: '2px 0', fontSize: 11, color: T.text3, fontFamily: 'DM Mono, monospace' }}>› {l.msg}</p>)}
                  </div>
                )}
              </div>

              {/* Run button */}
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.panelFooter }}>
                <AnimatedLoadingBar active={isLoading} indeterminate color={T.accent} height={3} style={{ marginBottom: 12, borderRadius: 6 }} />
                <button
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: 12, 
                    background: isLoading ? T.accentMuted : `linear-gradient(135deg, ${T.accent}, #a07b42)`, 
                    border: 'none', color: isLoading ? T.accent : (darkMode ? '#0a0a0f' : '#fff'), 
                    fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', 
                    letterSpacing: 0.8, transition: 'all 0.22s', 
                    boxShadow: isLoading ? 'none' : `0 4px 16px ${T.accent}4d`, 
                    position: 'relative', overflow: 'hidden' 
                  }}
                  onClick={handleRun} disabled={isLoading || !text.trim()}>
                  {isLoading ? 'Verifying...' : 'Verify Now'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT RESULTS PANEL */}
        <div style={{ flex: 1, height: 'calc(100vh - 60px)', overflowY: 'auto', padding: '32px 36px', background: T.bg, transition: 'all 0.3s' }}>

          {/* Empty state */}
          {!stage && claims.length === 0 && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: T.accentMuted, border: `1px solid ${T.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: `${T.accent}4d` }}>◉</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 32, color: T.emptyColor, lineHeight: 1.2 }}>Ready to verify</div>
              <div style={{ fontSize: 14, color: T.text3, maxWidth: 340, lineHeight: 1.7 }}>Paste any text, URL, or PDF on the left. VeriXa will extract every claim and check it against real evidence.</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                {['Text', 'URL', 'PDF', 'Voice', 'Image'].map(f => (
                  <span key={f} style={{ padding: '4px 14px', borderRadius: 999, background: T.accentMuted, border: `1px solid ${T.accent}1f`, fontSize: 12, color: T.accent }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* ════ ANIMATED PIPELINE LOADING STATE ════ */}
          {stage && stage !== 'done' && claims.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 32 }}>
              {/* Orbiting ring animation */}
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `2px solid ${T.accent}14`,
                }} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid transparent', borderTopColor: T.accent,
                  animation: 'orbit 1.5s linear infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: 8, borderRadius: '50%',
                  border: '2px solid transparent', borderTopColor: `${T.accent}66`,
                  animation: 'orbit 2.5s linear infinite reverse',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: T.accent,
                }}>
                  {stage === 'extracting' ? '🔍' : stage === 'searching' ? '🌐' : '✓'}
                </div>
              </div>

              {/* Stage label */}
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: 28,
                  color: T.text, lineHeight: 1.2, marginBottom: 8,
                }}>
                  {stage === 'extracting' ? 'Extracting Claims' : stage === 'searching' ? 'Searching Evidence' : 'Verifying Claims'}...
                </div>
                <div style={{ fontSize: 14, color: T.text3, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                  {stage === 'extracting'
                    ? 'Decomposing your text into discrete, verifiable factual claims using chain-of-thought reasoning.'
                    : stage === 'searching'
                    ? 'Querying authoritative sources across the web. Cross-referencing evidence for each claim.'
                    : 'Analyzing evidence against each claim. Generating verdicts with confidence scores.'}
                </div>
              </div>

              {/* Mini progress bar */}
              <div style={{ width: '100%', maxWidth: 320 }}>
                <AnimatedLoadingBar active indeterminate height={3} style={{ borderRadius: 6 }} />
              </div>

              {/* Live stage pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Extracting', 'Searching', 'Verifying'].map((s, i) => {
                  const stageMap = ['extracting', 'searching', 'verifying'];
                  const currentIdx = stageMap.indexOf(stage);
                  const isDone = i < currentIdx;
                  const isActive = i === currentIdx;
                  return (
                    <span key={s} style={{
                      padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                      background: isDone ? 'rgba(74,222,128,0.08)' : isActive ? T.accentMuted : `${T.accent}0a`,
                      color: isDone ? '#4ade80' : isActive ? T.accent : T.text3,
                      border: `1px solid ${isDone ? 'rgba(74,222,128,0.2)' : isActive ? `${T.accent}40` : T.border}`,
                      transition: 'all 0.3s',
                    }}>
                      {isDone ? '✓ ' : isActive ? '● ' : ''}{s}
                    </span>
                  );
                })}
              </div>

              {/* Typing dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: T.accent,
                    animation: `typing-dot 1.4s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 20px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              Error: {error}
            </div>
          )}

          {/* Results */}
          {claims.length > 0 && (
            <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>

              {/* Color coded score banner */}
              <ScoreBanner score={overallScore} claims={claims} />

              {/* AI Detection */}
              {aiDetection && (
                <div style={{ padding: '18px 22px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>AI Text Detection</p>
                    <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: aiDetection.ai_probability > 60 ? '#fee2e2' : '#dcfce7', color: aiDetection.ai_probability > 60 ? '#991b1b' : '#166534', fontWeight: 700 }}>
                      {aiDetection.ai_probability > 60 ? 'Likely AI Generated' : 'Likely Human Written'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: T.text2, margin: '0 0 12px', fontStyle: 'italic' }}>{aiDetection.assessment}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[['AI', aiDetection.ai_probability, '#f87171'], ['Human', aiDetection.human_probability, '#4ade80']].map(([label, val, color]) => (
                      <div key={label} style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: T.text3 }}>{label}</span>
                          <span style={{ fontSize: 12, color, fontWeight: 700 }}>{val}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, background: color, transition: 'width 1s ease', borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Claims */}
              <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.text3, marginBottom: 16, fontWeight: 600 }}>
                {claims.length} Claims Analyzed
              </p>
              {claims.map((c, i) => <ClaimCard key={i} claim={c} index={i} theme={T} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}