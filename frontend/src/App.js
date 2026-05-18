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
  const [isBypassed, setIsBypassed] = React.useState(() => {
    return localStorage.getItem('verixa_dev_access') === 'true';
  });

  const [activeStatusIdx, setActiveStatusIdx] = React.useState(0);

  const statuses = [
    "Verification Systems Calibrating...",
    "Temporal Analysis Stabilizing...",
    "Evidence Engines Training...",
    "Multi-Modal Forensics Optimizing..."
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatusIdx(prev => (prev + 1) % statuses.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleLogoClick = () => {
    let clicks = parseInt(sessionStorage.getItem('verixa-logo-clicks') || '0') + 1;
    sessionStorage.setItem('verixa-logo-clicks', clicks.toString());
    if (clicks >= 3) {
      localStorage.setItem('verixa_dev_access', 'true');
      setIsBypassed(true);
      sessionStorage.removeItem('verixa-logo-clicks');
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LangProvider>
          <Router>
            <DragDropOverlay>
              {!isBypassed && (
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
                      50% { box-shadow: 0 0 60px rgba(201, 169, 110, 0.25); }
                      100% { box-shadow: 0 0 30px rgba(201, 169, 110, 0.1); }
                    }
                    @keyframes ambientShift {
                      0% { opacity: 0.3; }
                      50% { opacity: 0.6; }
                      100% { opacity: 0.3; }
                    }
                    @keyframes blinkStatus {
                      0%, 100% { opacity: 0.4; }
                      50% { opacity: 1; }
                    }
                    @keyframes progressPulse {
                      0% { width: 10%; }
                      50% { width: 85%; }
                      100% { width: 95%; }
                    }
                  `}</style>

                  {/* High-fidelity Cinematic Grid Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'linear-gradient(rgba(201, 169, 110, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201, 169, 110, 0.02) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    pointerEvents: 'none',
                    opacity: 0.85
                  }} />

                  {/* Ambient Background Glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-15%',
                    width: '130%',
                    height: '130%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(201, 169, 110, 0.06), transparent 70%)',
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
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%)',
                    backgroundSize: '100% 4px',
                    pointerEvents: 'none',
                    opacity: 0.2
                  }} />

                  {/* Glassmorphic Central Card */}
                  <div style={{
                    maxWidth: 620,
                    width: '90%',
                    padding: '64px 48px',
                    borderRadius: 24,
                    background: 'rgba(11, 11, 17, 0.9)',
                    border: '1px solid rgba(201, 169, 110, 0.15)',
                    backdropFilter: 'blur(30px)',
                    textAlign: 'center',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    animation: 'pulseGlow 6s ease-in-out infinite',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {/* Brand Identifier (Logo) */}
                    <div 
                      onClick={handleLogoClick}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 12, 
                        marginBottom: 32,
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: 10,
                        height: 10,
                        background: '#c9a96e',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 0 10px #c9a96e'
                      }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 26,
                        fontWeight: 300,
                        letterSpacing: 8,
                        textTransform: 'uppercase',
                        color: '#f5f3ef'
                      }}>VeriXa</span>
                    </div>

                    {/* Stage Ribbon */}
                    <div style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      color: '#c9a96e',
                      marginBottom: 16
                    }}>
                      RESEARCH CALIBRATION IN PROGRESS
                    </div>

                    {/* Cinematic Header */}
                    <h1 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 42,
                      fontWeight: 300,
                      lineHeight: 1.2,
                      margin: '0 0 24px',
                      color: '#f5f3ef',
                      letterSpacing: 0.5
                    }}>
                      Calibrating the Next Generation of Forensic Intelligence.
                    </h1>
                    
                    {/* Subheading Body Copy */}
                    <p style={{
                      fontSize: 15,
                      color: 'rgba(245, 243, 239, 0.7)',
                      lineHeight: 1.7,
                      margin: '0 0 40px',
                      fontWeight: 300
                    }}>
                      VeriXa is currently undergoing active forensic calibration and infrastructure refinement before public release. We are carefully engineering a trust-first intelligence system focused on evidence, resilience, and precision under real-world constraints.
                    </p>

                    {/* Active Calibration Status Block */}
                    <div style={{
                      background: 'rgba(201, 169, 110, 0.03)',
                      border: '1px solid rgba(201, 169, 110, 0.1)',
                      borderRadius: 16,
                      padding: '24px 32px',
                      marginBottom: 40,
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#c9a96e',
                          boxShadow: '0 0 8px #c9a96e',
                          animation: 'blinkStatus 1.5s infinite ease-in-out'
                        }} />
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          color: '#c9a96e',
                          transition: 'opacity 0.3s'
                        }}>
                          {statuses[activeStatusIdx]}
                        </span>
                      </div>
                      
                      {/* Sub-Progress Indicator */}
                      <div style={{
                        height: 2,
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)',
                          width: '100%',
                          animation: 'progressPulse 4s infinite linear'
                        }} />
                      </div>
                    </div>

                    {/* Soft Motivational Footer */}
                    <div style={{
                      fontSize: 10,
                      color: 'rgba(245, 243, 239, 0.4)',
                      letterSpacing: 1,
                      fontWeight: 300,
                      lineHeight: 1.5
                    }}>
                      Built with obsession for truth, reliability, and resilient AI systems.
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