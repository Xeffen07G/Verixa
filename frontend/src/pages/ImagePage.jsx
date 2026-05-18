import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

import api from '../utils/api';

const VERDICT_CONFIG = (lang) => ({
  'Likely AI Generated':    { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✗', label: 'Likely AI Generated' },
  'Possibly AI Generated':  { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  icon: '~', label: 'Possibly AI Generated' },
  'Unclear':                { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '?', label: 'Unclear' },
  'Possibly Real':          { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓', label: 'Possibly Real' },
  'Likely Real':            { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓', label: 'Likely Real' },
});

import { Image, Upload } from 'lucide-react';

function GooeyInputWrapper({ children }) {
  return (
    <div className="gooey-wrapper" style={{ position: 'relative', width: '100%' }}>
      <div className="gooey-backplate" style={{
        position: 'absolute',
        inset: '-1px',
        borderRadius: '13px',
        background: 'linear-gradient(90deg, #c9a96e, #85736d, #c9a96e)',
        backgroundSize: '200% 200%',
        opacity: 0.15,
        filter: 'blur(2px) url(#gooey-filter)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1, borderRadius: '12px', background: 'transparent' }}>
        {children}
      </div>
      <style>{`
        .gooey-wrapper:focus-within .gooey-backplate {
          opacity: 0.5;
          filter: blur(4px) url(#gooey-filter);
          animation: gooey-flow 4s linear infinite;
          inset: -2px;
        }
        @keyframes gooey-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ingestion-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function IngestionZone({ onFileSelected, acceptedTypesText, icon: Icon, uploading, status, theme, lang }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        position: 'relative',
        border: `1.5px dashed ${isDragActive ? theme.accent : theme.border}`,
        borderRadius: 16,
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? `${theme.accent}0a` : `${theme.accent}02`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: isDragActive ? `0 12px 32px ${theme.accent}10` : 'none'
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: isDragActive ? 0.07 : 0.03,
        backgroundImage: `radial-gradient(${theme.text} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease'
      }} />

      {isDragActive && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          animation: 'ingestion-scan 2s linear infinite',
          zIndex: 1
        }} />
      )}

      <div style={{
        transform: isDragActive ? 'scale(1.05) translateY(-4px)' : 'none',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: isDragActive ? `${theme.accent}1a` : `${theme.accent}05`,
          border: `1px solid ${isDragActive ? theme.accent : theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: isDragActive ? `0 8px 24px ${theme.accent}20` : 'none',
          transition: 'all 0.3s ease'
        }}>
          <Icon size={24} color={theme.accent} style={{
            transform: isDragActive ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.5s ease'
          }} />
        </div>

        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.text,
          margin: '0 0 6px 0',
          letterSpacing: '0.01em'
        }}>
          {uploading ? status : (isDragActive ? 'Drop to Ingest Evidence' : t('clickDragImage', lang))}
        </p>
        
        <p style={{
          fontSize: 11,
          color: theme.text3,
          margin: 0,
          letterSpacing: '0.02em'
        }}>
          {uploading ? 'Processing asset signatures...' : `or click to browse local files (${acceptedTypesText})`}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files && e.target.files.length > 0) onFileSelected(e.target.files); }}
      />
    </div>
  );
}

const RISK_CONFIG = (lang) => ({
  'High':   { color: '#f87171', bg: 'rgba(248,113,113,0.08)', label: t('highRisk', lang) },
  'Medium': { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', label: t('mediumRisk', lang) },
  'Low':    { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', label: t('lowRisk', lang) },
});

export default function ImagePage() {
  const { lang } = useLang();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  const T = {
    bg: '#0a0a0f',
    bg2: '#111118',
    border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)',
    text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e',
    cardBg: '#111118',
    cardBorder: 'rgba(255,255,255,0.07)',
  };

  async function analyzeUrl() {
    if (!imageUrl.trim()) return;
    setLoading(true); setError(null);
    const url = imageUrl.trim();
    setPreviews(prev => [...prev, url]);
    setImageUrl('');
    try {
      const res = await api.post('/api/image/url', { imageUrl: url });
      setResults(prev => [...prev, { ...res.data, url }]);
      setActiveIdx(prev => results.length); 
    } catch (e) {
      console.error("[ImagePage] URL Analysis Error:", e.response || e);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeUpload(fileList) {
    setLoading(true); setError(null);
    const newFiles = Array.from(fileList);
    
    for (const file of newFiles) {
      // 1. Temporary frontend diagnostic trace
      console.log(`[ImagePage] Uploading Image: file.type = ${file.type}, file.size = ${file.size} bytes, upload endpoint = /api/image/upload`);

      // 2. Validate accepted formats
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError(`AI engine could not process this image format. Supported formats: PNG, JPG, JPEG, WEBP.`);
        continue;
      }

      // 3. Validate standardized file size (MAX_IMAGE_SIZE = 5MB)
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`AI engine could not process this image size. File (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 5MB limit. Try a smaller file.`);
        continue;
      }

      const localPreview = URL.createObjectURL(file);
      setPreviews(prev => [...prev, localPreview]);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const res = await api.post('/api/image/upload', arrayBuffer, {
          headers: { 'Content-Type': file.type }
        });
        console.log(`[ImagePage] Upload Success: response.status = ${res.status}`);
        setResults(prev => [...prev, { ...res.data, url: localPreview }]);
      } catch (e) {
        console.error("[ImagePage] Upload Analysis Error:", e.response || e);
        const errMsg = e.response?.data?.reason || e.response?.data?.error || e.message;
        setError(errMsg);
      }
    }
    setLoading(false);
    setActiveIdx(prev => results.length);
  }

  const getSimplifiedVerdict = (ai_probability) => {
    if (ai_probability >= 80) return "Likely AI Generated";
    if (ai_probability >= 60) return "Possibly AI Generated";
    if (ai_probability >= 40) return "Unclear";
    if (ai_probability >= 20) return "Possibly Real";
    return "Likely Real";
  };

  const getSecondaryText = (verdict) => {
    if (verdict === "Likely AI Generated") return "Strong synthetic indicators detected across multiple image features.";
    if (verdict === "Possibly AI Generated") return "Some synthetic markers detected, showing minor visual anomalies.";
    if (verdict === "Unclear") return "Mixed signals detected. Not enough evidence for a strong conclusion.";
    if (verdict === "Possibly Real") return "The analysis found mixed indicators and could not reach a definitive conclusion.";
    return "Authentic structural characteristics and noise patterns observed.";
  };

  const currentResult = results[activeIdx];
  const simplifiedVerdict = currentResult ? getSimplifiedVerdict(currentResult.ai_probability) : 'Unclear';
  const cfg = currentResult ? (VERDICT_CONFIG(lang)[simplifiedVerdict] || VERDICT_CONFIG(lang)['Unclear']) : null;
  const riskCfg = currentResult ? (RISK_CONFIG(lang)[currentResult.risk_level] || RISK_CONFIG(lang)['Medium']) : null;

  const [imageQuery, setImageQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, queryLoading]);

  async function handleQuery() {
    if (!imageQuery.trim() || results.length === 0) return;
    const currentQuery = imageQuery;
    setImageQuery('');
    setQueryLoading(true);
    
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
    
    const fullContext = results.map((r, i) => `[IMAGE ${i+1}]: ${r.extracted_text}`).join("\n\n");
    const fullForensic = results.map((r, i) => `[IMAGE ${i+1} AUTH]: ${r.assessment}`).join("\n");

    try {
      const payload = { 
        query: currentQuery, 
        context: fullContext,
        imageContext: fullForensic,
        history: chatHistory.slice(-4)
      };

      const res = await api.post('/api/image/query', payload);
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (e) {
      console.error("[ImagePage] Query Error:", e.response || e);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: " + (e.response?.data?.error || e.message) }]);
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingTop: 0, transition: 'background 0.3s, color 0.3s' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '160px 24px 120px' }}>
        <div style={{ marginBottom: 80 }}>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 24 }}>FORENSIC IMAGE INTELLIGENCE</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 64, color: T.text, margin: '0 0 24px', lineHeight: 1 }}>
            Image Authentication
          </h1>
          <p style={{ fontSize: 18, color: T.text2, maxWidth: 600, margin: 0, lineHeight: 1.7, fontWeight: 300 }}>
            {t('imageDesc', lang)}
          </p>
        </div>

        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[{ id: 'url', label: t('imageUrl', lang) }, { id: 'upload', label: t('uploadImage', lang) }].map(m => (
              <button key={m.id} onClick={() => setInputMode(m.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: inputMode === m.id ? `${T.accent}1f` : 'transparent', color: inputMode === m.id ? T.accent : T.text3, transition: 'all 0.18s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {inputMode === 'url' && (
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <GooeyInputWrapper>
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={e => e.key === 'Enter' && analyzeUrl()}
                  style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
              </GooeyInputWrapper>
              <button onClick={analyzeUrl} disabled={loading || !imageUrl.trim()}
                style={{ padding: '12px 24px', borderRadius: 8, background: loading ? `${T.accent}33` : `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: loading ? T.accent : (darkMode ? '#0a0a0f' : '#fff'), fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                {loading ? '...' : t('analyze', lang)}
              </button>
            </div>
          )}

          {inputMode === 'upload' && (
            <div>
              <IngestionZone
                onFileSelected={analyzeUpload}
                acceptedTypesText="JPG, PNG, WEBP"
                icon={Image}
                uploading={loading}
                status={t('analyzing', lang)}
                theme={T}
                lang={lang}
              />
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${T.accent}26`, borderTop: `2px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: T.text2, fontSize: 13 }}>{t('analyzingWithAI', lang)}</p>
            <p style={{ color: T.text3, fontSize: 11, marginTop: 4 }}>{t('checkingArtifacts', lang)}</p>
          </div>
        )}

        {error && (
          <div style={{ padding: 16, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 20 }}>
            ✕ {error}
          </div>
        )}

        {/* RESULTS GALLERY */}
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, scrollbarWidth: 'none' }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{ 
                minWidth: 100, height: 100, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', 
                border: activeIdx === i ? `3px solid ${T.accent}` : `1px solid ${T.border}`,
                opacity: activeIdx === i ? 1 : 0.6, transition: '0.2s', position: 'relative'
              }}>
                <img src={r.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: VERDICT_CONFIG(lang)[getSimplifiedVerdict(r.ai_probability)]?.color || T.accent, width: 12, height: 12, borderRadius: '50%', border: `2px solid ${T.bg}` }} />
              </div>
            ))}
            {loading && (
              <div style={{ minWidth: 100, height: 100, borderRadius: 12, background: `${T.accent}0a`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${T.accent}4d` }}>
                <div style={{ width: 24, height: 24, border: `2px solid ${T.accent}26`, borderTop: `2px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>
        )}

        {currentResult && cfg && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            {/* SAFE MODE Badge Indicator */}
            {currentResult.forensicStatus === "VISION_DEGRADED" && (
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 4, 
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', 
                color: '#fbbf24', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                marginBottom: 16, cursor: 'help'
              }} title="Running under constrained forensic environment. Heuristic fallback active.">
                ⚡ SAFE MODE ANALYSIS
              </div>
            )}

            <div className="responsive-grid" style={{ marginBottom: 20 }}>
              {currentResult.url && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `2px solid ${cfg.border}` }}>
                  <img src={currentResult.url} alt="analyzed" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
              <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, color: cfg.color, lineHeight: 1, marginBottom: 8 }}>{currentResult.ai_probability}%</div>
                <div style={{ fontSize: 11, color: cfg.color, opacity: darkMode ? 0.7 : 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>AI Likelihood</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 12, width: 'fit-content' }}>
                  <span style={{ fontSize: 14, color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 13, color: T.text2, opacity: 0.9, marginBottom: 16, lineHeight: 1.4 }}>
                  {getSecondaryText(simplifiedVerdict)}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: riskCfg.bg, color: riskCfg.color, fontWeight: 600 }}>{riskCfg.label} {t('risk', lang)}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: T.text3 }}>{currentResult.confidence}% {t('confidence', lang)}</span>
                </div>
              </div>
            </div>

            {/* Forensic Ambiguity range disclaimer */}
            {currentResult.ai_probability >= 40 && currentResult.ai_probability <= 60 && (
              <div style={{ 
                background: 'rgba(251,191,36,0.03)', borderLeft: '4px solid #fbbf24', borderRadius: '0 8px 8px 0', 
                padding: '12px 16px', marginBottom: 16, fontSize: 12.5, color: T.text2, lineHeight: 1.5
              }}>
                <strong style={{ color: '#fbbf24', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: 1, display: 'block', marginBottom: 4 }}>Mixed signals detected</strong>
                The analysis could not reach a strong conclusion.
              </div>
            )}

            {/* Toggle Button for Advanced Forensic Details */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 16px 0' }}>
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.accent}4d`,
                  borderRadius: 8,
                  color: T.accent,
                  padding: '10px 20px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  outline: 'none'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}0d`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {showAdvanced ? '▴ Hide Advanced Forensic Details' : '▾ Show Advanced Forensic Details'}
              </button>
            </div>

            {showAdvanced && (
              <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 16 }}>AUTHENTICITY MATRIX & SIGNAL ANALYSIS</p>
                  {[
                    ['AI Likelihood', currentResult.ai_probability, '#f87171'],
                    ['Human Authenticity', currentResult.real_probability, '#4ade80']
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: T.text2 }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compact Forensic Explanation block for ambiguous/uncertain assessments */}
                {(simplifiedVerdict === 'Unclear' || simplifiedVerdict === 'Possibly Real') && (
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 12, fontWeight: 700 }}>Forensic Caution Rationale</p>
                    <p style={{ fontSize: 13, color: T.text2, margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      Authenticity signals remain balanced. Analysis is held below decisive attribution limits due to:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20, color: T.text3, fontSize: 12, lineHeight: 1.8 }}>
                      <li><strong>Image Compression:</strong> Modern web compression strips micro-pixel structures.</li>
                      <li><strong>Resized Upload:</strong> Alterations in resolution destroy spatial entropy signals.</li>
                      <li><strong>Low Metadata Availability:</strong> Absence of camera profile, timestamps, and EXIF parameters.</li>
                      <li><strong>Insufficient Artifact Visibility:</strong> Visual anomalies fall below structural detection margins.</li>
                      <li><strong>Balanced Authenticity Indicators:</strong> The image contains both machine signatures and natural textures.</li>
                    </ul>
                  </div>
                )}

                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 12 }}>{t('analysis', lang)}</p>
                  <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0, fontStyle: 'italic', opacity: 1, fontWeight: 500 }}>
                    {(simplifiedVerdict === 'Unclear' || simplifiedVerdict === 'Possibly Real') 
                      ? 'Analysis finalized with balanced signals. Insufficient forensic evidence to confirm synthetic creation or natural camera capture definitively.' 
                      : currentResult.assessment}
                  </p>
                </div>

                {currentResult.context_info && (
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.accent, marginBottom: 16, fontWeight: 700 }}>{t('imageContext', lang)}</p>
                    <div className="responsive-grid" style={{ gap: 16 }}>
                      {currentResult.context_info.subject && (
                        <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                          <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('subject', lang)}</p>
                          <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{currentResult.context_info.subject}</p>
                        </div>
                      )}
                      {currentResult.context_info.location && (
                        <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                          <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('location', lang)}</p>
                          <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{currentResult.context_info.location}</p>
                        </div>
                      )}
                      {currentResult.context_info.historical_context && (
                        <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, gridColumn: 'span 2' }}>
                          <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('factContext', lang)}</p>
                          <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{currentResult.context_info.historical_context}</p>
                        </div>
                      )}
                      {currentResult.context_info.entities?.length > 0 && (
                        <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, gridColumn: 'span 2' }}>
                          <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 8px' }}>{t('identifiedEntities', lang)}</p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {currentResult.context_info.entities.map((e, idx) => (
                              <span key={idx} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: T.accentMuted || `${T.accent}1a`, color: T.accent, fontWeight: 600 }}>{e}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentResult.forensic_breakdown && (
                  <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 16 }}>{t('forensicBreakdown', lang)}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {Object.entries(currentResult.forensic_breakdown).map(([key, value]) => (
                        <div key={key} style={{ padding: '16px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, borderLeft: `3px solid ${T.accent}` }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'capitalize', fontWeight: 700, color: T.text, letterSpacing: 0.5 }}>
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 14 }}>{t('detectionIndicators', lang)}</p>
                  {currentResult.indicators.map((ind, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ color: T.accent, fontSize: 10, marginTop: 4, flexShrink: 0 }}>◆</span>
                      <p style={{ margin: 0, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{ind}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentResult.extracted_text && (
              <div style={{ background: T.cardBg, border: `1px solid ${T.accent}4d`, borderRadius: 12, padding: 20, marginBottom: 16, animation: 'fadeUp 0.4s ease' }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.accent, marginBottom: 12, fontWeight: 700 }}>{t('originalSentence', lang)}</p>
                <div style={{ padding: '14px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 15, color: T.text, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>"{currentResult.extracted_text}"</p>
                </div>
              </div>
            )}

            {/* ASK VERIXA CHAT SECTION */}
            <div style={{ background: T.cardBg, border: `1.5px solid ${T.accent}`, borderRadius: 16, padding: 24, marginBottom: 28, boxShadow: `0 10px 40px ${T.accent}1a`, animation: 'fadeUp 0.6s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: darkMode ? '#0a0a0f' : '#fff', fontSize: 14 }}>V</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t('askAboutImage', lang)}</h3>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>{t('legalIntelligenceActive', lang)}</p>
                </div>
              </div>

              {/* Chat History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 12 }}>
                    <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>{t('noQueriesYet', lang)}</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => msg.content && (
                    <div key={i} style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: msg.role === 'user' ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : `${T.accent}0a`,
                      border: `1px solid ${msg.role === 'user' ? T.border : `${T.accent}33`}`,
                      animation: 'fadeUp 0.2s ease'
                    }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px', fontWeight: 700 }}>
                        {msg.role === 'user' ? t('you', lang) : t('verixa', lang)}
                      </p>
                      <p style={{ fontSize: 14, color: T.text, margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                    </div>
                  ))
                )}
                {queryLoading && (
                   <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 14, background: `${T.accent}0a`, border: `1px solid ${T.accent}33` }}>
                     <div style={{ display: 'flex', gap: 4 }}>
                        <div style={{ width: 6, height: 6, background: T.accent, borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        <div style={{ width: 6, height: 6, background: T.accent, borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                        <div style={{ width: 6, height: 6, background: T.accent, borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ position: 'relative' }}>
                <textarea 
                  value={imageQuery} 
                  onChange={e => setImageQuery(e.target.value)}
                  placeholder={t('askAnythingPlaceholder', lang)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
                  style={{ width: '100%', height: 80, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', color: T.text, outline: 'none', resize: 'none', fontSize: 14, fontFamily: 'inherit' }}
                />
                <button 
                  onClick={handleQuery}
                  disabled={queryLoading || !imageQuery.trim()}
                  style={{ position: 'absolute', bottom: 12, right: 12, padding: '8px 20px', borderRadius: 8, background: T.accent, border: 'none', color: darkMode ? '#0a0a0f' : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: '0.2s' }}
                >
                  {t('send', lang)}
                </button>
              </div>
            </div>

            <button onClick={() => { setResults([]); setPreviews([]); setImageUrl(''); setActiveIdx(0); setChatHistory([]); }}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.text3, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('clearAllDocuments', lang)}
            </button>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div style={{ marginTop: 16, padding: 20, background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12 }}>
            <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 12 }}>{t('trySamples', lang)}</p>
            {[
              { label: '[AI Generated] Ultra-Realistic Portrait', url: window.location.origin + '/samples/ai_portrait.png' },
              { label: '[AI Generated] Cyberpunk Cityscape', url: window.location.origin + '/samples/ai_city.png' },
              { label: '[Real Photo] Professional Portrait', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
              { label: '[Real Photo] Mountain Landscape', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600' },
            ].map((s, i) => (
              <button key={i} onClick={() => { setImageUrl(s.url); setInputMode('url'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px', marginBottom: 6, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`, borderRadius: 6, color: T.accent, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
              >
                {s.label} →
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer darkMode={darkMode} />

      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}