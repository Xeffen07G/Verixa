import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Activity, Search, Upload, Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

const VERDICT_CONFIG = (lang) => ({
  'Deepfake Detected':   { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✗', label: t('deepfakeDetected', lang) },
  'Likely Synthetic':    { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  icon: '~', label: t('likelySynthetic', lang) },
  'Uncertain':           { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '?', label: t('uncertain', lang) },
  'Authentic Footage':   { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓', label: t('authenticFootage', lang) },
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Support for standard watch, shorts, live, and mobile youtu.be links
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : null;
  };

  const ytEmbed = inputMode === 'url' ? getYouTubeEmbedUrl(preview) : null;

  React.useEffect(() => {
    if (videoRef.current && !ytEmbed) {
      videoRef.current.load();
      setPlaying(false);
      setCurrentTime(0);
    }
  }, [preview, ytEmbed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const T_DARK = {
    bg: '#0a0a0f', bg2: 'rgba(16,16,23,0.9)', text: '#f5f3ef', text2: 'rgba(245,243,239,0.45)',
    text3: 'rgba(245,243,239,0.25)', border: 'rgba(255,255,255,0.06)', accent: '#c9a96e',
    cardBg: 'rgba(16,16,23,0.8)', cardBorder: 'rgba(255,255,255,0.07)',
    accentMuted: 'rgba(201,169,110,0.1)',
  };

  const T_LIGHT = {
    bg: '#e8e5de', bg2: 'rgba(232,229,222,0.95)', text: '#0d0d0d', text2: '#2a2a2a',
    text3: '#555555', border: 'rgba(0,0,0,0.12)', accent: '#5a421a',
    cardBg: '#f0ede6', cardBorder: 'rgba(0,0,0,0.08)',
    accentMuted: 'rgba(90,66,26,0.1)',
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
    <div key={lang} style={{ minHeight: '100vh', background: T.bg, color: T.text, transition: 'background 0.3s', fontFamily: 'DM Sans, sans-serif', paddingTop: 0 }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'calc(var(--nav-h) + 48px) 24px 60px' }}>
        
        {/* Header */}
        <section style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: T.accentMuted, color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 16 }}>
            <Activity size={14} /> {t('videoVerify', lang).toUpperCase()}
          </motion.div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, margin: '0 0 16px' }}>
            {t('videoHeroTitle1', lang)} <span style={{ fontStyle: 'italic', color: T.accent }}>{t('videoHeroTitle2', lang)}</span>
          </h1>
          <p style={{ color: T.text2, fontSize: 16, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            {t('videoHeroSubtitle', lang)}
          </p>
        </section>

        {/* Input Controls */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 20, padding: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['url', 'upload'].map(mode => (
              <button key={mode} onClick={() => setInputMode(mode)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: inputMode === mode ? `${T.accent}1a` : 'transparent', color: inputMode === mode ? T.accent : T.text3, fontSize: 12, fontWeight: 700, transition: '0.2s' }}>
                {mode === 'url' ? t('videoUrlBtn', lang) : t('uploadFileBtn', lang)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {inputMode === 'url' ? (
              <input value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setPreview(e.target.value); }}
                placeholder={t('videoUrlPlaceholder', lang)}
                style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, outline: 'none' }} />
            ) : (
              <div onClick={() => fileRef.current.click()} style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 12, color: uploadFile ? T.text : T.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Upload size={18} /> {uploadFile ? uploadFile.name : t('selectVideoFile', lang)}
              </div>
            )}
            <button onClick={analyzeVideo} disabled={loading}
              style={{ padding: '0 32px', borderRadius: 12, background: loading ? T.border : `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: darkMode ? '#0a0a0f' : '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
              {loading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : t('analyzeBtn', lang)}
            </button>
          </div>
          <input type="file" ref={fileRef} onChange={handleFileUpload} accept="video/*" style={{ display: 'none' }} />
        </div>

        {/* Preview Area (Always visible if preview exists) */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ marginBottom: 32 }}>
              <div style={{ borderRadius: 24, overflow: 'hidden', background: '#000', position: 'relative', border: `1px solid ${T.cardBorder}`, aspectRatio: '16/9', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                {ytEmbed ? (
                  <iframe src={ytEmbed} title="Video Preview" style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <video 
                    ref={videoRef} src={preview} playsInline autoPlay muted 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={() => {
                      if (!ytEmbed) {
                        setError('The provided URL is not a direct video file. Please use a YouTube link or upload a file.');
                        setPreview(null);
                      }
                    }}
                  />
                )}
                
                {!ytEmbed && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 32px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => { if (videoRef.current) { if (playing) videoRef.current.pause(); else videoRef.current.play(); } }}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                      {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: 3 }} />}
                    </button>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, position: 'relative', cursor: 'pointer' }}
                      onClick={(e) => {
                        if (videoRef.current) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pos = (e.clientX - rect.left) / rect.width;
                          videoRef.current.currentTime = pos * videoRef.current.duration;
                        }
                      }}>
                      <div style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%', height: '100%', background: T.accent, borderRadius: 3, transition: 'width 0.1s linear' }} />
                      
                      {/* Anomalies indicators */}
                      {result?.anomalies?.map((a, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${a.timestamp_pct}%`, top: -4, width: 4, height: 14, background: '#f87171', borderRadius: 2, boxShadow: '0 0 10px #f87171' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#fff', fontFamily: 'monospace', opacity: 0.8, minWidth: 80 }}>
                      {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </div>
                  </div>
                )}
                
                {/* Overlay Badge */}
                <div style={{ position: 'absolute', top: 20, left: 20, padding: '6px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: 8, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, background: playing ? '#4ade80' : '#fbbf24', borderRadius: '50%' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>{playing ? t('streaming', lang) : t('ready', lang)}</span>
                </div>

                {/* Clear Button */}
                <button onClick={() => { setPreview(null); setVideoUrl(''); setUploadFile(null); setResult(null); setCurrentTime(0); setDuration(0); }}
                  style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: `3px solid ${T.accent}22`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
              <h3 style={{ fontSize: 24, fontWeight: 300, color: T.text, fontFamily: 'Cormorant Garamond, serif' }}>{t('runningAudit', lang)}</h3>
              <p style={{ color: T.text3, fontSize: 14, marginTop: 8 }}>{t('deconstructingFrames', lang)}</p>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: 16, borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Analysis Overview Banner */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 24, padding: 32, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, margin: '0 0 12px' }}>{t('forensicReport', lang)} <span style={{ color: T.accent }}>{t('overview', lang)}</span></h2>
                  <p style={{ color: T.text2, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                    {t('reportDesc1', lang)} <span style={{ color: result.anomalies?.length > 0 ? '#f87171' : '#4ade80', fontWeight: 700 }}>{result.anomalies?.length || 0} {t('reportDesc2', lang)}</span>
                  </p>
                </div>
                <div style={{ width: 1, height: 60, background: T.border }} />
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <div style={{ fontSize: 11, color: T.text3, letterSpacing: 2, marginBottom: 4 }}>{t('integrity', lang)}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: cfg.color }}>{result.verdict === 'Authentic Footage' ? t('high', lang) : t('compromised', lang)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Technical Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ padding: 32, borderRadius: 24, background: cfg.bg, border: `1px solid ${cfg.border}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 64, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: cfg.color, lineHeight: 1, marginBottom: 8 }}>{result.ai_score}%</div>
                    <div style={{ fontSize: 12, color: cfg.color, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>{t('deepfakeProbability', lang)}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 99, background: cfg.color + '1a', color: cfg.color, fontWeight: 700, fontSize: 14 }}>
                      <span style={{ fontSize: 18 }}>{cfg.icon}</span> {cfg.label}
                    </div>
                  </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, padding: 20, background: T.cardBg, borderRadius: 20, border: `1px solid ${T.cardBorder}` }}>
                    <p style={{ fontSize: 10, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{t('resolution', lang)}</p>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>1920 x 1080 (HD)</p>
                  </div>
                  <div style={{ flex: 1, padding: 20, background: T.cardBg, borderRadius: 20, border: `1px solid ${T.cardBorder}` }}>
                    <p style={{ fontSize: 10, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{t('frameRate', lang)}</p>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>29.97 FPS</p>
                  </div>
                </div>

                <div style={{ padding: 28, borderRadius: 24, background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 12, letterSpacing: 1, color: T.text3, textTransform: 'uppercase' }}>{t('forensicAssessment', lang)}</h4>
                  <p style={{ margin: 0, fontSize: 15, color: T.text, lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{result.assessment}"
                  </p>
                </div>
              </div>

              {/* Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ padding: 28, borderRadius: 24, background: T.cardBg, border: `1px solid ${T.cardBorder}`, flex: 1 }}>
                  <h4 style={{ margin: '0 0 20px', fontSize: 12, letterSpacing: 1, color: T.text3, textTransform: 'uppercase' }}>{t('technicalIndicators', lang)}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {result.indicators?.map((ind, i) => (
                      <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ marginTop: 2 }}>
                          {ind.risk === 'high' ? <AlertCircle size={18} color="#f87171" /> : <CheckCircle size={18} color="#4ade80" />}
                        </div>
                        <span style={{ fontSize: 14, color: T.text2, lineHeight: 1.5 }}>{ind.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.anomalies?.length > 0 && (
                  <div style={{ padding: 28, borderRadius: 24, background: T.cardBg, border: `1px solid ${T.cardBorder}` }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 12, letterSpacing: 1, color: T.text3, textTransform: 'uppercase' }}>{t('temporalAnomalies', lang)}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {result.anomalies.map((a, i) => (
                        <div key={i} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600 }}>
                          {a.type} @ {a.timestamp_pct}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
