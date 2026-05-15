import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Building, Mail, Lock } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

const T = {
  bg: '#0a0a0f', card: 'rgba(22,22,31,0.95)', border: 'rgba(255,255,255,0.07)',
  text: '#f5f3ef', text2: 'rgba(245,243,239,0.55)', accent: '#c9a96e',
  inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.1)',
};

export default function SignupPage() {
  const { lang } = useLang();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('employee');
  const [designation, setDesignation] = useState('Individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const T = {
    bg: '#0a0a0f',
    bg2: '#111118',
    border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)',
    text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    
    if (password !== confirm) {
      setErr(t('passwordsDoNotMatch', lang));
      return;
    }
    
    if (password.length < 6) {
      setErr(t('passwordMinLength', lang));
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, name, organization, role, designation);
      if (result.success) {
        navigate('/verify');
      } else {
        setErr(result.error || t('signupFailed', lang));
      }
    } catch (error) {
      setErr(t('unexpectedErrorTryAgain', lang));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', 
    background: 'rgba(255,255,255,0.01)', 
    border: `1px solid ${T.border}`,
    borderRadius: 12, 
    padding: '16px 20px', 
    color: T.text, 
    fontSize: 16,
    boxSizing: 'border-box', 
    transition: 'all 0.2s', 
    outline: 'none',
    fontFamily: 'inherit',
    fontWeight: 300
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: T.text }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        .form-input:focus { border-color: ${T.accent}66 !important; }
      `}</style>

      <Link to="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 32, color: T.text, letterSpacing: -0.5, textDecoration: 'none', marginBottom: 64 }}>VeriXa</Link>

      <div style={{ maxWidth: 480, width: '100%', animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: T.text, margin: '0 0 16px' }}>Join the network</h1>
          <p style={{ fontSize: 16, color: T.text2, margin: 0, fontWeight: 300 }}>{t('establishIdentity', lang)}</p>
        </div>

        {err && (
          <div style={{ padding: '16px', background: 'rgba(248,113,113,0.05)', border: `1px solid rgba(248,113,113,0.1)`, color: '#f87171', borderRadius: 8, fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input required placeholder={t('fullName', lang)} value={name} onChange={e => setName(e.target.value)} className="form-input" style={inputStyle} />
            <input required placeholder={t('organization', lang)} value={organization} onChange={e => setOrganization(e.target.value)} className="form-input" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, color: T.text3, fontWeight: 900, letterSpacing: 1 }}>PROFESSIONAL SECTOR</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['Head', 'Leader', 'Expert', 'Analyst', 'Public', 'Researcher', 'Student', 'Other'].map((d) => (
                <button 
                  key={d}
                  type="button" 
                  onClick={() => setDesignation(d)}
                  style={{ 
                    padding: '10px 4px', borderRadius: 8, background: designation === d ? `${T.accent}1a` : 'transparent', 
                    border: `1px solid ${designation === d ? T.accent : T.border}`, 
                    color: designation === d ? T.accent : T.text2, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: '0.2s', letterSpacing: 0.5
                  }}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <input type="email" required placeholder={t('workEmail', lang)} value={email} onChange={e => setEmail(e.target.value)} className="form-input" style={inputStyle} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input type="password" required placeholder={t('password', lang)} value={password} onChange={e => setPassword(e.target.value)} className="form-input" style={inputStyle} />
            <input type="password" required placeholder={t('confirmPassword', lang)} value={confirm} onChange={e => setConfirm(e.target.value)} className="form-input" style={inputStyle} />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              marginTop: 16, 
              borderRadius: 12, 
              background: T.accent, 
              border: 'none', 
              color: '#0a0a0f', 
              fontSize: 14, 
              fontWeight: 800, 
              letterSpacing: 1,
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              transition: '0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'ESTABLISHING IDENTITY...' : 'JOIN VERIXA'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ fontSize: 14, color: T.text2, margin: 0, fontWeight: 300 }}>
            {t('alreadyRegistered', lang)} <Link to="/login" style={{ color: T.accent, textDecoration: 'none', fontWeight: 700 }}>{t('signIn', lang)}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}