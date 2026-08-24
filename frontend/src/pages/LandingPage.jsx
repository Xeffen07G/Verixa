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

            {/* Layout Grid */}
            <div className="mock-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', padding: '32px' }}>
              
              {/* Left Column: Highlighted Statement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.textDim, letterSpacing: '1px', textTransform: 'uppercase' }}>Audited Statement</span>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: `1px solid ${T.border}`, padding: '24px', borderRadius: '12px', fontSize: '16px', lineHeight: 1.7, color: T.text, fontStyle: 'italic', fontWeight: 300 }}>
                  "Option A regimen was tested on <span style={{ color: T.green, background: 'rgba(74, 222, 128, 0.08)', padding: '2px 6px', borderRadius: '4px', border: `1px solid rgba(74, 222, 128, 0.25)`, fontStyle: 'normal', fontWeight: 500 }}>36 patients [1]</span>, stabilizing recovery rates at <span style={{ color: T.amber, background: 'rgba(251, 191, 36, 0.08)', padding: '2px 6px', borderRadius: '4px', border: `1px solid rgba(251, 191, 36, 0.25)`, fontStyle: 'normal', fontWeight: 500 }}>92% [2]</span> with <span style={{ color: T.red, background: 'rgba(248, 113, 113, 0.08)', padding: '2px 6px', borderRadius: '4px', border: `1px solid rgba(248, 113, 113, 0.25)`, fontStyle: 'normal', fontWeight: 500 }}>zero documented [3]</span> clinical side-effects."
                </div>
              </div>

              {/* Right Column: Grounded Findings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.textDim, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Audited Findings</span>
                
                {/* Finding 1: True */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.green}`, padding: '12px 18px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: T.green }}>[1] Verified Cohort Size</span>
                    <span style={{ fontSize: '11px', background: T.greenBg, color: T.green, padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>True</span>
                  </div>
                  <p style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.4, margin: 0, fontWeight: 300 }}>
                    Tested on 36 patients. Source logs state: "Cohort size: 36."
                  </p>
                </div>

                {/* Finding 2: Partially True */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.amber}`, padding: '12px 18px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: T.amber }}>[2] Recovery Parameters</span>
                    <span style={{ fontSize: '11px', background: T.amberBg, color: T.amber, padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>Partially True</span>
                  </div>
                  <p style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.4, margin: 0, fontWeight: 300 }}>
                    92% recovery in controls, but general trials observed 67% efficacy.
                  </p>
                </div>

                {/* Finding 3: False */}
                <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.red}`, padding: '12px 18px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: T.red }}>[3] Safety Assertions</span>
                    <span style={{ fontSize: '11px', background: T.redBg, color: T.red, padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>False</span>
                  </div>
                  <p style={{ fontSize: '12px', color: T.textMuted, lineHeight: 1.4, margin: 0, fontWeight: 300 }}>
                    Mild side-effects (nausea, fatigue) were documented in 12% of patients.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* Responsive styles override */}
      <style>{`
        @media (max-width: 900px) {
          .mock-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}