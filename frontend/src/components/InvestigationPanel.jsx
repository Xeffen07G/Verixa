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
    const interval = setInterval(fetchSession, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!session) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ padding: '32px 24px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 8 }}>EVIDENCE LEDGER</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: T.text }}>Forensic Depth: {session.trustScore || 0}%</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.isArray(session?.evidenceLedger) && session.evidenceLedger.slice().reverse().map((e, idx) => (
            <div key={idx} style={{ paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 0.5 }}>{e.source.toUpperCase()}</div>
                 <div style={{ fontSize: 10, fontWeight: 800, color: T.text3 }}>{Math.round(e.confidence * 100)}% RELIABILITY</div>
              </div>
              <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, fontStyle: 'italic' }}>
                 "{e.text}"
              </div>
            </div>
          ))}
          
          {(!session?.evidenceLedger || session.evidenceLedger.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
               <div style={{ fontSize: 12, fontWeight: 500 }}>No forensic artifacts secured.</div>
            </div>
          )}
        </div>
      </div>
      
      {Array.isArray(session?.contradictions) && session.contradictions.length > 0 && (
        <div style={{ padding: 24, background: 'rgba(239,68,68,0.02)', borderTop: '1px solid rgba(239,68,68,0.1)' }}>
           <div style={{ fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: 2, marginBottom: 12 }}>CRITICAL CONTRADICTIONS</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {session.contradictions.map((c, idx) => (
                <div key={idx} style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>• {c.explanation}</div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
