import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VERDICT_CONFIG = {
  'AI Generated':        { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✗' },
  'Likely AI Generated': { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  icon: '~' },
  'Uncertain':           { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '?' },
  'Likely Real':         { color: '#a3e635', bg: 'rgba(163,230,53,0.08)',  border: 'rgba(163,230,53,0.25)',  icon: '~' },
  'Real':                { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  icon: '✓' },
};

const RISK_CONFIG = {
  'High':   { color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  'Medium': { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  },
  'Low':    { color: '#4ade80', bg: 'rgba(74,222,128,0.08)'  },
};

export default function ImagePage() {
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [inputMode, setInputMode] = useState('url');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

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

  const cfg = result ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['Uncertain']) : null;
  const riskCfg = result ? (RISK_CONFIG[result.risk_level] || RISK_CONFIG['Medium']) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
      `}</style>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: '#f5f3ef', letterSpacing: 1, textDecoration: 'none' }}>VeriXa</Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/verify" style={{ padding: '6px 16px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'none' }}>Text Verify</Link>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.5 }}>BETA</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 12 }}>Image Intelligence</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(36px, 6vw, 56px)', color: '#f5f3ef', margin: '0 0 16px', lineHeight: 1.1 }}>
            Is this image <span style={{ fontStyle: 'italic', color: '#c9a96e' }}>real?</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(245,243,239,0.45)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            VeriXa uses AI vision to detect deepfakes, AI-generated images, and digital manipulation.
          </p>
        </div>

        <div style={{ background: 'rgba(16,16,23,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {[{ id: 'url', label: 'Image URL' }, { id: 'upload', label: 'Upload Image' }].map(m => (
              <button key={m.id} onClick={() => setInputMode(m.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: inputMode === m.id ? 'rgba(201,169,110,0.12)' : 'transparent', color: inputMode === m.id ? '#c9a96e' : 'rgba(255,255,255,0.3)', transition: 'all 0.18s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {inputMode === 'url' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={e => e.key === 'Enter' && analyzeUrl()}
                style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f5f3ef', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
              <button onClick={analyzeUrl} disabled={loading || !imageUrl.trim()}
                style={{ padding: '12px 24px', borderRadius: 8, background: loading ? 'rgba(201,169,110,0.2)' : 'linear-gradient(135deg, #c9a96e, #a07b42)', border: 'none', color: loading ? '#c9a96e' : '#0a0a0f', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '...' : 'Analyze'}
              </button>
            </div>
          )}

          {inputMode === 'upload' && (
            <div>
              <div style={{ border: '2px dashed rgba(201,169,110,0.3)', borderRadius: 10, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(201,169,110,0.02)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) analyzeUpload(f); }}
                onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 36, marginBottom: 10, color: '#c9a96e' }}>◈</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{loading ? 'Analyzing...' : 'Click or drag an image here'}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>JPG, PNG, WEBP — Max 10MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) analyzeUpload(f); }} />
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(201,169,110,0.15)', borderTop: '2px solid #c9a96e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Analyzing image with AI vision...</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4 }}>Checking for artifacts, inconsistencies, and AI patterns</p>
          </div>
        )}

        {error && (
          <div style={{ padding: 16, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 20 }}>
            ✕ {error}
          </div>
        )}

        {result && cfg && (
          <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
            <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
              {preview && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `2px solid ${cfg.border}` }}>
                  <img src={preview} alt="analyzed" style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
              <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, color: cfg.color, lineHeight: 1, marginBottom: 8 }}>{result.ai_probability}%</div>
                <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>AI Probability</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 12, width: 'fit-content' }}>
                  <span style={{ fontSize: 14, color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{result.verdict}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: riskCfg.bg, color: riskCfg.color, fontWeight: 600 }}>{result.risk_level} Risk</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{result.confidence}% confidence</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16,16,23,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Probability Breakdown</p>
              {[['AI Generated', result.ai_probability, '#f87171'], ['Authentic / Real', result.real_probability, '#4ade80']].map(([label, val, color]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(16,16,23,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Analysis</p>
              <p style={{ fontSize: 14, color: 'rgba(245,243,239,0.7)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{result.assessment}</p>
            </div>

            {result.indicators?.length > 0 && (
              <div style={{ background: 'rgba(16,16,23,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>Detection Indicators</p>
                {result.indicators.map((ind, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: '#c9a96e', fontSize: 10, marginTop: 4, flexShrink: 0 }}>◆</span>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(245,243,239,0.6)', lineHeight: 1.5 }}>{ind}</p>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setResult(null); setPreview(null); setImageUrl(''); setUploadFile(null); }}
              style={{ width: '100%', padding: 12, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
              Analyze Another Image
            </button>
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop: 16, padding: 20, background: 'rgba(16,16,23,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>Try these sample URLs</p>
            {[
              { label: 'Real portrait photo', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400' },
              { label: 'Real landscape photo', url: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400' },
              { label: 'Real street photo', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400' },
            ].map((s, i) => (
              <button key={i} onClick={() => { setImageUrl(s.url); setInputMode('url'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#c9a96e', fontSize: 12, cursor: 'pointer' }}>
                {s.label} →
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}