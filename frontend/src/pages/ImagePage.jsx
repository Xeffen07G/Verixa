import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

const API_URL = process.env.REACT_APP_API_URL || '';

const VERDICT_CONFIG = (lang) => ({
  'AI Generated':        { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✗', label: t('aiGenerated', lang) },
  'Likely AI Generated': { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  icon: '~', label: t('likelyAI', lang) },
  'Uncertain':           { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '?', label: t('uncertain', lang) },
  'Likely Real':         { color: '#a3e635', bg: 'rgba(163,230,53,0.08)',  border: 'rgba(163,230,53,0.25)',  icon: '~', label: t('likelyReal', lang) },
  'Real':                { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓', label: t('real', lang) },
});

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

  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [inputMode, setInputMode] = useState('url');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, queryLoading]);

  const T_DARK = {
    bg: '#0a0a0f', bg2: 'rgba(16,16,23,0.9)', text: '#f5f3ef', text2: 'rgba(245,243,239,0.45)',
    text3: 'rgba(245,243,239,0.25)', border: 'rgba(255,255,255,0.06)', accent: '#c9a96e',
    cardBg: 'rgba(16,16,23,0.8)', cardBorder: 'rgba(255,255,255,0.07)',
  };

  const T_LIGHT = {
    bg: '#e8e5de', bg2: 'rgba(232,229,222,0.95)', text: '#0d0d0d', text2: '#2a2a2a',
    text3: '#555555', border: 'rgba(0,0,0,0.12)', accent: '#5a421a',
    cardBg: '#f0ede6', cardBorder: 'rgba(0,0,0,0.08)',
  };

  const T = darkMode ? T_DARK : T_LIGHT;

  async function analyzeUrl() {
    if (!imageUrl.trim()) return;
    setLoading(true); setError(null); setResult(null);
    setPreview(imageUrl);
    try {
      const res = await fetch(`${API_URL}/api/image/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeUpload(file) {
    setLoading(true); setError(null); setResult(null);
    setUploadFile(file);
    setPreview(URL.createObjectURL(file));
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch(`${API_URL}/api/image/upload`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: arrayBuffer,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? (VERDICT_CONFIG(lang)[result.verdict] || VERDICT_CONFIG(lang)['Uncertain']) : null;
  const riskCfg = result ? (RISK_CONFIG(lang)[result.risk_level] || RISK_CONFIG(lang)['Medium']) : null;

  const [imageQuery, setImageQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  async function handleQuery() {
    if (!imageQuery.trim() || !result) return;
    const currentQuery = imageQuery;
    setImageQuery('');
    setQueryLoading(true);
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
    
    console.log("Image Query started:", currentQuery);
    try {
      const payload = { 
        query: currentQuery, 
        context: result.extracted_text,
        imageContext: result.assessment,
        history: chatHistory.slice(-4)
      };
      console.log("Payload:", payload);

      const res = await fetch(`${API_URL}/api/image/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Data received:", data);

      if (!res.ok) throw new Error(data.error || 'Query failed');
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      console.error("Image Query Error:", e);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: " + e.message }]);
    } finally {
      setQueryLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingTop: 0, transition: 'background 0.3s, color 0.3s', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @media (max-width: 600px) {
          .analysis-grid { grid-template-columns: 1fr !important; }
          .analysis-grid img { height: 200px !important; }
        }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'calc(var(--nav-h) + 48px) 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.accent, marginBottom: 12 }}>{t('imageIntel', lang)}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(36px, 6vw, 56px)', color: T.text, margin: '0 0 16px', lineHeight: 1.1 }}>
            {t('isImage', lang)} <span style={{ fontStyle: 'italic', color: T.accent }}>{t('real', lang)}?</span>
          </h1>
          <p style={{ fontSize: 15, color: T.text2, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
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
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={e => e.key === 'Enter' && analyzeUrl()}
                style={{ flex: 1, padding: '12px 16px', background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
              <button onClick={analyzeUrl} disabled={loading || !imageUrl.trim()}
                style={{ padding: '12px 24px', borderRadius: 8, background: loading ? `${T.accent}33` : `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: loading ? T.accent : (darkMode ? '#0a0a0f' : '#fff'), fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                {loading ? '...' : t('analyze', lang)}
              </button>
            </div>
          )}

          {inputMode === 'upload' && (
            <div>
              <div style={{ border: `2px dashed ${T.accent}4d`, borderRadius: 10, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: `${T.accent}05` }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) analyzeUpload(f); }}
                onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 36, marginBottom: 10, color: T.accent }}>◈</div>
                <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>{loading ? t('analyzing', lang) : t('clickDragImage', lang)}</p>
                <p style={{ fontSize: 11, color: T.text3, marginTop: 6 }}>JPG, PNG, WEBP — {t('max10mb', lang)}</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) analyzeUpload(f); }} />
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

        {result && cfg && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
              {preview && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `2px solid ${cfg.border}` }}>
                  <img src={preview} alt="analyzed" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
              <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, color: cfg.color, lineHeight: 1, marginBottom: 8 }}>{result.ai_probability}%</div>
                <div style={{ fontSize: 11, color: cfg.color, opacity: darkMode ? 0.7 : 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>{t('aiProbability', lang)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 12, width: 'fit-content' }}>
                  <span style={{ fontSize: 14, color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: riskCfg.bg, color: riskCfg.color, fontWeight: 600 }}>{riskCfg.label} {t('risk', lang)}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: T.text3 }}>{result.confidence}% {t('confidence', lang)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 16 }}>{t('probBreakdown', lang)}</p>
              {[[t('aiGenerated', lang), result.ai_probability, '#f87171'], [t('authenticReal', lang), result.real_probability, '#4ade80']].map(([label, val, color]) => (
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

            {result.extracted_text && (
              <div style={{ background: T.cardBg, border: `1px solid ${T.accent}4d`, borderRadius: 12, padding: 20, marginBottom: 16, animation: 'fadeUp 0.4s ease' }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.accent, marginBottom: 12, fontWeight: 700 }}>{t('originalSentence', lang)}</p>
                <div style={{ padding: '14px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 15, color: T.text, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>"{result.extracted_text}"</p>
                </div>
              </div>
            )}

            <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 12 }}>{t('analysis', lang)}</p>
              <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0, fontStyle: 'italic', opacity: 1, fontWeight: 500 }}>{result.assessment}</p>
            </div>

            {result.context_info && (
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16, animation: 'fadeUp 0.5s ease' }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.accent, marginBottom: 16, fontWeight: 700 }}>{t('imageContext', lang)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {result.context_info.subject && (
                    <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('subject', lang)}</p>
                      <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{result.context_info.subject}</p>
                    </div>
                  )}
                  {result.context_info.location && (
                    <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('location', lang)}</p>
                      <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{result.context_info.location}</p>
                    </div>
                  )}
                  {result.context_info.historical_context && (
                    <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, gridColumn: 'span 2' }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 4px' }}>{t('factContext', lang)}</p>
                      <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{result.context_info.historical_context}</p>
                    </div>
                  )}
                  {result.context_info.entities?.length > 0 && (
                    <div style={{ padding: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 8, gridColumn: 'span 2' }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: T.text3, margin: '0 0 8px' }}>{t('identifiedEntities', lang)}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {result.context_info.entities.map((e, idx) => (
                          <span key={idx} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: T.accentMuted || `${T.accent}1a`, color: T.accent, fontWeight: 600 }}>{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.forensic_breakdown && (
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16, animation: 'fadeUp 0.5s ease' }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 16 }}>{t('forensicBreakdown', lang)}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(result.forensic_breakdown).map(([key, value]) => (
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

            {result.indicators?.length > 0 && (
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 14 }}>{t('detectionIndicators', lang)}</p>
                {result.indicators.map((ind, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: T.accent, fontSize: 10, marginTop: 4, flexShrink: 0 }}>◆</span>
                    <p style={{ margin: 0, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{ind}</p>
                  </div>
                ))}
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
                  chatHistory.map((msg, i) => (
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

            <button onClick={() => { setResult(null); setPreview(null); setImageUrl(''); setUploadFile(null); }}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border}`, color: T.text3, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t('analyzeAnother', lang)}
            </button>
          </div>
        )}

        {!result && !loading && (
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
    </div>
  );
}