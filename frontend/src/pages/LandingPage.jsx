import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, FileText, 
  XCircle, Info, ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

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
    red: '#f87171',
    redBg: 'rgba(248, 113, 113, 0.08)',
    green: '#4ade80',
    greenBg: 'rgba(74, 222, 128, 0.08)',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative', paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: '80px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: `radial-gradient(circle, ${T.accent}0d 0%, transparent 60%)`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '150px', background: `linear-gradient(to top, ${T.bg}, transparent)` }} />
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: '999px', border: `1px solid ${T.accent}15`, background: `${T.accent}05`, marginBottom: '32px' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontSize: '10px', fontWeight: '700', color: T.accent, letterSpacing: '2px', textTransform: 'uppercase' }}>Evidence-First Forensic Verification</span>
          </motion.div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(42px, 8vw, 88px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '24px' }}>
            Evidence over <br />
            <span style={{ fontStyle: 'italic', color: T.accent }}>AI Fluency.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: T.textMuted, lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 48px', fontWeight: 300 }}>
            VeriXa is a trust-first platform built for contradiction analysis, statement verification, and evidence-backed claims integrity.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/verify">
              <button className="shimmer-btn" style={{ padding: '16px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', background: T.accent, border: 'none', color: '#000', cursor: 'pointer', boxShadow: `0 4px 20px ${T.accent}20` }}>
                Verify Statements
              </button>
            </Link>
            <Link to="/research">
              <button style={{ padding: '16px 36px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                Document Intelligence
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Interactive Mock Verification Demo */}
      <section style={{ padding: '40px 24px 80px', position: 'relative' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ fontSize: '10px', color: T.accent, fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>Verification Workspace</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300 }}>Verification in Action</h2>
          </div>

          <div className="mock-window glassmorphism" style={{ border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', background: '#09090e', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ fontSize: '11px', color: T.textDim, marginLeft: '12px', letterSpacing: '0.5px' }}>VERIXA STATEMENT VERIFICATION LAB</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: T.amberBg, padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(251, 191, 36, 0.2)` }}>
                <AlertTriangle size={12} color={T.amber} />
                <span style={{ fontSize: '11px', color: T.amber, fontWeight: '600' }}>Claims Flagged</span>
              </div>
            </div>

            {/* Layout Container */}
            <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(255,255,255,0.003)' }}>
              
              {/* Line 1: Input Statement */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: T.accent, letterSpacing: '1px', textTransform: 'uppercase', minWidth: '90px', paddingTop: '4px' }}>Statement</span>
                <p style={{ fontSize: '15px', lineHeight: 1.5, color: T.text, margin: 0, fontWeight: 300, fontStyle: 'italic' }}>
                  "Option A regimen stabilized patient recovery rates at 92% with zero documented clinical side-effects."
                </p>
              </div>

              {/* Line 2: Contradiction Alert */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', borderTop: `1px solid ${T.border}`, paddingTop: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: T.amber, letterSpacing: '1px', textTransform: 'uppercase', minWidth: '90px', paddingTop: '4px' }}>Contradiction</span>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: T.textMuted, margin: 0, fontWeight: 300 }}>
                  Section 4.2 claims a <span style={{ color: T.accent, fontWeight: '500' }}>92% recovery rate</span>, but Page 9 patient logs reflect only 24 recoveries out of 36 subjects (<span style={{ color: T.red, fontWeight: '500' }}>67% recovery</span>).
                </p>
              </div>

              {/* Line 3: Grounded Evidence */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', borderTop: `1px solid ${T.border}`, paddingTop: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: T.textDim, letterSpacing: '1px', textTransform: 'uppercase', minWidth: '90px', paddingTop: '2px' }}>Evidence</span>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px' }}>
                    <FileText size={12} color={T.accent} />
                    <span style={{ color: T.textMuted }}>clinical_trial_v12.pdf — Page 4</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: `1px solid ${T.border}`, fontSize: '12px' }}>
                    <FileText size={12} color={T.accent} />
                    <span style={{ color: T.textMuted }}>clinical_trial_v12.pdf — Page 9</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars (Simplified) */}
      <section id="features" style={{ padding: '60px 24px 100px', background: T.bg2, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
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
            Start auditing statements for discrepancies and contradictions with absolute precision.
          </p>
          <Link to="/verify">
            <button className="shimmer-btn" style={{ padding: '18px 48px', borderRadius: '10px', fontSize: '16px', fontWeight: '600', background: T.accent, border: 'none', color: '#000', cursor: 'pointer', boxShadow: `0 4px 20px ${T.accent}20` }}>
              Start Verification
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
        }
      `}</style>
    </div>
  );
}