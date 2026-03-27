import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const T = {
  bg: '#0a0a0f', card: 'rgba(22,22,31,0.95)', border: 'rgba(255,255,255,0.07)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.55)', accent: '#c9a96e',
  inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.1)',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/verify');
      } else {
        // Map common Firebase auth errors to readable messages
        let message = result.error;
        if (result.error.includes('auth/invalid-credential')) {
          message = 'Invalid email or password.';
        } else if (result.error.includes('auth/too-many-requests')) {
          message = 'Too many failed attempts. Please try again later.';
        }
        setErr(message);
      }
    } catch (error) {
      setErr('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        input:focus { outline: none !important; border-color: rgba(201,169,110,0.4) !important; box-shadow: 0 0 0 3px rgba(201,169,110,0.08) !important; }
      `}</style>

      {/* Logo */}
      <Link to="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 28, color: T.text, letterSpacing: 1, textDecoration: 'none', marginBottom: 32 }}>VeriXa</Link>

      <div style={{ maxWidth: 420, width: '100%', padding: '44px 40px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22, color: T.accent }}>◉</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 300, color: T.text, margin: '0 0 6px' }}>Welcome Back</h1>
          <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>Sign in to continue to VeriXa</p>
        </div>

        {err && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 10, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: T.text2, marginBottom: 7, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: '13px 16px', color: T.text, fontSize: 14, boxSizing: 'border-box', transition: 'all 0.2s' }} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, color: T.text2, marginBottom: 7, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              style={{ width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: '13px 16px', color: T.text, fontSize: 14, boxSizing: 'border-box', transition: 'all 0.2s' }} />
          </div>

          <button type="submit" disabled={isLoading}
            style={{ width: '100%', padding: '14px', borderRadius: 10, background: isLoading ? 'rgba(201,169,110,0.2)' : 'linear-gradient(135deg, #c9a96e, #a07b42)', border: 'none', color: isLoading ? '#c9a96e' : '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: 0.5, boxShadow: isLoading ? 'none' : '0 4px 16px rgba(201,169,110,0.25)' }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>
            No account?{' '}
            <Link to="/signup" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(245,243,239,0.2)' }}>
        Protected by Firebase Auth
      </p>
    </div>
  );
}