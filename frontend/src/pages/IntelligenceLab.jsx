import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, Activity as ActivityIcon, Database as DatabaseIcon, Shield as ShieldIcon, 
  Zap, Search, Clock, FileText, TrendingUp, BarChart3, Globe, Cpu as CpuIcon, 
  AlertCircle, CheckCircle2, MoreVertical, Bookmark, MessageSquare, List, 
  Info, RefreshCw, AlertTriangle, Flame, ExternalLink as ExternalLinkIcon,
  Search as SearchIcon, FileJson, Target, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { t } from '../utils/i18n';
import api from '../utils/api';

export default function IntelligenceLab() {
  const { user } = useAuth();
  const { lang } = useLang();
  
  const [stats, setStats] = useState({
    sessionCount: 0,
    totalDocs: 0,
    contradictionCount: 0,
    avgConfidence: 0
  });

  const [boards, setBoards] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetchBoards();
    fetchActiveSessions();
    fetchTelemetry();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get('/api/investigation/active');
      setActiveSessions(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await api.get('/api/admin/telemetry');
      setTelemetry(res.data);
      setStats(prev => ({
        ...prev,
        sessionCount: res.data.sessions,
        totalDocs: res.data.vaultSize,
        contradictionCount: 4, // Keep mock for now or fetch from sessions
        avgConfidence: 84.5
      }));
    } catch (err) { console.error(err); }
  };

  const fetchBoards = async () => {
    try {
      const res = await api.get('/api/boards');
      if (res.data.success) setBoards(res.data.boards || []);
    } catch (err) { console.error(err); }
  };

  const T = {
    bg: '#050508',
    card: '#0a0a0f',
    border: 'rgba(255,255,255,0.08)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.8)',
    text3: 'rgba(245,243,239,0.4)',
    accent: '#c9a96e',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '120px 40px 60px', fontFamily: 'Inter, sans-serif' }}>
      <Navbar darkMode={true} onToggleTheme={() => {}} />
      
      <header style={{ marginBottom: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 12 }}>COMMAND CENTER</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, margin: 0 }}>Intelligence Lab</h1>
          <p style={{ color: T.text3, marginTop: 8, fontSize: 16 }}>Platform-wide forensic oversight and retrieval analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>RUN BENCHMARKS</button>
           <button style={{ padding: '12px 24px', borderRadius: 12, background: T.accent, border: 'none', color: T.bg, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>SYSTEM STATUS</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
        {/* MAIN PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* ANALYTICS TILES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { label: 'ACTIVE SESSIONS', value: stats.sessionCount, icon: <ShieldIcon size={16} />, trend: 'Live' },
              { label: 'TOTAL ARTIFACTS', value: stats.totalDocs, icon: <DatabaseIcon size={16} />, trend: 'Indexed' },
              { label: 'MEMORY HEALTH', value: telemetry ? `${Math.round((telemetry.memory.heapUsedNum / 512) * 100)}%` : '...', icon: <ActivityIcon size={16} />, trend: 'Monitored' },
              { label: 'EMBEDDING JOBS', value: telemetry?.activeJobs || 0, icon: <Zap size={16} />, trend: 'Background' }
            ].map((stat, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                   <div style={{ color: T.accent }}>{stat.icon}</div>
                   <div style={{ fontSize: 10, fontWeight: 900, color: '#4ade80' }}>{stat.trend}</div>
                </div>
                <div style={{ fontSize: 10, color: T.text3, fontWeight: 800, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ACTIVE INVESTIGATION SESSIONS (NEW) */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Active Forensic Sessions</h2>
               <div style={{ fontSize: 12, color: T.accent, fontWeight: 800, cursor: 'pointer' }}>ORCHESTRATE ALL</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {activeSessions.length > 0 ? activeSessions.map(sid => (
                 <div key={sid} style={{ padding: '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                       <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldIcon size={20} color={T.accent} />
                       </div>
                       <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{sid}</div>
                          <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>FORENSIC CONTINUITY ACTIVE</div>
                       </div>
                    </div>
                    <button style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text, fontSize: 10, fontWeight: 800 }}>INSPECT</button>
                 </div>
               )) : (
                 <div style={{ padding: '60px 40px', borderRadius: 32, border: `1px dashed ${T.border}`, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <ShieldIcon size={48} style={{ color: T.text3, marginBottom: 24, opacity: 0.5 }} />
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Platform Quiet State</div>
                    <div style={{ fontSize: 14, color: T.text3, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                       No active forensic investigations detected in the current orchestration window. 
                       Start a research session or verify a claim to populate real-time intelligence feeds.
                    </div>
                    <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
                       <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>WAITING FOR INGESTION</div>
                       <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>SYSTEM IDLE</div>
                    </div>
                 </div>
               )}
            </div>
          </section>

          {/* RETRIEVAL ANALYTICS */}
          <section style={{ padding: 32, borderRadius: 32, background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: `1px solid ${T.border}` }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Retrieval Intelligence</h2>
                <div style={{ display: 'flex', gap: 16 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.text3 }}>Confidence</div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.text3 }}>Alignment</div>
                   </div>
                </div>
             </div>
             
             <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
                {[60, 45, 80, 55, 90, 75, 85, 95, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: T.accent, opacity: 0.1 + (h/100), borderRadius: '4px 4px 0 0', position: 'relative' }}>
                    {i === 7 && <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 900, color: T.accent }}>PEAK</div>}
                  </div>
                ))}
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <div key={d} style={{ fontSize: 10, fontWeight: 800, color: T.text3 }}>{d}</div>)}
             </div>
          </section>

        </div>

        {/* SIDE PANEL: Intelligence Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
           <div style={{ padding: 32, borderRadius: 32, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <div style={{ fontSize: 12, fontWeight: 900, color: T.accent, letterSpacing: 2 }}>INTELLIGENCE FEED</div>
                 <RefreshCw size={14} className="spin-slow" style={{ color: T.text3 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                 {feed.map(item => (
                   <div key={item.id} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.type === 'alert' ? '#ef4444' : item.type === 'discovery' ? '#4ade80' : T.accent, marginTop: 4, flexShrink: 0 }} />
                      <div>
                         <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4, marginBottom: 4 }}>{item.message}</div>
                         <div style={{ fontSize: 10, fontWeight: 800, color: T.text3 }}>{item.timestamp.toUpperCase()} • {item.type.toUpperCase()}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div style={{ padding: 32, borderRadius: 32, background: `${T.accent}10`, border: `1px solid ${T.accent}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                 <CpuIcon size={20} color={T.accent} />
                 <div style={{ fontSize: 14, fontWeight: 800 }}>System Health</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, marginBottom: 8 }}>
                       <span style={{ color: T.text3 }}>HEAP USAGE</span>
                       <span style={{ color: T.text }}>242MB / 512MB</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: '47%', background: T.accent }} />
                    </div>
                 </div>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, marginBottom: 8 }}>
                       <span style={{ color: T.text3 }}>CPU LOAD</span>
                       <span style={{ color: T.text }}>14.2%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: '14%', background: '#4ade80' }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
