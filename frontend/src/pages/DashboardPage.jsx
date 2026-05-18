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

  const T = {
    bg: '#0a0a0f',
    bg2: '#111118',
    border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)',
    text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e',
    cardBg: '#111118',
    cardBorder: 'rgba(255,255,255,0.07)',
  };

  const [claim, setClaim] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const res = await api.post('/api/verify', { text: claim });
      const newEntry = { 
        id: Date.now(), 
        text: claim, 
        timestamp: new Date(), 
        overallScore: res.data.overallScore,
        claims: Array.isArray(res.data.claims) ? res.data.claims : []
      };
      
      const updatedHistory = [newEntry, ...verificationHistory].slice(0, 50);
      setVerificationHistory(updatedHistory);
      localStorage.setItem('verixa_history', JSON.stringify(updatedHistory));
      setClaim('');
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
      <Navbar darkMode={true} onToggleTheme={() => {}} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '160px 40px 120px' }}>
        <header style={{ marginBottom: 120, maxWidth: 800 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 24 }}>CORE FORENSIC INTELLIGENCE</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, margin: 0, letterSpacing: -1 }}>Verification Lab</h1>
          <p style={{ color: T.text2, marginTop: 24, fontSize: 20, lineHeight: 1.6, fontWeight: 300 }}>
            Investigate claims, verify sources, and analyze credibility across the intelligence landscape. 
            VeriXa utilizes multi-agent consensus to decode complex information networks.
          </p>
        </header>

        <div className="dashboard-grid">
          {/* Left: Investigation Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
            <section>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 40 }}>ANALYSIS CONSOLE</div>
              <form onSubmit={handleVerify}>
                <textarea 
                  value={claim}
                  onChange={e => setClaim(e.target.value)}
                  placeholder="Input investigative target (text, claim, or news snippet)..."
                  style={{ width: '100%', height: 200, background: 'rgba(255,255,255,0.01)', border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, color: T.text, outline: 'none', fontSize: 18, resize: 'none', marginBottom: 32, fontFamily: 'inherit', fontWeight: 300, lineHeight: 1.6 }}
                />
                <button 
                  disabled={verifying || !claim.trim()}
                  style={{ padding: '16px 40px', background: T.accent, border: 'none', borderRadius: 12, color: '#0a0a0f', fontWeight: 800, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {verifying ? <RefreshCw size={18} className="spin" /> : <ShieldCheck size={18} />}
                  {verifying ? 'DECODING...' : 'INITIATE FORENSIC SCAN'}
                </button>
              </form>
            </section>

            <section>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 40 }}>INTELLIGENCE LEDGER</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {Array.isArray(verificationHistory) && verificationHistory.length > 0 ? (
                  verificationHistory.map((h, i) => (
                    <div key={i} style={{ paddingBottom: 32, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: (h?.overallScore || 0) >= 70 ? '#4ade80' : '#f87171' }}>
                          {h?.overallScore || 0}%
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 500, color: T.text, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h?.text || 'Untitled Investigation'}</div>
                          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: 1 }}>REF: {h?.id ? h.id.toString().slice(-6) : 'N/A'}</span>
                            <button 
                              onClick={() => navigate('/research')}
                              style={{ background: 'none', border: 'none', color: T.accent, fontSize: 11, fontWeight: 900, cursor: 'pointer', letterSpacing: 1, padding: 0 }}
                            >
                              ANALYZE IN RESEARCH →
                            </button>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} color={T.accent} style={{ opacity: 0.5 }} />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '80px 40px', borderRadius: 24, border: `1px solid ${T.border}`, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: T.text3 }}>Ledger Empty</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Metrics & Intel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 40 }}>PLATFORM METRICS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Investigations</div>
                    <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif' }}>{stats.total} Active</div>
                 </div>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Average Integrity</div>
                    <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: stats.avg >= 70 ? '#4ade80' : '#fbbf24' }}>{stats.avg}% Reliable</div>
                 </div>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Risks Mitigated</div>
                    <div style={{ fontSize: 32, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', color: '#f87171' }}>{stats.alerts} Alerts</div>
                 </div>
              </div>
            </div>

            <div style={{ padding: 40, borderRadius: 24, background: 'rgba(201,169,110,0.03)', border: `1px solid ${T.accent}20` }}>
              <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 16 }}>Advanced Intel</div>
              <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                Need to analyze long-form technical reports? The Research Workspace provides a high-security environment for document interrogation.
              </p>
              <button 
                onClick={() => navigate('/research')}
                style={{ marginTop: 24, background: 'none', border: `1px solid ${T.accent}`, color: T.accent, padding: '12px 24px', borderRadius: 8, fontSize: 11, fontWeight: 900, letterSpacing: 1, cursor: 'pointer' }}
              >
                ENTER RESEARCH →
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer darkMode={true} />
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
