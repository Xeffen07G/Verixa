import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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
function Section({ children, id, style, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id} ref={ref} style={style}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
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

const testimonials = (lang) => [
  { name: 'Aditya Seth', role: t('test1Role', lang), text: t('test1Text', lang), avatar: 'AS' },
  { name: 'Arnab Basu', role: t('test2Role', lang), text: t('test2Text', lang), avatar: 'AB' },
  { name: 'Arnab Saha', role: t('test3Role', lang), text: t('test3Text', lang), avatar: 'AS' },
];

const featuresList = [
  { Icon: Shield, key: 'surgicalExtraction', descKey: 'surgicalDesc' },
  { Icon: Search, key: 'searchingEvidence', descKey: 'searchingDesc' },
  { Icon: BarChart3, key: 'verifyingClaims', descKey: 'verifyingDesc' },
  { Icon: Brain, key: 'aiTextDetection', descKey: 'aiDetectDesc' },
  { Icon: Video, key: 'videoForensic', descKey: 'videoForensicDesc' },
  { Icon: Link2, key: 'urlAnalysis', descKey: 'deepScrapeDesc' },
  { Icon: AlertTriangle, key: 'conflictIntel', descKey: 'conflictDesc' },
];

const plansList = (lang) => [
  { nameKey: 'starterPlan', price: '0', periodKey: 'forever', highlight: false, descKey: 'starterDesc', features: [t('plan1F1', lang), t('plan1F2', lang), t('plan1F3', lang), t('plan1F4', lang)], ctaKey: 'startFreeCTA' },
  { nameKey: 'proPlan', price: '29', periodKey: 'perMonth', highlight: true, descKey: 'proDesc', features: [t('plan2F1', lang), t('plan2F2', lang), t('plan2F3', lang), t('plan2F4', lang), t('plan2F5', lang), t('plan2F6', lang)], ctaKey: 'soonCTA' },
  { nameKey: 'enterprisePlan', price: t('custom', lang), periodKey: 'contactUs', highlight: false, descKey: 'entDesc', features: [t('plan3F1', lang), t('plan3F2', lang), t('plan3F3', lang), t('plan3F4', lang), t('plan3F5', lang), t('plan3F6', lang)], ctaKey: 'soonCTA' },
];

export default function LandingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : false; // Default to Light Mode for "Human" feel
  });

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const [activeTestimonial, setActiveTestimonial] = useState(0);
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
  }, [demoStep, demoInput]);

  useEffect(() => {
    if (demoStep < 1 || demoStep > 3) return;
    const timer = setTimeout(() => {
      if (demoStep < 3) setDemoStep(demoStep + 1);
      else setTimeout(() => { setDemoStep(0); setTypedText(''); }, 3000);
    }, 900);
    return () => clearTimeout(timer);
  }, [demoStep]);

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials(lang).length), 5000);
    return () => clearInterval(timer);
  }, [lang]);

  /* ── Theme tokens ── */
  const T_DARK = {
    bg: '#0a0a0f', bg2: '#12121a', accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.1)',
    text: '#f5f3ef', text2: 'rgba(245,243,239,0.7)', text3: 'rgba(245,243,239,0.4)',
    border: 'rgba(255,255,255,0.08)', cardBg: '#161621', shadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  const T_LIGHT = {
    bg: '#fdfcf9', bg2: '#fff8f6', accent: '#d48c70', accentLight: 'rgba(212, 140, 112, 0.1)',
    text: '#201a18', text2: '#53433e', text3: '#85736d',
    border: 'rgba(212, 140, 112, 0.15)', cardBg: '#ffffff', shadow: '0 20px 50px rgba(45, 45, 45, 0.05)',
  };

  const T = darkMode ? T_DARK : T_LIGHT;

  const stats = [
    { label: t('verifiedFacts', lang), value: '2.4M+', icon: <CheckCircle2 size={18} /> },
    { label: t('activeUsers', lang), value: '180K+', icon: <Users size={18} /> },
    { label: t('sourcesScanned', lang), value: '500+', icon: <Globe size={18} /> },
    { label: t('avgAccuracy', lang), value: '99.8%', icon: <Zap size={18} /> },
  ];

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', transition: 'all 0.5s ease', fontFamily: 'Inter, sans-serif' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* ══════════ HERO SECTION ══════════ */}
      <Section style={{ 
        paddingTop: 'min(220px, 25vh)', 
        paddingBottom: 160, 
        position: 'relative', 
        overflow: 'hidden',
        textAlign: 'center',
        background: darkMode 
          ? 'radial-gradient(circle at 50% 50%, rgba(201,169,110,0.1) 0%, #0a0a0f 70%)' 
          : 'radial-gradient(circle at 50% 50%, rgba(212,140,112,0.05) 0%, #fdfcf9 70%)'
      }}>
        {/* Particle Background Effect */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: Math.random() * 500 }}
              animate={{ 
                opacity: [0, 0.5, 0], 
                y: [Math.random() * 800, Math.random() * 200],
                x: [Math.random() * 100, Math.random() * -100]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                width: 2, height: 2,
                borderRadius: '50%',
                background: T.accent,
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 2 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', 
              borderRadius: 100, background: T.accentLight, border: `1px solid ${T.accent}30`, 
              marginBottom: 48, color: T.accent, fontSize: 11, fontWeight: 800, letterSpacing: 2
            }}>
              <div className="pulsing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
              {t('landingBeta', lang).toUpperCase()}
            </div>
            
            <h1 style={{ 
              fontFamily: 'Cormorant Garamond, serif', 
              fontSize: 'clamp(56px, 8vw, 120px)', 
              lineHeight: 0.9, 
              fontWeight: 300, 
              color: T.text, 
              marginBottom: 40,
              letterSpacing: -2
            }}>
              {t('landingHero1', lang)} <br />
              <span style={{ color: T.accent, fontStyle: 'italic' }}>{t('landingHero2', lang)}</span>
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(16px, 1.2vw, 20px)', 
              color: T.text2, 
              lineHeight: 1.8, 
              maxWidth: 700, 
              margin: '0 auto 64px',
              fontWeight: 400,
              opacity: 0.9
            }}>
              {t('landingHeroSubtitle', lang)}
            </p>

            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={user ? "/dashboard" : "/signup"}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    padding: '20px 52px', borderRadius: 12, fontSize: 15, fontWeight: 700, 
                    background: T.accent, color: darkMode ? '#0a0a0f' : '#fff', 
                    border: 'none', cursor: 'pointer', boxShadow: `0 20px 40px ${T.accent}40`,
                    minWidth: 200
                  }}
                > 
                  {user ? t('navDashboard', lang) : t('signUp', lang)} 
                </motion.button>
              </Link>
              <a href="#live-demo">
                <motion.button
                  whileHover={{ scale: 1.05, background: T.accent + '15' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    padding: '20px 52px', borderRadius: 12, fontSize: 15, fontWeight: 700, 
                    background: 'rgba(255,255,255,0.03)', color: T.text, border: `1px solid ${T.border}`, 
                    cursor: 'pointer', minWidth: 200, backdropFilter: 'blur(10px)'
                  }}
                > 
                  {t('landingSeeHow', lang)} 
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════ FEATURES SECTION ══════════ */}
      <Section id="features" style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>{t('features', lang)}</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 5vw, 64px)', color: T.text, fontWeight: 300, lineHeight: 1 }}>{t('landingFeaturesTitle', lang)}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {featuresList.map((f, i) => (
              <StaggerCard key={i} index={i} style={{ 
                padding: '48px 32px', borderRadius: 32, background: T.cardBg, 
                border: `1px solid ${T.border}`, boxShadow: T.shadow,
                display: 'flex', flexDirection: 'column', gap: 24
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accentLight, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <f.Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 12 }}>{t(f.key, lang)}</h3>
                  <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, margin: 0 }}>{t(f.descKey, lang)}</p>
                </div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ HOW IT WORKS SECTION ══════════ */}
      <Section id="how-it-works" style={{ padding: '120px 40px', background: T.bg2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>{t('process', lang)}</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 5vw, 64px)', color: T.text, fontWeight: 300, lineHeight: 1 }}>{t('howItWorks', lang)}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 60 }} className="capabilities-grid">
            {[
              { step: '01', key: 'surgicalExtraction', descKey: 'surgicalDesc' },
              { step: '02', key: 'searchingEvidence', descKey: 'searchingDesc' },
              { step: '03', key: 'verifyingClaims', descKey: 'verifyingDesc' }
            ].map((step, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontSize: 80, fontWeight: 900, color: T.accent, opacity: 0.1, position: 'absolute', top: -40, left: -20, fontFamily: 'Inter, sans-serif' }}>{step.step}</div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 16 }}>{t(step.key, lang)}</h3>
                  <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.7, margin: 0 }}>{t(step.descKey, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ STATS SECTION ══════════ */}
      <Section style={{ padding: '40px 40px 120px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {stats.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  padding: '48px 32px', borderRadius: 40, background: T.cardBg, 
                  border: `1px solid ${T.border}`, boxShadow: T.shadow,
                  textAlign: 'center', position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ color: T.accent, marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 36, fontWeight: 300, color: T.text, marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: T.text3, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ LIVE DEMO (HUMANIZED) ══════════ */}
      <Section id="live-demo" style={{ padding: '120px 0', background: T.bg2 }}>
        <div style={{ padding: '0 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'center' }} className="capabilities-grid">
            <div>
              <p style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Interactive Experience</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px, 4vw, 54px)', color: T.text, fontWeight: 300, lineHeight: 1.1, marginBottom: 32 }}>Witness the precision <br /><span style={{ fontStyle: 'italic' }}>of clarity.</span></h2>
              <p style={{ fontSize: 18, color: T.text2, lineHeight: 1.6, fontWeight: 300, marginBottom: 40 }}>Watch as VeriXa deconstructs complex narratives into verifiable truths in real-time. Our interface is designed for humans, by humans.</p>
              
              <Link to="/verify">
                <button style={{ padding: '16px 40px', borderRadius: 100, border: `1px solid ${T.text}`, background: 'transparent', color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Get Started Now</button>
              </Link>
            </div>

            <div style={{
              borderRadius: 40, overflow: 'hidden', position: 'relative',
              background: T.cardBg, border: `1px solid ${T.border}`,
              padding: '40px', boxShadow: T.shadow,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontWeight: 700 }}>VERIXA ENGINE v2.4</div>
              </div>

              <div style={{
                background: T.bg, borderRadius: 24, padding: '24px',
                border: `1px solid ${T.border}`, minHeight: 100, marginBottom: 24,
                fontFamily: 'Inter, sans-serif', color: T.text2, lineHeight: 1.6, fontSize: 15
              }}>
                {typedText}
                {demoStep === 0 && <span style={{ display: 'inline-block', width: 2, height: 18, background: T.accent, marginLeft: 4, animation: 'blink 1s infinite' }} />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence>
                  {demoClaims.slice(0, demoStep).map((claim, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '16px 20px', borderRadius: 20, background: T.bg2,
                        border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 16
                      }}
                    >
                      <claim.Icon size={20} color={claim.color} />
                      <div style={{ flex: 1, fontSize: 14, color: T.text, fontWeight: 500 }}>{t(claim.textKey, lang)}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: claim.color, background: `${claim.color}15`, padding: '6px 12px', borderRadius: 100 }}>{claim.verdict}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <Section id="testimonials" style={{ padding: '140px 0' }}>
        <div style={{ padding: '0 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>Voice of the People</p>
          
          <div style={{ position: 'relative', padding: '60px 0' }}>
             <AnimatePresence mode="wait">
               {testimonials(lang).map((tItem, i) => i === activeTestimonial && (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   transition={{ duration: 0.6 }}
                 >
                   <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 3vw, 42px)', color: T.text, fontWeight: 300, lineHeight: 1.4, fontStyle: 'italic', marginBottom: 40 }}>
                     "{tItem.text}"
                   </h3>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                     <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>{tItem.avatar}</div>
                     <div style={{ textAlign: 'left' }}>
                       <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{tItem.name}</div>
                       <div style={{ fontSize: 14, color: T.text3 }}>{tItem.role}</div>
                     </div>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
            {testimonials(lang).map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTestimonial(i)}
                style={{ 
                  width: i === activeTestimonial ? 32 : 12, height: 6, borderRadius: 10, 
                  background: i === activeTestimonial ? T.accent : T.border, 
                  border: 'none', cursor: 'pointer', transition: 'all 0.4s ease' 
                }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ PRICING ══════════ */}
      <Section id="pricing" style={{ padding: '140px 0', background: T.bg2 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 12, color: T.accent, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Pricing & Access</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 5vw, 64px)', color: T.text, fontWeight: 300, lineHeight: 1 }}>Plans for every <br /><span style={{ fontStyle: 'italic' }}>perspective.</span></h2>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {plansList(lang).map((plan, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                style={{
                  padding: '60px 40px', borderRadius: 48, background: T.cardBg, 
                  border: plan.highlight ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  position: 'relative', boxShadow: T.shadow, display: 'flex', flexDirection: 'column'
                }}
              >
                {plan.highlight && <div style={{ position: 'absolute', top: 32, right: 32, background: T.accent, color: '#fff', padding: '6px 16px', borderRadius: 100, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 12 }}>{t(plan.nameKey, lang)}</div>
                <div style={{ fontSize: 14, color: T.text3, marginBottom: 40, lineHeight: 1.6 }}>{t(plan.descKey, lang)}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 40 }}>
                  <span style={{ fontSize: 56, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: T.text }}>{plan.price === t('custom', lang) ? plan.price : `$${plan.price}`}</span>
                  <span style={{ fontSize: 14, color: T.text3 }}>{t(plan.periodKey, lang)}</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 48, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 14, color: T.text2, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CheckCircle2 size={18} color={T.accent} /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/verify">
                  <button style={{ width: '100%', padding: '18px', borderRadius: 100, background: plan.highlight ? T.accent : 'transparent', color: plan.highlight ? '#fff' : T.text, border: plan.highlight ? 'none' : `1px solid ${T.border}`, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t(plan.ctaKey, lang)}</button>
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
          .hero-grid { grid-template-columns: 1fr !important; gap: 60px !important; text-align: center; }
          .hero-grid div { align-items: center; }
          .hero-grid p { margin-left: auto; margin-right: auto; }
          .capabilities-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}