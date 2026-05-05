import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Shield, Activity, Cpu, Search, Upload, Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

const VERDICT_CONFIG = (lang) => ({
  'Deepfake Detected':   { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✗', label: 'Deepfake Detected' },
  'Likely Synthetic':    { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  icon: '~', label: 'Likely Synthetic' },
  'Uncertain':           { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '?', label: t('uncertain', lang) },
  'Authentic Footage':   { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓', label: 'Authentic Footage' },
});

export default function VideoPage() {
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

  const [videoUrl, setVideoUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [inputMode, setInputMode] = useState('url');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

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

  async function analyzeVideo() {
    setLoading(true); setError(null); setResult(null);
    if (inputMode === 'url' && !videoUrl.trim()) {
      setLoading(false);
      return;
    }
    
    // Logic for both URL and Upload
    try {
      const endpoint = inputMode === 'url' ? '/api/video/url' : '/api/video/upload';
      const body = inputMode === 'url' ? JSON.stringify({ videoUrl }) : uploadFile;
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: inputMode === 'url' ? { 'Content-Type': 'application/json' } : {},
        body: body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video analysis failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setPreview(URL.createObjectURL(file));
      setInputMode('upload');
    }
  };

  const cfg = result ? (VERDICT_CONFIG(lang)[result.verdict] || VERDICT_CONFIG(lang)['Uncertain']) : null;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, transition: 'background 0.3s', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
        
        {/* Header */}
        <section style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: T.accentMuted, color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 16 }}>
            <Activity size={14} /> {t('videoVerify', lang).toUpperCase()}
          </motion.div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, margin: '0 0 16px' }}>
            Unmasking <span style={{ fontStyle: 'italic', color: T.accent }}>Deepfakes.</span>
          </h1>
          <p style={{ color: T.text2, fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Advanced temporal and biometric analysis to detect synthetic media artifacts in motion.
          </p>
        </section>

        {/* Input Controls */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['url', 'upload'].map(mode => (
              <button key={mode} onClick={() => setInputMode(mode)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: inputMode === mode ? `${T.accent}1a` : 'transparent', color: inputMode === mode ? T.accent : T.text3, fontSize: 12, fontWeight: 700, transition: '0.2s' }}>
                {mode === 'url' ? 'VIDEO URL' : 'UPLOAD FILE'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {inputMode === 'url' ? (
              <input value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setPreview(e.target.value); }}
                placeholder="https://youtube.com/watch?v=..."
                style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, outline: 'none' }} />
            ) : (
              <div onClick={() => fileRef.current.click()} style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 12, color: uploadFile ? T.text : T.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Upload size={18} /> {uploadFile ? uploadFile.name : 'Select video file...'}
              </div>
            )}
            <button onClick={analyzeVideo} disabled={loading}
              style={{ padding: '0 32px', borderRadius: 12, background: loading ? T.border : `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: darkMode ? '#0a0a0f' : '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
              {loading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'ANALYZE'}
            </button>
          </div>
          <input type="file" ref={fileRef} onChange={handleFileUpload} accept="video/*" style={{ display: 'none' }} />
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `2px solid ${T.accent}22`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <h3 style={{ fontSize: 20, fontWeight: 300, color: T.text }}>Running Temporal Audit...</h3>
              <p style={{ color: T.text3, fontSize: 13, marginTop: 8 }}>Deconstructing frames and analyzing biometric landmarks</p>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: 16, borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
              
              {/* Video Player & Timeline */}
              <div>
                <div style={{ borderRadius: 20, overflow: 'hidden', background: '#000', position: 'relative', border: `1px solid ${T.cardBorder}`, aspectRatio: '16/9' }}>
                  {preview && (
                    <video ref={videoRef} src={preview} style={{ width: '100%', height: '100%' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => { if (videoRef.current) { if (playing) videoRef.current.pause(); else videoRef.current.play(); setPlaying(!playing); } }}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                      {playing ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' }}>
                      <div style={{ width: '40%', height: '100%', background: T.accent, borderRadius: 2 }} />
                      {/* Anomalies indicators */}
                      {result.anomalies?.map((a, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${a.timestamp_pct}%`, top: -4, width: 4, height: 12, background: '#f87171', borderRadius: 2 }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, padding: 16, background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBorder}` }}>
                    <p style={{ fontSize: 10, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Resolution</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>1920 x 1080 (HD)</p>
                  </div>
                  <div style={{ flex: 1, padding: 16, background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBorder}` }}>
                    <p style={{ fontSize: 10, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Frame Rate</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>29.97 FPS</p>
                  </div>
                </div>
              </div>

              {/* Analysis Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ padding: 24, borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: cfg.color, marginBottom: 8 }}>{result.ai_score}%</div>
                  <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Deepfake Probability</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: cfg.color + '1a', color: cfg.color, fontWeight: 700, fontSize: 13 }}>
                    {cfg.icon} {cfg.label}
                  </div>
                </div>

                <div style={{ padding: 24, borderRadius: 20, background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 12, letterSpacing: 1, color: T.text3, textTransform: 'uppercase' }}>Technical Indicators</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {result.indicators?.map((ind, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {ind.risk === 'high' ? <AlertCircle size={16} color="#f87171" /> : <CheckCircle size={16} color="#4ade80" />}
                        <span style={{ fontSize: 13, color: T.text2 }}>{ind.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 24, borderRadius: 20, background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 12, letterSpacing: 1, color: T.text3, textTransform: 'uppercase' }}>Forensic Assessment</h4>
                  <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{result.assessment}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
}
