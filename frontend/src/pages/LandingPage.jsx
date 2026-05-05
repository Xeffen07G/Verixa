import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Search, BarChart3, Brain, Link2, AlertTriangle, Zap, Clock, CheckCircle2, XCircle, MinusCircle, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

/* ─────────── Floating Particles ─────────── */
function Particles({ count = 22, darkMode }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 6 + 5,
      delay: Math.random() * 4,
    }))
  ).current;
  return (
    <div className="particles-container">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%`,
          '--duration': `${p.duration}s`, '--delay': `${p.delay}s`,
          opacity: darkMode ? 0.5 : 0.35,
        }} />
      ))}
    </div>
  );
}

/* ─────────── Animated Section Wrapper ─────────── */
function Section({ children, id, style, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id} ref={ref} style={style}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.section>
  );
}

/* ─────────── Stagger Card ─────────── */
function StaggerCard({ children, index, style, onMouseEnter, onMouseLeave }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref} style={style}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
}

/* ─────────── Live Demo Data ─────────── */
const demoClaims = [
  { textKey: 'demo1', verdict: 'False', confidence: 97, color: '#f87171', Icon: XCircle },
  { textKey: 'demo2', verdict: 'True', confidence: 99, color: '#4ade80', Icon: CheckCircle2 },
  { textKey: 'demo3', verdict: 'Partially True', confidence: 72, color: '#fbbf24', Icon: MinusCircle },
];

/* ─────────── Static Data ─────────── */
const testimonials = [
  { name: 'Aditya Seth', role: 'Software, Strategy and AI Initiative', text: 'VeriXa has become indispensable to our compliance workflow. It catches misinformation before it reaches our clients with a precision I have never seen in any other tool.', avatar: 'AS' },
  { name: 'Arnab Basu', role: 'Academic Coordinator at Techno India University', text: 'The claim extraction is extraordinary. What used to take my team three hours of manual fact-checking now takes VeriXa under two minutes. The source citations are impeccable.', avatar: 'AB' },
  { name: 'Arnab Saha', role: 'Senior Programme Coordinator at Techno India University', text: 'We integrated VeriXa into our research pipeline. The confidence scoring system has become the gold standard for how we evaluate information quality across the firm.', avatar: 'AS' },
];

const featuresList = [
  { Icon: Shield, key: 'surgicalExtraction', descKey: 'surgicalDesc' },
  { Icon: Search, key: 'searchingEvidence', descKey: 'searchingDesc' },
  { Icon: BarChart3, key: 'verifyingClaims', descKey: 'verifyingDesc' },
  { Icon: Brain, key: 'aiTextDetection', descKey: 'aiDetectDesc' },
  { Icon: Link2, key: 'urlAnalysis', descKey: 'deepScrapeDesc' },
  { Icon: AlertTriangle, key: 'conflictIntel', descKey: 'conflictDesc' },
];

const stepsList = (lang) => [
  { num: '01', title: t('step1Title', lang), desc: t('step1Desc', lang) },
  { num: '02', title: t('step2Title', lang), desc: t('step2Desc', lang) },
  { num: '03', title: t('step3Title', lang), desc: t('step3Desc', lang) },
  { num: '04', title: t('step4Title', lang), desc: t('step4Desc', lang) },
];

const plansList = (lang) => [
  { nameKey: 'starterPlan', price: '0', periodKey: 'forever', highlight: false, descKey: 'starterDesc', features: [t('plan1F1', lang), t('plan1F2', lang), t('plan1F3', lang), t('plan1F4', lang)], ctaKey: 'startFreeCTA' },
  { nameKey: 'proPlan', price: '29', periodKey: 'perMonth', highlight: true, descKey: 'proDesc', features: [t('plan2F1', lang), t('plan2F2', lang), t('plan2F3', lang), t('plan2F4', lang), t('plan2F5', lang), t('plan2F6', lang)], ctaKey: 'soonCTA' },
  { nameKey: 'enterprisePlan', price: t('custom', lang), periodKey: 'contactUs', highlight: false, descKey: 'entDesc', features: [t('plan3F1', lang), t('plan3F2', lang), t('plan3F3', lang), t('plan3F4', lang), t('plan3F5', lang), t('plan3F6', lang)], ctaKey: 'soonCTA' },
];



/* ═══════════════════════════════ COMPONENT ═══════════════════════════════ */

export default function LandingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };
  const [stat1, ref1] = useCountUp(5);
  const [stat2, ref2] = useCountUp(4);
  const [stat3, ref3] = useCountUp(3);
  const [stat4, ref4] = useCountUp(2);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [demoStep, setDemoStep] = useState(0); 
  const [typedText, setTypedText] = useState('');

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
  }, [demoStep]);

  useEffect(() => {
    if (demoStep < 1 || demoStep > 3) return;
    const timer = setTimeout(() => {
      if (demoStep < 3) setDemoStep(demoStep + 1);
      else setTimeout(() => { setDemoStep(0); setTypedText(''); }, 3000);
    }, 900);
    return () => clearTimeout(timer);
  }, [demoStep]);

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  /* ── Theme tokens ── */
  const T_DARK = {
    bg: '#0a0a0f', bg2: 'rgba(16,16,23,0.5)', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    border: 'rgba(255,255,255,0.07)', cardBg: 'rgba(18,18,28,0.6)',
    heroBg: `radial-gradient(ellipse 80% 60% at 50% 0%, ${darkMode ? 'rgba(201,169,110,0.08)' : 'rgba(90,66,26,0.08)'} 0%, transparent 70%)`,
    statBg: 'rgba(10,10,15,0.8)', featureHover: 'rgba(201,169,110,0.06)',
    stepBg: 'rgba(26,26,36,0.6)', testimonialBg: 'rgba(22,22,31,0.8)',
    pricingBg: 'rgba(16,16,23,0.8)',
    ctaBg: `radial-gradient(ellipse 60% 50% at 50% 50%, ${darkMode ? 'rgba(201,169,110,0.06)' : 'rgba(90,66,26,0.06)'} 0%, transparent 70%)`,
    sectionBg: 'rgba(16,16,23,0.5)', badgeText: '#c9a96e',
    demoBg: 'rgba(14,14,22,0.85)', demoCardBg: 'rgba(20,20,30,0.9)',
    glassCard: 'rgba(255,255,255,0.03)', glassBorder: 'rgba(255,255,255,0.06)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.15)',
  };

  const T_LIGHT = {
    bg: '#e8e5de', bg2: 'rgba(220,216,208,0.9)', text: '#0d0d0d',
    text2: '#2a2a2a', text3: '#555555',
    border: 'rgba(0,0,0,0.12)', cardBg: '#f5f3ed',
    heroBg: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(90,66,26,0.08) 0%, transparent 70%)',
    statBg: '#f5f3ed', featureHover: 'rgba(90,66,26,0.1)',
    stepBg: '#f5f3ed', testimonialBg: '#f5f3ed', pricingBg: '#f5f3ed',
    ctaBg: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(90,66,26,0.1) 0%, transparent 70%)',
    sectionBg: 'rgba(220,216,208,0.9)', badgeText: '#5a421a',
    demoBg: 'rgba(245,243,237,0.95)', demoCardBg: '#f5f3ed',
    glassCard: 'rgba(245,243,237,0.85)', glassBorder: 'rgba(0,0,0,0.1)',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
  };

  const T = darkMode ? T_DARK : T_LIGHT;

  const sectionHeadingStyle = {
    fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
    fontSize: 'clamp(28px, 5vw, 54px)', lineHeight: 1.1, color: T.text, letterSpacing: -0.5,
  };
  const sectionLabelStyle = {
    fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
    color: T.accent, marginBottom: 14, fontWeight: 500,
  };
  const dividerStyle = {
    width: 48, height: 1, background: `linear-gradient(to right, ${T.accent}, transparent)`, margin: '20px 0',
  };

  return (
    <div className="page-wrapper" style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s' }}>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />


      {/* ══════════ HERO SECTION ══════════ */}
      <Section style={{ padding: '30px 0 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Full Hero Background Video Scaffolding */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
          {/* <video 
            autoPlay={true} loop={true} muted={true} playsInline={true}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: darkMode ? 0.35 : 0.15 }}
            src="YOUR_VIDEO_URL_HERE"
          /> */}
          {/* Gradients to ensure text readability */}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${T.bg}00 0%, ${T.bg} 80%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${T.bg} 100%)` }} />
        </div>

        <div style={{ padding: '0 24px', maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999, border: `1px solid ${T.accent}33`,
              background: `${T.accent}0a`, marginBottom: 32,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1.5 }}>{t('landingBeta', lang)}</span>
            </div>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(38px, 9vw, 90px)',
              fontWeight: 300, color: T.text, lineHeight: 1.1,
              marginBottom: 32, letterSpacing: -1,
            }}>
              {t('landingHero1', lang)} <br />
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>{t('landingHero2', lang)}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{
              fontSize: 19, color: T.text2, lineHeight: 1.6, maxWidth: 600,
              margin: '0 auto 48px', fontWeight: 300,
            }}
          >
            {t('landingHeroSubtitle', lang)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}
          >
            <Link to={user ? "/dashboard" : "/verify"}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${T.accent}40` }}
                whileTap={{ scale: 0.97 }}
                className="shimmer-btn"
                style={{
                  padding: '15px 38px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none',
                  color: darkMode ? '#0a0a0f' : '#fff', letterSpacing: 0.5, cursor: 'pointer',
                }}
              >{user ? t('navDashboard', lang) : t('landingStartFree', lang)}</motion.button>
            </Link>
            <a href="#how-it-works">
              <motion.button
                whileHover={{ scale: 1.04, borderColor: `${T.accent}66` }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '15px 38px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  color: T.text, letterSpacing: 0.5, cursor: 'pointer',
                }}
              >{t('landingSeeHow', lang)}</motion.button>
            </a>
          </motion.div>
        </div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            style={{
              marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, color: T.text3, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            }}
          >
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${T.accent}66, transparent)` }} />
            <span>{t('landingScroll', lang)}</span>
          </motion.div>
      </Section>

      {/* ══════════ STATS ══════════ */}
      <Section style={{ position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="stats-grid"
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
              background: T.border, borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${T.border}`, boxShadow: `0 20px 40px rgba(0,0,0,0.2)`
            }}
          >
            {[
              { val: stat1, suffix: '+', label: t('inputFormats', lang), r: ref1 },
              { val: stat2, suffix: '', label: t('verdictTypes', lang), r: ref2 },
              { val: stat3, suffix: '', label: stat3 === 1 ? t('aiModels', lang).replace('s', '') : t('aiModels', lang), r: ref3 },
              { val: stat4, suffix: 's', label: t('avgResponse', lang), r: ref4 },
            ].map((s, i) => (
              <div key={i} ref={s.r} className="glassmorphism" style={{ padding: '48px 24px', textAlign: 'center', background: T.statBg, borderRadius: 24 }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 52,
                  color: T.accent, lineHeight: 1,
                }}>{s.val}{s.suffix}</div>
                <div style={{
                  fontSize: 10, color: T.text3, letterSpacing: 2, textTransform: 'uppercase', marginTop: 12,
                }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ══════════ LIVE DEMO ══════════ */}
      <Section id="live-demo" style={{ padding: '40px 0 100px' }}>
        <div style={{ padding: '0 24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={sectionLabelStyle}>{t('livePreview', lang)}</p>
            <h2 style={sectionHeadingStyle}>{t('seeAction', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          <div style={{
            borderRadius: 20, overflow: 'hidden', position: 'relative',
            background: T.demoBg, border: `1px solid ${T.border}`,
            backdropFilter: 'blur(16px)', padding: '28px 28px 20px',
            boxShadow: darkMode ? '0 20px 80px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.08)',
          }}>
            {demoStep === 0 && typedText.length > 10 && (
              <div className="scan-line-effect" />
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
              paddingBottom: 16, borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{
                marginLeft: 12, fontSize: 12, color: T.text3, fontFamily: 'DM Mono, monospace',
              }}>verixa-engine v2.0</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 1 }}>LIVE</span>
              </div>
            </div>

            <div className="demo-terminal-box" style={{
              background: darkMode ? 'rgba(10,10,15,0.6)' : 'rgba(0,0,0,0.03)',
              borderRadius: 12, marginBottom: 20,
              border: `1px solid ${T.border}`, minHeight: 56,
              fontFamily: 'DM Mono, monospace', color: T.text2, lineHeight: 1.7,
            }}>
              {typedText}
              {demoStep === 0 && (
                <span style={{
                  display: 'inline-block', width: 2, height: 16, background: T.accent,
                  marginLeft: 2, animation: 'typewriter-blink 0.8s infinite', verticalAlign: 'text-bottom',
                }} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {demoClaims.slice(0, Math.max(0, demoStep)).map((claim, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="demo-claim-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderRadius: 10,
                      background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <claim.Icon size={18} color={claim.color} style={{ flexShrink: 0 }} className="demo-icon" />
                    <span className="demo-claim-text" style={{ color: T.text2, flex: 1, lineHeight: 1.5 }}>{t(claim.textKey, lang)}</span>
                    <span className="demo-claim-badge" style={{
                      fontWeight: 600, color: claim.color, letterSpacing: 0.5,
                      borderRadius: 6,
                      background: `${claim.color}15`, whiteSpace: 'nowrap', textAlign: 'right'
                    }}>{claim.verdict} · {claim.confidence}%</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
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

      {/* ══════════ CAPABILITIES (RE-ENGINEERED) ══════════ */}
      <Section id="features" style={{ padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="capabilities-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
            
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p style={sectionLabelStyle}>{t('capabilitiesLabel', lang)}</p>
                <h2 style={{
                  ...sectionHeadingStyle,
                  fontSize: 'clamp(42px, 6vw, 72px)',
                  lineHeight: 1,
                  marginBottom: 32
                }}>
                  {t('engineeredPrecision', lang)}
                </h2>
                
                <div style={{ 
                  padding: '24px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderLeft: `2px solid ${T.accent}`, borderRadius: '0 16px 16px 0',
                  backdropFilter: 'blur(10px)', marginBottom: 40
                }}>
                  <p style={{ fontSize: 18, color: T.text2, lineHeight: 1.5, margin: 0, fontWeight: 300 }}>
                    {t('eliminatingMisinfo', lang)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
                  {[
                    { label: t('calibration', lang), val: '99.9%', color: '#4ade80' },
                    { label: t('latency', lang), val: '< 800ms', color: T.accent },
                    { label: t('integrity', lang), val: 'SECURE', color: '#60a5fa' }
                  ].map((h, i) => (
                    <div key={i} style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 9, color: T.text3, letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>{h.label}</div>
                      <div style={{ fontSize: 20, color: h.color, fontWeight: 800, fontFamily: 'DM Mono, monospace' }}>{h.val}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="capabilities-sub-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {featuresList.slice(0, 4).map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                  whileHover={{ y: -8, borderColor: T.accent }}
                  style={{
                    padding: '24px', borderRadius: 20,
                    background: T.cardBg, border: `1px solid ${T.border}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                    cursor: 'pointer', position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    background: `${T.accent}14`, border: `1px solid ${T.accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12
                  }}>
                    <f.Icon size={16} color={T.accent} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t(f.key, lang)}</h3>
                  <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.5, margin: 0 }}>{t(f.descKey, lang)}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="extended-features-grid" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
            gap: 20, marginTop: 40 
          }}>
            {featuresList.slice(4).map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 + (i * 0.1) }}
                whileHover={{ scale: 1.01, borderColor: `${T.accent}4d` }}
                style={{
                  padding: '32px', borderRadius: 20,
                  background: `linear-gradient(135deg, ${T.cardBg}, transparent)`,
                  border: `1px solid ${T.border}`,
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="feature-card"
              >
                <div style={{ 
                  padding: 12, borderRadius: 12, background: `${T.accent}14`,
                  border: `1px solid ${T.accent}33`, color: T.accent 
                }}>
                  <f.Icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>{t(f.key, lang)}</h3>
                  <div style={{ height: 0, opacity: 0, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }} className="hover-desc">
                    <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, margin: 0 }}>{t(f.descKey, lang)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ PROCESS (SINE-WAVE JOURNEY) ══════════ */}
      <Section id="how-it-works" style={{ padding: '120px 0', background: T.sectionBg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '0 24px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>{t('howItWorksLabel', lang)}</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>{t('pathTruth', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '24px auto' }} />
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 60 }}>
            <svg style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              pointerEvents: 'none', zIndex: 0, opacity: 0.1
            }} className="desktop-wave">
              <motion.path
                d="M 450 0 Q 700 150 450 300 Q 200 450 450 600 Q 700 750 450 900"
                fill="none" stroke={T.accent} strokeWidth="1.5" strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </svg>

            {[
              { num: '01', side: 'left', label: t('surgicalExtraction', lang), desc: t('surgicalDesc', lang), icon: Zap },
              { num: '02', side: 'right', label: t('evidenceRetrieval', lang), desc: t('evidenceDesc', lang), icon: Search },
              { num: '03', side: 'left', label: t('integrityTest', lang), desc: t('integrityDesc', lang), icon: ShieldCheck },
              { num: '04', side: 'right', label: t('finalVerdict', lang), desc: t('finalDesc', lang), icon: CheckCircle2 }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: step.side === 'left' ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                style={{
                  alignSelf: step.side === 'left' ? 'flex-start' : 'flex-end',
                  width: '100%', maxWidth: 380, position: 'relative', zIndex: 2
                }}
                className="journey-step"
              >
                <div style={{
                  padding: '32px', borderRadius: 24,
                  background: `linear-gradient(135deg, ${T.cardBg}, rgba(255,255,255,0.01))`,
                  border: `1px solid ${T.border}`, backdropFilter: 'blur(12px)',
                  position: 'relative', overflow: 'hidden', boxShadow: `0 10px 40px rgba(0,0,0,0.2)`
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${T.accent}14`, border: `1px solid ${T.accent}4d`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20, transform: 'rotate(5deg)',
                    boxShadow: `0 0 20px ${T.accent}14`
                  }}>
                    <step.icon size={22} color={T.accent} strokeWidth={1.5} style={{ transform: 'rotate(-5deg)' }} />
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 3, color: T.accent, fontWeight: 900, marginBottom: 12 }}>PHASE_{step.num}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 500, color: T.text, marginBottom: 12, fontFamily: 'Cormorant Garamond, serif' }}>{step.label}</h3>
                  <p style={{ fontSize: 14, color: T.text3, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{step.desc}</p>
                  <div style={{
                    position: 'absolute', bottom: -10, right: 15,
                    fontSize: 80, fontWeight: 900, color: `${T.accent}0a`,
                    fontFamily: 'DM Mono, monospace', pointerEvents: 'none', zIndex: -1
                  }}>{step.num}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <style>{`
          .demo-terminal-box { padding: 16px 20px; font-size: 13px; }
          .demo-claim-card { padding: 12px 16px; }
          .demo-claim-text { font-size: 13px; }
          .demo-claim-badge { font-size: 11px; padding: 4px 10px; }
          .demo-icon { width: 18px; height: 18px; }
          
          @media (max-width: 1024px) {
            .desktop-wave { display: none !important; }
            .journey-step { align-self: center !important; margin: 0 auto !important; width: 100% !important; }
          }
          @media (max-width: 600px) {
            .demo-terminal-box { padding: 12px 14px; font-size: 11px; }
            .demo-claim-card { padding: 10px 12px; gap: 8px !important; flex-wrap: wrap; }
            .demo-claim-text { font-size: 11px; }
            .demo-claim-badge { font-size: 9px; padding: 3px 8px; }
            .demo-icon { width: 14px !important; height: 14px !important; }
          }
        `}</style>
      </Section>


      {/* ══════════ TESTIMONIALS ══════════ */}
      <Section id="testimonials" style={{ padding: '100px 0' }}>
        <div style={{ padding: '0 24px', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={sectionLabelStyle}>{t('testimonialsLabel', lang)}</p>
            <h2 style={sectionHeadingStyle}>{t('trustedAccuracy', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          <div className="testimonial-card" style={{
            position: 'relative', minHeight: 220,
            background: T.testimonialBg, borderRadius: 20,
            border: `1px solid ${T.border}`, padding: '44px 40px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 16, left: 28, fontSize: 72,
              fontFamily: 'Cormorant Garamond, serif', color: `${T.accent}1a`,
              lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
            }}>"</div>

            <AnimatePresence mode="wait">
              {testimonials.map((tItem, i) => i === activeTestimonial && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.8, fontWeight: 300, fontStyle: 'italic', marginBottom: 28 }}>
                    "{tItem.text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${T.accent}66, ${T.accent}0d)`,
                      border: `1px solid ${T.accent}4d`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, color: T.accent, flexShrink: 0,
                    }}>{tItem.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{tItem.name}</div>
                      <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{tItem.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28 }}>
              <button
                onClick={() => setActiveTestimonial(p => (p - 1 + testimonials.length) % testimonials.length)}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: `${T.accent}14`, color: T.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent}33`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent}14`}
              ><ChevronLeft size={20} /></button>
              <div style={{ display: 'flex', gap: 8 }}>
                {testimonials.map((_, i) => (
                  <button
                    key={i} onClick={() => setActiveTestimonial(i)}
                    style={{
                      width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 999,
                      background: i === activeTestimonial ? T.accent : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveTestimonial(p => (p + 1) % testimonials.length)}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: `${T.accent}14`, color: T.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent}33`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent}14`}
              ><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════ PRICING ══════════ */}
      <Section id="pricing" style={{ padding: '140px 0', background: T.sectionBg }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>{t('pricingLabel', lang)}</p>
            <h2 style={sectionHeadingStyle}>{t('scaleTruth', lang)}</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          <div className="pricing-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24, alignItems: 'stretch',
          }}>
            {plansList(lang).map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  padding: '56px 40px', borderRadius: 32,
                  border: plan.highlight ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                  background: plan.highlight ? `${T.accent}05` : T.cardBg,
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  backdropFilter: 'blur(10px)', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: 24, right: 32,
                    padding: '6px 14px', borderRadius: 20,
                    background: T.accent, color: darkMode ? '#0a0a0f' : '#fff',
                    fontSize: 10, fontWeight: 900, letterSpacing: 1.5,
                  }}>POPULAR</div>
                )}
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 24, color: T.text, marginBottom: 8,
                }}>{t(plan.nameKey, lang)}</div>
                <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.5, marginBottom: 32 }}>{t(plan.descKey, lang)}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
                  fontSize: 56, color: T.text, lineHeight: 1,
                }}>{plan.price === t('custom', lang) ? plan.price : `$${plan.price}`}</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 8, marginBottom: 32 }}>{t(plan.periodKey, lang)}</div>
                <ul style={{ listStyle: 'none', marginBottom: 40, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      fontSize: 14, color: T.text2, padding: '10px 0',
                      borderBottom: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <CheckCircle2 size={16} color={T.accent} strokeWidth={1.5} style={{ flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/verify" style={{ marginTop: 'auto' }}>
                  <button style={{
                    width: '100%', padding: '16px', borderRadius: 12,
                    background: plan.highlight ? T.accent : 'transparent',
                    border: plan.highlight ? 'none' : `1px solid ${T.border}`,
                    color: plan.highlight ? (darkMode ? '#0a0a0f' : '#fff') : T.text,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  }}>{t(plan.ctaKey, lang)}</button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ CTA ══════════ */}
      <Section style={{ padding: '120px 24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
            fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1.1,
            color: T.text, maxWidth: 700, margin: '0 auto 20px',
          }}>{t('ctaTitle', lang)}</h2>
          <p style={{ fontSize: 16, color: T.text2, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            {t('ctaSubtitle', lang)}
          </p>
          <Link to="/verify">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 44px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none',
                color: darkMode ? '#0a0a0f' : '#fff', letterSpacing: 0.5, cursor: 'pointer',
              }}
            > {t('ctaBtn', lang)} </motion.button>
          </Link>
        </div>
      </Section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

      <style>{`
        .feature-card:hover .hover-desc { height: auto !important; opacity: 1 !important; margin-top: 8px !important; }
        
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .capabilities-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .capabilities-sub-grid { grid-template-columns: 1fr !important; }
          .extended-features-grid { grid-template-columns: 1fr !important; }
          .feature-card { flex-direction: column !important; padding: 24px !important; }
          .demo-card { padding: 16px !important; }
          .journey-step { max-width: 100% !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-grid > div { padding: 40px 24px !important; }
          .testimonial-card { padding: 32px 20px !important; }
          .desktop-br { display: none !important; }
        }
        
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .capabilities-grid h2 { font-size: 32px !important; }
        }
      `}</style>
    </div>
  );
}