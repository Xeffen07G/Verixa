import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VerifyPage from './pages/VerifyPage';
import ImagePage from './pages/ImagePage';
import VideoPage from './pages/VideoPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TrendingPage from './pages/TrendingPage';
import DashboardPage from './pages/DashboardPage';
import ExtensionPage from './pages/ExtensionPage';
import AccountPage from './pages/AccountPage';
import ResearchWorkspace from './pages/ResearchWorkspace';
import IntelligenceLab from './pages/IntelligenceLab';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import DragDropOverlay from './components/DragDropOverlay';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [hasEntered, setHasEntered] = React.useState(() => {
    return localStorage.getItem('verixa-research-gate-accepted') === 'true';
  });

  const handleEnter = () => {
    localStorage.setItem('verixa-research-gate-accepted', 'true');
    setHasEntered(true);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LangProvider>
          <Router>
            <DragDropOverlay>
              {!hasEntered && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: '#0a0a0f',
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif",
                  color: '#f5f3ef',
                  overflow: 'hidden'
                }}>
                  {/* Styling Injection */}
                  <style>{`
                    @keyframes pulseGlow {
                      0% { box-shadow: 0 0 30px rgba(201, 169, 110, 0.1); }
                      50% { box-shadow: 0 0 50px rgba(201, 169, 110, 0.25); }
                      100% { box-shadow: 0 0 30px rgba(201, 169, 110, 0.1); }
                    }
                    @keyframes ambientShift {
                      0% { opacity: 0.4; }
                      50% { opacity: 0.7; }
                      100% { opacity: 0.4; }
                    }
                    @keyframes scanline {
                      0% { transform: translateY(-100%); }
                      100% { transform: translateY(100%); }
                    }
                  `}</style>

                  {/* Ambient Background Glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '120%',
                    height: '120%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(201, 169, 110, 0.08), transparent 60%)',
                    pointerEvents: 'none',
                    animation: 'ambientShift 8s ease-in-out infinite'
                  }} />

                  {/* Scanline Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                    backgroundSize: '100% 4px',
                    pointerEvents: 'none',
                    opacity: 0.15
                  }} />

                  {/* Glassmorphic Central Card */}
                  <div style={{
                    maxWidth: 580,
                    width: '90%',
                    padding: '48px 40px',
                    borderRadius: 24,
                    background: 'rgba(17, 17, 24, 0.85)',
                    border: '1px solid rgba(201, 169, 110, 0.2)',
                    backdropFilter: 'blur(30px)',
                    textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'pulseGlow 6s ease-in-out infinite',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {/* Logo Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        background: '#c9a96e',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 0 10px #c9a96e'
                      }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 28,
                        fontWeight: 300,
                        letterSpacing: 6,
                        textTransform: 'uppercase',
                        color: '#f5f3ef'
                      }}>VeriXa</span>
                    </div>

                    {/* Active Calibration Badge */}
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 99,
                      background: 'rgba(201, 169, 110, 0.1)',
                      border: '1px solid rgba(201, 169, 110, 0.25)',
                      color: '#c9a96e',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 32
                    }}>
                      RESEARCH PREVIEW // ACTIVE CALIBRATION PHASE
                    </div>

                    {/* Mission Statement */}
                    <h2 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 24,
                      fontWeight: 300,
                      lineHeight: 1.4,
                      margin: '0 0 16px',
                      color: '#f5f3ef'
                    }}>
                      "Truth is not negotiable. Precision is engineered."
                    </h2>
                    
                    <p style={{
                      fontSize: 14,
                      color: 'rgba(245, 243, 239, 0.7)',
                      lineHeight: 1.7,
                      margin: '0 0 32px',
                      fontWeight: 300
                    }}>
                      VeriXa operates as a high-fidelity AI-powered fact verification platform and forensic suit, engineered to separate signal from noise within visual, audio, and textual streams.
                    </p>

                    {/* Disclaimer Alert */}
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      background: 'rgba(201, 169, 110, 0.04)',
                      border: '1px solid rgba(201, 169, 110, 0.1)',
                      textAlign: 'left',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: 'rgba(245, 243, 239, 0.8)',
                      marginBottom: 40,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    }}>
                      <div style={{
                        marginTop: 2,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#c9a96e',
                        flexShrink: 0
                      }} />
                      <span>
                        <strong>SYSTEM CALIBRATION NOTICE:</strong> Some forensic verification models are undergoing active alignment and training cycles. They may produce experimental outputs during this phase.
                      </span>
                    </div>

                    {/* CTA Enter Button */}
                    <button
                      onClick={handleEnter}
                      style={{
                        width: '100%',
                        padding: '16px 0',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #c9a96e, #a07b42)',
                        border: 'none',
                        color: '#0a0a0f',
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(201, 169, 110, 0.3)',
                        transition: '0.3s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 169, 110, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(201, 169, 110, 0.3)';
                      }}
                    >
                      Access Research Environment
                    </button>

                    {/* Constraints Footer */}
                    <div style={{
                      marginTop: 36,
                      fontSize: 9,
                      color: 'rgba(245, 243, 239, 0.35)',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      Built under real deployment and infrastructure constraints
                    </div>
                  </div>
                </div>
              )}

              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/image" element={<ImagePage />} />
                <Route path="/pdf" element={<VerifyPage />} />
                <Route path="/video" element={<VideoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/intelligence" element={<IntelligenceLab />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/extension" element={<ExtensionPage />} />
                <Route path="/research" element={<ResearchWorkspace />} />
                <Route path="/account" element={<AccountPage />} />
              </Routes>
            </DragDropOverlay>
          </Router>
        </LangProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}