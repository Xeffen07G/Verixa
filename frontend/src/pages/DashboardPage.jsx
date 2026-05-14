import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, Download, ChevronRight, Users, Activity, BarChart3, History, BookOpen, Upload, Plus, Search, MessageSquare, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const [messages, setMessages] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const sessionId = useMemo(() => `session_${Math.random().toString(36).substr(2, 9)}`, []);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
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
    
    console.log(`[Dashboard] Upload started: ${file.name}`);
    setUploadStatus({ status: 'loading', message: 'Uploading...' });
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      // 1. Submit to ultra-lean ingestion endpoint
      const res = await api.post('/api/pdf/ingest', formData);
      const { documentId } = res.data;
      console.log(`[Dashboard] Upload accepted. Document ID: ${documentId}`);
      setUploadStatus({ status: 'loading', message: 'Starting analysis...' });

      // 2. Poll for completion
      console.log(`[Dashboard] Polling started`);
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 150) { 
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
        
        try {
          const statusRes = await api.get(`/api/pdf/status/${documentId}`);
          const { status, chunksEmbedded, totalChunks } = statusRes.data;
          
          if (status === 'completed') {
            completed = true;
            setUploadStatus({ status: 'success', message: `${file.name} learned!` });
            fetchVault();
          } else if (status === 'failed') {
            throw new Error('Ingestion failed');
          } else {
            const progress = totalChunks > 0 ? Math.round((chunksEmbedded / totalChunks) * 100) : 0;
            setUploadStatus({ status: 'loading', message: `Learning... ${progress}%` });
          }
        } catch (pollErr) {
          console.warn("[Dashboard] Polling error:", pollErr);
          // Continue polling if it's just a transient error
        }
      }
      
      if (!completed) throw new Error('Processing timed out');
      
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error("[Dashboard] Upload failed:", err.response || err);
      setUploadStatus({ status: 'error', message: 'Upload failed: ' + (err.response?.data?.error || err.message) });
    }
  };

  const handleQuery = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setQueryLoading(true);

    try {
      const res = await api.post('/api/rag/query', { query, sessionId });
      console.log("RAG RESPONSE:", res.data);
      
      const aiMsg = { 
        role: 'ai', 
        content: res.data.answer, 
        sources: res.data.sources || [],
        confidence: res.data.confidence,
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("[Dashboard] Query failed:", err);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Error: I encountered a problem processing your research query. Please try again.", 
        isError: true 
      }]);
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
          <div className="vault-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: '70vh' }}>
            {/* Left Column: Management */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', paddingRight: 8 }}>
              {/* Upload Card */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, color: T.text }}>
                  <Upload size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> {t('uploadDocs', lang)}
                </h3>
                <div onClick={() => fileInputRef.current.click()} style={{ padding: '24px 12px', border: `2px dashed ${T.border}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: `${T.accent}05` }}>
                  <FileText size={24} color={T.accent} style={{ marginBottom: 8, opacity: 0.6 }} />
                  <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>Click to upload research</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt" style={{ display: 'none' }} />
                </div>
                {uploadStatus && (
                  <div style={{ marginTop: 12, fontSize: 11, color: T.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {uploadStatus.status === 'loading' && <RefreshCw size={12} className="spin" />}
                    {uploadStatus.message}
                  </div>
                )}
              </div>

              {/* Documents Card */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, color: T.text }}>
                  <BookOpen size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> {t('docsLearned', lang)}
                </h3>
                {vaultDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {vaultDocs.map((doc, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: 10, background: `${T.accent}0a`, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileText size={16} color={T.accent} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</div>
                          <div style={{ fontSize: 10, color: T.text3 }}>{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: T.text3, textAlign: 'center' }}>No documents uploaded.</p>
                )}
              </div>
            </div>

            {/* Right Column: Conversational Chat */}
            <div style={{ display: 'flex', flexDirection: 'column', background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: T.shadow }}>
              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: T.text3 }}>
                    <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                    <p style={{ fontSize: 16, fontWeight: 500 }}>VeriXa Research Copilot</p>
                    <p style={{ fontSize: 13, opacity: 0.6 }}>Ask follow-up questions naturally. I'll maintain research context.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 8
                    }}>
                      <div style={{ 
                        maxWidth: '85%',
                        padding: msg.role === 'user' ? '12px 20px' : '0px',
                        background: msg.role === 'user' ? `${T.accent}1a` : 'transparent',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '0px',
                        border: msg.role === 'user' ? `1px solid ${T.accent}33` : 'none',
                        color: T.text
                      }}>
                        {msg.role === 'user' ? (
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{msg.content}</p>
                        ) : (
                          <div className="research-report" style={{ padding: '24px', background: `${T.accent}05`, border: `1px solid ${T.border}`, borderRadius: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: T.accent, fontWeight: 900 }}>AI Intelligence</span>
                              {msg.confidence && <span style={{ fontSize: 9, color: T.text3 }}>Confidence: {Math.round(msg.confidence * 100)}%</span>}
                            </div>
                            <div style={{ fontSize: 15, color: T.text, lineHeight: 1.8 }}>
                              <ReactMarkdown components={{
                                p: ({node, ...props}) => <p style={{marginBottom: '12px'}} {...props} />,
                                h1: ({node, ...props}) => <h1 style={{color: T.accent, fontSize: '18px', marginTop: '20px', marginBottom: '10px'}} {...props} />,
                                h2: ({node, ...props}) => <h2 style={{color: T.accent, fontSize: '16px', marginTop: '16px', marginBottom: '8px'}} {...props} />,
                                ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', marginBottom: '12px'}} {...props} />,
                                code: ({node, ...props}) => <code style={{background: `${T.accent}15`, padding: '2px 4px', borderRadius: 4, color: T.accent, fontSize: '0.9em'}} {...props} />
                              }}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            
                            {msg.sources && msg.sources.length > 0 && (
                              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                                <span style={{ fontSize: 10, color: T.text3, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Supporting Evidence</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {msg.sources.map((s, si) => (
                                    <div key={si} style={{ padding: '10px 14px', background: T.cardBg, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                                        <span style={{ color: T.accent, fontWeight: 800 }}>{s.metadata?.source}</span>
                                        <span style={{ color: T.text3 }}>P. {s.metadata?.page} — {s.metadata?.section}</span>
                                      </div>
                                      <p style={{ fontSize: 12, color: T.text3, margin: 0, fontStyle: 'italic', opacity: 0.8 }}>"{s.text.slice(0, 150)}..."</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {queryLoading && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: T.text3 }}>
                    <RefreshCw className="spin" size={16} />
                    <span style={{ fontSize: 13 }}>Analyzing across context...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleQuery} style={{ padding: '20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 12, background: `${T.accent}02` }}>
                <input 
                  type="text" 
                  value={query} 
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Ask a follow-up or research question..."
                  style={{ flex: 1, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 20px', color: T.text, outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={queryLoading || !query.trim()}
                  style={{ width: 48, height: 48, background: T.accent, border: 'none', borderRadius: 14, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {queryLoading ? <RefreshCw size={20} className="spin" /> : <Search size={20} />}
                </button>
              </form>
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
