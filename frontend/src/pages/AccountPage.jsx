import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Shield, Building, Calendar, Settings, LogOut, Camera, Save, X, Briefcase, MapPin, Quote, TrendingUp, Award, Zap } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function AccountPage() {
  const { user, logout, setUser } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, avg: 0 });
  const [editData, setEditData] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    profilePic: user?.profilePic || '',
    title: user?.title || 'Analysis Expert',
    bio: user?.bio || '',
    location: user?.location || 'Global Network'
  });
  const fileInputRef = useRef(null);

  const T = darkMode ? {
    bg: '#0a0a0f', surface: '#13131a', border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef', text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
    card: 'rgba(20,20,30,0.6)', input: 'rgba(255,255,255,0.05)'
  } : {
    bg: '#e8e5de', surface: '#f5f3ed', border: 'rgba(0,0,0,0.12)',
    text: '#0d0d0d', text2: '#2a2a2a', text3: '#555555',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
    card: '#f0ede6', input: 'rgba(0,0,0,0.05)'
  };

  useEffect(() => {
    // Load stats from local history for now
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
      const reader = new FileReader();
      reader.onloadend = () => setEditData({ ...editData, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Use pure relative path for absolute compatibility in Vercel monorepo
      const res = await axios.put('/api/user/profile', {
        userId: user?._id || user?.id,
        ...editData
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const updatedUser = { ...user, ...res.data };
      if (typeof setUser === 'function') setUser(updatedUser);
      localStorage.setItem('verixa_user', JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s', display: 'flex', flexDirection: 'column' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '60px auto', padding: '0 24px', animation: 'fadeUp 0.6s ease' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 32, alignItems: 'start' }}>
          
          {/* LEFT: Identity Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ 
              padding: '40px 32px', borderRadius: 24, 
              background: T.card, border: `1px solid ${T.border}`,
              backdropFilter: 'blur(12px)', textAlign: 'center', position: 'relative'
            }}>
              <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
                <div onClick={() => isEditing && fileInputRef.current?.click()} style={{ width: 140, height: 140, borderRadius: '50%', background: editData.profilePic ? `url(${editData.profilePic}) center/cover` : `linear-gradient(135deg, ${T.accent}, #a07b42)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 300, color: '#0a0a0f', border: `4px solid ${isEditing ? T.accent : T.border}`, transition: 'all 0.3s', overflow: 'hidden', cursor: isEditing ? 'pointer' : 'default' }}>
                  {!editData.profilePic && (user?.name || 'U').charAt(0).toUpperCase()}
                  {isEditing && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Camera size={32} /></div>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              {isEditing ? (
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={{ background: T.input, border: `1px solid ${T.accent}33`, borderRadius: 8, padding: '8px', color: T.text, fontSize: 24, textAlign: 'center', width: '100%', marginBottom: 8, outline: 'none' }} />
              ) : (
                <h1 style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 300, color: T.text, margin: '0 0 4px' }}>{user?.name}</h1>
              )}

              {isEditing ? (
                <input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} style={{ background: T.input, border: 'none', color: T.accent, fontSize: 13, textAlign: 'center', width: '100%', outline: 'none', fontWeight: 600 }} />
              ) : (
                <p style={{ color: T.accent, fontSize: 13, fontWeight: 600, margin: '0 0 16px' }}>{user?.title || 'Analysis Expert'}</p>
              )}

              <div style={{ padding: '4px 12px', borderRadius: 999, background: isAdmin ? `${T.accent}14` : 'rgba(96,165,250,0.08)', border: `1px solid ${isAdmin ? `${T.accent}33` : 'rgba(96,165,250,0.2)'}`, color: isAdmin ? T.accent : '#60a5fa', fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {isAdmin ? 'Head of Organization' : 'Verified Employee'}
              </div>
            </div>

            {/* Quick Stats Ribbon */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, padding: '16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, textAlign: 'center' }}>
                <TrendingUp size={16} color={T.accent} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{stats.total}</div>
                <div style={{ fontSize: 9, color: T.text3, fontWeight: 700 }}>AUDITS</div>
              </div>
              <div style={{ flex: 1, padding: '16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, textAlign: 'center' }}>
                <Award size={16} color="#4ade80" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{stats.avg}%</div>
                <div style={{ fontSize: 9, color: T.text3, fontWeight: 700 }}>ACCURACY</div>
              </div>
            </div>
          </div>

          {/* RIGHT: Professional Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Bio Section */}
            <div style={{ padding: '28px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.accent, marginBottom: 16 }}>
                <Quote size={16} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>PROFESSIONAL BIO</span>
              </div>
              {isEditing ? (
                <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder="Tell us about your professional expertise..." style={{ width: '100%', minHeight: 100, background: T.input, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', color: T.text, fontSize: 14, outline: 'none', resize: 'none' }} />
              ) : (
                <p style={{ fontSize: 15, color: T.text2, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  {user?.bio || "No professional summary provided. Add a bio to enhance your enterprise identity."}
                </p>
              )}
            </div>

            {/* Information Grid */}
            <div style={{ padding: '28px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: Mail, label: 'Email', value: user?.email, locked: true },
                { icon: Building, label: 'Organization', value: user?.organization, key: 'organization' },
                { icon: MapPin, label: 'Office Location', value: user?.location || 'Global Network', key: 'location' },
                { icon: Zap, label: 'Access Tier', value: isAdmin ? 'Unlimited Enterprise' : 'Standard Node', locked: true }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                      <item.icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: 1 }}>{item.label}</div>
                      {isEditing && !item.locked ? (
                        <input value={editData[item.key]} onChange={e => setEditData({ ...editData, [item.key]: e.target.value })} style={{ background: 'none', border: 'none', borderBottom: `1px solid ${T.accent}`, color: T.text, fontSize: 14, outline: 'none', width: '200px', padding: '2px 0' }} />
                      ) : (
                        <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{item.value}</div>
                      )}
                    </div>
                  </div>
                  {item.locked && <div style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: `${T.border}`, color: T.text3, fontWeight: 700 }}>SECURE</div>}
                </div>
              ))}
            </div>

            {/* Control Strip */}
            <div style={{ display: 'flex', gap: 12 }}>
              {isEditing ? (
                <>
                  <button onClick={handleSave} disabled={isSaving} style={{ flex: 2, padding: '14px', borderRadius: 14, background: T.accent, border: 'none', color: '#0a0a0f', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                    {isSaving ? 'Processing...' : <><Save size={18} /> Update Identity</>}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: T.surface, border: `1px solid ${T.accent}4d`, color: T.accent, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = T.accentMuted}>
                  <Settings size={18} /> Edit Professional Profile
                </button>
              )}
            </div>

          </div>

        </div>

      </main>

      <Footer darkMode={darkMode} />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
