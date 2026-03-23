import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ darkMode = true }) {
  const T = darkMode ? {
    bg: '#0a0a0f',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.05)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.45)',
    text3: 'rgba(245,243,239,0.2)',
    linkHover: '#c9a96e',
  } : {
    bg: '#1a1a1a',
    border: 'rgba(255,255,255,0.08)',
    border2: 'rgba(255,255,255,0.06)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.5)',
    text3: 'rgba(245,243,239,0.25)',
    linkHover: '#c9a96e',
  };

  return (
    <footer style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '60px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 48 }} className="footer-grid">

          {/* Brand */}
          <div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 22, color: T.text, letterSpacing: 1, display: 'block', marginBottom: 12 }}>VeriXa</span>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, maxWidth: 280, fontWeight: 300 }}>
              The world's most precise AI-powered fact verification engine. Built for journalists, researchers, and enterprises who demand truth.
            </p>
          </div>

          {/* Product */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.text2, marginBottom: 16, fontWeight: 500 }}>Product</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a href="#features" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Features</a></li>
              <li><a href="#how-it-works" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>How It Works</a></li>
              <li><a href="#pricing" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Pricing</a></li>
              <li><Link to="/verify" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Text Verify</Link></li>
              <li><Link to="/image" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Image Verify</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.text2, marginBottom: 16, fontWeight: 500 }}>Company</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a href="#testimonials" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Testimonials</a></li>
              <li><a href="#features" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>About</a></li>
              <li><a href="mailto:hello@verixa.ai" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Contact</a></li>
              <li><a href="#" style={{ fontSize: 13, color: T.text2, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = T.linkHover} onMouseLeave={e => e.target.style.color = T.text2}>Blog</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ paddingTop: 24, borderTop: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>2025 VeriXa. All rights reserved.</span>
          <span style={{ fontSize: 10, color: '#c9a96e', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', padding: '4px 12px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase' }}>Public Beta</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}