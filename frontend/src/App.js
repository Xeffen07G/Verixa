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
                  background: '#07070a',
                  zIndex: 99999,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: "'Inter', sans-serif",
                  color: '#f5f3ef',
                  padding: '60px 24px',
                  boxSizing: 'border-box'
                }}>
                  {/* Styling Injection */}
                  <style>{`
                    @keyframes softBlink {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 1; }
                    }
                  `}</style>

                  {/* Top: Brand Identifier (Logo) with Developer Bypass */}
                  <div 
                    onClick={handleLogoClick}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 10,
                      cursor: 'pointer',
                      userSelect: 'none',
                      opacity: 0.95
                    }}
                  >
                    <div style={{
                      width: 8,
                      height: 8,
                      background: '#c9a96e',
                      transform: 'rotate(45deg)'
                    }} />
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22,
                      fontWeight: 300,
                      letterSpacing: 6,
                      textTransform: 'uppercase',
                      color: '#f5f3ef'
                    }}>VeriXa</span>
                  </div>

                  {/* Middle: Content */}
                  <div style={{
                    maxWidth: 580,
                    width: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 28,
                    marginTop: '-40px'
                  }}>
                    {/* Header */}
                    <h1 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 38,
                      fontWeight: 300,
                      lineHeight: 1.3,
                      margin: 0,
                      color: '#f5f3ef',
                      letterSpacing: 0.5
                    }}>
                      Something Powerful is Being Refined.
                    </h1>
                    
                    {/* Body */}
                    <p style={{
                      fontSize: 14,
                      color: 'rgba(245, 243, 239, 0.65)',
                      lineHeight: 1.8,
                      margin: 0,
                      fontWeight: 300,
                      maxWidth: 480
                    }}>
                      We're currently refining VeriXa before public release.
                      The platform is undergoing active calibration, testing, and forensic system stabilization.
                    </p>

                    {/* Status Indicator */}
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 10,
                      background: 'rgba(201, 169, 110, 0.04)',
                      border: '1px solid rgba(201, 169, 110, 0.08)',
                      padding: '8px 18px',
                      borderRadius: 99
                    }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#c9a96e',
                        animation: 'softBlink 2s infinite ease-in-out'
                      }} />
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: '#c9a96e'
                      }}>
                        Active system calibration in progress
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Understated Footer */}
                  <div style={{
                    fontSize: 10,
                    color: 'rgba(245, 243, 239, 0.35)',
                    letterSpacing: 1,
                    fontWeight: 300,
                    textAlign: 'center',
                    maxWidth: 320,
                    lineHeight: 1.5
                  }}>
                    Built with a focus on truth, resilience, and evidence-first intelligence.
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