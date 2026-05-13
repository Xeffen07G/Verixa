import { Link } from 'react-router-dom';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

export default function Footer({ darkMode = true }) {
  const { lang } = useLang();
  const T = darkMode ? {
    bg: '#0a0a0f',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.05)',
    text: '#ffffff',
    text2: 'rgba(255,255,255,0.5)',
    text3: 'rgba(255,255,255,0.2)',
    linkHover: '#c9a96e',
  } : {
    bg: '#fdfcf9',
    border: 'rgba(212, 140, 112, 0.1)',
    border2: 'rgba(212, 140, 112, 0.05)',
    text: '#201a18',
    text2: '#53433e',
    text3: '#85736d',
    linkHover: '#d48c70',
  };

  return (
    <footer style={{ 
      background: T.bg, 
      borderTop: `1px solid ${T.border}`, 
      padding: '80px 24px 32px',
      marginTop: 'auto',
      position: 'relative'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 48 }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
               <div style={{ width: 24, height: 24, borderRadius: 6, background: darkMode ? '#c9a96e' : '#5a421a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: darkMode ? '#000' : '#fff', fontWeight: 900 }}>V</div>
               <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: 1 }}>VeriXa</span>
            </div>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, maxWidth: 280, fontWeight: 300 }}>
              {t('landingHeroSubtitle', lang)}
            </p>
          </div>

          {/* Product */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.text2, marginBottom: 16, fontWeight: 500 }}>{t('product', lang)}</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a href="#features" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('navFeatures', lang)}</a></li>
              <li><a href="#how-it-works" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('navHowItWorks', lang)}</a></li>
              <li><a href="#pricing" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('navPricing', lang)}</a></li>
              <li><Link to="/verify" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('text', lang)} {t('verifyNow', lang)}</Link></li>
              <li><Link to="/image" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('imageVerify', lang)}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.text2, marginBottom: 16, fontWeight: 500 }}>{t('company', lang)}</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a href="#testimonials" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('navTestimonials', lang)}</a></li>
              <li><a href="#features" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('about', lang)}</a></li>
              <li><a href="mailto:hello@verixa.ai" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('contactUs', lang)}</a></li>
              <li><a href="#" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>{t('blog', lang)}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ paddingTop: 24, borderTop: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>2025 VeriXa. {t('rights', lang)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 10, color: T.text3, letterSpacing: 0.5, opacity: 0.8 }}>Build: {window.__VERIXA_BUILD__ || 'local'}</span>
            <span style={{ fontSize: 10, color: '#c9a96e', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', padding: '4px 12px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase' }}>{t('landingBeta', lang)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}