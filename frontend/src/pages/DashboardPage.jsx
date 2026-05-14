import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShieldCheck, AlertCircle, Clock, ChevronRight, Activity, BarChart3, History, Search, CheckCircle2, RefreshCw, FileSearch, Globe, Database, Fingerprint } from 'lucide-react';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon: Icon, value, label, theme, color = '#c9a96e' }) {
  return (
    <div style={{
      padding: '24px', borderRadius: 20,
      background: theme.cardBg, border: `1px solid ${theme.border}`,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      flex: 1, minWidth: 200,
      boxShadow: theme.shadow
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: theme.text, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: theme.text3, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export default function VerificationLab() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('verixa-theme');
    return saved ? saved === 'dark' : false;
  });

  const [claim, setClaim] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const T = darkMode ? {
    bg: '#0a0a0f',
    cardBg: '#12121a',
    border: 'rgba(255,255,255,0.08)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.8)',
    text3: 'rgba(245,243,239,0.4)',
    accent: '#c9a96e',
    shadow: '0 20px 50px rgba(0,0,0,0.5)'
  } : {
    bg: '#fdfcf9',
    cardBg: '#fff',
    border: 'rgba(212, 140, 112, 0.15)',
    text: '#201a18',
    text2: 'rgba(32, 26, 24, 0.8)',
    text3: 'rgba(32, 26, 24, 0.4)',
    accent: '#d48c70',
    shadow: '0 10px 30px rgba(212, 140, 112, 0.1)'
  };

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem('verixa_history');
    if (saved) setVerificationHistory(JSON.parse(saved));
    setLoading(false);
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!claim.trim()) return;
    setVerifying(true);
    
    try {
      // For now, redirect to existing verify logic or implement inline
      const res = await api.post('/api/verify', { text: claim });
      const newEntry = { 
        id: Date.now(), 
        text: claim, 
        timestamp: new Date(), 
        overallScore: res.data.overallScore,
        claims: res.data.claims 
      };
      
      const updatedHistory = [newEntry, ...verificationHistory].slice(0, 50);
      setVerificationHistory(updatedHistory);
      localStorage.setItem('verixa_history', JSON.stringify(updatedHistory));
      setClaim('');
      
      // Optional: navigate to details or show in feed
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  const stats = useMemo(() => {
    const total = verificationHistory.length;
    const avg = total ? Math.round(verificationHistory.reduce((a, b) => a + (b.overallScore || 0), 0) / total) : 0;
    const alerts = verificationHistory.filter(h => (h.overallScore || 0) < 50).length;
    return { total, avg, alerts };
  }, [verificationHistory]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, transition: '0.3s' }}>
      <Navbar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
      
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '120px 40px 60px' }}>
        <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Fingerprint size={14} /> Core Forensic Intelligence
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, margin: 0 }}>Verification Lab</h1>
            <p style={{ color: T.text3, marginTop: 8, maxWidth: 500 }}>Investigate claims, verify sources, and analyze credibility across the intelligence landscape.</p>
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <StatCard icon={Activity} value={stats.total} label="Claims Investigated" theme={T} />
            <StatCard icon={ShieldCheck} value={`${stats.avg}%`} label="Credibility Index" theme={T} color="#4ade80" />
            <StatCard icon={AlertCircle} value={stats.alerts} label="Risks Detected" theme={T} color="#f87171" />
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }}>
          {/* Left: Investigation Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ position: 'relative', background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, boxShadow: T.shadow, overflow: 'hidden' }}>
              {verifying && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}
                >
                  <div className="scanner" style={{ width: '80%', height: 2, background: T.accent, position: 'absolute', top: 0, left: '10%', boxShadow: `0 0 20px ${T.accent}` }} />
                  <RefreshCw size={40} className="spin" color={T.accent} />
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: T.accent, textAlign: 'center' }}>
                    ANALYZING STANCE • TRACING SOURCES • SCANNED 1.2M NODES
                  </div>
                </motion.div>
              )}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileSearch size={20} color={T.accent} /> Forensic Analysis Console
              </h3>
              <form onSubmit={handleVerify}>
                <textarea 
                  value={claim}
                  onChange={e => setClaim(e.target.value)}
                  placeholder="Input investigative target (text, claim, or news snippet)..."
                  style={{ width: '100%', height: 160, background: 'rgba(0,0,0,0.1)', border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, color: T.text, outline: 'none', fontSize: 16, resize: 'none', marginBottom: 20, fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: 0.5 }}>
                      <Globe size={12} /> OSINT SEARCH ACTIVE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: 0.5 }}>
                      <Fingerprint size={12} /> BIAS DETECTION ENABLED
                    </div>
                  </div>
                  <button 
                    disabled={verifying || !claim.trim()}
                    style={{ padding: '14px 32px', background: T.accent, border: 'none', borderRadius: 12, color: '#000', fontWeight: 800, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    {verifying ? <RefreshCw size={18} className="spin" /> : <ShieldCheck size={18} />}
                    {verifying ? 'DECODING...' : 'INITIATE FORENSIC SCAN'}
                  </button>
                </div>
              </form>
            </div>

            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                  <History size={20} color={T.accent} /> Intelligence Ledger
                </h3>
                <span style={{ fontSize: 10, color: T.text3, fontWeight: 700 }}>VERIFIED HISTORICAL LOGS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verificationHistory.length > 0 ? (
                  verificationHistory.map((h, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.01)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: h.overallScore >= 70 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${h.overallScore >= 70 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: h.overallScore >= 70 ? '#4ade80' : '#f87171', fontSize: 14 }}>
                          {h.overallScore}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 9, color: T.text3, fontWeight: 700 }}>REF: {h.id.toString().slice(-6)}</span>
                            <span style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>STANCE: {h.overallScore > 50 ? 'NEUTRAL/POSITIVE' : 'DECEPTIVE'}</span>
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await api.post('/api/flow/transfer', { data: h, targetWorkspace: 'research' });
                                  if (res.data.success) {
                                    navigate(`/research?sessionId=${res.data.sessionId}`);
                                  }
                                } catch (err) { console.error("Transfer failed", err); }
                              }}
                              style={{ background: 'none', border: 'none', color: T.accent, fontSize: 9, fontWeight: 900, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                            >
                              ANALYZE IN RESEARCH →
                            </button>
                          </div>
                        </div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer' }}><MoreVertical size={18} /></button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px', border: `1px dashed ${T.border}`, borderRadius: 16 }}>
                    <AlertCircle size={32} color={T.text3} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p style={{ color: T.text3, fontSize: 13, fontWeight: 500 }}>No forensic records found in current session.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Tools & Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, boxShadow: T.shadow }}>
              <h4 style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: T.accent, marginBottom: 20 }}>Security Protocols</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: 'Fact-Check Engine', desc: 'Active multi-source lookup', status: 'Optimal' },
                  { label: 'Bias Calibrator', desc: 'Detecting political & intent bias', status: 'Active' },
                  { label: 'Synthetic Scan', desc: 'Identifying AI-generated prose', status: 'Online' },
                  { label: 'OSINT Crawler', desc: 'Real-time web cross-referencing', status: 'Standby' }
                ].map((p, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: p.status === 'Optimal' || p.status === 'Active' ? '#4ade80' : T.accent }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.text3 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ position: 'relative', background: `${T.accent}14`, border: `1px solid ${T.accent}33`, borderRadius: 24, padding: 32, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}><TrendingUp size={120} /></div>
              <h4 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Database size={20} color={T.accent} /> Advanced Intel
              </h4>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 24 }}>Need to analyze long-form technical reports or sensitive documentation? The **Research Workspace** provides a high-security environment for document interrogation.</p>
              <button 
                onClick={() => navigate('/research')}
                style={{ width: '100%', padding: '14px', background: T.accent, border: 'none', borderRadius: 12, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                Enter Research Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer darkMode={darkMode} />
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
