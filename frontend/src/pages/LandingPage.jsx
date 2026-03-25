import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Search, BarChart3, Brain, Link2, AlertTriangle, Zap, Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ─────────── Counter Hook ─────────── */
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
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
  { text: 'The Eiffel Tower is located in Berlin, Germany.', verdict: 'False', confidence: 97, color: '#f87171', Icon: XCircle },
  { text: 'Water boils at 100°C at standard atmospheric pressure.', verdict: 'True', confidence: 99, color: '#4ade80', Icon: CheckCircle2 },
  { text: 'The Great Wall of China is visible from space with the naked eye.', verdict: 'Partially True', confidence: 72, color: '#fbbf24', Icon: MinusCircle },
];

/* ─────────── Static Data ─────────── */
const testimonials = [
  { name: 'Aditya Seth', role: 'Software, Strategy and AI Initiative', text: 'VeriXa has become indispensable to our compliance workflow. It catches misinformation before it reaches our clients with a precision I have never seen in any other tool.', avatar: 'AS' },
  { name: 'Arnab Basu', role: 'Academic Coordinator at Techno India University', text: 'The claim extraction is extraordinary. What used to take my team three hours of manual fact-checking now takes VeriXa under two minutes. The source citations are impeccable.', avatar: 'AB' },
  { name: 'Arnab Saha', role: 'Senior Programme Coordinator at Techno India University', text: 'We integrated VeriXa into our research pipeline. The confidence scoring system has become the gold standard for how we evaluate information quality across the firm.', avatar: 'AS' },
];

const features = [
  { Icon: Shield, title: 'Precision Claim Extraction', desc: 'Atomic decomposition of complex text into individual verifiable statements using chain-of-thought reasoning. Zero ambiguity.' },
  { Icon: Search, title: 'Real-Time Evidence Retrieval', desc: 'Autonomous web intelligence gathering across authoritative sources. Cross-referenced and ranked by credibility in milliseconds.' },
  { Icon: BarChart3, title: 'Verdict & Confidence Scoring', desc: 'True · False · Partially True · Unverifiable — each with a 0-100 confidence score and transparent reasoning chain.' },
  { Icon: Brain, title: 'AI Origin Detection', desc: 'Probabilistic analysis of whether text was generated by an LLM. Stylometric fingerprinting meets statistical pattern recognition.' },
  { Icon: Link2, title: 'URL Article Analysis', desc: 'Paste any news article URL. VeriXa scrapes, extracts, and runs the full verification pipeline in seconds.' },
  { Icon: AlertTriangle, title: 'Conflict Surface Intelligence', desc: 'When sources disagree, VeriXa surfaces the conflict explicitly — never averaging away the truth with false consensus.' },
];

const steps = [
  { num: '01', title: 'Submit Text or URL', desc: 'Paste any article, essay, or link. VeriXa accepts raw text or scrapes content automatically.' },
  { num: '02', title: 'Claims Are Extracted', desc: 'The AI engine decomposes your content into discrete, atomic factual claims — each independently verifiable.' },
  { num: '03', title: 'Evidence Is Retrieved', desc: 'Web intelligence agents formulate targeted queries and cross-reference findings against authoritative sources.' },
  { num: '04', title: 'Report Generated', desc: 'A granular report with verdicts, confidence scores, citations, and an overall accuracy score is delivered instantly.' },
];

const plans = [
  { name: 'Starter', price: '0', period: 'forever', highlight: false, desc: 'For individuals exploring intelligent fact-checking.', features: ['10 verifications / month', 'Text input only', 'Basic accuracy report', 'Community support'], cta: 'Start Free' },
  { name: 'Professional', price: '29', period: 'per month', highlight: true, desc: 'For journalists, analysts, and serious researchers.', features: ['500 verifications / month', 'URL + text input', 'AI text detection', 'Priority support', 'Export reports (PDF)', 'Confidence scoring'], cta: 'Payments Beginning Soon' },
  { name: 'Enterprise', price: 'Custom', period: 'contact us', highlight: false, desc: 'For organizations requiring full pipeline integration.', features: ['Unlimited verifications', 'REST API access', 'SSO and team accounts', 'Dedicated support', 'SLA guarantees', 'Custom models'], cta: 'Payments Beginning Soon' },
];



/* ═══════════════════════════════ COMPONENT ═══════════════════════════════ */

