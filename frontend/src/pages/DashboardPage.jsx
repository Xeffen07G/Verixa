import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, Download, ChevronRight, Users, Activity, BarChart3, User, History } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function StatCard({ icon: Icon, value, label, theme, color = '#d48c70' }) {
  return (
    <div style={{
      padding: '32px', borderRadius: 32,
      background: theme.cardBg, border: `1px solid ${theme.border}`,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      flex: 1, minWidth: 240,
      boxShadow: theme.shadow
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-6px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: theme.text, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.text3, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : false; // Default to Light for "Human" feel
  });

  const [orgHistory, setOrgHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is Admin (Head of Company)
  const isAdmin = user?.role === 'head' || user?.role === 'admin' || user?.email?.includes('admin'); // Fallback for now

  useEffect(() => {
    if (!user) return;
    
    // Load local history
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

  const T_DARK = {
    bg: '#0a0a0f', text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.65)', text3: 'rgba(245,243,239,0.35)',
    border: 'rgba(255,255,255,0.07)', cardBg: 'rgba(18,18,28,0.6)',
    accent: '#c9a96e', accentMuted: 'rgba(201,169,110,0.1)', shadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  const T_LIGHT = {
    bg: '#fdfcf9', text: '#201a18',
    text2: '#53433e', text3: '#85736d',
    border: 'rgba(212, 140, 112, 0.15)', cardBg: '#ffffff',
    accent: '#d48c70', accentMuted: 'rgba(212, 140, 112, 0.1)', shadow: '0 20px 50px rgba(45, 45, 45, 0.05)',
  };

  const T = darkMode ? T_DARK : T_LIGHT;

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  if (authLoading) return null; // Or a loader
  if (!user) return null;

  return (
    <div className="page-wrapper" style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s' }}>
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: T.accent, fontWeight: 900, marginBottom: 16, textTransform: 'uppercase' }}>
              {isAdmin ? t('orgIntel', lang) : t('personalAudit', lang)}
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 300, color: T.text, margin: 0, lineHeight: 1, letterSpacing: -1 }}>
              {isAdmin ? `${user?.organization} ${t('network', lang)}` : t('yourActivity', lang)}<span style={{ color: T.accent }}>.</span>
            </h1>
            <p style={{ color: T.text2, marginTop: 16, fontSize: 16, fontWeight: 300, maxWidth: 600 }}>
              {isAdmin ? t('monitoringTeam', lang) : t('trackPersonal', lang)}
            </p>
          </div>
          {isAdmin && (
            <button style={{ padding: '12px 24px', borderRadius: 10, background: T.accent, border: 'none', color: '#0a0a0f', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> {t('exportGlobalAudit', lang)}
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 64 }}>
          <StatCard icon={isAdmin ? BarChart3 : History} value={stats.total} label={isAdmin ? t('totalOrgScans', lang) : t('yourScans', lang)} theme={T} />
          <StatCard icon={Activity} value={`${stats.avg}%`} label={isAdmin ? t('teamAccuracy', lang) : t('yourAccuracy', lang)} theme={T} color="#4ade80" />
          {isAdmin ? (
             <StatCard icon={Users} value={members.length} label={t('activeEmployees', lang)} theme={T} color="#60a5fa" />
          ) : (
            <StatCard icon={ShieldCheck} value={personalHistory.length > 0 ? t('secure', lang) : t('inactive', lang)} label={t('status', lang)} theme={T} color="#60a5fa" />
          )}
          <StatCard icon={AlertCircle} value={stats.falseClaims} label={isAdmin ? t('globalFalsehoods', lang) : t('falseDetected', lang)} theme={T} color="#f87171" />
        </div>

        {/* Main Feed Area */}
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.6fr 1fr' : '1fr', gap: 40 }}>
          
          {/* Activity Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, margin: 0 }}>
                {isAdmin ? t('masterActivityFeed', lang) : t('recentVerifications', lang)}
              </h2>
              <span style={{ fontSize: 12, color: T.text3 }}>{isAdmin ? orgHistory.length : personalHistory.length} {t('opsLogged', lang)}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(isAdmin ? orgHistory : personalHistory).length > 0 ? (isAdmin ? orgHistory : personalHistory).map((h, i) => (
                <div key={i} className="activity-item" style={{ padding: '16px 20px', borderRadius: 14, background: T.cardBg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: (h.overallScore || 0) >= 70 ? '#4ade8014' : '#f8717114', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: (h.overallScore || 0) >= 70 ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                      {h.overallScore || 0}%
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</div>
                      <div style={{ fontSize: 11, color: T.text3 }}>
                        {isAdmin ? `${t('verifiedBy', lang)} ${h.userName || t('unknown', lang)}` : t('verifiedLocally', lang)} • {new Date(h.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.text3} />
                </div>
              )) : (
                <div style={{ padding: '60px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 16 }}>
                  <p style={{ color: T.text3, fontSize: 14 }}>{t('noActivityLogged', lang)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Only for Admins */}
          {isAdmin && (
            <div>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 24 }}>{t('employeePerformance', lang)}</h2>
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
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name || t('teamMember', lang)}</div>
                            <div style={{ fontSize: 11, color: T.text3 }}>{userWork.length} {t('verifications', lang)} • {userScore}% {t('accuracy', lang)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color: T.text3, fontSize: 13 }}>{t('noTeamFound', lang)}</p>}
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer darkMode={darkMode} />
      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .activity-item { flex-direction: column !important; align-items: flex-start !important; }
          .activity-item > div { width: 100% !important; }
          .activity-item > svg { display: none !important; }
        }
      `}</style>
    </div>
  );
}
