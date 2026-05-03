import ScrollReveal from '../components/ScrollReveal';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

const API_URL = process.env.REACT_APP_API_URL || '';

const VERDICT_COLORS = {
  'False': { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: '✕' },
  'Partially True': { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', icon: '~' },
};

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

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) {
    return <span style={{ fontSize: 28, lineHeight: 1 }}>{medals[rank]}</span>;
  }
  return (
    <span style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 500,
      color: 'rgba(201,169,110,0.6)',
    }}>
      {rank}
    </span>
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
      setLastUpdated(new Date().toLocaleTimeString());
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

  const shareOnTwitter = (claim) => {
    const text = `⚠️ Trending misinformation being fact-checked right now:\n\n"${claim.claim}"\n\nVerdict: ${claim.verdict} — verified by @VeriXaAI\n\nhttps://verixa.ai/trending`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = (idx) => {
    navigator.clipboard.writeText(`https://verixa.ai/trending#claim-${idx}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const T = darkMode ? {
    bg: '#0a0a0f', surface: '#13131a', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    border: 'rgba(255,255,255,0.07)', cardBg: 'rgba(18,18,28,0.6)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
  } : {
    bg: '#e8e5de', surface: '#f0ede6', text: '#0d0d0d',
    text2: '#2a2a2a', text3: '#555555',
    border: 'rgba(0,0,0,0.12)', cardBg: '#f5f3ed',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, transition: 'background 0.3s' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse-live { 0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(248,113,113,0.4); } 50% { opacity:0.7; box-shadow: 0 0 0 6px rgba(248,113,113,0); } }
        @keyframes count-up-glow { 0%,100% { text-shadow: 0 0 8px rgba(201,169,110,0.2); } 50% { text-shadow: 0 0 20px rgba(201,169,110,0.4); } }
        .trending-card:hover { border-color: rgba(201,169,110,0.3) !important; transform: translateY(-2px); }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 60px' }}>
        {/* Header */}
        <ScrollReveal animation="blurIn" duration={800}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 999,
            background: 'rgba(248,113,113,0.08)', marginBottom: 20,
            fontSize: 11, color: '#f87171', letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#f87171',
              animation: 'pulse-live 2s infinite', display: 'inline-block',
            }} />
            {t('liveLeaderboard', lang)}
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
            fontSize: 'clamp(36px, 6vw, 56px)', color: T.text,
            lineHeight: 1.1, margin: '0 0 16px',
          }}>
            {t('trendingTitlePart1', lang)} <span style={{ fontStyle: 'italic', color: '#f87171' }}>{t('trendingTitlePart2', lang)}</span>
          </h1>
          <p style={{ fontSize: 15, color: T.text2, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            {t('trendingSubtitle', lang)}
          </p>
        </div>
        </ScrollReveal>

        {/* Stats bar */}
        <ScrollReveal animation="fadeUp" delay={150}>
        <div style={{
          display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { label: t('totalTracked', lang), value: totalTracked, icon: '📊' },
            { label: t('autoRefresh', lang), value: '30s', icon: '🔄' },
            { label: t('lastChecked', lang), value: lastUpdated || '—', icon: '⏱️' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '12px 20px', borderRadius: 12,
              background: T.cardBg, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 160,
            }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: T.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text, fontFamily: 'Cormorant Garamond, serif' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
        </ScrollReveal>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 40, height: 40, border: '2px solid rgba(201,169,110,0.2)',
              borderTop: '2px solid #c9a96e', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: T.text2, fontSize: 14 }}>Loading trending misinformation...</p>
          </div>
        )}

        {/* Claims list */}
        {!loading && trending.map((claim, i) => {
          const cfg = VERDICT_COLORS[claim.verdict] || VERDICT_COLORS['False'];
          return (
            <div key={i} id={`claim-${i}`} className="trending-card" style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              padding: '20px 24px', borderRadius: 14,
              border: `1px solid ${T.border}`, background: T.cardBg,
              marginBottom: 12, transition: 'all 0.25s ease', cursor: 'default',
              animation: 'fadeUp 0.4s ease forwards',
              animationDelay: `${0.3 + i * 0.06}s`, opacity: 0,
              animationFillMode: 'forwards',
            }}>
              <RankBadge rank={i + 1} />

              <div style={{ flex: 1 }}>
                <p style={{
                  margin: '0 0 8px', fontSize: 15, color: T.text, lineHeight: 1.55,
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                }}>
                  "{claim.claim}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    color: cfg.color, fontWeight: 700,
                  }}>
                    {cfg.icon} {claim.verdict}
                  </span>
                  <span style={{
                    fontSize: 11, color: T.text3,
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    {claim.avgConfidence}% confidence
                  </span>
                  <span style={{ fontSize: 11, color: T.text3 }}>·</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>
                    {formatTimeAgo(claim.lastChecked, lang)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300,
                  color: cfg.color, lineHeight: 1,
                  animation: 'count-up-glow 3s ease-in-out infinite',
                }}>
                  {claim.count.toLocaleString()}
                </div>
                <span style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('timesChecked', lang)}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => shareOnTwitter(claim)} style={{
                    padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                    background: 'transparent', color: T.text3, fontSize: 10, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1DA1F2'; e.currentTarget.style.color = '#1DA1F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}
                  >
                    𝕏 {t('share', lang)}
                  </button>
                  <button onClick={() => copyLink(i)} style={{
                    padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                    background: copiedIdx === i ? 'rgba(74,222,128,0.1)' : 'transparent',
                    color: copiedIdx === i ? '#4ade80' : T.text3, fontSize: 10, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    {copiedIdx === i ? `✓ ${t('copied', lang)}` : `🔗 ${t('copy', lang)}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && trending.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.text3 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
            <p>No trending misinformation data yet. Start verifying claims!</p>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
