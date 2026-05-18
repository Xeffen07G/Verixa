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

  const [activeSessions, setActiveSessions] = useState([]);
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetchActiveSessions();
    fetchTelemetry();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get('/api/investigation/active');
      setActiveSessions(res.data || []);
    } catch (err) { 
        console.error(err); 
    }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await api.get('/api/admin/telemetry');
      setTelemetry(res.data);
      setStats({
        sessionCount: res.data.sessions,
        totalDocs: res.data.vaultSize,
        contradictionCount: 4,
        avgConfidence: 84.5
      });
    } catch (err) { 
        console.error(err); 
    }
  };

  const T = {
    bg: '#0a0a0f',
    bg2: '#111118',
    border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)',
    text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '160px 80px 80px' }}>
      <Navbar darkMode={true} onToggleTheme={() => {}} />
      
      <header style={{ marginBottom: 120, maxWidth: 800 }}>
        <div style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: T.accent, fontWeight: 900, marginBottom: 24 }}>PLATFORM OVERSIGHT</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 300, margin: 0, letterSpacing: -1 }}>Intelligence Lab</h1>
        <p style={{ color: T.text2, marginTop: 24, fontSize: 20, lineHeight: 1.6, fontWeight: 300 }}>
          Centralized forensic telemetry and retrieval oversight for the VeriXa pipeline. 
          Monitor active investigations and system integrity across all research branches.
        </p>
      </header>

      <div className="intelligence-grid">
        {/* MAIN PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          
          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 40 }}>ACTIVE INVESTIGATIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
               {Array.isArray(activeSessions) && activeSessions.length > 0 ? activeSessions.map(sid => (
                 <div key={sid} style={{ paddingBottom: 32, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{sid}</div>
                       <div style={{ fontSize: 12, color: T.text3, fontWeight: 500, letterSpacing: 1 }}>FORENSIC CONTINUITY ACTIVE</div>
                    </div>
                    <ChevronRight size={20} color={T.accent} style={{ opacity: 0.5 }} />
                 </div>
               )) : (
                 <div style={{ padding: '80px 40px', borderRadius: 24, border: `1px solid ${T.border}`, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: T.text3 }}>Platform Idle State</div>
                 </div>
               )}
            </div>
          </section>

          <section>
             <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 40 }}>RETRIEVAL ANALYTICS</div>
             <div style={{ height: 300, border: `1px solid ${T.border}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ color: T.text3, fontSize: 14, fontWeight: 300 }}>Heuristic mapping active across {stats.totalDocs} artifacts.</div>
             </div>
          </section>

        </div>

        {/* SIDE PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
           <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 32 }}>SYSTEM TELEMETRY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Memory Heap</div>
                    <div style={{ fontSize: 24, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif' }}>
                       {telemetry?.memory?.heapUsedNum ? Math.round(telemetry.memory.heapUsedNum) : 0} MB / 512 MB
                    </div>
                 </div>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Vault Ingestion</div>
                    <div style={{ fontSize: 24, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif' }}>
                       {stats.totalDocs} Forensic Artifacts
                    </div>
                 </div>
                 <div>
                    <div style={{ fontSize: 13, color: T.text2, marginBottom: 12 }}>Active Threads</div>
                    <div style={{ fontSize: 24, fontWeight: 300, fontFamily: 'Cormorant Garamond, serif' }}>
                       {stats.sessionCount} Concurrent Sessions
                    </div>
                 </div>
              </div>
           </div>

           <div style={{ padding: 40, borderRadius: 24, background: 'rgba(201,169,110,0.03)', border: `1px solid ${T.accent}20` }}>
              <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 16 }}>Operational Stability</div>
              <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, fontWeight: 300 }}>
                 The VeriXa pipeline is currently running in SAFE_MODE with automated retry logic enabled for all retrieval stages.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
