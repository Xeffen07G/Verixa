import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, Download, ChevronRight, Users, Activity, BarChart3, History, BookOpen, Upload, Plus, Search, MessageSquare, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

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
    return saved ? saved === 'dark' : false;
  });

  const [activeTab, setActiveTab] = useState('activity'); // 'activity' or 'vault'
  const [orgHistory, setOrgHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [personalHistory, setPersonalHistory] = useState([]);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { status: 'idle', message: '' }
  const fileInputRef = useRef(null);

  const isAdmin = user?.role === 'head' || user?.role === 'admin' || user?.email?.includes('admin');

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

  useEffect(() => {
    if (!user) return;
    
    const saved = localStorage.getItem('verixa_history');
    if (saved) setPersonalHistory(JSON.parse(saved));

    if (user?.organization) {
      setLoading(true);
      api.get(`/api/organization/${user.organization}/members`)
        .then(res => setMembers(res.data))
        .catch(err => console.error('Failed to sync members', err))
        .finally(() => setLoading(false));

      if (isAdmin) {
        api.get(`/api/organization/${user.organization}/history`)
          .then(res => setOrgHistory(res.data))
          .catch(err => console.error('Failed to sync history', err));
      }
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (activeTab === 'vault') {
      fetchVault();
    }
  }, [activeTab]);

  const fetchVault = async () => {
    setVaultLoading(true);
    try {
      const res = await api.get('/api/rag/documents');
      setVaultDocs(res.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch vault docs', err);
    } finally {
      setVaultLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadStatus({ status: 'loading', message: t('processingDoc', lang) });
    
    try {
      // 1. If PDF, use async ingestion
      let content = "";
      if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await api.post('/api/pdf/ingest', formData);
        const { jobId } = res.data;

        // Poll for completion
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 150) {
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await api.get(`/api/pdf/status/${jobId}`);
          if (statusRes.data.status === 'completed') {
            completed = true;
            content = statusRes.data.result.text;
          } else if (statusRes.data.status === 'failed') {
            throw new Error('PDF extraction failed');
          }
        }
        if (!completed) throw new Error('Timeout');
      } else {
        content = await file.text();
      }

      // 2. Add to RAG
      await api.post('/api/rag/add', {
        id: file.name,
        text: content,
        metadata: { source: file.name, type: file.type, size: file.size }
      });

      setUploadStatus({ status: 'success', message: `${file.name} learned!` });
      fetchVault();
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setUploadStatus({ status: 'error', message: 'Upload failed: ' + err.message });
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await api.post('/api/rag/query', { query });
      setQueryResult(res.data.results);
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const stats = useMemo(() => {
    const data = isAdmin ? orgHistory : personalHistory;
    const total = data.length;
    const avg = total ? Math.round(data.reduce((a, b) => a + (b.overallScore || 0), 0) / total) : 0;
    const falseClaims = data.reduce((count, h) => {
      return count + (h.claims || []).filter(c => c.verdict === 'False').length;
    }, 0);
    return { total, avg, falseClaims };
  }, [orgHistory, personalHistory, isAdmin]);

  const toggleTheme = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('verixa-theme', newVal ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  if (authLoading) return null;
  if (!user) return null;

  return (
    <div className="page-wrapper" style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.3s', color: T.text }}>
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
              {activeTab === 'activity' 
                ? (isAdmin ? t('monitoringTeam', lang) : t('trackPersonal', lang))
                : t('vaultDesc', lang)
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setActiveTab('activity')} style={{ padding: '12px 24px', borderRadius: 10, background: activeTab === 'activity' ? T.accent : 'transparent', border: `1px solid ${T.accent}`, color: activeTab === 'activity' ? '#0a0a0f' : T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '0.3s' }}>
              {t('navDashboard', lang)}
            </button>
            <button onClick={() => setActiveTab('vault')} style={{ padding: '12px 24px', borderRadius: 10, background: activeTab === 'vault' ? T.accent : 'transparent', border: `1px solid ${T.accent}`, color: activeTab === 'vault' ? '#0a0a0f' : T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} /> {t('knowledgeVault', lang)}
            </button>
          </div>
        </div>

        {activeTab === 'activity' ? (
          <>
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

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.6fr 1fr' : '1fr', gap: 40 }}>
              <div>
                <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 24 }}>{isAdmin ? t('masterActivityFeed', lang) : t('recentVerifications', lang)}</h2>
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
            </div>
          </>
        ) : (
          <div className="vault-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40 }}>
            {/* Left: Upload & Query */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Upload Card */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Upload size={20} color={T.accent} /> {t('uploadDocs', lang)}
                </h3>
                <div onClick={() => fileInputRef.current.click()} style={{ padding: '40px 20px', border: `2px dashed ${T.border}`, borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `${T.accent}05`, transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}>
                  <FileText size={40} color={T.accent} style={{ marginBottom: 16, opacity: 0.6 }} />
                  <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>{t('dropFiles', lang)}</p>
                  <p style={{ fontSize: 11, color: T.text3, marginTop: 8 }}>PDF, TXT (Max 20MB)</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt" style={{ display: 'none' }} />
                </div>
                {uploadStatus && (
                  <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: uploadStatus.status === 'error' ? '#f871711a' : `${T.accent}1a`, border: `1px solid ${uploadStatus.status === 'error' ? '#f8717133' : `${T.accent}33`}`, color: uploadStatus.status === 'error' ? '#f87171' : T.accent, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {uploadStatus.status === 'loading' && <RefreshCw size={14} className="spin" />}
                    {uploadStatus.status === 'success' && <CheckCircle2 size={14} />}
                    {uploadStatus.message}
                  </div>
                )}
              </div>

              {/* Query Card */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MessageSquare size={20} color={T.accent} /> {t('queryVault', lang)}
                </h3>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder={t('queryPlaceholder', lang)} style={{ width: '100%', height: 120, background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', color: T.text, outline: 'none', resize: 'none', fontSize: 14 }} />
                  <button onClick={handleQuery} disabled={queryLoading || !query.trim()} style={{ position: 'absolute', bottom: 12, right: 12, padding: '8px 20px', borderRadius: 8, background: T.accent, border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    {queryLoading ? '...' : t('askVault', lang)}
                  </button>
                </div>
                {queryResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                    <h4 style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>{t('vaultResults', lang)}</h4>
                    {queryResult.map((res, i) => (
                      <div key={i} style={{ padding: '16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                        <p style={{ fontSize: 13, color: T.text, margin: '0 0 8px', lineHeight: 1.6 }}>"{res.text}"</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>{res.metadata?.source || 'Document'}</span>
                          <span style={{ fontSize: 10, color: T.text3 }}>{Math.round(res.score * 100)}% match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Docs List */}
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={20} color={T.accent} /> {t('docsLearned', lang)}
              </h3>
              {vaultLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="spin" size={24} color={T.text3} /></div>
              ) : vaultDocs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {vaultDocs.map((doc, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: `${T.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={18} color={T.accent} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{doc.id}</div>
                          <div style={{ fontSize: 11, color: T.text3 }}>{new Date(doc.timestamp).toLocaleDateString()} • {t('learned', lang)}</div>
                        </div>
                      </div>
                      <CheckCircle2 size={16} color="#4ade80" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 16 }}>
                  <p style={{ color: T.text3, fontSize: 14 }}>{t('noDocs', lang)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .dashboard-grid, .vault-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
