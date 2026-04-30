import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, Download, ChevronRight, Users, Activity, BarChart3, User, History } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

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
  const [orgHistory, setOrgHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is Admin (Head of Company)
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin'); // Fallback for now

  useEffect(() => {
    // Load local history for everyone
    const saved = localStorage.getItem('verixa_history');
    if (saved) setPersonalHistory(JSON.parse(saved));

    if (user?.organization) {
      setLoading(true);
      const orgName = user.organization;
      
      // Fetch Org Data if Admin
      const requests = [
        axios.get(`${API_URL}/api/organization/${orgName}/members`)
      ];
      if (isAdmin) {
        requests.push(axios.get(`${API_URL}/api/organization/${orgName}/history`));
      }

      Promise.all(requests).then(([membersRes, historyRes]) => {
        setMembers(membersRes.data);
        if (historyRes) setOrgHistory(historyRes.data);
      }).catch(err => {
        console.error('Failed to sync organization data', err);
      }).finally(() => setLoading(false));
    }
  }, [user, isAdmin]);

  const stats = useMemo(() => {
    const data = isAdmin ? orgHistory : personalHistory;
    const total = data.length;
    const avg = total ? Math.round(data.reduce((a, b) => a + (b.overallScore || 0), 0) / total) : 0;
    const falseClaims = data.reduce((count, h) => {
      return count + (h.claims || []).filter(c => c.verdict === 'False').length;
    }, 0);
    return { total, avg, falseClaims };
  }, [orgHistory, personalHistory, isAdmin]);

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
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: T.accent, fontWeight: 900, marginBottom: 12 }}>
              {isAdmin ? 'ORGANIZATION_INTELLIGENCE' : 'PERSONAL_AUDIT_TERMINAL'}
            </div>
            <h1 style={{ fontFamily: 'serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, color: T.text, margin: 0, lineHeight: 1 }}>
              {isAdmin ? `${user?.organization} Network` : 'Your Activity'}<span style={{ color: T.accent }}>.</span>
            </h1>
            <p style={{ color: T.text2, marginTop: 12, fontSize: 14 }}>
              {isAdmin ? 'Monitoring all team activity across the global network.' : 'Track your personal verifications and accuracy scores.'}
            </p>
          </div>
          {isAdmin && (
            <button style={{ padding: '12px 24px', borderRadius: 10, background: T.accent, border: 'none', color: '#0a0a0f', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Export Global Audit
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 64 }}>
          <StatCard icon={isAdmin ? BarChart3 : History} value={stats.total} label={isAdmin ? "Total Org Scans" : "Your Scans"} theme={T} />
          <StatCard icon={Activity} value={`${stats.avg}%`} label={isAdmin ? "Team Accuracy" : "Your Accuracy"} theme={T} color="#4ade80" />
          {isAdmin ? (
             <StatCard icon={Users} value={members.length} label="Active Employees" theme={T} color="#60a5fa" />
          ) : (
            <StatCard icon={ShieldCheck} value={personalHistory.length > 0 ? "Secure" : "Inactive"} label="Status" theme={T} color="#60a5fa" />
          )}
          <StatCard icon={AlertCircle} value={stats.falseClaims} label={isAdmin ? "Global Falsehoods" : "False Claims Detected"} theme={T} color="#f87171" />
        </div>

        {/* Main Feed Area */}
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.6fr 1fr' : '1fr', gap: 40 }}>
          
          {/* Activity Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, margin: 0 }}>
                {isAdmin ? 'Master Activity Feed' : 'Recent Verifications'}
              </h2>
              <span style={{ fontSize: 12, color: T.text3 }}>{isAdmin ? orgHistory.length : personalHistory.length} operations logged</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(isAdmin ? orgHistory : personalHistory).length > 0 ? (isAdmin ? orgHistory : personalHistory).map((h, i) => (
                <div key={i} style={{ padding: '16px 20px', borderRadius: 14, background: T.cardBg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: (h.overallScore || 0) >= 70 ? '#4ade8014' : '#f8717114', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: (h.overallScore || 0) >= 70 ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                      {h.overallScore || 0}%
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</div>
                      <div style={{ fontSize: 11, color: T.text3 }}>
                        {isAdmin ? `Verified by ${h.userName || 'Unknown'}` : 'Verified locally'} • {new Date(h.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.text3} />
                </div>
              )) : (
                <div style={{ padding: '60px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 16 }}>
                  <p style={{ color: T.text3, fontSize: 14 }}>No activity logged yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Only for Admins */}
          {isAdmin && (
            <div>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 24 }}>Employee Performance</h2>
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px' }}>
                {members.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {members.map((m, i) => {
                      const userWork = orgHistory.filter(h => h.userId === m._id || h.userName === m.name);
                      const userScore = userWork.length ? Math.round(userWork.reduce((a, b) => a + b.overallScore, 0) / userWork.length) : 0;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: T.accent, fontWeight: 700 }}>
                            {(m.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name || 'Team Member'}</div>
                            <div style={{ fontSize: 11, color: T.text3 }}>{userWork.length} verifications • {userScore}% Accuracy</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color: T.text3, fontSize: 13 }}>No other team members found.</p>}
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}
