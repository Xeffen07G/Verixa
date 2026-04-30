import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Calendar, Settings, LogOut, Camera } from 'lucide-react';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');

  const T = darkMode ? {
    bg: '#0a0a0f', surface: '#13131a', border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef', text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
    card: 'rgba(20,20,30,0.6)'
  } : {
    bg: '#e8e5de', surface: '#f5f3ed', border: 'rgba(0,0,0,0.12)',
    text: '#0d0d0d', text2: '#2a2a2a', text3: '#555555',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
    card: '#f0ede6'
  };

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s', display: 'flex', flexDirection: 'column' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '60px auto', padding: '0 24px', animation: 'fadeUp 0.6s ease' }}>
        
        {/* Profile Header Card */}
        <div style={{ 
          padding: '48px', borderRadius: 24, 
          background: T.card, border: `1px solid ${T.border}`,
          backdropFilter: 'blur(12px)',
          textAlign: 'center', marginBottom: 32,
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Background Glow */}
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: `${T.accent}0a`, borderRadius: '50%', filter: 'blur(60px)' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 24px' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 300, color: '#0a0a0f', border: `4px solid ${T.border}`, boxShadow: `0 12px 32px ${T.accent}33` }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <button style={{ position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.accent }}>
                <Camera size={16} />
              </button>
            </div>

            <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 300, color: T.text, margin: '0 0 8px' }}>{user?.name}</h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: isAdmin ? `${T.accent}1a` : 'rgba(96,165,250,0.1)', border: `1px solid ${isAdmin ? `${T.accent}4d` : 'rgba(96,165,250,0.3)'}`, color: isAdmin ? T.accent : '#60a5fa', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              <Shield size={12} /> {isAdmin ? 'Head of Organization' : 'Verified Employee'}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {[
            { icon: Mail, label: 'Email Address', value: user?.email },
            { icon: Building, label: 'Organization', value: user?.organization },
            { icon: Shield, label: 'Access Role', value: isAdmin ? 'Administrator' : 'Standard User' },
            { icon: Calendar, label: 'Member Since', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 24px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.text3, marginBottom: 8 }}>
                <item.icon size={14} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 15, color: T.text, fontWeight: 500 }}>{item.value || 'Not provided'}</div>
            </div>
          ))}
        </div>

        {/* Actions Card */}
        <div style={{ padding: '32px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button style={{ width: '100%', padding: '14px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <Settings size={18} color={T.accent} /> Edit Profile Settings
          </button>
          <button onClick={logout} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}>
            <LogOut size={18} /> Sign Out of VeriXa
          </button>
        </div>

      </main>

      <Footer darkMode={darkMode} />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
