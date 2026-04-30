import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Building, Mail, Lock } from 'lucide-react';

const T = {
  bg: '#0a0a0f', card: 'rgba(22,22,31,0.95)', border: 'rgba(255,255,255,0.07)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.55)', accent: '#c9a96e',
  inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.1)',
};

export default function SignupPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, name, organization);
      if (result.success) {
        navigate('/verify');
      } else {
        setErr(result.error || 'Signup failed');
      }
    } catch (error) {
      setErr('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 12, padding: '12px 16px 12px 44px', color: T.text, fontSize: 14,
    boxSizing: 'border-box', transition: 'all 0.2s', outline: 'none'
  };

  const iconStyle = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: T.text2 };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        .form-input:focus { border-color: ${T.accent}66 !important; background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <Link to="/" style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 28, color: T.text, letterSpacing: 1, textDecoration: 'none', marginBottom: 32 }}>VeriXa</Link>

      <div style={{ maxWidth: 460, width: '100%', padding: '48px 40px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'fadeUp 0.5s ease' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'serif', fontSize: 34, fontWeight: 300, color: T.text, margin: '0 0 8px' }}>Join the Network.</h1>
          <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>Establish your enterprise identity for shared integrity.</p>
        </div>

        {err && (
          <div style={{ padding: '12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', borderRadius: 12, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <User size={16} style={iconStyle} />
              <input required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="form-input" style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Building size={16} style={iconStyle} />
              <input required placeholder="Organization" value={organization} onChange={e => setOrganization(e.target.value)} className="form-input" style={inputStyle} />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={16} style={iconStyle} />
            <input type="email" required placeholder="Work Email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" style={inputStyle} />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={iconStyle} />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" style={inputStyle} />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={iconStyle} />
            <input type="password" required placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} className="form-input" style={inputStyle} />
          </div>

          <button type="submit" disabled={isLoading}
            style={{ width: '100%', padding: '14px', marginTop: 12, borderRadius: 12, background: isLoading ? 'rgba(201,169,110,0.2)' : T.accent, border: 'none', color: '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {isLoading ? 'Establishing Identity...' : 'Join VeriXa'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>
            Already registered? <Link to="/login" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}