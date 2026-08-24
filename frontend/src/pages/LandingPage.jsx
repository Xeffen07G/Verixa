import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, FileText, 
  ArrowRight, Brain, MessageSquare, ListCollapse, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);

  // Theme toggle placeholder to keep Navbar happy
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // State for the interactive demo workspace
  const [activeCitation, setActiveCitation] = useState('citation1');

  // Theme styles (Warm Gold & Obsidian)
  const T = {
    bg: '#06060a',
    bg2: '#0b0b10',
    accent: '#c9a96e',
    accentDim: 'rgba(201, 169, 110, 0.08)',
    text: '#f5f3ef',
    textMuted: 'rgba(245, 243, 239, 0.65)',
    textDim: 'rgba(245, 243, 239, 0.35)',
    border: 'rgba(255, 255, 255, 0.04)',
    borderHover: 'rgba(255, 255, 255, 0.08)',
    cardBg: '#0f0f15',
    amber: '#fbbf24',
    amberBg: 'rgba(251, 191, 36, 0.08)',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative', paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: '80px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glow ambient backgrounds */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: `radial-gradient(circle, ${T.accent}0d 0%, transparent 60%)`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '150px', background: `linear-gradient(to top, ${T.bg}, transparent)` }} />
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: '999px', border: `1px solid ${T.accent}15`, background: `${T.accent}05`, marginBottom: '32px' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontSize: '10px', fontWeight: '700', color: T.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>Evidence-First Forensic Intelligence</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 8vw, 88px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '24px' }}
          >
            Evidence over <br />
            <span style={{ fontStyle: 'italic', color: T.accent }}>AI Fluency.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: T.textMuted, lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 48px', fontWeight: 300 }}
          >
            VeriXa is a trust-first platform engineered for contradiction analysis, anti-hallucination verification, and strict evidence-backed research.
          </motion.p>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/research">
              <button className="shimmer-btn" style={{ padding: '16px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', background: T.accent, border: 'none', color: '#000', cursor: 'pointer', boxShadow: `0 4px 20px ${T.accent}20` }}>
                Enter Research Lab
              </button>
            </Link>
            <Link to="/verify">
              <button style={{ padding: '16px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                Verify Evidence
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Interactive Mock Workspace Demo */}
      <section style={{ padding: '40px 24px 80px', position: 'relative' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '10px', color: T.accent, fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Interactive Preview</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300 }}>Verification in Action</h2>
          </div>

          {/* Mock Window Container */}
          <div className="mock-window glassmorphism" style={{ border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', background: '#09090e', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ fontSize: '11px', color: T.textDim, marginLeft: '12px', letterSpacing: '0.5px' }}>VERIXA WORKSPACE — DEMO_CLINICAL_TRIAL.PDF</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: T.amberBg, padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(251, 191, 36, 0.2)` }}>
                <AlertTriangle size={12} color={T.amber} />
                <span style={{ fontSize: '11px', color: T.amber, fontWeight: '600' }}>Contradiction Flagged</span>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="mock-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 300px', height: '420px' }}>
              
              {/* Left Panel: Library (Muted, minimalist list) */}
              <div className="mock-panel-left" style={{ borderRight: `1px solid ${T.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.textDim, letterSpacing: '1px', textTransform: 'uppercase' }}>WORKSPACE FILES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: `${T.accent}0d`, borderLeft: `2px solid ${T.accent}`, cursor: 'pointer' }}>
                    <FileText size={14} color={T.accent} />
                    <span style={{ fontSize: '12px', color: T.accent, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>clinical_trial_v12.pdf</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', opacity: 0.5 }}>
                    <FileText size={14} />
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>peer_review_analysis.pdf</span>
                  </div>
                </div>
              </div>

              {/* Center Panel: Primary Conversation */}
              <div className="mock-panel-center" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(255,255,255,0.005)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* User Question */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>US</div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '14px', maxWidth: '85%', border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>Are there any discrepancies in option efficacy rates?</p>
                    </div>
                  </div>

                  {/* VeriXa Answer */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                      <Brain size={14} />
                    </div>
                    <div style={{ padding: '4px 0', maxWidth: '90%' }}>
                      <p style={{ fontSize: '14px', lineHeight: 1.6, color: T.text, margin: '0 0 12px 0', fontWeight: 300 }}>
                        Yes, a clear contradiction is present:
                      </p>
                      <div style={{ background: 'rgba(251, 191, 36, 0.03)', borderLeft: `2px solid ${T.amber}`, padding: '10px 14px', borderRadius: '0 8px 8px 0', margin: '8px 0 16px' }}>
                        <p style={{ fontSize: '13px', lineHeight: 1.5, color: T.textMuted, margin: 0 }}>
                          Section 4.2 claims a{' '}
                          <span 
                            onClick={() => setActiveCitation('citation1')}
                            style={{ color: T.accent, textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                          >
                            92% efficacy rate
                          </span>{' '}
                          [Page 4], whereas the raw patient logs on{' '}
                          <span 
                            onClick={() => setActiveCitation('citation2')}
                            style={{ color: T.accent, textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Page 9
                          </span>{' '}
                          reflect only 24 recoveries out of 36 subjects (67%).
                        </p>
                      </div>
                      <p style={{ fontSize: '12px', color: T.textDim, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Interactive: Click underlined claims to inspect verification sources.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input block decoration */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.015)', padding: '10px 16px', borderRadius: '24px', border: `1px solid ${T.border}` }}>
                  <MessageSquare size={14} color={T.textDim} />
                  <span style={{ fontSize: '12px', color: T.textDim }}>Ask VeriXa about loaded documents...</span>
                </div>
              </div>

              {/* Right Panel: Evidence Inspector */}
              <div className="mock-panel-right" style={{ borderLeft: `1px solid ${T.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.textDim, letterSpacing: '1px', textTransform: 'uppercase' }}>EVIDENCE INSPECTION</span>
                
                <AnimatePresence mode="wait">
                  {activeCitation === 'citation1' ? (
                    <motion.div 
                      key="cit1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ fontSize: '11px', color: T.accent, fontWeight: '600', textTransform: 'uppercase' }}>Section 4.2 (Page 4)</div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: '11px', color: T.textDim, display: 'block', marginBottom: '6px' }}>VERBATIM QUOTE</span>
                        <p style={{ fontSize: '12px', lineHeight: 1.5, color: T.textMuted, fontStyle: 'italic', margin: 0 }}>
                          "...efficacy parameters under Option A regimens stabilized at 92% across test demographics, demonstrating optimal compliance parameters..."
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.textDim }}>
                        <CheckCircle2 size={12} color={T.accent} />
                        <span>Source: clinical_trial_v12.pdf</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="cit2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ fontSize: '11px', color: T.accent, fontWeight: '600', textTransform: 'uppercase' }}>Raw Patient Logs (Page 9)</div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: '11px', color: T.textDim, display: 'block', marginBottom: '6px' }}>VERBATIM QUOTE</span>
                        <p style={{ fontSize: '12px', lineHeight: 1.5, color: T.textMuted, fontStyle: 'italic', margin: 0 }}>
                          "Total Option A Cohort size: 36. Positive recovery outcomes documented: 24. Unresolved or minor responses: 12."
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.textDim }}>
                        <CheckCircle2 size={12} color={T.accent} />
                        <span>Source: clinical_trial_v12.pdf</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars (Simplified) */}
      <section style={{ padding: '60px 24px 100px', background: T.bg2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              { 
                title: 'Contradiction Detection', 
                desc: 'Cross-references claim parameters across files to automatically locate and alert you of data conflicts and anomalies.' 
              },
              { 
                title: 'Verbatim Grounding', 
                desc: 'Guarantees every assertion is paired with clickable direct quotes. No speculation, no synthetic hallucinations.' 
              },
              { 
                title: 'Forensic Benchmarks', 
                desc: 'Computes document-level precision and semantic consistency scores, giving you full trust transparency.' 
              }
            ].map((pillar, idx) => (
              <div 
                key={idx} 
                className="pillar-card" 
                style={{ 
                  padding: '32px', 
                  borderRadius: '12px', 
                  background: T.cardBg, 
                  border: `1px solid ${T.border}`,
                  transition: 'border-color 0.3s'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, marginBottom: '20px' }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 300, marginBottom: '12px' }}>{pillar.title}</h3>
                <p style={{ fontSize: '14px', color: T.textMuted, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, marginBottom: '24px' }}>
            Ready for Forensic <br />
            <span style={{ color: T.accent, fontStyle: 'italic' }}>Intelligence?</span>
          </h2>
          <p style={{ fontSize: '16px', color: T.textMuted, marginBottom: '40px', fontWeight: 300, lineHeight: 1.6 }}>
            Start auditing documents for discrepancies and contradictions with absolute precision.
          </p>
          <Link to="/research">
            <button className="shimmer-btn" style={{ padding: '18px 48px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', background: T.accent, border: 'none', color: '#000', cursor: 'pointer', boxShadow: `0 4px 20px ${T.accent}20` }}>
              Start Investigation
            </button>
          </Link>
        </div>
      </section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* Responsive styles override */}
      <style>{`
        .pillar-card:hover {
          border-color: ${T.accent}40 !important;
        }
        @media (max-width: 900px) {
          .mock-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .mock-panel-left {
            border-right: none !important;
            border-bottom: 1px solid ${T.border} !important;
          }
          .mock-panel-right {
            border-left: none !important;
            border-top: 1px solid ${T.border} !important;
          }
        }
      `}</style>
    </div>
  );
}