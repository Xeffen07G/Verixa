import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DARK = {
  bg: '#0a0a0f',
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.06)',
  text: '#f5f3ef',
  text2: 'rgba(245, 243, 239, 0.7)',
  accent: '#c9a96e',
  error: '#f87171'
};

const LIGHT = {
  bg: '#fcfbf9',
  card: '#ffffff',
  border: '#e5e1d8',
  text: '#1a1a1a',
  text2: '#555555',
  accent: '#a68a56',
  error: '#dc2626'
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });

  const T = darkMode ? DARK : LIGHT;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (password !== confirmPassword) {
      return setErr('Passwords do not match');
    }

    setIsLoading(true);
    const result = await register(email, password);
    if (result.success) {
      navigate('/verify');
    } else {
      setErr(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
      <Navbar darkMode={darkMode} onToggleTheme={() => {
        const newVal = !darkMode;
        setDarkMode(newVal);
        localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
      }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ 
          maxWidth: 400, width: '100%', padding: '48px 40px', 
          background: T.card, border: `1px solid ${T.border}`, 
          borderRadius: 24, backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
          animation: 'fadeUp 0.6s ease-out'
        }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: T.text, margin: '0 0 8px', textAlign: 'center' }}>Create Account</h1>
          <p style={{ fontSize: 14, color: T.text2, textAlign: 'center', marginBottom: 32 }}>Join the platform of truth</p>

          {err && <div style={{ padding: '12px', background: `${T.error}15`, border: `1px solid ${T.error}33`, color: T.error, borderRadius: 12, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>{err}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: T.text2, marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>EMAIL ADDRESS</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', color: T.text, fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: T.text2, marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>PASSWORD</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', color: T.text, fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 12, color: T.text2, marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>CONFIRM PASSWORD</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', color: T.text, fontSize: 14, outline: 'none' }} />
            </div>

            <button type="submit" disabled={isLoading} style={{ 
              width: '100%', padding: '16px', borderRadius: 12, background: T.accent, 
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, 
              cursor: 'pointer', transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
            }}>
              {isLoading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.text2 }}>
            Already have an account? <Link to="/login" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
