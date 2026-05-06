import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Shield, Building, Calendar, Settings, Camera, Save, X, MapPin, Quote, TrendingUp, Award, Zap, Activity, CheckCircle2, ChevronRight, Edit3 } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

export default function AccountPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user, logout, setUser, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : true;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [editData, setEditData] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    profilePic: user?.profilePic || '',
    title: user?.title || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [orgHistory, setOrgHistory] = useState([]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (user) {
      setEditData(prev => ({
        ...prev,
        name: user.name || prev.name,
        organization: user.organization || prev.organization,
        profilePic: user.profilePic || prev.profilePic,
        title: user.title || prev.title,
        bio: user.bio || prev.bio,
        location: user.location || prev.location
      }));
    }
  }, [user]);

  const fileInputRef = useRef(null);

  const T_DARK = {
    bg: '#030305',
    surface: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.08)',
    borderHighlight: 'rgba(255,255,255,0.2)',
    text: '#ffffff',
    text2: 'rgba(255,255,255,0.7)',
    text3: 'rgba(255,255,255,0.4)',
    accent: '#e6c35c', // Brighter, more vibrant gold
    accentMuted: 'rgba(230,195,92,0.1)',
    card: 'rgba(10,10,15,0.4)',
    glass: 'rgba(15,15,20,0.5)',
    input: 'rgba(0,0,0,0.4)',
    shadow: '0 16px 40px rgba(0,0,0,0.6)',
    glow: '0 0 30px rgba(230,195,92,0.25)'
  };

  const T_LIGHT = {
    bg: '#f0f2f5',
    surface: '#ffffff',
    border: 'rgba(0,0,0,0.1)',
    borderHighlight: 'rgba(0,0,0,0.2)',
    text: '#0a0a0f',
    text2: '#4a4a55',
    text3: '#71717a',
    accent: '#b8860b',
    accentMuted: 'rgba(184,134,11,0.1)',
    card: 'rgba(255,255,255,0.7)',
    glass: 'rgba(255,255,255,0.8)',
    input: 'rgba(0,0,0,0.04)',
    shadow: '0 16px 40px rgba(0,0,0,0.08)',
    glow: '0 0 30px rgba(184,134,11,0.2)'
  };

  const T = darkMode ? T_DARK : T_LIGHT;

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('verixa_history') || '[]');
    if (history.length > 0) {
      const avg = Math.round(history.reduce((a, b) => a + (b.overallScore || 0), 0) / history.length);
      setStats({ total: history.length, avg });
    }
  }, []);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const maxSize = 300;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * maxSize; w = maxSize; }
        else { w = (w / h) * maxSize; h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        setEditData({ ...editData, profilePic: canvas.toDataURL('image/jpeg', 0.9) });
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedUser = { ...user, ...editData };

    // Optimistic local update
    if (typeof setUser === 'function') setUser(updatedUser);
    localStorage.setItem('verixa_user', JSON.stringify(updatedUser));

    // Async server update with timeout
    try {
      const API = process.env.REACT_APP_API_URL || '';
      // We don't wait indefinitely for the server; 6s is enough
      await axios.post(`${API}/api/user/profile`, 
        { email: user?.email, ...editData },
        { timeout: 6000 }
      );
    } catch (err) {
      console.warn('Profile sync delayed:', err.message);
      // We don't alert the user here because we've already updated locally
    }

    setIsSaving(false);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isAdmin = user?.role === 'head' || user?.role === 'admin' || user?.email?.includes('admin');

  useEffect(() => {
    if (isAdmin && user?.organization) {
      const API = process.env.REACT_APP_API_URL || '';
      // Fetch organization members
      axios.get(`${API}/api/organization/${encodeURIComponent(user.organization)}/members`)
        .then(res => setTeamMembers(res.data))
        .catch(console.error);
        
      // Fetch organization history to calculate stats
      axios.get(`${API}/api/organization/${encodeURIComponent(user.organization)}/history`)
        .then(res => setOrgHistory(res.data))
        .catch(console.error);
    }
  }, [isAdmin, user?.organization]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.5s ease, color 0.5s ease', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -40px) scale(1.05); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-40px, 30px) scale(0.95); } }
        @keyframes fadeUpStagger { from { opacity: 0; transform: translateY(40px) scale(0.96); filter: blur(4px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes sweepShine { 0% { left: -100%; } 100% { left: 200%; } }
        @keyframes borderSpin { 100% { transform: rotate(360deg); } }
        
        /* The magical glowing cursor spotlight */
        .cursor-spotlight {
          position: fixed; top: 0; left: 0; width: 600px; height: 600px;
          border-radius: 50%; pointer-events: none; z-index: 0;
          background: radial-gradient(circle, ${T.accent}15 0%, transparent 60%);
          transform: translate(calc(var(--mouse-x) * 1px - 300px), calc(var(--mouse-y) * 1px - 300px));
          transition: transform 0.1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-glass-card {
          position: relative;
          background: ${T.glass};
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid ${T.border};
          border-top: 1px solid ${T.borderHighlight};
          box-shadow: ${T.shadow}, inset 0 1px 0 rgba(255,255,255,0.1);
          border-radius: 28px;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .premium-glass-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          pointer-events: none; z-index: 1;
        }

        .premium-glass-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 50px rgba(0,0,0,0.8), ${T.glow};
          border-color: ${T.accent}50;
        }

        .gradient-text {
          background: linear-gradient(135deg, ${T.text} 0%, ${T.accent} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .glow-btn {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, ${T.accent}, #a07b42);
          color: #000; border: none; font-weight: 700;
          transition: all 0.3s ease; box-shadow: ${T.glow};
        }
        .glow-btn::after {
          content: ''; position: absolute; top: -50%; left: -100%; width: 50%; height: 200%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);
          transform: skewX(-20deg); animation: sweepShine 3s infinite;
        }
        .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(230,195,92,0.4); }

        .stat-box { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .stat-box:hover { transform: scale(1.03) translateY(-4px); }
        
        .animated-border-wrap {
          position: relative; padding: 4px; border-radius: 50%; overflow: hidden;
        }
        .animated-border-wrap::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent, transparent, transparent, ${T.accent});
          animation: borderSpin 4s linear infinite;
        }
        .animated-border-inner { position: relative; background: ${T.bg}; border-radius: 50%; z-index: 2; }
      `}</style>

      {/* Dynamic Cursor Spotlight */}
      <div className="cursor-spotlight" style={{ '--mouse-x': mousePos.x, '--mouse-y': mousePos.y }} />

      {/* Floating Ambient Orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '15%', width: 400, height: 400, background: `${T.accent}`, filter: 'blur(150px)', opacity: 0.08, borderRadius: '50%', animation: 'float1 15s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 500, height: 500, background: '#60a5fa', filter: 'blur(150px)', opacity: 0.05, borderRadius: '50%', animation: 'float2 20s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ flex: 1, maxWidth: 1050, width: '100%', margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        
        {saveSuccess && (
          <div style={{ position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 28px', borderRadius: 999, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(16px)', animation: 'fadeUpStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <CheckCircle2 size={18} /> {t('profileUpdated', lang)}
          </div>
        )}

        {/* The Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'start' }}>
          
          {/* Header Profile Section - Spans Full Width */}
          <div className="premium-glass-card" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, animation: 'fadeUpStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Super Premium Avatar */}
            <div className="animated-border-wrap" style={{ width: 160, height: 160 }}>
              <div className="animated-border-inner" style={{ width: '100%', height: '100%', padding: 4 }}>
                <div 
                  onClick={() => isEditing && fileInputRef.current?.click()} 
                  style={{ 
                    width: '100%', height: '100%', borderRadius: '50%', 
                    background: editData.profilePic ? `url(${editData.profilePic}) center/cover` : `linear-gradient(135deg, ${T.accent}, #8c6a2c)`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 60, fontWeight: 300, color: '#000', 
                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.3)',
                    cursor: isEditing ? 'pointer' : 'default',
                    position: 'relative', overflow: 'hidden'
                  }}>
                  {!editData.profilePic && (user?.name || 'U').charAt(0).toUpperCase()}
                  {isEditing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      <Camera size={32} style={{ marginBottom: 4 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{t('upload', lang)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

            <div style={{ textAlign: 'center', width: '100%', maxWidth: 500, position: 'relative', zIndex: 2 }}>
              {isEditing ? (
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={{ background: T.input, border: `1px solid ${T.accent}50`, color: T.text, borderRadius: 12, padding: '12px', fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, textAlign: 'center', width: '100%', marginBottom: 12, outline: 'none', boxShadow: `0 0 0 3px ${T.accent}15` }} />
              ) : (
                <h1 className="gradient-text" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 600, margin: '0 0 10px', letterSpacing: '-0.5px' }}>{editData.name || user?.name}</h1>
              )}

              {isEditing ? (
                <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder={t('expertTitle', lang)} style={{ background: T.input, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '10px', fontSize: 15, textAlign: 'center', width: '100%', fontWeight: 500, marginBottom: 16, outline: 'none' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, transparent, ${T.accent})` }} />
                  <p style={{ color: T.accent, fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{editData.title || t('expertTitle', lang)}</p>
                  <div style={{ height: 1, width: 40, background: `linear-gradient(270deg, transparent, ${T.accent})` }} />
                </div>
              )}
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, background: isAdmin ? `linear-gradient(135deg, ${T.accent}20, transparent)` : 'linear-gradient(135deg, rgba(96,165,250,0.15), transparent)', border: `1px solid ${isAdmin ? `${T.accent}50` : 'rgba(96,165,250,0.4)'}`, color: isAdmin ? T.accent : '#60a5fa', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', boxShadow: `0 8px 20px ${isAdmin ? `${T.accent}15` : 'rgba(96,165,250,0.1)'}` }}>
                <Shield size={14} fill={isAdmin ? T.accent : '#60a5fa'} />
                {user.designation || (isAdmin ? t('headOfOrg', lang) : t('verifiedEmployee', lang))}
              </div>
            </div>
          </div>

          {/* Bottom Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            
            {isAdmin && (
              <div className="premium-glass-card" style={{ padding: 40, animation: 'fadeUpStagger 0.9s cubic-bezier(0.16, 1, 0.3, 1)', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 24, fontFamily: 'serif', display: 'flex', alignItems: 'center', gap: 12, color: T.text }}><Building size={24} color={T.accent} /> {user.organization} Team</h3>
                  <div style={{ background: `${T.accent}15`, padding: '6px 12px', borderRadius: 8, fontSize: 13, color: T.accent, fontWeight: 700 }}>{teamMembers.length} Employees</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {teamMembers.map(member => {
                    const memberVerifications = orgHistory.filter(h => h.userName === member.name).length;
                    return (
                      <div key={member.email} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, transition: '0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.borderColor = `${T.accent}50`} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.accent}40, transparent)`, border: `1px solid ${T.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontWeight: 700, fontSize: 18 }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: T.text, fontWeight: 600, fontSize: 15 }}>{member.name}</div>
                          <div style={{ color: T.text2, fontSize: 13 }}>{member.email}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: T.accent, fontWeight: 800, fontSize: 16 }}>{memberVerifications}</div>
                          <div style={{ color: T.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{t('scans', lang)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Left Column: Stats & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Performance Stats */}
              <div className="premium-glass-card" style={{ padding: '36px', animation: 'fadeUpStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s', animationFillMode: 'both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={16} color={T.accent} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: T.text, textTransform: 'uppercase' }}>{t('systemImpact', lang)}</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="stat-box" style={{ padding: '24px', background: 'linear-gradient(145deg, rgba(255,255,255,0.03), transparent)', borderRadius: 20, border: `1px solid ${T.borderHighlight}`, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />
                    <TrendingUp size={24} color={T.accent} style={{ marginBottom: 16, filter: `drop-shadow(0 0 8px ${T.accent}80)` }} />
                    <div style={{ fontSize: 38, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: T.text, lineHeight: 1 }}>{stats.total}</div>
                    <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('audits', lang)}</div>
                  </div>
                  
                  <div className="stat-box" style={{ padding: '24px', background: 'linear-gradient(145deg, rgba(255,255,255,0.03), transparent)', borderRadius: 20, border: `1px solid rgba(74,222,128,0.2)`, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: `linear-gradient(90deg, #4ade80, transparent)` }} />
                    <Award size={24} color="#4ade80" style={{ marginBottom: 16, filter: `drop-shadow(0 0 8px rgba(74,222,128,0.8))` }} />
                    <div style={{ fontSize: 38, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: T.text, lineHeight: 1 }}>{stats.avg}%</div>
                    <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('accuracy', lang)}</div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="premium-glass-card" style={{ padding: '28px', animation: 'fadeUpStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s', animationFillMode: 'both' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <button onClick={handleSave} disabled={isSaving} className="glow-btn" style={{ width: '100%', padding: '18px', borderRadius: 16, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                      {isSaving ? <span style={{ animation: 'pulse 1s infinite' }}>{t('saving', lang)}...</span> : <><Save size={20} /> {t('saveProfile', lang)}</>}
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditData({ name: user?.name || '', organization: user?.organization || '', profilePic: user?.profilePic || '', title: user?.title || '', bio: user?.bio || '', location: user?.location || '' }); }} style={{ width: '100%', padding: '18px', borderRadius: 16, background: 'transparent', border: `1px solid ${T.borderHighlight}`, color: T.text, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = T.surface} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {t('cancel', lang)}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '18px', borderRadius: 16, background: `linear-gradient(135deg, ${T.surface}, transparent)`, border: `1px solid ${T.accent}60`, color: T.accent, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.background = T.accentMuted; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.glow; }} onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${T.surface}, transparent)`; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <Edit3 size={18} /> {t('editProfile', lang)}
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: Bio & Identity Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div className="premium-glass-card" style={{ padding: '36px', animation: 'fadeUpStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s', animationFillMode: 'both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Quote size={16} color={T.accent} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: T.text, textTransform: 'uppercase' }}>{t('professionalBio', lang)}</span>
                </div>
                {isEditing ? (
                  <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder={t('bioPlaceholder', lang)} style={{ width: '100%', minHeight: 140, background: T.input, border: `1px solid ${T.accent}40`, borderRadius: 16, padding: '20px', color: T.text, fontSize: 15, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.8, boxShadow: `inset 0 2px 10px rgba(0,0,0,0.2)` }} />
                ) : (
                  <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.8, margin: 0, fontStyle: editData.bio ? 'normal' : 'italic', fontWeight: 400 }}>
                    {editData.bio || t('noBio', lang)}
                  </p>
                )}
              </div>

              <div className="premium-glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeUpStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s', animationFillMode: 'both' }}>
                {[
                  { icon: Mail, label: t('emailLabel', lang), value: user?.email, locked: true },
                  { icon: Building, label: t('orgLabel', lang), value: editData.organization, key: 'organization' },
                  { icon: MapPin, label: t('officeLabel', lang), value: editData.location, key: 'location' },
                  { icon: Zap, label: t('accessTier', lang), value: isAdmin ? t('enterpriseTier', lang) : t('standardNode', lang), locked: true }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i !== 3 ? 28 : 0, borderBottom: i !== 3 ? `1px solid ${T.borderHighlight}` : 'none', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, width: '100%' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${T.surface}, transparent)`, border: `1px solid ${T.borderHighlight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, flexShrink: 0, boxShadow: `0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)` }}>
                        <item.icon size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: T.text3, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                        {isEditing && !item.locked ? (
                          <input value={editData[item.key]} onChange={e => setEditData({ ...editData, [item.key]: e.target.value })} style={{ background: T.input, border: `1px solid ${T.borderHighlight}`, color: T.text, borderRadius: 8, padding: '10px 14px', fontSize: 16, width: '100%', maxWidth: '100%', outline: 'none', transition: '0.3s' }} onFocus={e => e.target.style.borderColor = T.accent} onBlur={e => e.target.style.borderColor = T.borderHighlight} />
                        ) : (
                          <div style={{ fontSize: 16, color: T.text, fontWeight: 500 }}>{item.value || <span style={{ color: T.text3, fontStyle: 'italic' }}>{t('notSet', lang)}</span>}</div>
                        )}
                      </div>
                    </div>
                    {item.locked && (
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 9, padding: '6px 12px', borderRadius: 8, background: `linear-gradient(135deg, ${T.surface}, transparent)`, border: `1px solid ${T.border}`, color: T.text3, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                        {t('secureLabel', lang)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
}
