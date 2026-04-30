import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Shield, Building, Calendar, Settings, LogOut, Camera, Check, X, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function AccountPage() {
  const { user, logout, setUser } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    profilePic: user?.profilePic || ''
  });
  const [isSaving, setIsSaving] = useState(false);
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

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/user/profile`, {
        userId: user?._id || user?.id,
        ...editData
      });
      // Update local context and storage
      const updatedUser = { ...user, ...res.data };
      if (typeof setUser === 'function') setUser(updatedUser);
      localStorage.setItem('verixa_user', JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (error) {
      alert('Failed to update profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
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
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: `${T.accent}0a`, borderRadius: '50%', filter: 'blur(60px)' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
              <div 
                onClick={handleImageClick}
                style={{ 
                  width: 140, height: 140, borderRadius: '50%', 
                  background: editData.profilePic ? `url(${editData.profilePic}) center/cover` : `linear-gradient(135deg, ${T.accent}, #a07b42)`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 56, fontWeight: 300, color: '#0a0a0f', 
                  border: `4px solid ${isEditing ? T.accent : T.border}`, 
                  boxShadow: `0 12px 32px ${T.accent}33`,
                  cursor: isEditing ? 'pointer' : 'default',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}>
                {!editData.profilePic && (user?.name || 'U').charAt(0).toUpperCase()}
                {isEditing && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Camera size={32} />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>

            {isEditing ? (
              <input 
                value={editData.name} 
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={{ background: T.input, border: `1px solid ${T.accent}`, borderRadius: 8, padding: '8px 16px', color: T.text, fontSize: 24, textAlign: 'center', width: '80%', marginBottom: 12, outline: 'none' }}
              />
            ) : (
              <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 300, color: T.text, margin: '0 0 8px' }}>{user?.name}</h1>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: isAdmin ? `${T.accent}1a` : 'rgba(96,165,250,0.1)', border: `1px solid ${isAdmin ? `${T.accent}4d` : 'rgba(96,165,250,0.3)'}`, color: isAdmin ? T.accent : '#60a5fa', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              <Shield size={12} /> {isAdmin ? 'Head of Organization' : 'Verified Employee'}
            </div>
          </div>
        </div>

        {/* Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {[
            { icon: Mail, label: 'Email Address', value: user?.email, locked: true },
            { icon: Building, label: 'Organization', value: user?.organization, key: 'organization' },
            { icon: Shield, label: 'Account Authority', value: isAdmin ? 'Organization Administrator' : 'Standard Employee Access', locked: true },
            { icon: Calendar, label: 'Member Since', value: new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), locked: true }
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 24px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                  <item.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  {isEditing && !item.locked ? (
                    <input 
                      value={editData[item.key]} 
                      onChange={e => setEditData({ ...editData, [item.key]: e.target.value })}
                      style={{ background: T.input, border: 'none', borderBottom: `1px solid ${T.accent}`, color: T.text, fontSize: 15, padding: '4px 0', outline: 'none', width: '200px' }}
                    />
                  ) : (
                    <div style={{ fontSize: 15, color: T.text, fontWeight: 500 }}>{item.value}</div>
                  )}
                </div>
              </div>
              {item.locked && <div style={{ fontSize: 9, color: T.text3, fontWeight: 600 }}>SECURE FIELD</div>}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 12 }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={isSaving} style={{ flex: 2, padding: '16px', borderRadius: 14, background: T.accent, border: 'none', color: '#0a0a0f', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                {isSaving ? 'Saving Changes...' : <><Save size={18} /> Save Profile</>}
              </button>
              <button onClick={() => { setIsEditing(false); setEditData({ name: user.name, organization: user.organization, profilePic: user.profilePic }); }} style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                <X size={18} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={{ flex: 2, padding: '16px', borderRadius: 14, background: T.surface, border: `1px solid ${T.accent}4d`, color: T.accent, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentMuted}>
                <Settings size={18} /> Edit Your Profile
              </button>
              <button onClick={logout} style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                <LogOut size={18} /> Sign Out
              </button>
            </>
          )}
        </div>

      </main>

      <Footer darkMode={darkMode} />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
