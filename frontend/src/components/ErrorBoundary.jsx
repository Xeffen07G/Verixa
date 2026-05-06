import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("VeriXa Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const darkMode = localStorage.getItem('verixa-theme') !== 'light';
      const T = darkMode ? {
        bg: '#0a0a0f',
        text: '#f5f3ef',
        text2: 'rgba(245,243,239,0.5)',
        accent: '#c9a96e',
        card: '#13131a',
        border: 'rgba(255,255,255,0.1)',
        text3: 'rgba(245,243,239,0.25)'
      } : {
        bg: '#f8f7f4',
        text: '#0d0d0d',
        text2: '#555555',
        accent: '#5a421a',
        card: '#ffffff',
        border: 'rgba(0,0,0,0.1)',
        text3: 'rgba(0,0,0,0.4)'
      };

      return (
        <div style={{ 
          minHeight: '100vh', 
          background: T.bg, 
          color: T.text, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px 24px',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <div style={{ 
            maxWidth: 500, 
            width: '100%', 
            background: T.card, 
            border: `1px solid ${T.border}`, 
            borderRadius: 24, 
            padding: 48, 
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', 
              color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <ShieldAlert size={32} />
            </div>
            
            <h1 style={{ 
              fontFamily: 'Cormorant Garamond, serif', 
              fontSize: 32, fontWeight: 300, 
              margin: '0 0 16px' 
            }}>
              System <span style={{ color: T.accent }}>Interruption</span>
            </h1>
            
            <p style={{ color: T.text2, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
              VeriXa encountered an unexpected state while processing your request. 
              This is usually caused by temporary memory pressure or invalid input formatting.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => window.location.reload()}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: 12, 
                  background: T.accent, color: darkMode ? '#000' : '#fff', 
                  border: 'none', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <RefreshCw size={18} /> Restart Session
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: 12, 
                  background: 'transparent', border: `1px solid ${T.border}`, 
                  color: T.text2, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <Home size={18} /> Return to Home
              </button>
            </div>
            
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.text3, opacity: 0.5 }}>
              ERROR_CODE: {this.state.error?.name || 'UNKNOWN_FAILURE'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
