import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Mail, Shield, Building, Calendar, Settings, Camera, Save, X, MapPin, Quote, TrendingUp, Award, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';

export default function AccountPage() {
  const { lang } = useLang();
  const { user, logout, setUser } = useAuth();
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
    bg: '#050508',
    surface: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.06)',
    borderHighlight: 'rgba(255,255,255,0.15)',
    text: '#ffffff',
    text2: 'rgba(255,255,255,0.65)',
    text3: 'rgba(255,255,255,0.4)',
    accent: '#d4af37',
    accentMuted: 'rgba(212,175,55,0.1)',
    card: 'rgba(15,15,22,0.6)',
    glass: 'rgba(20,20,30,0.4)',
    input: 'rgba(0,0,0,0.3)',
    shadow: '0 8px 32px rgba(0,0,0,0.5)',
    glow: '0 0 20px rgba(212,175,55,0.15)'
  };

  const T_LIGHT = {
    bg: '#f8f9fa',
    surface: '#ffffff',
    border: 'rgba(0,0,0,0.08)',
    borderHighlight: 'rgba(0,0,0,0.15)',
    text: '#0d0d12',
    text2: '#4a4a55',
    text3: '#71717a',
    accent: '#a67c00',
    accentMuted: 'rgba(166,124,0,0.1)',
    card: 'rgba(255,255,255,0.8)',
    glass: 'rgba(255,255,255,0.6)',
    input: 'rgba(0,0,0,0.03)',
    shadow: '0 8px 32px rgba(0,0,0,0.05)',
    glow: '0 0 20px rgba(166,124,0,0.15)'
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

    if (typeof setUser === 'function') setUser(updatedUser);
    localStorage.setItem('verixa_user', JSON.stringify(updatedUser));

    try {
      const API = process.env.REACT_APP_API_URL || '';
      await axios.post(`${API}/api/user/profile`, { email: user?.email, ...editData });
    } catch (err) {}

    setIsSaving(false);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.4s ease, color 0.4s ease', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        @keyframes fadeUpStagger { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 ${T.accent}40; } 70% { box-shadow: 0 0 0 15px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        
        .glass-panel {
          background: ${T.glass};
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid ${T.border};
          border-top: 1px solid ${T.borderHighlight};
          box-shadow: ${T.shadow};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-panel:hover {
          transform: translateY(-4px);
          border: 1px solid ${T.accent}40;
          box-shadow: ${T.glow}, ${T.shadow};
        }
        
        .animated-gradient-text {
          background: linear-gradient(135deg, ${T.text} 0%, ${T.accent} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-card { transition: all 0.3s; }
        .stat-card:hover { transform: scale(1.02) translateY(-2px); }
        
        .premium-input {
          background: ${T.input};
          border: 1px solid ${T.border};
          color: ${T.text};
          transition: all 0.3s ease;
        }
        .premium-input:focus {
          border-color: ${T.accent};
          box-shadow: 0 0 0 3px ${T.accent}20;
          outline: none;
          background: ${T.surface};
        }
        
        /* Subtle background grid */
        .bg-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(to right, ${T.border} 1px, transparent 1px), linear-gradient(to bottom, ${T.border} 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at center, black, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black, transparent 80%);
          opacity: 0.3;
        }
      `}</style>

      <div className="bg-grid" />
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: '100px 24px 60px', position: 'relative', zIndex: 1 }}>
        
        {/* Success Toast */}
        {saveSuccess && (
          <div style={{ position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '12px 24px', borderRadius: 999, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', animation: 'fadeUpStagger 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <CheckCircle2 size={18} /> {t('profileUpdated', lang)}
          </div>
        )}

        {/* Profile Banner */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260, background: `radial-gradient(ellipse at top, ${T.accent}20 0%, transparent 70%)`, opacity: 0.6, pointerEvents: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'start' }}>
          
          {/* Header Section */}
          <div className="glass-panel" style={{ borderRadius: 32, padding: '40px', position: 'relative', overflow: 'hidden', animation: 'fadeUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1)', animationFillMode: 'both' }}>
            
            {/* Background elements for card */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: `radial-gradient(circle, ${T.accent}15 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              
              {/* Avatar Container */}
              <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 10 }}>
                <div 
                  onClick={() => isEditing && fileInputRef.current?.click()} 
                  style={{ 
                    width: '100%', height: '100%', borderRadius: '50%', 
                    background: editData.profilePic ? `url(${editData.profilePic}) center/cover` : `linear-gradient(135deg, ${T.accent}, #a07b42)`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 56, fontWeight: 300, color: '#000', 
                    border: `4px solid ${T.card}`, 
                    boxShadow: `0 12px 30px rgba(0,0,0,0.3), ${isEditing ? T.glow : 'none'}`,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                    cursor: isEditing ? 'pointer' : 'default',
                    overflow: 'hidden',
                    animation: isEditing ? 'pulseGlow 2s infinite' : 'none'
                  }}>
                  {!editData.profilePic && (user?.name || 'U').charAt(0).toUpperCase()}
                  {isEditing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                      <Camera size={32} />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                
                {/* Admin/Verified Badge Float */}
                <div style={{ position: 'absolute', bottom: 5, right: 5, width: 32, height: 32, borderRadius: '50%', background: isAdmin ? T.accent : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${T.card}`, color: '#000', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} title={isAdmin ? t('headOfOrg', lang) : t('verifiedEmployee', lang)}>
                  <Shield size={16} fill="currentColor" />
                </div>
              </div>

              {/* Name & Title */}
              <div style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                {isEditing ? (
                  <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="premium-input" style={{ borderRadius: 12, padding: '10px', fontSize: 28, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, textAlign: 'center', width: '100%', marginBottom: 8 }} />
                ) : (
                  <h1 className="animated-gradient-text" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.5px' }}>{editData.name || user?.name}</h1>
                )}

                {isEditing ? (
                  <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder={t('expertTitle', lang)} className="premium-input" style={{ borderRadius: 8, padding: '8px', fontSize: 14, textAlign: 'center', width: '100%', fontWeight: 500 }} />
                ) : (
                  <p style={{ color: T.accent, fontSize: 15, fontWeight: 600, margin: '0 0 20px', letterSpacing: '1px', textTransform: 'uppercase' }}>{editData.title || t('expertTitle', lang)}</p>
                )}
                
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: isAdmin ? `${T.accent}15` : 'rgba(96,165,250,0.1)', border: `1px solid ${isAdmin ? `${T.accent}40` : 'rgba(96,165,250,0.3)'}`, color: isAdmin ? T.accent : '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
                  <Shield size={12} />
                  {isAdmin ? t('headOfOrg', lang) : t('verifiedEmployee', lang)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* Stats Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div className="glass-panel" style={{ borderRadius: 24, padding: '32px', animation: 'fadeUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s', animationFillMode: 'both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <Activity size={18} color={T.accent} />
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: T.text3, textTransform: 'uppercase' }}>Performance</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="stat-card" style={{ padding: '24px', background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, ${T.accent}, transparent)` }} />
                    <TrendingUp size={24} color={T.accent} style={{ marginBottom: 12, opacity: 0.8 }} />
                    <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: T.text, lineHeight: 1 }}>{stats.total}</div>
                    <div style={{ fontSize: 11, color: T.text2, fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{t('audits', lang)}</div>
                  </div>
                  
                  <div className="stat-card" style={{ padding: '24px', background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: `linear-gradient(90deg, #4ade80, transparent)` }} />
                    <Award size={24} color="#4ade80" style={{ marginBottom: 12, opacity: 0.8 }} />
                    <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: T.text, lineHeight: 1 }}>{stats.avg}%</div>
                    <div style={{ fontSize: 11, color: T.text2, fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{t('accuracy', lang)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="glass-panel" style={{ borderRadius: 24, padding: '24px', animation: 'fadeUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s', animationFillMode: 'both' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={handleSave} disabled={isSaving} style={{ width: '100%', padding: '16px', borderRadius: 16, background: `linear-gradient(135deg, ${T.accent}, #a07b42)`, border: 'none', color: '#000', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.3s', boxShadow: T.glow }}>
                      {isSaving ? <div style={{ animation: 'pulse 1s infinite' }}>{t('saving', lang)}</div> : <><Save size={18} /> {t('saveProfile', lang)}</>}
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditData({ name: user?.name || '', organization: user?.organization || '', profilePic: user?.profilePic || '', title: user?.title || '', bio: user?.bio || '', location: user?.location || '' }); }} style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'transparent', border: `1px solid ${T.borderHighlight}`, color: T.text, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = T.surface} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {t('cancel', lang)}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '16px', borderRadius: 16, background: T.surface, border: `1px solid ${T.accent}60`, color: T.accent, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = T.accentMuted; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.glow; }} onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <Settings size={18} /> {t('editProfile', lang)}
                  </button>
                )}
              </div>

            </div>

            {/* Details Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div className="glass-panel" style={{ borderRadius: 24, padding: '32px', animation: 'fadeUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s', animationFillMode: 'both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.text3, marginBottom: 20 }}>
                  <Quote size={18} color={T.accent} />
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>{t('professionalBio', lang)}</span>
                </div>
                {isEditing ? (
                  <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder={t('bioPlaceholder', lang)} className="premium-input" style={{ width: '100%', minHeight: 120, borderRadius: 16, padding: '16px', fontSize: 15, resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
                ) : (
                  <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.8, margin: 0, fontStyle: editData.bio ? 'normal' : 'italic', fontWeight: 400 }}>
                    {editData.bio || t('noBio', lang)}
                  </p>
                )}
              </div>

              <div className="glass-panel" style={{ borderRadius: 24, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s', animationFillMode: 'both' }}>
                {[
                  { icon: Mail, label: t('emailLabel', lang), value: user?.email, locked: true },
                  { icon: Building, label: t('orgLabel', lang), value: editData.organization, key: 'organization' },
                  { icon: MapPin, label: t('officeLabel', lang), value: editData.location, key: 'location' },
                  { icon: Zap, label: t('accessTier', lang), value: isAdmin ? t('enterpriseTier', lang) : t('standardNode', lang), locked: true }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i !== 3 ? 24 : 0, borderBottom: i !== 3 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: T.surface, border: `1px solid ${T.borderHighlight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, flexShrink: 0, boxShadow: `0 4px 12px rgba(0,0,0,0.1)` }}>
                        <item.icon size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                        {isEditing && !item.locked ? (
                          <input value={editData[item.key]} onChange={e => setEditData({ ...editData, [item.key]: e.target.value })} className="premium-input" style={{ borderRadius: 8, padding: '8px 12px', fontSize: 15, width: '100%', maxWidth: '300px' }} />
                        ) : (
                          <div style={{ fontSize: 15, color: T.text, fontWeight: 500 }}>{item.value || <span style={{ color: T.text3, fontStyle: 'italic' }}>{t('notSet', lang)}</span>}</div>
                        )}
                      </div>
                    </div>
                    {item.locked && (
                      <div style={{ fontSize: 9, padding: '4px 10px', borderRadius: 6, background: T.surface, border: `1px solid ${T.border}`, color: T.text3, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>
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
