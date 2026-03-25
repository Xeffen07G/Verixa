import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ darkMode = true, onToggleTheme, children }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isVerify = location.pathname === '/verify';
  const isImage = location.pathname === '/image';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  const textColor = darkMode ? '#f5f3ef' : '#111111';
  const textMuted = darkMode ? 'rgba(245,243,239,0.55)' : 'rgba(30,30,30,0.6)';
  const bgScrolled = darkMode ? 'rgba(10,10,15,0.92)' : 'rgba(245,244,240,0.96)';
  const borderScrolled = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
  const mobileBg = darkMode ? 'rgba(10,10,15,0.98)' : 'rgba(245,244,240,0.98)';
  const T = {
    text: textColor,
    text2: textMuted,
    border: borderScrolled,
    accent: '#c9a96e'
  };

  return (
    <>
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, 
        padding: (scrolled || !isLanding) ? '14px 0' : '22px 0', 
        background: (scrolled || !isLanding) ? bgScrolled : 'transparent', 
        backdropFilter: (scrolled || !isLanding) ? 'blur(20px)' : 'none', 
        borderBottom: (scrolled || !isLanding) ? `1px solid ${borderScrolled}` : '1px solid transparent', 
        transition: 'all 0.3s ease' 
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.05))', border: '1px solid rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#c9a96e', fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>V</div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 22, color: textColor, letterSpacing: 1 }}>VeriXa</span>
          </Link>

          {isLanding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="nav-links-desktop">
              {navLinks.map(l => (
                <a key={l.label} href={l.href} style={{ fontSize: 13, color: textMuted, fontWeight: 400, letterSpacing: 0.5, transition: 'color 0.2s', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}
                  onMouseEnter={e => e.target.style.color = '#c9a96e'}
                  onMouseLeave={e => e.target.style.color = textMuted}
                >{l.label}</a>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="nav-cta-desktop">
            {/* Custom Buttons from Page */}
            {children}

            {/* Verification Buttons */}
            {!isImage && (
              <Link to="/image" style={{ 
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, 
                border: '1px solid rgba(201,169,110,0.3)', background: 'transparent', color: '#c9a96e', 
                letterSpacing: 0.3, transition: 'all 0.3s', textDecoration: 'none', 
                display: 'inline-block', opacity: (isLanding && !scrolled) ? 0.7 : 1,
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >Image Verify</Link>
            )}

            {!isVerify && (
              <Link to="/verify" style={{ 
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, 
                background: (!isLanding || scrolled) ? 'linear-gradient(135deg, #c9a96e, #a07b42)' : 'transparent', 
                border: (!isLanding || scrolled) ? 'none' : '1px solid rgba(201,169,110,0.3)', 
                color: (!isLanding || scrolled) ? '#0a0a0f' : '#c9a96e', 
                letterSpacing: 0.3, transition: 'all 0.3s', textDecoration: 'none', display: 'inline-block'
              }}
                onMouseEnter={e => {
                  if (!isLanding || scrolled) e.currentTarget.style.opacity = '0.88';
                  else e.currentTarget.style.background = 'rgba(201,169,110,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isLanding || scrolled) e.currentTarget.style.opacity = '1';
                  else e.currentTarget.style.background = 'transparent';
                }}
              >Start Verifying</Link>
            )}

            <div style={{ width: 1, height: 20, background: T.border, margin: '0 8px' }} />

            {/* Auth Buttons */}
            {user ? (
              <button onClick={logout} style={{ 
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, 
                background: 'transparent', border: `1px solid ${T.border}`, color: T.text,
                cursor: 'pointer', transition: 'all 0.2s'
              }}>Logout</button>
            ) : (
              <Link to="/login" style={{ 
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, 
                background: 'transparent', border: `1px solid ${T.border}`, color: T.text,
                textDecoration: 'none', transition: 'all 0.2s'
              }}>Sign In</Link>
            )}

            {/* Theme Toggle */}
            <button onClick={onToggleTheme} style={{
                background: 'transparent', border: scrolled ? `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : '1px solid rgba(201,169,110,0.3)',
                color: '#c9a96e', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, marginLeft: 4, transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <button className="hamburger-btn" onClick={() => setMobileOpen(true)}
            style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
            <span style={{ width: 22, height: 1.5, background: textColor, borderRadius: 2, display: 'block' }} />
            <span style={{ width: 22, height: 1.5, background: textColor, borderRadius: 2, display: 'block' }} />
            <span style={{ width: 22, height: 1.5, background: textColor, borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: mobileBg, backdropFilter: 'blur(20px)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, animation: 'fadeIn 0.2s ease' }}>
          <button style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: textColor, fontSize: 24, cursor: 'pointer' }} onClick={() => setMobileOpen(false)}>✕</button>
          {isLanding && navLinks.map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 36, color: textColor, letterSpacing: 2, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>{l.label}</a>
          ))}
          <button onClick={() => { onToggleTheme(); setMobileOpen(false); }} style={{ background: 'none', border: 'none', color: '#c9a96e', fontSize: 32, cursor: 'pointer', fontFamily: 'Cormorant Garamond, serif' }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <Link to="/image" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 24, color: '#c9a96e', letterSpacing: 2, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>Image Verify</Link>
          <Link to="/verify" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 36, color: '#c9a96e', letterSpacing: 2, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>Start Verifying</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-cta-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}