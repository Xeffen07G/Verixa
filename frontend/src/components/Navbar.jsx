import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { Menu, X, Sun, Moon, Globe, Image, TrendingUp, LogOut, User, FileText, Layout } from 'lucide-react';

export default function Navbar({ darkMode = true, onToggleTheme, children }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, changeLanguage } = useLang();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLangChange = (code) => {
    changeLanguage(code);
    setLangOpen(false);
  };

  const navLinks = React.useMemo(() => {
    const links = [
      { label: t('navFeatures', lang), href: '#features' },
      { label: t('navHowItWorks', lang), href: '#how-it-works' },
    ];
    if (user) {
      links.push({ label: t('navDashboard', lang), href: '/dashboard' });
    }
    links.push({ label: t('navPricing', lang), href: '#pricing' });
    links.push({ label: t('navTestimonials', lang), href: '#testimonials' });
    return links;
  }, [lang, user]);

  const textColor = darkMode ? '#ffffff' : '#000000';
  const textMuted = darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const bg = darkMode 
    ? ((!isLanding || scrolled) ? 'rgba(10,10,15,0.85)' : 'transparent') 
    : ((!isLanding || scrolled) ? 'rgba(255,255,255,0.85)' : 'transparent');
  const T = { accent: '#c9a96e' };

  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <>
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
        background: bg, backdropFilter: (!isLanding || scrolled) ? 'blur(24px)' : 'none',
        borderBottom: (!isLanding || scrolled) ? `1px solid ${border}` : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        height: 'var(--nav-h)',
        display: 'flex', alignItems: 'center'
      }}>
        <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left: Logo & Core Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#000', fontWeight: 900 }}>V</div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#4ade80', border: `2px solid ${darkMode ? '#0a0a0f' : '#fff'}` }} />
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: textColor, letterSpacing: -0.5 }}>VeriXa</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="hide-tablet">
              {navLinks.map((l, i) => (
                <a key={i} href={l.href} style={{ fontSize: 13, color: textMuted, textDecoration: 'none', fontWeight: 500, transition: '0.2s' }} onMouseEnter={e => e.target.style.color = textColor} onMouseLeave={e => e.target.style.color = textMuted}>{l.label}</a>
              ))}
            </div>
          </div>

          {/* Right: Tools & Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {children}
            
            {/* Tool Group (Always Visible) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Language Switcher */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setLangOpen(!langOpen)} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', padding: 8, minHeight: 44, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => e.currentTarget.style.color = textColor} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                  <Globe size={18} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{currentLang?.code.toUpperCase()}</span>
                </button>
                {langOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, background: darkMode ? '#15151a' : '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: '8px', minWidth: 180, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease', zIndex: 2001 }}>
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => handleLangChange(l.code)} style={{ width: '100%', padding: '10px 12px', background: lang === l.code ? `${T.accent}1a` : 'none', border: 'none', color: lang === l.code ? T.accent : textColor, textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500 }} onMouseEnter={e => e.target.style.background = `${T.accent}0d`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button onClick={onToggleTheme} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', padding: 8, borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.color = textColor} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* The "Three Lines" Menu Trigger (Now right of Tools) */}
              <button 
                onClick={() => { setMobileOpen(!mobileOpen); setLangOpen(false); }} 
                style={{ 
                  background: 'none', border: 'none', color: textColor, cursor: 'pointer', 
                  padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', 
                  zIndex: 2005 
                }}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu Overlay (Full Control Panel) */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: 440, height: '100%', zIndex: 1001,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        background: darkMode ? 'rgba(10,10,15,0.98)' : '#fff', backdropFilter: 'blur(32px)',
        padding: '80px 48px', display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', borderLeft: `1px solid ${border}`
      }}>
        {/* Mobile menu content */}
        
        <div style={{ fontSize: 10, letterSpacing: 4, color: T.accent, fontWeight: 900, marginBottom: 40 }}>{user ? `${t('hi', lang)}, ${user.name?.toUpperCase() || t('user', lang).toUpperCase()}` : t('identityAccess', lang).toUpperCase().replace('_', ' ')}</div>
        
        {/* Verification Tools Section */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: textMuted, fontWeight: 700, marginBottom: 20, letterSpacing: 1 }}>{t('tools', lang).toUpperCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/verify" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(201,169,110,0.1)', color: T.accent, textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.15)'}>
              <FileText size={20} />
              <span style={{ fontSize: 18, fontWeight: 700 }}>{t('textVerify', lang)}</span>
            </Link>
            <Link to="/image" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: textColor, textDecoration: 'none' }}>
              <Image size={20} />
              <span style={{ fontSize: 18, fontWeight: 700 }}>{t('imageVerify', lang)}</span>
            </Link>
            <Link to="/trending" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: textColor, textDecoration: 'none' }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: 18, fontWeight: 700 }}>{t('navTrending', lang)}</span>
            </Link>
          </div>
        </div>

        {/* Navigation & Auth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: textMuted, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{t('account', lang).toUpperCase()}</div>
          {!user ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{ padding: '14px', textAlign: 'center', borderRadius: 12, border: `1px solid ${border}`, color: textColor, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{t('signIn', lang)}</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} style={{ padding: '14px', textAlign: 'center', borderRadius: 12, background: T.accent, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{t('signUp', lang)}</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: textColor, textDecoration: 'none' }}>
                <Layout size={20} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>{t('navDashboard', lang)}</span>
              </Link>
              <Link to="/account" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: textColor, textDecoration: 'none' }}>
                <User size={20} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>{t('myAccount', lang)}</span>
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', textAlign: 'left' }}>
                <LogOut size={20} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>{t('logout', lang)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Compact Footer Links (Mobile Only) */}
        <div className="mobile-only" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {navLinks.map((l, i) => (
            <a key={i} href={l.href} onClick={() => setMobileOpen(false)} style={{ fontSize: 14, color: textMuted, textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
      </div>

      <style>{`
        :root { --nav-h: ${scrolled ? '64px' : '80px'}; }
        @media (max-width: 1024px) {
          .hide-tablet { display: none !important; }
          .mobile-only { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 1025px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}