export default function LandingPage() {
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
  const [demoStep, setDemoStep] = useState(0); // 0=typing, 1..3=claims appearing
  const [typedText, setTypedText] = useState('');

  const demoInput = 'The Eiffel Tower is in Berlin. Water boils at 100°C. The Great Wall is visible from space.';

  // Typewriter effect
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

  // Claims appearing one by one
  useEffect(() => {
    if (demoStep < 1 || demoStep > 3) return;
    const timer = setTimeout(() => {
      if (demoStep < 3) setDemoStep(demoStep + 1);
      else setTimeout(() => { setDemoStep(0); setTypedText(''); }, 3000);
    }, 900);
    return () => clearTimeout(timer);
  }, [demoStep]);

  // Testimonial carousel
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
    fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1.1, color: T.text, letterSpacing: -0.5,
  };
  const sectionLabelStyle = {
    fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
    color: T.accent, marginBottom: 14, fontWeight: 500,
  };
  const dividerStyle = {
    width: 48, height: 1, background: `linear-gradient(to right, ${T.accent}, transparent)`, margin: '20px 0',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s' }}>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />


      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '120px 24px 80px',
      }}>
        <Particles darkMode={darkMode} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: T.heroBg, pointerEvents: 'none' }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: darkMode ? 0.03 : 0.06,
          backgroundImage: 'linear-gradient(rgba(128,128,128,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
              border: `1px solid ${T.accent}4d`, borderRadius: 999,
              background: T.accentMuted, marginBottom: 28, fontSize: 12,
              color: T.badgeText, letterSpacing: 1.5, fontWeight: 500, textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: T.accent,
              animation: 'pulse-gold 1.8s infinite', display: 'inline-block',
            }} />
            Now in public beta
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
              fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.08,
              color: T.text, letterSpacing: -1, marginBottom: 24,
            }}
          >
            Truth is not<br />
            <span style={{
              fontStyle: 'italic',
              display: 'inline-block',
              backgroundImage: `linear-gradient(90deg, ${T.accent}, #e8d5a3, ${T.accent})`,
              backgroundSize: '200% auto',
              backgroundPosition: 'center',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>negotiable.</span>          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{
              fontSize: 17, color: T.text2, lineHeight: 1.7, maxWidth: 560,
              margin: '0 auto 40px', fontWeight: 300,
            }}
          >
            VeriXa is the world's most precise AI-powered fact verification engine.
            Extract claims, retrieve evidence, and generate authoritative accuracy reports in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}
          >
            <Link to="/verify">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${T.accent}40` }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '15px 38px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none',
                  color: darkMode ? '#0a0a0f' : '#fff', letterSpacing: 0.5, cursor: 'pointer',
                  boxShadow: `0 4px 24px ${T.accent}26`,
                }}
              >Start Verifying Free</motion.button>
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
              >See How It Works</motion.button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            style={{
              marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, color: T.text3, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            }}
          >
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${T.accent}66, transparent)` }} />
            <span>Scroll</span>
          </motion.div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <Section>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
            background: T.border, borderRadius: 16, overflow: 'hidden',
            border: `1px solid ${T.border}`, animation: 'glow-pulse 4s ease-in-out infinite',
          }}>
            {[
              { val: stat1, suffix: '+', label: 'Input formats supported', r: ref1 },
              { val: stat2, suffix: '', label: 'Verdict types', r: ref2 },
              { val: stat3, suffix: '', label: 'AI models powering engine', r: ref3 },
              { val: stat4, suffix: 's', label: 'Avg. response time', r: ref4 },
            ].map((s, i) => (
              <div key={i} ref={s.r} style={{ padding: '40px 24px', textAlign: 'center', background: T.statBg }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 48,
                  color: T.accent, lineHeight: 1, animation: 'count-glow 3s ease-in-out infinite',
                }}>{s.val}{s.suffix}</div>
                <div style={{
                  fontSize: 11, color: T.text3, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 8,
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ LIVE DEMO ══════════ */}
      <Section id="live-demo" style={{ padding: '40px 0 100px' }}>
        <div style={{ padding: '0 24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={sectionLabelStyle}>Live Preview</p>
            <h2 style={sectionHeadingStyle}>See VeriXa in action.</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          <div style={{
            borderRadius: 20, overflow: 'hidden', position: 'relative',
            background: T.demoBg, border: `1px solid ${T.border}`,
            backdropFilter: 'blur(16px)', padding: '28px 28px 20px',
            boxShadow: darkMode ? '0 20px 80px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.08)',
          }}>
            {/* Scanline */}
            {demoStep === 0 && typedText.length > 10 && (
              <div className="scan-line-effect" />
            )}

            {/* Header bar */}
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
            </div>

            {/* Input area */}
            <div style={{
              background: darkMode ? 'rgba(10,10,15,0.6)' : 'rgba(0,0,0,0.03)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              border: `1px solid ${T.border}`, minHeight: 56,
              fontFamily: 'DM Mono, monospace', fontSize: 13, color: T.text2, lineHeight: 1.7,
            }}>
              {typedText}
              {demoStep === 0 && (
                <span style={{
                  display: 'inline-block', width: 2, height: 16, background: T.accent,
                  marginLeft: 2, animation: 'typewriter-blink 0.8s infinite', verticalAlign: 'text-bottom',
                }} />
              )}
            </div>

            {/* Claims results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {demoClaims.slice(0, Math.max(0, demoStep)).map((claim, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10,
                      background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <claim.Icon size={18} color={claim.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.text2, flex: 1, lineHeight: 1.5 }}>{claim.text}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: claim.color, letterSpacing: 0.5,
                      padding: '4px 10px', borderRadius: 6,
                      background: `${claim.color}15`, whiteSpace: 'nowrap',
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
          Powered by leading AI infrastructure
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

      {/* ══════════ FEATURES ══════════ */}
      <Section id="features" style={{ padding: '80px 0' }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
          <p style={sectionLabelStyle}>Capabilities</p>
          <h2 style={sectionHeadingStyle}>Engineered for<br />absolute precision.</h2>
          <div style={dividerStyle} />
          <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.7, maxWidth: 520, marginTop: 14, fontWeight: 300 }}>
            Every component of VeriXa is designed to eliminate misinformation at scale.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20, marginTop: 60,
          }}>
            {features.map((f, i) => (
              <StaggerCard key={i} index={i} style={{
                padding: '36px 32px', borderRadius: 16,
                background: T.glassCard || T.cardBg,
                backdropFilter: darkMode ? 'blur(12px)' : 'none',
                border: `1px solid ${T.glassBorder || T.border}`,
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${T.accent}4d`;
                  e.currentTarget.style.background = T.featureHover;
                  e.currentTarget.style.boxShadow = `0 8px 40px ${T.accent}0f`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = T.glassBorder || T.border;
                  e.currentTarget.style.background = T.glassCard || T.cardBg;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 20,
                  background: `linear-gradient(135deg, ${T.accent}33, ${T.accent}0a)`,
                  border: `1px solid ${T.accent}4d`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.Icon size={20} color={T.accent} strokeWidth={1.5} />
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 20, color: T.text, marginBottom: 10,
                }}>{f.title}</div>
                <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <Section id="how-it-works" style={{ padding: '100px 0', background: T.sectionBg }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
          <p style={sectionLabelStyle}>Process</p>
          <h2 style={sectionHeadingStyle}>From text to truth<br />in four steps.</h2>
          <div style={dividerStyle} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginTop: 60, position: 'relative' }}>
            {steps.map((step, i) => (
              <StaggerCard key={i} index={i} style={{
                padding: '32px 28px', background: T.stepBg, borderRadius: 16,
                border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.accent}4d`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
              >
                {/* Step number with gradient */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                  background: `linear-gradient(135deg, ${T.accent}40, ${T.accent}0a)`,
                  border: `1px solid ${T.accent}4d`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 20, color: T.accent,
                }}>{step.num}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 20, color: T.text, marginBottom: 10,
                }}>{step.title}</div>
                <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, fontWeight: 300 }}>{step.desc}</div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <Section id="testimonials" style={{ padding: '100px 0' }}>
        <div style={{ padding: '0 24px', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={sectionLabelStyle}>Testimonials</p>
            <h2 style={sectionHeadingStyle}>Trusted by those who<br />demand accuracy.</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          {/* Carousel */}
          <div style={{
            position: 'relative', minHeight: 220,
            background: T.testimonialBg, borderRadius: 20,
            border: `1px solid ${T.border}`, padding: '44px 40px',
            overflow: 'hidden',
          }}>
            {/* Decorative quote mark */}
            <div style={{
              position: 'absolute', top: 16, left: 28, fontSize: 72,
              fontFamily: 'Cormorant Garamond, serif', color: `${T.accent}1a`,
              lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
            }}>"</div>

            <AnimatePresence mode="wait">
              {testimonials.map((t, i) => i === activeTestimonial && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.8, fontWeight: 300, fontStyle: 'italic', marginBottom: 28 }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${T.accent}66, ${T.accent}0d)`,
                      border: `1px solid ${T.accent}4d`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, color: T.accent, flexShrink: 0,
                    }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Navigation: Arrows + Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28 }}>
                <button
                onClick={() => setActiveTestimonial(p => (p - 1 + testimonials.length) % testimonials.length)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: `${T.accent}14`, color: T.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent}33`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent}14`}
              >←</button>
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
                  width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: `${T.accent}14`, color: T.accent, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.accent}33`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.accent}14`}
              >→</button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════ PRICING ══════════ */}
      <Section id="pricing" style={{ padding: '100px 0', background: T.sectionBg }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={sectionLabelStyle}>Pricing</p>
            <h2 style={sectionHeadingStyle}>Simple, transparent<br />pricing.</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
            <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.7, maxWidth: 520, margin: '14px auto 0', fontWeight: 300 }}>
              Start free. Scale when you are ready. No hidden fees, no surprises.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20, alignItems: 'stretch',
          }}>
            {plans.map((plan, i) => (
              <StaggerCard key={i} index={i} style={{
                padding: '40px 32px', borderRadius: 20,
                border: plan.highlight ? `1px solid ${T.accent}4d` : `1px solid ${T.border}`,
                background: plan.highlight
                  ? (darkMode ? `${T.accent}0a` : `${T.accent}0f`)
                  : T.pricingBg,
                position: 'relative', display: 'flex', flexDirection: 'column',
                boxShadow: plan.highlight ? `0 8px 40px ${T.accent}14` : 'none',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    padding: '5px 18px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                    background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, color: darkMode ? '#0a0a0f' : '#fff',
                    letterSpacing: 1.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>Most Popular</div>
                )}
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 500,
                  fontSize: 22, color: T.text, marginBottom: 6,
                }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.5, marginBottom: 28 }}>{plan.desc}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
                  fontSize: 52, color: T.text, lineHeight: 1,
                }}>{plan.price === 'Custom' ? 'Custom' : `$${plan.price}`}</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 4, marginBottom: 28 }}>{plan.period}</div>
                <ul style={{ listStyle: 'none', marginBottom: 32, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      fontSize: 13, color: T.text2, padding: '8px 0',
                      borderBottom: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <CheckCircle2 size={14} color={T.accent} strokeWidth={1.5} style={{ flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/verify" style={{ marginTop: 'auto' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: plan.highlight ? `linear-gradient(135deg, ${T.accent}, #a07b42)` : 'transparent',
                      border: plan.highlight ? 'none' : `1px solid ${T.border}`,
                      color: plan.highlight ? (darkMode ? '#0a0a0f' : '#fff') : T.text, cursor: 'pointer',
                      transition: 'all 0.2s', letterSpacing: 0.3,
                    }}
                  >{plan.cta}</motion.button>
                </Link>
              </StaggerCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ CTA ══════════ */}
      <Section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="aurora-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}10 0%, transparent 70%)`,
          top: '10%', left: '-5%', pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}0a 0%, transparent 70%)`,
          bottom: '10%', right: '5%', pointerEvents: 'none', filter: 'blur(30px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Zap size={36} color={T.accent} strokeWidth={1} style={{ marginBottom: 24 }} />
          </motion.div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
            fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1.1,
            color: T.text, maxWidth: 700, margin: '0 auto 20px',
          }}>Start verifying facts<br />with confidence today.</h2>
          <p style={{ fontSize: 16, color: T.text2, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join thousands of journalists, researchers, and enterprises who trust VeriXa to surface truth from noise.
          </p>
          <Link to="/verify">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: `0 12px 48px ${T.accent}4d` }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 44px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none',
                color: darkMode ? '#0a0a0f' : '#fff', letterSpacing: 0.5, cursor: 'pointer',
                boxShadow: `0 4px 24px ${T.accent}26`,
              }}
            >Launch VeriXa Free</motion.button>
          </Link>
        </div>
      </Section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* ── Responsive Overrides ── */}
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}