import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollReveal from '../components/ScrollReveal';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Globe, Share2, Link as LinkIcon, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

import api from '../utils/api';

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
  const [trending, setTrending] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

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

  const fetchTrending = useCallback(async () => {
    try {
      const res = await api.get('/api/trending');
      const data = res.data;
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

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, transition: 'background 0.3s', overflowX: 'hidden', paddingTop: 0 }}>
      <Navbar darkMode={true} onToggleTheme={() => {}} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '160px 24px 120px', position: 'relative', zIndex: 1 }}>
        
        <section style={{ marginBottom: 120 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 24 }}>GLOBAL INTELLIGENCE</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, margin: '0 0 24px', lineHeight: 1 }}>
            Trending <span style={{ fontStyle: 'italic', color: T.accent }}>Narratives</span>
          </h1>
          <p style={{ color: T.text2, fontSize: 18, maxWidth: 600, margin: 0, lineHeight: 1.7, fontWeight: 300 }}>
            {t('trendingSubtitle', lang)}
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginBottom: 120 }}>
          {[
            { label: 'Total Tracked', value: totalTracked },
            { label: 'Refresh Rate', value: '30s' },
            { label: 'Sync Time', value: lastUpdated || '...' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: T.text3, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>{stat.label}</div>
              <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.accent }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div style={{ width: 40, height: 40, border: `2px solid ${T.accent}22`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : trending.map((item, i) => {
              const cfg = VERDICT_CONFIG(lang)[item.verdict] || VERDICT_CONFIG(lang)['False'];
              
              return (
                <div key={item.claim} style={{ paddingBottom: 64, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 48 }}>
                   <div style={{ fontSize: 32, fontWeight: 300, color: T.text3, fontFamily: 'Cormorant Garamond, serif', minWidth: 40 }}>{i + 1}</div>
                   
                   <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                         <div style={{ color: cfg.color, fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>{cfg.label.toUpperCase()}</div>
                         <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{item.avgConfidence}% CONFIDENCE</div>
                      </div>
                      <h3 style={{ fontSize: 24, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.text, lineHeight: 1.4, margin: '0 0 16px' }}>
                        "{item.claim}"
                      </h3>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                         <span style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>{formatTimeAgo(item.lastChecked, lang)}</span>
                         {item.source && (
                           <span style={{ fontSize: 10, color: T.accent, fontWeight: 900, letterSpacing: 1 }}>{item.source.toUpperCase()}</span>
                         )}
                      </div>
                   </div>

                   <div style={{ textAlign: 'right', minWidth: 120 }}>
                      <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.accent, marginBottom: 4 }}>{item.count.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 900 }}>AUDIT FREQUENCY</div>
                   </div>
                </div>
              );
            })}
        </div>
      </main>

      <Footer darkMode={true} />
    </div>
  );
}


