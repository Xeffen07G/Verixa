import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollReveal from '../components/ScrollReveal';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Globe, Share2, Link as LinkIcon, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

const VERDICT_CONFIG = (lang) => ({
  'False':          { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', icon: <AlertTriangle size={12} />, label: t('mostlyInaccurate', lang) },
  'Partially True': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', icon: <Activity size={12} />, label: t('mixedAccuracy', lang) },
  'True':           { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)', icon: <CheckCircle size={12} />, label: t('mostlyAccurate', lang) },
});

function formatTimeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow', lang);
  if (mins < 60) return `${mins}m ${t('ago', lang)}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${t('ago', lang)}`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${t('ago', lang)}`;
}

function RankBadge({ rank, color }) {
  const isTop = rank <= 3;
  return (
    <div style={{
      width: isTop ? 48 : 36,
      height: isTop ? 48 : 36,
      borderRadius: '50%',
      background: isTop ? `linear-gradient(135deg, ${color}33, transparent)` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isTop ? color : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isTop ? 20 : 14, fontWeight: 800, color: isTop ? color : 'rgba(255,255,255,0.4)',
      boxShadow: isTop ? `0 0 20px ${color}1a` : 'none',
      fontFamily: 'DM Mono, monospace',
      position: 'relative'
    }}>
      {rank}
      {isTop && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', top: -5, right: -5, width: 12, height: 12, background: color, borderRadius: '50%', border: '2px solid #0a0a0f' }}
        />
      )}
    </div>
  );
}

export default function TrendingPage() {
  const { lang } = useLang();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });
  const [trending, setTrending] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/trending`);
      const data = await res.json();
      setTrending(data.trending || []);
      setTotalTracked(data.totalTracked || 0);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to fetch trending:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 30000);
    return () => clearInterval(interval);
  }, [fetchTrending]);

  const shareOnTwitter = (item) => {
    const text = `${t('trendingShareTitle', lang)}\n\n"${item.claim}"\n\nVerdict: ${item.verdict} — verified by @VeriXaAI\n\nhttps://verixa-gamma.vercel.app/trending`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = (idx) => {
    navigator.clipboard.writeText(`https://verixa-gamma.vercel.app/trending#claim-${idx}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const T = darkMode ? {
    bg: '#0a0a0f', surface: '#13131a', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)', text3: 'rgba(245,243,239,0.4)',
    border: 'rgba(255,255,255,0.08)', cardBg: 'rgba(16,16,24,0.7)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.15)',
    glow: 'rgba(201,169,110,0.05)'
  } : {
    bg: '#f8f7f4', surface: '#ffffff', text: '#0d0d0d',
    text2: '#333333', text3: '#666666',
    border: 'rgba(0,0,0,0.1)', cardBg: 'rgba(255,255,255,0.9)',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.1)',
    glow: 'rgba(90,66,26,0.03)'
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, transition: 'background 0.3s', overflowX: 'hidden' }}>
      <style>{`
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .glass-card { backdrop-filter: blur(20px); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .glass-card:hover { transform: translateY(-4px) scale(1.01); border-color: ${T.accent}4d !important; box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${T.glow}; }
        .velocity-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.05); position: relative; overflow: hidden; }
        .velocity-fill { height: 100%; position: absolute; left: 0; top: 0; }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Decorative Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: darkMode ? 0.4 : 0.1 }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${T.accent}1a 0%, transparent 70%)`, filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${T.accent}0d 0%, transparent 70%)`, filter: 'blur(100px)' }} />
      </div>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '140px 24px 80px', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <section style={{ textAlign: 'center', marginBottom: 80 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderRadius: 99, background: T.accentMuted, color: T.accent, fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 24, border: `1px solid ${T.accent}33` }}>
            <Globe size={14} /> {t('liveLeaderboard', lang).toUpperCase()}
          </motion.div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 300, margin: '0 0 20px', lineHeight: 1.1 }}>
            {t('trendingTitlePart1', lang)} <span style={{ fontStyle: 'italic', color: T.accent }}>{t('trendingTitlePart2', lang)}</span>
          </h1>
          <p style={{ color: T.text2, fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6, fontWeight: 300 }}>
            {t('trendingSubtitle', lang)}
          </p>
        </section>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 60 }}>
          {[
            { label: t('totalTracked', lang), value: totalTracked, icon: <Activity size={20} />, sub: 'Claims audited globally' },
            { label: t('autoRefresh', lang), value: '30s', icon: <TrendingUp size={20} />, sub: 'Continuous intelligence feed' },
            { label: t('lastChecked', lang), value: lastUpdated || '...', icon: <Info size={20} />, sub: 'Platform synchronization time' }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card" style={{ padding: '24px 32px', borderRadius: 24, background: T.cardBg, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${T.accent}4d, transparent)`, animation: 'scanline 3s infinite' }} />
              <div style={{ color: T.accent, marginBottom: 16 }}>{stat.icon}</div>
              <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: T.text3 }}>{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Trending List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div style={{ width: 40, height: 40, border: `2px solid ${T.accent}22`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : trending.map((item, i) => {
              const cfg = VERDICT_CONFIG(lang)[item.verdict] || VERDICT_CONFIG(lang)['False'];
              const velocity = Math.min(100, Math.floor((item.count / 5000) * 100)); // Simulated velocity %
              
              return (
                <motion.div
                  layout
                  key={item.claim}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 24, padding: '28px 32px', borderRadius: 24,
                    background: T.cardBg, border: `1px solid ${T.border}`, cursor: 'pointer'
                  }}
                >
                  <RankBadge rank={i + 1} color={i < 3 ? T.accent : T.text3} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 11, fontWeight: 800 }}>
                        {cfg.icon} {cfg.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>
                        {item.avgConfidence}% CONFIDENCE
                      </div>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.text, lineHeight: 1.4, margin: '0 0 12px' }}>
                      "{item.claim}"
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={12} /> {formatTimeAgo(item.lastChecked, lang)}
                      </span>
                      {item.source && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${T.accent}1a`, color: T.accent, fontWeight: 700, letterSpacing: 1 }}>
                          {item.source.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ width: 140, textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.accent, lineHeight: 1 }}>
                      {item.count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Audit Frequency</div>
                    <div className="velocity-bar">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${velocity}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                        className="velocity-fill" style={{ background: `linear-gradient(90deg, transparent, ${T.accent})` }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button onClick={() => shareOnTwitter(item)} style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text3, transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.text3}>
                      <Share2 size={16} />
                    </button>
                    <button onClick={() => copyLink(i)} style={{ padding: 10, borderRadius: 12, background: copiedIdx === i ? `${T.accent}33` : 'rgba(255,255,255,0.03)', border: `1px solid ${copiedIdx === i ? T.accent : T.border}`, color: copiedIdx === i ? T.accent : T.text3, transition: '0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = T.text3}>
                      {copiedIdx === i ? <CheckCircle size={16} /> : <LinkIcon size={16} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {!loading && trending.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
            <Globe size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
            <p>No trending intelligence detected in this sector.</p>
          </div>
        )}
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
}
