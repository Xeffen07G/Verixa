import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Mic, Trash2, ArrowRight, ShieldCheck, FileText, Globe, Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useVerify } from '../hooks/useVerify';
import { useAuth } from '../context/AuthContext';
import SkeletonLoading from '../components/SkeletonCard';
import Confetti from '../components/Confetti';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import api from '../utils/api';



const VERDICT_CONFIG = (lang) => ({
  'True':           { color: '#31572c', bg: '#f1f8e9', border: '#dcedc8', icon: '✓', label: t('mostlyAccurate', lang),   short: t('trueShort', lang)    },
  'False':          { color: '#7f1d1d', bg: '#fff1f1', border: '#fee2e2', icon: '✕', label: t('mostlyInaccurate', lang),  short: t('falseShort', lang)   },
  'Partially True': { color: '#92400e', bg: '#fffbeb', border: '#fef3c7', icon: '~', label: t('mixedAccuracy', lang),  short: t('partialShort', lang) },
  'Unverifiable':   { color: '#53433e', bg: '#f5f3ed', border: '#e8e5de', icon: '?', label: t('unverifiable', lang),    short: t('unclearShort', lang) },
  'Pending':        { color: '#d48c70', bg: '#fdfcf9', border: 'rgba(212, 140, 112, 0.2)', icon: '◈', label: 'Processing...', short: '...' },
});

const STAGES = ['extracting', 'searching', 'verifying', 'done'];

const DARK = {
  bg: '#0a0a0f', surface: '#111118', surface2: '#16161f',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.04)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.7)', text3: 'rgba(245,243,239,0.35)',
  topbar: 'rgba(10,10,15,0.95)', panelFooter: 'rgba(10,10,15,0.8)',
  inputBg: 'rgba(255,255,255,0.02)', inputBorder: 'rgba(255,255,255,0.08)',
  logBg: 'rgba(255,255,255,0.01)', emptyColor: 'rgba(245,243,239,0.55)',
  cardBg: '#111118', cardBorder: 'rgba(255,255,255,0.07)',
  accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.1)',
};

const LIGHT = {
  bg: '#fdfcf9', surface: '#fdfcf9', surface2: '#f5f3ed',
  border: 'rgba(212, 140, 112, 0.15)', border2: 'rgba(212, 140, 112, 0.08)',
  text: '#201a18', text2: '#53433e', text3: '#85736d',
  topbar: 'rgba(253, 252, 249, 0.95)', panelFooter: 'rgba(253, 252, 249, 0.9)',
  inputBg: '#ffffff', inputBorder: 'rgba(212, 140, 112, 0.2)',
  logBg: 'rgba(212, 140, 112, 0.03)', emptyColor: '#85736d',
  cardBg: '#ffffff', cardBorder: 'rgba(212, 140, 112, 0.15)',
  accent: '#d48c70', accentMuted: 'rgba(212, 140, 112, 0.12)',
};

