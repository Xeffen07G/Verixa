import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, Download, ChevronRight, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function StatCard({ icon: Icon, value, label, theme, color = '#c9a96e' }) {
  return (
    <div style={{
      padding: '24px', borderRadius: 16,
      background: theme.cardBg, border: `1px solid ${theme.border}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      flex: 1, minWidth: 200
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}4d`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontFamily: 'serif', fontSize: 36, fontWeight: 300, color: theme.text, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: theme.text3, letterSpacing: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('verixa-theme') === 'dark');
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load local history
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('verixa_history') || '[]');
      setHistory(saved);
    } catch (e) { console.error('Failed to load history', e); }
  }, []);

  // Fetch real team members from backend
  useEffect(() => {
    if (user?.organization) {
      setLoadingMembers(true);
      axios.get(`${API_URL}/api/organization/${user.organization}/members`)
        .then(res => setMembers(res.data))
        .catch(err => console.error('Failed to fetch members', err))
        .finally(() => setLoadingMembers(false));
    }
  }, [user]);

  const totalVerifications = history.length;
  const avgAccuracy = useMemo(() => {
    if (!history.length) return 0;
    const scores = history.map(h => h.overallScore).filter(s => s !== undefined);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [history]);

  const falseClaims = useMemo(() => {
    return history.reduce((count, h) => {
      return count + (h.claims || []).filter(c => c.verdict === 'False').length;
    }, 0);
  }, [history]);

  const T = darkMode ? {
    bg: '#0a0a0f', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    border: 'rgba(255,255,255,0.07)', cardBg: 'rgba(18,18,28,0.6)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.12)',
  } : {
    bg: '#e8e5de', text: '#0d0d0d',
    text2: '#2a2a2a', text3: '#555555',
    border: 'rgba(0,0,0,0.12)', cardBg: '#f5f3ed',
    accent: '#5a421a', accentMuted: 'rgba(90,66,26,0.15)',
  };

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="page-wrapper" style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: T.accent, fontWeight: 900, marginBottom: 12 }}>ORGANIZATION_INTELLIGENCE</div>
            <h1 style={{ fontFamily: 'serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, color: T.text, margin: 0, lineHeight: 1 }}>{user?.organization || 'Enterprise'} <span style={{ color: T.accent }}>Network.</span></h1>
          </div>
          <button style={{ padding: '12px 24px', borderRadius: 10, background: T.accent, border: 'none', color: '#0a0a0f', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Export Audit
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 64 }}>
          <StatCard icon={TrendingUp} value={totalVerifications} label="Personal Scans" theme={T} />
          <StatCard icon={ShieldCheck} value={`${avgAccuracy}%`} label="Personal Accuracy" theme={T} color="#4ade80" />
          <StatCard icon={Users} value={members.length} label="Team Members" theme={T} color="#60a5fa" />
          <StatCard icon={AlertCircle} value={falseClaims} label="False Claims" theme={T} color="#f87171" />
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 40 }}>
          
          {/* Left Column: Recent Activity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, margin: 0 }}>Recent Activity</h2>
              <span style={{ fontSize: 12, color: T.text3 }}>{history.length} operations logged</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.length > 0 ? history.slice(0, 10).map((h, i) => (
                <div key={i} style={{ padding: '16px 20px', borderRadius: 14, background: T.cardBg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = T.cardBg}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: h.overallScore >= 70 ? '#4ade8014' : '#f8717114', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: h.overallScore >= 70 ? '#4ade80' : '#f87171' }}>
                      {h.overallScore}%
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</div>
                      <div style={{ fontSize: 11, color: T.text3 }}>{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.text3} />
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 16 }}>
                  <p style={{ color: T.text3, fontSize: 14 }}>No local history found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Team Members */}
          <div>
            <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 24 }}>Real-time Team</h2>
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px' }}>
              {loadingMembers ? (
                <div style={{ color: T.text3, fontSize: 13 }}>Synchronizing team data...</div>
              ) : members.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {members.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accentMuted, border: `1px solid ${T.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: T.accent, fontWeight: 700 }}>
                        {(m.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name || 'Team Member'}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>Joined {new Date(m.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade804d' }} title="Online" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: T.text3, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  No other members found in <b>{user?.organization || 'this organization'}</b> yet.
                </div>
              )}
              <div style={{ height: 1, background: T.border, margin: '24px 0' }} />
              <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.6 }}>
                You are currently connected to the <b>{user?.organization || 'Enterprise'}</b> cluster. Shared verifications will appear as other members join your network.
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}
