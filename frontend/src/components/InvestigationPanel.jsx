import React, { useState, useEffect } from 'react';
import { 
  Shield, History, BarChart3, AlertTriangle, 
  CheckCircle2, GitBranch, Search, ChevronRight,
  Database, Activity, FileText
} from 'lucide-react';
import api from '../utils/api';

/**
 * Unified Investigation Panel
 * Provides global forensic context (Evidence Ledger, Timeline, Trust Score)
 */
export default function InvestigationPanel({ sessionId, T }) {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('ledger'); // ledger | timeline | analytics

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/investigation/${sessionId}`);
        setSession(res.data);
      } catch (err) {
        console.error("Failed to fetch investigation context", err);
      }
    };
    fetchSession();
    const interval = setInterval(fetchSession, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!session) return null;

  return (
    <div style={{ 
      width: 320, height: '100%', background: '#0a0a0f', 
      borderLeft: `1px solid rgba(255,255,255,0.05)`, display: 'flex', flexDirection: 'column' 
    }}>
      {/* Trust Score Header */}
      <div style={{ padding: 24, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 16 }}>
          INVESTIGATION TRUST SCORE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
             <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="32" cy="32" r="28" fill="none" stroke={T.accent} strokeWidth="4" 
                  strokeDasharray={`${((session?.trustScore || 0) / 100) * 176} 176`}
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: T.text }}>
                 {session?.trustScore || 0}
             </div>
          </div>
          <div>
             <div style={{ fontSize: 12, fontWeight: 700, color: (session?.trustScore || 0) > 70 ? '#4ade80' : '#f87171' }}>
                {(session?.trustScore || 0) > 70 ? 'VERIFIED DEPTH' : 'LOW EVIDENCE'}
             </div>
             <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                 {session?.evidenceLedger?.length || 0} artifacts secured
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        {[
          { id: 'ledger', icon: Database, label: 'LEDGER' },
          { id: 'timeline', icon: History, label: 'LOG' },
          { id: 'analytics', icon: Activity, label: 'REL' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              flex: 1, padding: '12px 0', background: 'transparent', border: 'none', 
              color: activeTab === tab.id ? T.accent : 'rgba(255,255,255,0.3)',
              borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : 'none',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <tab.icon size={12} />
            <span style={{ fontSize: 9, fontWeight: 900 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.isArray(session?.evidenceLedger) && session.evidenceLedger.slice().reverse().map((e, idx) => (
               <div key={idx} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                     <div style={{ fontSize: 9, fontWeight: 900, color: T.accent }}>{e.source}</div>
                     <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{Math.round(e.confidence * 100)}% Match</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(245,243,239,0.7)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                     {e.text}
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingLeft: 8 }}>
              {Array.isArray(session?.timeline) && session.timeline.slice().reverse().map((ev, idx) => (
               <div key={idx} style={{ position: 'relative', paddingLeft: 20, borderLeft: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ 
                    position: 'absolute', left: -5, top: 0, width: 9, height: 9, borderRadius: '50%', 
                    background: ev.type === 'CONTRADICTION_DETECTED' ? '#ef4444' : T.accent,
                    boxShadow: `0 0 10px ${ev.type === 'CONTRADICTION_DETECTED' ? '#ef4444' : T.accent}44`
                  }} />
                  <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                     {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f5f3ef', marginBottom: 2 }}>{ev.type.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{ev.description}</div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ height: 200, background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`, position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                   {/* Relationship lines */}
                   {Array.isArray(session?.evidenceLedger) && session.evidenceLedger.slice(0, 5).map((e, i) => (
                     <line 
                        key={`line-${i}`}
                        x1="50%" y1="50%" 
                        x2={`${20 + (i * 15)}%`} y2={`${20 + (i * 15)}%`}
                        stroke={T.accent} strokeWidth="1" strokeOpacity="0.2"
                     />
                   ))}
                   {/* Central Query Node */}
                   <circle cx="50%" cy="50%" r="6" fill={T.accent} />
                   <text x="50%" y="65%" textAnchor="middle" fontSize="8" fill={T.accent} fontWeight="900">CORE CLAIM</text>

                   {/* Evidence Nodes */}
                   {Array.isArray(session?.evidenceLedger) && session.evidenceLedger.slice(0, 5).map((e, i) => (
                     <g key={`node-${i}`}>
                        <circle 
                          cx={`${20 + (i * 15)}%`} 
                          cy={`${20 + (i * 15)}%`} 
                          r="4" 
                          fill={e.confidence > 0.7 ? '#4ade80' : T.accent} 
                        />
                        <text x={`${20 + (i * 15)}%`} y={`${20 + (i * 15) + 12}%`} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)">SRC {i+1}</text>
                     </g>
                   ))}
                </svg>
                <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 8, fontWeight: 900, color: T.accent, letterSpacing: 1 }}>SVG RESEARCH GRAPH v1.0</div>
             </div>
             
             <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 }}>RELATIONSHIP LEDGER</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 {Array.isArray(session?.contradictions) && session.contradictions.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                     <AlertTriangle size={12} color="#ef4444" />
                     <div style={{ fontSize: 10, color: '#f5f3ef', lineHeight: 1.4 }}>{c.explanation}</div>
                  </div>
                ))}
                 {(session?.evidenceLedger?.length || 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)' }}>
                     <CheckCircle2 size={12} color="#4ade80" />
                      <div style={{ fontSize: 10, color: '#f5f3ef', lineHeight: 1.4 }}>Consensus cluster detected across {session?.evidenceLedger?.length || 0} artifacts.</div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
