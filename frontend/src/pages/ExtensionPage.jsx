import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

/**
 * Browser Extension landing page
 * Showcases the Chrome Extension with installation instructions
 */

const FEATURES = (lang) => [
  { icon: '🖱️', title: t('rightClickVerify', lang), desc: t('rightClickDesc', lang) },
  { icon: '⚡', title: t('instantResults', lang), desc: t('instantResultsDesc', lang) },
  { icon: '🌐', title: t('worksEverywhere', lang), desc: t('worksEverywhereDesc', lang) },
  { icon: '💾', title: t('saveHistory', lang), desc: t('saveHistoryDesc', lang) },
  { icon: '🎨', title: t('nativeFeel', lang), desc: t('nativeFeelDesc', lang) },
  { icon: '🔒', title: t('privacyFirst', lang), desc: t('privacyFirstDesc', lang) },
];

const INSTALL_STEPS = (lang) => [
  { num: '01', title: t('downloadExt', lang), desc: t('downloadExtDesc', lang) },
  { num: '02', title: t('openExtPage', lang), desc: t('openExtPageDesc', lang) },
  { num: '03', title: t('enableDevMode', lang), desc: t('enableDevModeDesc', lang) },
  { num: '04', title: t('loadUnpacked', lang), desc: t('loadUnpackedDesc', lang) },
];

export default function ExtensionPage() {
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

  const T = darkMode ? {
    bg: '#0a0a0f', surface: '#13131a', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    border: 'rgba(255,255,255,0.07)', cardBg: 'rgba(18,18,28,0.6)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
    glassBg: 'rgba(255,255,255,0.03)', glassBorder: 'rgba(255,255,255,0.06)',
  } : {
    bg: '#e8e5de', surface: '#f0ede6', text: '#0d0d0d',
    text2: '#2a2a2a', text3: '#555555',
    border: 'rgba(0,0,0,0.12)', cardBg: '#f5f3ed',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
    glassBg: 'rgba(245,243,237,0.85)', glassBorder: 'rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, transition: 'background 0.3s' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(201,169,110,0.1); } 50% { box-shadow: 0 0 40px rgba(201,169,110,0.2); } }
        .ext-feature:hover { border-color: rgba(201,169,110,0.3) !important; transform: translateY(-4px); }
        @media (max-width: 768px) {
          .install-grid { grid-template-columns: 1fr !important; }
          .mockup-container { display: none !important; }
        }
      `}</style>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Hero */}
      <section style={{
        padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}10 0%, transparent 70%)`,
          top: '10%', left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', filter: 'blur(60px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              border: `1px solid ${T.accent}4d`, borderRadius: 999,
              background: T.accentMuted, marginBottom: 24,
              fontSize: 11, color: T.accent, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase',
            }}
          >
            🧩 {t('navExtension', lang).toUpperCase()}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
              fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.1,
              color: T.text, margin: '0 0 20px',
            }}
          >
            {t('verifyWhile', lang)}{' '}
            <span style={{ fontStyle: 'italic', color: T.accent }}>{t('browse', lang)}.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{
              fontSize: 17, color: T.text2, lineHeight: 1.7,
              maxWidth: 520, margin: '0 auto 36px', fontWeight: 300,
            }}
          >
            {t('extensionTagline', lang)}
          </motion.p>

          {/* Browser mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mockup-container"
            style={{
              maxWidth: 600, margin: '0 auto', borderRadius: 16,
              background: T.cardBg, border: `1px solid ${T.border}`,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'glow-pulse 4s ease-in-out infinite',
            }}
          >
            {/* Tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
              borderBottom: `1px solid ${T.border}`, background: darkMode ? 'rgba(20,20,30,0.8)' : 'rgba(240,237,230,0.8)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80' }} />
              </div>
              <div style={{
                flex: 1, margin: '0 12px', padding: '6px 12px', borderRadius: 6,
                background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                fontSize: 11, color: T.text3, fontFamily: 'DM Mono, monospace',
              }}>
                https://news.example.com/article
              </div>
            </div>

            {/* Content with context menu */}
            <div style={{ padding: '24px 28px', position: 'relative', minHeight: 200 }}>
              <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.8, marginBottom: 16 }}>
                <span style={{ background: darkMode ? 'rgba(201,169,110,0.15)' : 'rgba(90,66,26,0.15)', padding: '2px 0', borderRadius: 2 }}>
                  {t('demo4', lang)}
                </span>
                ...
              </div>

              {/* Fake context menu */}
              <div style={{
                position: 'absolute', top: 60, right: 40,
                background: darkMode ? '#1a1a24' : '#fff',
                border: `1px solid ${T.border}`, borderRadius: 10,
                padding: '8px 0', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: 'fadeUp 0.3s ease forwards', animationDelay: '1.5s',
                opacity: 0, animationFillMode: 'forwards',
              }}>
                {['Copy', 'Search Google for...', 'Translate to English'].map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 16px', fontSize: 12, color: T.text3,
                    borderBottom: i === 2 ? `1px solid ${T.border}` : 'none',
                  }}>{t(item.toLowerCase().replace(/ /g, '_'), lang) || item}</div>
                ))}
                <div style={{
                  padding: '8px 16px', fontSize: 12, color: T.accent,
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                  background: T.accentMuted, margin: '4px 6px', borderRadius: 6,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: `linear-gradient(135deg, ${T.accent}, #a07b42)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: darkMode ? '#0a0a0f' : '#fff', fontWeight: 800,
                  }}>V</span>
                  {t('verifyWithVerixa', lang)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
              color: T.accent, marginBottom: 12, fontWeight: 500,
            }}>{t('capabilitiesLabel', lang)}</p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
              fontSize: 'clamp(32px, 5vw, 48px)', color: T.text, margin: 0,
            }}>{t('everythingYouNeed', lang)}</h2>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {FEATURES(lang).map((f, i) => (
              <div key={i} className="ext-feature" style={{
                padding: '28px 24px', borderRadius: 14,
                background: T.glassBg, border: `1px solid ${T.glassBorder}`,
                transition: 'all 0.3s ease', cursor: 'default',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: T.accentMuted, border: `1px solid ${T.accent}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>{f.icon}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 18, color: T.text, marginBottom: 8,
                }}>{f.title}</div>
                <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, fontWeight: 300 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation steps */}
      <section style={{ padding: '80px 24px', background: darkMode ? 'rgba(16,16,23,0.5)' : 'rgba(220,216,208,0.9)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
              color: T.accent, marginBottom: 12, fontWeight: 500,
            }}>{t('setup', lang)}</p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
              fontSize: 'clamp(32px, 5vw, 48px)', color: T.text, margin: 0,
            }}>{t('installIn60', lang)}</h2>
          </div>

          <div className="install-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {INSTALL_STEPS(lang).map((step, i) => (
              <div key={i} style={{
                padding: '28px 24px', borderRadius: 14,
                background: T.cardBg, border: `1px solid ${T.border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: `linear-gradient(135deg, ${T.accent}40, ${T.accent}0a)`,
                  border: `1px solid ${T.accent}4d`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 300, color: T.accent,
                }}>{step.num}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 18, color: T.text, marginBottom: 8,
                }}>{step.title}</div>
                <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, fontWeight: 300 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ fontSize: 13, color: T.text3, marginBottom: 16, lineHeight: 1.7 }}>
              {t('extensionDirHint', lang)} <code style={{
                background: T.accentMuted, padding: '2px 8px', borderRadius: 4,
                fontFamily: 'DM Mono, monospace', fontSize: 12, color: T.accent,
              }}>/extension</code> {t('directory', lang)}
            </p>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
}