function ScoreBanner({ score, claims, lang }) {
  const color = score >= 70 ? '#166534' : score >= 40 ? '#92400e' : '#991b1b';
  const bg = score >= 70 ? 'linear-gradient(135deg, #14532d, #166534)' : score >= 40 ? 'linear-gradient(135deg, #78350f, #92400e)' : 'linear-gradient(135deg, #7f1d1d, #991b1b)';
  const label = score >= 70 ? t('mostlyAccurate', lang) : score >= 40 ? t('mixedAccuracy', lang) : t('mostlyInaccurate', lang);
  const trueCount = Array.isArray(claims) ? claims.filter(c => c.verdict === 'True').length : 0;
  const falseCount = Array.isArray(claims) ? claims.filter(c => c.verdict === 'False').length : 0;
  const partialCount = Array.isArray(claims) ? claims.filter(c => c.verdict === 'Partially True').length : 0;
  const unclearCount = Array.isArray(claims) ? claims.filter(c => c.verdict === 'Unverifiable').length : 0;

  return (
    <div className="score-banner" style={{ background: bg, borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>{t('accuracyReport', lang)}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, color: '#fff', lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', fontFamily: 'Cormorant Garamond, serif' }}>%</span>
            </div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { count: trueCount, label: t('trueLabel', lang), color: '#4ade80' },
              { count: falseCount, label: t('falseLabel', lang), color: '#f87171' },
              { count: partialCount, label: t('partialLabel', lang), color: '#fbbf24' },
              { count: unclearCount, label: t('unclearLabel', lang), color: '#d1d5db' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, minWidth: 60 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>{item.count}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim, index, theme, lang }) {
  const [open, setOpen] = useState(false);
  const cfg = VERDICT_CONFIG(lang)[claim.verdict] || VERDICT_CONFIG(lang)['Unverifiable'];

  function getCredibilityLabel(url = '') {
    const high = ['wikipedia.org', 'reuters.com', 'bbc.com', 'who.int', 'cdc.gov', 'nasa.gov', '.gov', '.edu'];
    const medium = ['theguardian.com', 'nytimes.com', 'apnews.com', 'bloomberg.com'];
    const lower = (url || '').toLowerCase();
    if (high.some(d => lower.includes(d))) return { label: t('authoritative', lang), color: '#166534', bg: '#dcfce7' };
    if (medium.some(d => lower.includes(d))) return { label: t('reputable', lang), color: '#92400e', bg: '#fef3c7' };
    return { label: t('general', lang), color: '#374151', bg: '#f3f4f6' };
  }

  return (
    <div style={{ borderRadius: 14, marginBottom: 12, overflow: 'hidden', border: `1.5px solid ${open ? cfg.border : theme.cardBorder}`, background: theme.cardBg, transition: 'all 0.22s' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16, background: open ? cfg.bg : 'transparent' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 1 }}>
          <span style={{ fontSize: 16, color: cfg.color, fontWeight: 700 }}>{cfg.icon}</span>
          <span style={{ fontSize: 7, color: cfg.color, fontWeight: 800, letterSpacing: 0.5 }}>{cfg.short}</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: 15, color: open ? cfg.color : theme.text, lineHeight: 1.55, fontWeight: 700 }}>{claim.claim}</p>
          <span style={{ fontSize: 12, color: cfg.color, fontWeight: 700, background: cfg.bg, padding: '2px 10px', borderRadius: 999, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
        </div>
        <span style={{ color: theme.text3, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: 12, marginTop: 14 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '24px', background: cfg.bg + '40', borderTop: `1px solid ${cfg.border}` }}>
          <p style={{ fontSize: 14, color: theme.text2, lineHeight: 1.75, margin: '0 0 20px', fontStyle: 'italic' }}>{claim.reasoning}</p>
          {claim.sources?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.text3, margin: '0 0 12px', fontWeight: 700 }}>{t('evidenceSources', lang)}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.isArray(claim?.sources) && claim.sources.map((src, j) => {
                  const cred = getCredibilityLabel(src.url);
                  return (
                    <div key={j} style={{ padding: '12px 16px', background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{src.title}</span>
                          <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 999, background: cred.bg, color: cred.color, fontWeight: 700 }}>{cred.label}</span>
                        </div>
                        {src.snippet && <p style={{ fontSize: 12, color: theme.text3, margin: 0, lineHeight: 1.5 }}>{src.snippet}</p>}
                        {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.accent, marginTop: 4, display: 'inline-block', textDecoration: 'none' }}>{t('readSource', lang)} →</a>}
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

function HistoryPanel({ history, onLoad, onDelete, theme, lang }) {
  if (history.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.text3, fontSize: 13 }}>
      {t('noVerifications', lang)}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.isArray(history) && history.map((item, i) => (
        <div key={i} style={{ padding: '16px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.cardBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: theme.text3 }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : '...'}</span>
            <button onClick={() => onDelete(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: theme.text, lineHeight: 1.5 }}>{item.text?.slice(0, 80)}...</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{item.overallScore}%</span>
            <button onClick={() => onLoad(item)} style={{ fontSize: 11, color: theme.accent, background: theme.accentMuted, border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>{t('load', lang)}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function exportToPDF(claims, overallScore, text, lang) {
  const label = overallScore >= 70 ? t('mostlyAccurate', lang) : overallScore >= 40 ? t('mixedAccuracy', lang) : t('mostlyInaccurate', lang);
  const html = `<html><head><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;}h1{border-bottom:2px solid #c9a96e;padding-bottom:12px;}.score{font-size:48px;font-weight:bold;color:${overallScore>=70?'#166534':overallScore>=40?'#92400e':'#991b1b'}}.claim{border:1px solid #ddd;padding:15px;margin-bottom:10px;border-radius:8px;}</style></head><body><h1>VeriXa Report</h1><div class="score">${overallScore}%</div><p>${label}</p>${claims.map((c,i)=>`<div class="claim"><strong>${i+1}. ${c.claim}</strong><br/>${c.reasoning}</div>`).join('')}</body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

function generateCertificate(claims, overallScore, text, lang) {
  const label = overallScore >= 70 ? t('mostlyAccurate', lang) : overallScore >= 40 ? t('mixedAccuracy', lang) : t('mostlyInaccurate', lang);
  const html = `<html><head><style>body{background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;}.cert{width:800px;border:10px solid #c9a96e;padding:60px;text-align:center;position:relative;}.title{font-size:40px;margin-bottom:20px;color:#c9a96e;} .score{font-size:72px;margin:20px 0;}</style></head><body><div class="cert"><div class="title">VeriXa Certificate</div><div class="score">${overallScore}%</div><p>${label}</p></div></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function VerifyPage() {
  const { lang } = useLang();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState(() => {
    if (searchParams.get('mode') === 'pdf' || window.location.pathname === '/pdf') return 'pdf';
    return 'text';
  });
  const [detectAI, setDetectAI] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState(''); // Uploading, Queued, Processing, etc.
  const [isScannedPdf, setIsScannedPdf] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leftTab, setLeftTab] = useState('input');
  const [listening, setListening] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('verixa_history') || '[]'));

  const recognitionRef = useRef(null);
  const T = darkMode ? DARK : LIGHT;

  const { stage, logs, claims, overallScore, aiDetection, error, isLoading, verify, reset } = useVerify();

  useEffect(() => {
    if (searchParams.get('source') === 'dragdrop') {
      const dragText = sessionStorage.getItem('verixa-dragdrop-text');
      if (dragText) { setText(dragText); sessionStorage.removeItem('verixa-dragdrop-text'); }
    }
  }, [searchParams]);

  useEffect(() => {
    if (stage === 'done' && overallScore >= 90) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [stage, overallScore]);

  useEffect(() => {
    if (stage === 'done' && claims.length > 0) {
      const entry = { text, claims, overallScore, aiDetection, timestamp: new Date().toISOString() };
      const updated = [entry, ...history.slice(0, 19)];
      setHistory(updated);
      localStorage.setItem('verixa_history', JSON.stringify(updated));
    }
  }, [stage]);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetchingUrl(true);
    try {
      const res = await api.post('/api/url', { url: url.trim() });
      setText(res.data.content); setInputMode('text');
    } catch (e) { 
      console.error("[VerifyPage] URL Fetch Error:", e.response || e);
      alert('URL Error: ' + (e.response?.data?.error || e.message)); 
    }
    finally { setFetchingUrl(false); }
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    setUploadingPdf(true);
    setPdfStatus('Uploading...');
    setIsScannedPdf(false);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      // 1. Submit to queue (Instantly returns 202)
      const res = await api.post('/api/pdf/ingest', formData);
      const { jobId } = res.data;
      setPdfStatus('Queued...');

      // 2. Poll for extraction completion
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 150) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
        
        const statusRes = await api.get(`/api/pdf/status/${jobId}`);
        const { status, progress, result } = statusRes.data;
        
        if (status === 'completed') {
          completed = true;
          setPdfStatus('Completed');
          setText(result.text);
          setInputMode('text');
        } else if (status === 'failed') {
          throw new Error(statusRes.data.error || 'Ingestion failed');
        } else {
          setPdfStatus(`Processing... ${progress || 0}%`);
        }
      }
      
      if (!completed) throw new Error('Processing timed out');
    } catch (e) { 
      console.error("[VerifyPage] PDF Upload Error:", e.response || e);
      alert('PDF Error: ' + (e.response?.data?.error || e.message)); 
    }
    finally { 
      setUploadingPdf(false);
      setPdfStatus('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', color: T.text, transition: '0.3s' }}>
      <Confetti trigger={showConfetti} />
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div className="verify-container">
        {/* SIDEBAR */}
        <div className="verify-sidebar">
          <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
            <button onClick={() => setLeftTab('input')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: leftTab === 'input' ? T.accentMuted : 'transparent', color: leftTab === 'input' ? T.accent : T.text3, fontWeight: 700, cursor: 'pointer' }}>{t('input', lang)}</button>
            <button onClick={() => setLeftTab('history')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: leftTab === 'history' ? T.accentMuted : 'transparent', color: leftTab === 'history' ? T.accent : T.text3, fontWeight: 700, cursor: 'pointer' }}>{t('history', lang)}</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {leftTab === 'history' ? (
              <HistoryPanel history={history} theme={T} lang={lang} onLoad={item => { setText(item.text); setLeftTab('input'); }} onDelete={i => setHistory(history.filter((_, idx) => idx !== i))} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 4, background: T.surface2, padding: 4, borderRadius: 10 }}>
                  {['text', 'url', 'pdf'].map(m => (
                    <button key={m} onClick={() => setInputMode(m)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, background: inputMode === m ? T.surface : 'transparent', color: inputMode === m ? T.text : T.text3, fontWeight: 600, cursor: 'pointer' }}>{t(m, lang)}</button>
                  ))}
                </div>

                {inputMode === 'text' && (
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('pasteText', lang)} style={{ width: '100%', height: 200, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 12, padding: 16, color: T.text, outline: 'none', resize: 'none' }} />
                )}

                {inputMode === 'url' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder={t('pasteUrl', lang)} style={{ flex: 1, padding: '12px', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.text, outline: 'none' }} />
                    <button onClick={handleFetchUrl} disabled={fetchingUrl} style={{ padding: '0 16px', background: T.accent, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>{fetchingUrl ? '...' : '→'}</button>
                  </div>
                )}

                {inputMode === 'pdf' && (
                  <div onClick={() => document.getElementById('pdf-in').click()} style={{ padding: '40px 20px', border: `2px dashed ${T.border}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}>
                    <FileText size={32} color={T.accent} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 13, color: T.text3 }}>{uploadingPdf ? pdfStatus : t('clickDragPdf', lang)}</p>
                    <input id="pdf-in" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handlePdfUpload(e.target.files[0])} />
                  </div>
                )}

                <button onClick={() => verify(text, detectAI)} disabled={isLoading || !text.trim()} style={{ width: '100%', padding: '16px', borderRadius: 12, background: T.accent, border: 'none', color: '#000', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 8px 24px ${T.accent}33` }}>
                  {isLoading ? t('verifying', lang) : t('startVerification', lang)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="verify-results">
          {isLoading ? (
            <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
              <div style={{ marginBottom: 32, padding: '24px', borderRadius: 16, background: T.surface2, border: `1px solid ${T.accent}33`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: T.accent, animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: 2 }}>{t(stage || 'extracting', lang)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.isArray(logs) && logs.slice(-3).map((log, i) => (
                    <div key={i} style={{ fontSize: 13, color: T.text2, display: 'flex', gap: 10, opacity: 1 - (logs.slice(-3).length - 1 - i) * 0.3 }}>
                      <span style={{ color: T.text3 }}>[{log?.ts ? new Date(log.ts).toLocaleTimeString() : '...'}]</span>
                      <span>{log?.msg || '...'}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <p style={{ margin: 0, fontSize: 13, color: T.text3 }}>{t('processingWait', lang)}</p>}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: T.accent, animation: 'loading-progress 15s linear forwards' }} />
              </div>
              <SkeletonLoading darkMode={darkMode} />
            </div>
          ) : stage === 'done' ? (
            <div>
              <ScoreBanner score={overallScore} claims={claims} lang={lang} />
              <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                <button onClick={() => exportToPDF(claims, overallScore, text, lang)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontWeight: 700, cursor: 'pointer' }}>{t('exportReport', lang)}</button>
                <button onClick={() => generateCertificate(claims, overallScore, text, lang)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: T.accent, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>{t('generateCert', lang)}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Array.isArray(claims) && claims.map((c, i) => <ClaimCard key={i} claim={c} theme={T} lang={lang} />)}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 20px', animation: 'fadeUp 0.8s ease' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: `${T.accent}0a`, border: `1px solid ${T.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <ShieldCheck size={40} color={T.accent} />
              </div>
              <h2 style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, marginBottom: 16 }}>Forensic Audit Ready</h2>
              <p style={{ color: T.text3, maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.6, fontSize: 15 }}>
                Submit a text claim, research URL, or document for deep-trace verification. 
                Our engine will isolate claims and retrieve multi-source evidence for audit.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 16px', borderRadius: 20, background: T.surface2, fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>EVIDENCE MAPPING</div>
                <div style={{ padding: '8px 16px', borderRadius: 20, background: T.surface2, fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>CONTRADICTION SCAN</div>
                <div style={{ padding: '8px 16px', borderRadius: 20, background: T.surface2, fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>HALLUCINATION FILTER</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer darkMode={darkMode} />

      <style>{`
        @keyframes loading-shimmer { 0% { left: -100%; } 100% { left: 200%; } }
        @keyframes loading-progress { 0% { width: 0%; } 100% { width: 90%; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}