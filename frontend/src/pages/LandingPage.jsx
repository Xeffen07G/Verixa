import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Search, BarChart3, Brain, Link2, AlertTriangle, Zap, Clock, CheckCircle2, XCircle, MinusCircle, ShieldCheck } from 'lucide-react';
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
  { Icon: Shield, title: 'Claim Extraction', desc: 'Atomic decomposition of text into verifiable facts.' },
  { Icon: Search, title: 'Live Retrieval', desc: 'Autonomous intelligence gathering from global sources.' },
  { Icon: BarChart3, title: 'Verdict Scoring', desc: 'Precise True/False scores with transparent reasoning.' },
  { Icon: Brain, title: 'AI Detection', desc: 'Identify LLM-generated content with 99% accuracy.' },
  { Icon: Link2, title: 'URL Analysis', desc: 'Deep-scrape and verify any news link instantly.' },
  { Icon: AlertTriangle, title: 'Conflict Intel', desc: 'Surface source disagreements with absolute clarity.' },
];

const steps = [
  { num: '01', title: 'Submit', desc: 'Paste text or a URL link.' },
  { num: '02', title: 'Extract', desc: 'AI breaks text into facts.' },
  { num: '03', title: 'Verify', desc: 'Agents gather live evidence.' },
  { num: '04', title: 'Report', desc: 'Get your truth certificate.' },
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
  const [activeFeature, setActiveFeature] = useState(0);
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
    <div className="page-wrapper" style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s' }}>

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />


      {/* ══════════ HERO SECTION ══════════ */}
      <Section style={{ padding: '30px 0 100px', textAlign: 'center', position: 'relative' }}>
        {/* Subtle Background Glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(circle at 50% 30%, ${T.accent}0a 0%, transparent 70%)`,
          zIndex: 0
        }} />

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
              <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 1.5 }}>NOW IN PUBLIC BETA</span>
            </div>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(52px, 9vw, 90px)',
              fontWeight: 300, color: T.text, lineHeight: 1.1,
              marginBottom: 32, letterSpacing: -1,
            }}>
              Truth is not <br />
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: T.accent }}>negotiable.</span>
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
            VeriXa is the world's most precise AI-powered fact verification engine.<br />
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
        </div>

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
      </Section>

      {/* ══════════ STATS ══════════ */}
      <Section style={{ position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
              background: T.border, borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${T.border}`, boxShadow: `0 20px 40px rgba(0,0,0,0.2)`
            }}
          >
            {[
              { val: stat1, suffix: '+', label: 'Input formats supported', r: ref1 },
              { val: stat2, suffix: '', label: 'Verdict types', r: ref2 },
              { val: stat3, suffix: '', label: 'AI models powering engine', r: ref3 },
              { val: stat4, suffix: 's', label: 'Avg. response time', r: ref4 },
            ].map((s, i) => (
              <div key={i} ref={s.r} style={{ padding: '48px 24px', textAlign: 'center', background: T.statBg }}>
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

      {/* ══════════ CAPABILITIES (RE-ENGINEERED) ══════════ */}
      <Section id="features" style={{ padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
            
            {/* Left Column: Vision & Identity */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <p style={sectionLabelStyle}>Engineering Integrity</p>
                <h2 style={{
                  ...sectionHeadingStyle,
                  fontSize: 'clamp(42px, 6vw, 72px)',
                  lineHeight: 1,
                  marginBottom: 32
                }}>
                  Engineered for<br />
                  <span style={{ color: T.accent, fontStyle: 'italic' }}>absolute precision.</span>
                </h2>
                
                <div style={{ 
                  padding: '24px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderLeft: `2px solid ${T.accent}`, borderRadius: '0 16px 16px 0',
                  backdropFilter: 'blur(10px)', marginBottom: 40
                }}>
                  <p style={{ fontSize: 18, color: T.text2, lineHeight: 1.5, margin: 0, fontWeight: 300 }}>
                    Eliminating misinformation. At scale. With absolute rigor.
                  </p>
                </div>

                {/* Status HUD */}
                <div style={{ display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
                  {[
                    { label: 'CALIBRATION', val: '99.9%', color: '#4ade80' },
                    { label: 'LATENCY', val: '< 800ms', color: T.accent },
                    { label: 'INTEGRITY', val: 'SECURE', color: '#60a5fa' }
                  ].map((h, i) => (
                    <div key={i} style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 9, color: T.text3, letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>{h.label}</div>
                      <div style={{ fontSize: 20, color: h.color, fontWeight: 800, fontFamily: 'DM Mono, monospace' }}>{h.val}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {features.slice(0, 4).map((f, i) => (
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
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Full Width Extended Features */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
            gap: 20, marginTop: 40 
          }}>
            {features.slice(4).map((f, i) => (
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
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>{f.title}</h3>
                  <div style={{ height: 0, opacity: 0, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }} className="hover-desc">
                    <p style={{ fontSize: 13, color: T.text3, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
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
            <p style={sectionLabelStyle}>Operational Intelligence</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 4vw, 48px)' }}>The Path to <span style={{ color: T.accent, fontStyle: 'italic' }}>Absolute Truth.</span></h2>
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
              { num: '01', side: 'left', label: 'Surgical Extraction', desc: 'We intake raw content with zero-loss precision, isolating every potential claim.', icon: Zap },
              { num: '02', side: 'right', label: 'Evidence Retrieval', desc: 'Our engine cross-references millions of data points to uncover hidden facts.', icon: Search },
              { num: '03', side: 'left', label: 'Integrity Stress-Test', desc: 'Every claim is validated against authoritative sources, eliminating noise.', icon: ShieldCheck },
              { num: '04', side: 'right', label: 'The Final Verdict', desc: 'You receive a clear, evidence-backed report that serves as the source of truth.', icon: CheckCircle2 }
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
          @media (max-width: 1024px) {
            .desktop-wave { display: none !important; }
            div { align-self: center !important; margin: 0 auto !important; }
          }
        `}</style>
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
      <Section id="pricing" style={{ padding: '140px 0', background: T.sectionBg }}>
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>Tiered Access</p>
            <h2 style={sectionHeadingStyle}>Scale with absolute truth.</h2>
            <div style={{ ...dividerStyle, margin: '20px auto' }} />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24, alignItems: 'stretch',
          }}>
            {plans.map((plan, i) => (
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
                }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.5, marginBottom: 32 }}>{plan.desc}</div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
                  fontSize: 56, color: T.text, lineHeight: 1,
                }}>{plan.price === 'Custom' ? 'Custom' : `$${plan.price}`}</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 8, marginBottom: 32 }}>{plan.period}</div>
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', padding: '16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: plan.highlight ? `linear-gradient(135deg, ${T.accent}, #a07b42)` : 'transparent',
                      border: plan.highlight ? 'none' : `1px solid ${T.border}`,
                      color: plan.highlight ? (darkMode ? '#0a0a0f' : '#fff') : T.text, cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >{plan.cta}</motion.button>
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
          }}>Start verifying facts<br />with confidence today.</h2>
          <p style={{ fontSize: 16, color: T.text2, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join thousands of journalists, researchers, and enterprises who trust VeriXa to surface truth from noise.
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
            >Launch VeriXa Free</motion.button>
          </Link>
        </div>
      </Section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

        <style>{`
          .feature-card:hover .hover-desc { height: auto !important; opacity: 1 !important; margin-top: 8px !important; }
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