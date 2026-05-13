import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Shield, Search, BarChart3, Brain, Link2, AlertTriangle, CheckCircle2, XCircle, MinusCircle, Video, Zap, ShieldCheck, ChevronLeft, ChevronRight, Users, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

/* ─────────── Counter Hook ─────────── */
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let timer;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [target, duration]);
  return [count, ref];
}

/* ─────────── Animated Section Wrapper ─────────── */
function Section({ children, id, style, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id} ref={ref} className={className}
      style={{ ...style, position: 'relative' }}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

/* ─────────── Data Structures ─────────── */
const demoClaims = (lang) => [
  { textKey: 'demo1', verdictKey: 'falseShort', confidence: 97, color: '#f87171', Icon: XCircle },
  { textKey: 'demo2', verdictKey: 'trueShort', confidence: 99, color: '#4ade80', Icon: CheckCircle2 },
  { textKey: 'demo3', verdictKey: 'partialShort', confidence: 72, color: '#fbbf24', Icon: MinusCircle },
];

const testimonialsList = (lang) => [
  { name: 'Aditya Seth', role: t('test1Role', lang), text: t('test1Text', lang), avatar: 'AS' },
  { name: 'Arnab Basu', role: t('test2Role', lang), text: t('test2Text', lang), avatar: 'AB' },
  { name: 'Arnab Saha', role: t('test3Role', lang), text: t('test3Text', lang), avatar: 'AS' },
];

const featuresList = [
  { Icon: Zap, key: 'surgicalExtraction', descKey: 'surgicalDesc', path: '/verify' },
  { Icon: Search, key: 'searchingEvidence', descKey: 'searchingDesc', path: '/verify' },
  { Icon: ShieldCheck, key: 'verifyingClaims', descKey: 'verifyingDesc', path: '/verify' },
  { Icon: Brain, key: 'aiTextDetection', descKey: 'aiDetectDesc', path: '/verify?mode=text' },
  { Icon: Shield, key: 'imageForensic', descKey: 'imageForensicDesc', path: '/image' },
  { Icon: Video, key: 'videoForensic', descKey: 'videoForensicDesc', path: '/video' },
  { Icon: Search, key: 'pdfForensic', descKey: 'pdfForensicDesc', path: '/pdf' },
  { Icon: Link2, key: 'urlAnalysis', descKey: 'deepScrapeDesc', path: '/verify?mode=url' },
  { Icon: AlertTriangle, key: 'conflictIntel', descKey: 'conflictDesc', path: '/verify?mode=conflict' },
];

const plansList = (lang) => [
  { nameKey: 'starterPlan', price: '0', periodKey: 'forever', highlight: false, descKey: 'starterDesc', features: [t('plan1F1', lang), t('plan1F2', lang), t('plan1F3', lang), t('plan1F4', lang)], ctaKey: 'startFreeCTA' },
  { nameKey: 'proPlan', price: '29', periodKey: 'perMonth', highlight: true, descKey: 'proDesc', features: [t('plan2F1', lang), t('plan2F2', lang), t('plan2F3', lang), t('plan2F4', lang), t('plan2F5', lang), t('plan2F6', lang)], ctaKey: 'soonCTA' },
  { nameKey: 'enterprisePlan', price: t('custom', lang), periodKey: 'contactUs', highlight: false, descKey: 'entDesc', features: [t('plan3F1', lang), t('plan3F2', lang), t('plan3F3', lang), t('plan3F4', lang), t('plan3F5', lang), t('plan3F6', lang)], ctaKey: 'soonCTA' },
];

export default function LandingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [demoStep, setDemoStep] = useState(0); 
  const [typedText, setTypedText] = useState('');

  const [stat1, ref1] = useCountUp(25);
  const [stat2, ref2] = useCountUp(4);
  const [stat3, ref3] = useCountUp(4);
  const [stat4, ref4] = useCountUp(12);

  const demoInput = t('demo1', lang) + ' ' + t('demo2', lang) + ' ' + t('demo3', lang);

  useEffect(() => {
    if (demoStep !== 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(demoInput.slice(0, i));
      if (i >= demoInput.length) {
        clearInterval(timer);
        setTimeout(() => setDemoStep(1), 600);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [demoStep, demoInput]);

  useEffect(() => {
    if (demoStep < 1 || demoStep > 4) return;
    const timer = setTimeout(() => {
      if (demoStep < 4) setDemoStep(demoStep + 1);
      else setTimeout(() => { setDemoStep(0); setTypedText(''); }, 4000);
    }, 1200);
    return () => clearTimeout(timer);
  }, [demoStep]);

  /* ── Theme tokens ── */
  const T = darkMode ? {
    bg: '#0a0a0f', bg2: '#12121a', accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.1)',
    text: '#f5f3ef', text2: 'rgba(245,243,239,0.7)', text3: 'rgba(245,243,239,0.4)',
    border: 'rgba(255,255,255,0.08)', cardBg: '#161621', statBg: 'rgba(22,22,33,0.4)',
    demoBg: 'rgba(10,10,15,0.85)', sectionBg: '#0f0f16'
  } : {
    bg: '#fdfcf9', bg2: '#fff8f6', accent: '#d48c70', accentLight: 'rgba(212, 140, 112, 0.1)',
    text: '#201a18', text2: '#53433e', text3: '#85736d',
    border: 'rgba(212, 140, 112, 0.15)', cardBg: '#ffffff', statBg: 'rgba(255,255,255,0.6)',
    demoBg: 'rgba(255,255,255,0.9)', sectionBg: '#f9f6f2'
  };

  const sectionLabelStyle = { fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 };
  const sectionHeadingStyle = { fontFamily: 'Cormorant Garamond, serif', color: T.text, fontWeight: 300, lineHeight: 1.1 };
  const dividerStyle = { width: 60, height: 1, background: T.accent, opacity: 0.3 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s', paddingTop: 0 }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* ══════════ HERO SECTION ══════════ */}
      <Section style={{ padding: 'calc(var(--nav-h) + 60px) 0 140px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: darkMode ? 0.45 : 0.35, filter: 'brightness(1.1) contrast(1.1)' }} src="/hero-bg.mp4" />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${T.bg}00 0%, ${T.bg} ${darkMode ? '80%' : '95%'})` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${T.bg} 100%)` }} />
        </div>

        <div style={{ padding: '0 24px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, border: `1px solid ${T.accent}33`, background: `${T.accent}0a`, marginBottom: 32 }}>
              <div className="pulsing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1.5 }}>{t('landingBeta', lang)}</span>
            </div>
            <h1 style={{ ...sectionHeadingStyle, fontSize: 'clamp(38px, 9vw, 90px)', marginBottom: 32, letterSpacing: -1 }}>
              {t('landingHero1', lang)} <br />
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>{t('landingHero2', lang)}</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} style={{ fontSize: 19, color: T.text2, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 48px', fontWeight: 300 }}>{t('landingHeroSubtitle', lang)}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/verify"><motion.button whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${T.accent}40` }} whileTap={{ scale: 0.97 }} style={{ padding: '18px 44px', borderRadius: 12, fontSize: 15, fontWeight: 600, background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: darkMode ? '#0a0a0f' : '#fff', cursor: 'pointer' }}>{t('landingStartFree', lang)}</motion.button></Link>
            <a href="#how-it-works"><motion.button whileHover={{ scale: 1.04, borderColor: `${T.accent}66` }} whileTap={{ scale: 0.97 }} style={{ padding: '18px 44px', borderRadius: 12, fontSize: 15, fontWeight: 500, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }}>{t('landingSeeHow', lang)}</motion.button></a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, color: T.text3, textTransform: 'uppercase' }}>{t('landingScroll', lang)}</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${T.accent}, transparent)` }} />
        </div>
      </Section>

      {/* ══════════ STATS SECTION ══════════ */}
      <Section style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { val: stat1, suffix: '+', label: t('inputFormats', lang), r: ref1 },
              { val: stat2, suffix: '', label: t('verdictTypes', lang), r: ref2 },
              { val: stat3, suffix: '', label: t('aiModels', lang), r: ref3 },
              { val: stat4, suffix: 's', label: t('avgResponse', lang), r: ref4 },
            ].map((s, i) => (
              <motion.div key={i} ref={s.r} whileHover={{ y: -8, borderColor: T.accent }} style={{ padding: '40px 24px', textAlign: 'center', background: T.statBg, border: `1px solid ${T.accent}33`, borderRadius: 16, backdropFilter: 'blur(10px)', transition: 'all 0.4s' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 52, color: T.accent, lineHeight: 1 }}>{s.val}{s.suffix}</div>
                <div style={{ fontSize: 10, color: T.text3, letterSpacing: 2, textTransform: 'uppercase', marginTop: 12 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ POWERED BY ══════════ */}
      <Section style={{ padding: '40px 0 60px', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.text3, marginBottom: 24, fontWeight: 500 }}>
          {t('poweredByLabel', lang)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', padding: '0 24px' }}>
          {['Groq', 'LLaMA', 'Tavily', 'React'].map((name, i) => (
            <span key={i} style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 400,
              color: T.text3, whiteSpace: 'nowrap', transition: 'color 0.3s',
              padding: '8px 0', borderBottom: `1px solid ${T.accent}33`,
            }}>{name}</span>
          ))}
        </div>
      </Section>

      {/* ══════════ LIVE DEMO SECTION ══════════ */}
      <Section id="live-demo" style={{ padding: '40px 0 120px' }}>
        <div style={{ padding: '0 24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={sectionLabelStyle}>{t('livePreview', lang)}</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>{t('seeAction', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: T.demoBg, border: `1px solid ${T.border}`, backdropFilter: 'blur(16px)', padding: '32px', boxShadow: '0 30px 100px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, color: T.text2, lineHeight: 1.6, minHeight: 80, marginBottom: 32 }}>
              <span style={{ color: T.accent }}>$ verixa audit --input</span> "{typedText}"
              <span style={{ display: 'inline-block', width: 8, height: 18, background: T.accent, marginLeft: 4, verticalAlign: 'middle', animation: 'blink 1s infinite' }} />
            </div>
            <AnimatePresence mode="wait">
              {demoStep > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {demoClaims(lang).map((claim, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={demoStep > i ? { opacity: 1, x: 0 } : { opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <claim.Icon size={18} color={claim.color} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{t(claim.textKey, lang)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: claim.color, letterSpacing: 1 }}>{t(claim.verdictKey, lang).toUpperCase()}</span>
                        <div style={{ width: 100, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={demoStep > i ? { width: `${claim.confidence}%` } : { width: 0 }} transition={{ duration: 1, delay: 0.5 }} style={{ height: '100%', background: claim.color }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Section>

      {/* ══════════ FEATURES SECTION (ENGINEERING INTEGRITY) ══════════ */}
      <Section id="features" style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="capabilities-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p style={sectionLabelStyle}>{t('capabilitiesLabel', lang)}</p>
              <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(42px, 6vw, 72px)', marginBottom: 32 }}>{t('engineeredPrecision', lang)}</h2>
              <div style={{ padding: '24px', background: `${T.accent}05`, borderLeft: `2px solid ${T.accent}`, borderRadius: '0 16px 16px 0', backdropFilter: 'blur(10px)', marginBottom: 40 }}>
                <p style={{ fontSize: 18, color: T.text2, lineHeight: 1.5, margin: 0, fontWeight: 300 }}>{t('eliminatingMisinfo', lang)}</p>
              </div>
              <div style={{ display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
                {[
                  { label: t('calibration', lang), val: 'Benchmarked', color: '#4ade80' },
                  { label: t('latency', lang), val: 'Optimized', color: T.accent },
                  { label: t('integrityLabel', lang), val: t('secureLabel', lang), color: '#60a5fa' }
                ].map((h, i) => (
                  <div key={i} style={{ minWidth: 100 }}>
                    <div style={{ fontSize: 9, color: T.text3, letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>{h.label}</div>
                    <div style={{ fontSize: 20, color: h.color, fontWeight: 800, fontFamily: 'monospace' }}>{h.val}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="capabilities-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {featuresList.slice(0, 4).map((f, i) => (
                <Link to={f.path} key={i} style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ y: -8, borderColor: T.accent }} style={{ padding: '24px', borderRadius: 20, background: T.cardBg, border: `1px solid ${T.border}`, transition: 'all 0.2s', height: '100%' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <f.Icon size={16} color={T.accent} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t(f.key, lang)}</h3>
                    <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.5, margin: 0 }}>{t(f.descKey, lang)}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          <div className="extended-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginTop: 40 }}>
            {featuresList.slice(4).map((f, i) => (
              <Link to={f.path} key={i} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ scale: 1.01, borderColor: `${T.accent}4d` }} style={{ padding: '32px', borderRadius: 20, background: `linear-gradient(135deg, ${T.cardBg}, transparent)`, border: `1px solid ${T.border}`, display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'all 0.2s', height: '100%' }}>
                  <div style={{ padding: 12, borderRadius: 12, background: T.accentLight, color: T.accent }}><f.Icon size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>{t(f.key, lang)}</h3>
                    <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, margin: 0 }}>{t(f.descKey, lang)}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ HOW IT WORKS SECTION (ZIG-ZAG FLOW) ══════════ */}
      <Section id="how-it-works" style={{ padding: '120px 0', background: T.sectionBg, overflow: 'hidden' }}>
        <div style={{ padding: '0 24px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>{t('howItWorksLabel', lang)}</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>{t('pathTruth', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '24px auto' }} />
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 60 }}>
            {/* Desktop Wave Line */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.1 }} className="desktop-wave">
              <motion.path d="M 450 0 Q 700 150 450 300 Q 200 450 450 600 Q 700 750 450 900" fill="none" stroke={T.accent} strokeWidth="1.5" strokeDasharray="8 8" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2 }} />
            </svg>

            {[
              { num: '01', side: 'left', label: t('surgicalExtraction', lang), desc: t('surgicalDesc', lang), icon: Zap },
              { num: '02', side: 'right', label: t('evidenceRetrieval', lang), desc: t('evidenceDesc', lang), icon: Search },
              { num: '03', side: 'left', label: t('integrityTest', lang), desc: t('integrityDesc', lang), icon: ShieldCheck },
              { num: '04', side: 'right', label: t('finalVerdict', lang), desc: t('finalDesc', lang), icon: CheckCircle2 }
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: step.side === 'left' ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} style={{ alignSelf: step.side === 'left' ? 'flex-start' : 'flex-end', width: '100%', maxWidth: 380, position: 'relative', zIndex: 2 }}>
                <div style={{ padding: '32px', borderRadius: 24, background: `linear-gradient(135deg, ${T.cardBg}, rgba(255,255,255,0.01))`, border: `1px solid ${T.border}`, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden', boxShadow: `0 10px 40px rgba(0,0,0,0.2)` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accentLight, border: `1px solid ${T.accent}4d`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: 'rotate(5deg)', boxShadow: `0 0 20px ${T.accent}14` }}>
                    <step.icon size={22} color={T.accent} strokeWidth={1.5} style={{ transform: 'rotate(-5deg)' }} />
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: T.accent, fontWeight: 900, marginBottom: 12 }}>{t('phaseLabel', lang)}_{step.num}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 12, fontFamily: 'Cormorant Garamond, serif' }}>{step.label}</h3>
                  <p style={{ fontSize: 14, color: T.text3, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{step.desc}</p>
                  <div style={{ position: 'absolute', bottom: -10, right: 15, fontSize: 80, fontWeight: 900, color: `${T.accent}0a`, fontFamily: 'monospace', pointerEvents: 'none', zIndex: -1 }}>{step.num}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ TESTIMONIALS SECTION ══════════ */}
      <Section id="testimonials" style={{ padding: '120px 0', background: T.bg2 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={sectionLabelStyle}>{t('testimonialsLabel', lang)}</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>{t('trustedAccuracy', lang)}</h2>
          </div>
          <div style={{ position: 'relative', padding: '60px 0' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(24px, 3vw, 32px)', fontStyle: 'italic', color: T.text, lineHeight: 1.5, marginBottom: 40 }}>"{testimonialsList(lang)[activeTestimonial].text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{testimonialsList(lang)[activeTestimonial].avatar}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{testimonialsList(lang)[activeTestimonial].name}</div>
                    <div style={{ fontSize: 12, color: T.text3, letterSpacing: 1 }}>{testimonialsList(lang)[activeTestimonial].role.toUpperCase()}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 60 }}>
              <button onClick={() => setActiveTestimonial(p => (p - 1 + 3) % 3)} style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${T.border}`, background: 'transparent', color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
              <button onClick={() => setActiveTestimonial(p => (p + 1) % 3)} style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${T.border}`, background: 'transparent', color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════ PRICING SECTION ══════════ */}
      <Section id="pricing" style={{ padding: '140px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>{t('pricingLabel', lang)}</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>{t('scaleTruth', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {plansList(lang).map((plan, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} style={{ padding: '56px 40px', borderRadius: 32, border: plan.highlight ? `1px solid ${T.accent}` : `1px solid ${T.border}`, background: plan.highlight ? `${T.accent}05` : T.cardBg, backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
                {plan.highlight && <div style={{ position: 'absolute', top: 32, right: 32, background: T.accent, color: '#fff', padding: '6px 16px', borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>{t('popularBadge', lang)}</div>}
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: T.text, marginBottom: 8 }}>{t(plan.nameKey, lang)}</div>
                <div style={{ fontSize: 13, color: T.text3, marginBottom: 32 }}>{t(plan.descKey, lang)}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 56, color: T.text, lineHeight: 1 }}>{plan.price === t('custom', lang) ? plan.price : `$${plan.price}`}</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 8, marginBottom: 32 }}>{t(plan.periodKey, lang)}</div>
                <ul style={{ listStyle: 'none', marginBottom: 40, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 14, color: T.text2, padding: '12px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CheckCircle2 size={16} color={T.accent} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/verify">
                  <button style={{ width: '100%', padding: '16px', borderRadius: 12, background: plan.highlight ? T.accent : 'transparent', border: plan.highlight ? 'none' : `1px solid ${T.border}`, color: plan.highlight ? '#fff' : T.text, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t(plan.ctaKey, lang)}</button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        .pulsing-dot { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(212, 140, 112, 0.4); }
          70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(212, 140, 112, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(212, 140, 112, 0); }
        }
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .capabilities-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .desktop-wave { display: none !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}