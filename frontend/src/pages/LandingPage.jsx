import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Shield, Search, BarChart3, Brain, Link2, AlertTriangle, 
  CheckCircle2, XCircle, MinusCircle, Video, Zap, ShieldCheck, 
  ChevronLeft, ChevronRight, Users, Globe, BookOpen, Target,
  GitBranch, Database, Activity, Lock, FileText
} from 'lucide-react';
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

export default function LandingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark' || true); // Default dark for forensic feel

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
  };

  const [stat1, ref1] = useCountUp(25);
  const [stat2, ref2] = useCountUp(98);
  const [stat3, ref3] = useCountUp(500);
  const [stat4, ref4] = useCountUp(2);

  const T = {
    bg: '#050508', 
    bg2: '#0a0a0f',
    accent: '#c9a96e', 
    accentLight: 'rgba(201,169,110,0.1)',
    text: '#f5f3ef', 
    text2: 'rgba(245,243,239,0.7)', 
    text3: 'rgba(245,243,239,0.4)',
    border: 'rgba(255,255,255,0.08)', 
    cardBg: '#0f0f16',
    demoBg: 'rgba(10,10,15,0.9)',
  };

  const sectionLabelStyle = { fontSize: 10, color: T.accent, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 };
  const sectionHeadingStyle = { fontFamily: 'Cormorant Garamond, serif', color: T.text, fontWeight: 300, lineHeight: 1.1 };
  const dividerStyle = { width: 60, height: 1, background: T.accent, opacity: 0.3 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s', paddingTop: 0, color: T.text, fontFamily: 'Inter, sans-serif' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* ══════════ HERO SECTION ══════════ */}
      <Section style={{ padding: 'calc(var(--nav-h) + 80px) 0 160px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${T.accent}0a 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${T.bg} 100%)` }} />
        </div>

        <div style={{ padding: '0 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 24px', borderRadius: 999, border: `1px solid ${T.accent}20`, background: `${T.accent}05`, marginBottom: 48 }}>
               <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.accent }} />
               <span style={{ fontSize: 9, fontWeight: 900, color: T.accent, letterSpacing: 3, opacity: 0.8 }}>PREMIUM FORENSIC INTELLIGENCE</span>
            </div>
            <h1 style={{ ...sectionHeadingStyle, fontSize: 'clamp(44px, 10vw, 110px)', marginBottom: 40, letterSpacing: -3 }}>
              Evidence over <br />
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: T.accent, opacity: 0.9 }}>AI Fluency.</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} style={{ fontSize: 20, color: T.text2, lineHeight: 1.6, maxWidth: 700, margin: '0 auto 56px', fontWeight: 300 }}>
            VeriXa is a trust-first forensic intelligence platform engineered for contradiction analysis, 
            evidence-backed reasoning, and anti-hallucination research workflows. 
            Verification at the speed of thought, precision at the scale of truth.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/research"><motion.button whileHover={{ scale: 1.04, boxShadow: `0 8px 40px ${T.accent}30` }} whileTap={{ scale: 0.97 }} style={{ padding: '20px 48px', borderRadius: 12, fontSize: 16, fontWeight: 700, background: T.accent, border: 'none', color: T.bg, cursor: 'pointer' }}>ENTER RESEARCH LAB</motion.button></Link>
            <Link to="/verification"><motion.button whileHover={{ scale: 1.04, borderColor: `${T.accent}66` }} whileTap={{ scale: 0.97 }} style={{ padding: '20px 48px', borderRadius: 12, fontSize: 16, fontWeight: 600, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }}>VERIFY EVIDENCE</motion.button></Link>
          </motion.div>
        </div>
      </Section>

      {/* ══════════ CORE PILLARS ══════════ */}
      <Section style={{ padding: '0 24px 120px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { Icon: GitBranch, title: 'Contradiction Intelligence', desc: 'Automatically map conflicting claims across multiple papers, identifying consensus and minority views.' },
            { Icon: ShieldCheck, title: 'Anti-Hallucination Pipeline', desc: 'Rigid grounding protocols that force AI to cite verbatim evidence before generating any interpretation.' },
            { Icon: Activity, title: 'Forensic Evaluation', desc: 'Continuous benchmarking against known misinformation datasets to ensure 99%+ grounding accuracy.' },
            { Icon: Lock, title: 'Research Integrity', desc: 'Full source transparency with alignment metrics and credibility badges for every discovery.' },
          ].map((p, i) => (
            <motion.div key={i} whileHover={{ y: -8 }} style={{ padding: '48px 40px', borderRadius: 20, background: T.bg2, border: `1px solid ${T.border}`, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: T.text, marginBottom: 16, letterSpacing: -0.5 }}>{p.title}</h3>
              <p style={{ fontSize: 15, color: T.text2, lineHeight: 1.7, fontWeight: 300 }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════ HOW IT WORKS: THE PIPELINE ══════════ */}
      <Section id="how-it-works" style={{ padding: '120px 0', background: T.bg2 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={sectionLabelStyle}>INTEGRITY PIPELINE</p>
            <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 5vw, 56px)' }}>Engineering the Path to Truth</h2>
            <div style={{ ...dividerStyle, margin: '24px auto' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {[
              { num: '01', title: 'Surgical Ingestion', desc: 'PDF text is extracted and semantically mapped in under 5 seconds for immediate interrogation.', icon: Database },
              { num: '02', title: 'Adaptive Retrieval', desc: 'Hybrid search combines BM25 keyword matching with vector embeddings to find relevant forensic chunks.', icon: Search },
              { num: '03', title: 'Consistency Analysis', desc: 'The Contradiction Engine compares retrieved evidence to identify cross-document disagreements.', icon: Brain },
              { num: '04', title: 'Grounded Reporting', desc: 'A final intelligence report is synthesized with verbatim citations and credibility-weighted trust scores.', icon: FileText }
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                 <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: T.accent, opacity: 0.5 }}>{step.num}</div>
                 <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 48 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: T.text, marginBottom: 12, letterSpacing: -0.5 }}>{step.title}</h3>
                    <p style={{ fontSize: 17, color: T.text2, lineHeight: 1.7, margin: 0, fontWeight: 300, maxWidth: 600 }}>{step.desc}</p>
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ NOT A CHATBOT ══════════ */}
      <Section style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={sectionLabelStyle}>WHAT VERIXA IS NOT</p>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: 48 }}>This is not "chat with your PDF."</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, textAlign: 'left' }}>
            {[
              { label: 'Not a chatbot', desc: 'Every response is grounded in retrieved evidence. No fluent hallucinations.' },
              { label: 'Not a RAG demo', desc: 'Contradiction detection, trust scoring, and forensic reporting go far beyond basic retrieval.' },
              { label: 'Not an AI wrapper', desc: 'Custom retrieval pipeline with intent classification, section boosts, and fallback synthesis.' },
              { label: 'Not speculation', desc: 'When evidence is missing, VeriXa says so. Explicit refusal over confident fabrication.' }
            ].map((item, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 20, border: `1px solid ${T.border}`, background: T.bg }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════ FINAL CTA ══════════ */}
      <Section style={{ padding: '160px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(32px, 6vw, 64px)', marginBottom: 40 }}>Ready for Forensic <br /><span style={{ color: T.accent }}>Intelligence?</span></h2>
          <Link to="/research"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '24px 64px', borderRadius: 16, background: T.accent, color: T.bg, border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>START INVESTIGATION</motion.button></Link>
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 32 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color={T.accent} />
                <span style={{ fontSize: 12, color: T.text3, fontWeight: 700, letterSpacing: 1 }}>NO CREDIT CARD</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color={T.accent} />
                <span style={{ fontSize: 12, color: T.text3, fontWeight: 700, letterSpacing: 1 }}>FREE TIER ALWAYS</span>
             </div>
          </div>
        </div>
      </Section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />
    </div>
  );
}