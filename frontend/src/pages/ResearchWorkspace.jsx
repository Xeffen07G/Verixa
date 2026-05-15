import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, FileText, Send, RefreshCw, BookOpen, MessageSquare, 
  Shield, Activity, Download, Layout, Cpu, Database, Database as DatabaseIcon,
  Globe, Info, Search as SearchIcon, List, ChevronRight, BarChart3, Bookmark, 
  ExternalLink, Target as TargetIcon, Shield as ShieldIcon, Send as SendIcon,
  Upload as UploadIcon, AlertTriangle, FileJson, Clock, Save, Eye, Layers,
  CheckCircle2, TrendingUp, GitBranch
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { t } from '../utils/i18n';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InvestigationPanel from '../components/InvestigationPanel';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function ResearchWorkspace() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  
  const [vaultDocs, setVaultDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [activeMode, setActiveMode] = useState('Deep Analysis');
  const [investigations, setInvestigations] = useState([]);
  const [currentInvestigationId, setCurrentInvestigationId] = useState(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [telemetry, setTelemetry] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const modes = ["Scholar", "Skeptic", "Contradiction Hunter", "Literature Review", "Methodology Analysis", "Deep Analysis"];

  const sessionId = useMemo(() => currentInvestigationId || `session_${Math.random().toString(36).slice(2, 9)}`, [currentInvestigationId]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    fetchVaultDocs();
    fetchInvestigations();
    if (showTelemetry) fetchTelemetry();
  }, [user, authLoading, navigate, showTelemetry]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVaultDocs = async () => {
    try {
      const res = await api.get('/api/rag/documents');
      setVaultDocs(res.data.documents || []);
    } catch (err) { console.error(err); }
  };

  const fetchInvestigations = async () => {
    try {
      const res = await api.get('/api/boards');
      setInvestigations(res.data.boards || []);
    } catch (err) { console.error(err); }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await api.get('/api/admin/telemetry');
      setTelemetry(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus({ status: 'loading', message: 'Extracting forensic artifacts...' });
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const { data } = await api.post('/api/pdf/ingest', formData);
      setUploadStatus({ status: 'success', message: 'READY_BASIC: Intelligence indexed' });
      fetchVaultDocs();
      
      const poll = setInterval(async () => {
        try {
          const s = await api.get(`/api/pdf/status/${data.docId}`);
          if (s.data.status === 'READY_SEMANTIC') {
            clearInterval(poll);
            fetchVaultDocs();
            setUploadStatus({ status: 'success', message: 'READY_SEMANTIC: Enhancement complete' });
            setTimeout(() => setUploadStatus(null), 3000);
          }
        } catch (e) { clearInterval(poll); }
      }, 5000);
    } catch (err) {
      setUploadStatus({ status: 'error', message: 'INGESTION FAILED' });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userQuery = input;
    setMessages(prev => [...prev, { role: 'user', content: userQuery, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/rag/query', { query: userQuery, sessionId, mode: activeMode });
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: res.data.answer,
        sources: res.data.sources,
        confidence: res.data.confidence,
        confidenceLabel: res.data.confidenceLabel,
        contradictions: res.data.contradictions,
        mode: res.data.mode,
        intent: res.data.intent,
        fallbackTriggered: res.data.fallbackTriggered || false,
        timestamp: new Date(),
        telemetry: res.data.telemetry,
        relationships: (res.data.sources || []).map(s => ({
          type: s.score > 0.7 ? 'supporting' : 'relevant',
          source: s.label,
          credibility: s.credibility?.score || 0.5
        }))
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Evidence retrieval temporarily unavailable. Please verify system connectivity or vault status.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const res = await api.post('/api/rag/report', { sessionId });
      const blob = new Blob([res.data.report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Forensic_Report_${sessionId}.md`;
      a.click();
    } catch (err) { console.error("Report failed:", err); }
  };

  const loadDemo = async (file) => {
    try {
      const res = await fetch(`/demo/${file}`);
      const demoData = await res.json();
      
      const demoMessages = [
        { role: 'user', content: `Analyze investigation: ${demoData.investigationName}`, timestamp: new Date() },
        { 
          role: 'ai', 
          content: demoData.forensicConclusion,
          timestamp: new Date(),
          intent: 'SYNTHESIS',
          confidenceLabel: 'HIGH',
          relationships: demoData.findings.map(f => ({
            type: 'supporting',
            source: f.source,
            credibility: 0.92
          })),
          contradictions: demoData.findings.filter(f => f.contradiction).map(f => ({ explanation: f.contradiction }))
        }
      ];
      setMessages(demoMessages);
      setUploadStatus({ status: 'success', message: 'DEMO_MODE: Forensic artifacts pre-loaded' });
    } catch (err) {
      console.error("Demo load failed:", err);
    }
  };

  const exportResearch = (format) => {
    let content = "";
    let filename = `VeriXa_Forensic_Export_${new Date().toISOString().slice(0,10)}`;
    if (format === 'json') {
      content = JSON.stringify({ session: sessionId, timestamp: new Date().toISOString(), messages, vaultCount: vaultDocs.length }, null, 2);
      filename += ".json";
    } else {
      content = `# VeriXa Forensic Intelligence Report\n\nSession: ${sessionId}\nDate: ${new Date().toLocaleString()}\n\n---\n\n`;
      messages.forEach(m => {
        content += `### ${m.role.toUpperCase()} [${m.mode || ''}]\n\n${m.content}\n\n`;
      });
      filename += ".md";
    }
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const saveInvestigation = async () => {
    try {
      const res = await api.post('/api/boards', { 
        title: `Investigation ${new Date().toLocaleDateString()}`,
        description: `Persistent research session with ${messages.length} interactions.`
      });
      fetchInvestigations();
      setCurrentInvestigationId(res.data.board.id);
    } catch (err) { console.error(err); }
  };

  const T = {
    bg: '#0a0a0f',
    bg2: '#111118',
    border: 'rgba(255,255,255,0.07)',
    text: '#f5f3ef',
    text2: 'rgba(245,243,239,0.7)',
    text3: 'rgba(245,243,239,0.35)',
    accent: '#c9a96e',
    accentDim: 'rgba(201,169,110,0.1)',
  };

  return (
    <div style={{ height: '100vh', display: 'flex', background: T.bg, color: T.text, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* LEFT PANEL: Research Vault & Case Files */}
      <div style={{ width: 320, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ padding: '32px 24px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 8 }}>RESEARCH VAULT</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: T.text }}>Case Files</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div 
            onClick={() => fileInputRef.current.click()}
            style={{ 
              padding: '32px 16px', borderRadius: 16, border: `1px solid ${T.border}`, textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.3s', background: 'rgba(255,255,255,0.02)', marginBottom: 32
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = 'rgba(201,169,110,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf" />
            <UploadIcon size={20} style={{ color: T.accent, marginBottom: 12, opacity: 0.8 }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.text }}>INGEST ARTIFACT</div>
            <div style={{ fontSize: 9, color: T.text3, marginTop: 4 }}>PDF • MAX 10MB</div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1, marginBottom: 12 }}>CASE FILES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {Array.isArray(investigations) && investigations.map(inv => (
              <div key={inv.id} onClick={() => setCurrentInvestigationId(inv.id)} style={{ padding: '12px 16px', borderRadius: 12, background: sessionId === inv.id ? `${T.accent}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${sessionId === inv.id ? T.accent : T.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                {inv.title}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1, marginBottom: 12 }}>FORENSIC ARTIFACTS</div>
          {Array.isArray(vaultDocs) && vaultDocs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vaultDocs.map(doc => (
                <div key={doc.id} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={14} style={{ color: T.accent }} />
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</div>
                  </div>
                  <div style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(201,169,110,0.1)', color: T.accent, fontWeight: 900, textTransform: 'uppercase', marginTop: 8, width: 'fit-content' }}>{doc.status || 'READY'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.2 }}>
              <DatabaseIcon size={32} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 10 }}>Vault Empty</div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL: Intelligence Thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg }}>
        <div style={{ padding: '24px 40px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>MODE</span>
              <select 
                value={activeMode} 
                onChange={e => setActiveMode(e.target.value)}
                style={{ background: 'none', border: 'none', color: T.accent, fontSize: 11, fontWeight: 800, outline: 'none', cursor: 'pointer' }}
              >
                {Array.isArray(modes) && modes.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
            <button onClick={() => setShowTelemetry(!showTelemetry)} style={{ background: 'none', border: 'none', color: showTelemetry ? T.accent : T.text3, cursor: 'pointer', opacity: 0.8 }} title="System Telemetry">
              <Activity size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button onClick={generateReport} style={{ background: 'rgba(201,169,110,0.1)', border: `1px solid ${T.accent}`, color: T.accent, padding: '6px 16px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} /> FORENSIC REPORT
             </button>
             <button onClick={() => exportResearch('md')} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer' }} title="Export Markdown"><Download size={16} /></button>
             <button onClick={saveInvestigation} style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer' }} title="Save Case File"><Save size={16} /></button>
          </div>
        </div>

        {/* Telemetry Overlay */}
        {showTelemetry && telemetry && (
          <div style={{ background: 'rgba(20,20,30,0.95)', borderBottom: `1px solid ${T.accent}33`, padding: '12px 32px', display: 'flex', gap: 32, backdropFilter: 'blur(10px)' }}>
             {[
               { label: 'MEMORY', value: telemetry?.memory?.heapUsed || '...' },
               { label: 'SESSIONS', value: telemetry.sessions },
               { label: 'TASKS', value: telemetry.activeJobs },
               { label: 'INDEX', value: telemetry.chunkCount }
             ].map(s => (
               <div key={s.label}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: T.text3, letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.accent }}>{s.value}</div>
               </div>
             ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 64px' }}>
          {(!Array.isArray(messages) || messages.length === 0) ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', marginBottom: 64 }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(201,169,110,0.05)', border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                  <Shield size={32} color={T.accent} />
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, marginBottom: 12, letterSpacing: -1 }}>Forensic Intelligence Lab</h2>
                <div style={{ fontSize: 16, maxWidth: 440, margin: '0 auto', color: T.text2, fontWeight: 300, lineHeight: 1.6 }}>Ingest artifacts to begin cross-document interrogation or select a pre-configured investigation.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', maxWidth: 720 }}>
                {[
                  { file: 'ai_bias_conflict.json', title: 'LLM Bias & Safety', desc: 'Map contradictions in safety alignment research.' },
                  { file: 'climate_contradiction.json', title: 'Climate Data Audit', desc: 'Analyze conflicting Arctic melt velocity metrics.' },
                  { file: 'misinformation_verification.json', title: 'Vaccine Misinfo Audit', desc: 'Cross-reference viral claims against peer-reviewed data.' },
                  { file: 'methodology_conflict.json', title: 'Replication Crisis', desc: 'Trace replication failures in psychology priming studies.' }
                ].map(d => (
                  <div key={d.file} style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => loadDemo(d.file)} onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: T.accent, letterSpacing: 2, marginBottom: 12 }}>SAMPLE DATA</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.5 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>

              
              <div style={{ marginTop: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, letterSpacing: 2, marginBottom: 16 }}>SUGGESTED WORKFLOWS</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {["Analyze methodology gaps", "Identify source contradictions", "Extract p-value alignments", "Synthesize findings"].map(w => (
                    <div key={w} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${T.border}`, fontSize: 10, fontWeight: 800, color: T.text3 }}>{w.toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {Array.isArray(messages) && messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%', width: '100%', display: 'flex', gap: 20, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                    {msg.role === 'user' ? <MessageSquare size={16} /> : <ShieldIcon size={16} color={T.accent} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    {msg.role === 'user' ? (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: '24px 24px 4px 24px', border: `1px solid ${T.border}`, width: 'fit-content', marginLeft: 'auto' }}>
                         <div style={{ fontSize: 14, fontWeight: 500 }}>{msg.content}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                           <div style={{ fontSize: 10, fontWeight: 900, color: T.accent, letterSpacing: 1.5 }}>
                             {msg.fallbackTriggered
                               ? 'SCHOLARLY SYNTHESIS • LIMITED'
                               : (msg.intent === 'SYNTHESIS' || msg.intent === 'EXPLORATORY')
                                 ? 'SCHOLARLY SYNTHESIS'
                                 : 'VERIXA INTELLIGENCE'}
                           </div>
                           <div style={{ fontSize: 9, color: T.text3 }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '...'}</div>
                           <div style={{
                             fontSize: 8, padding: '2px 6px', borderRadius: 4, fontWeight: 900,
                             background: msg.confidenceLabel === 'HIGH' ? '#4ade8022' : msg.confidenceLabel === 'MEDIUM' ? '#60a5fa22' : msg.confidenceLabel === 'LIMITED' ? '#fbbf2422' : msg.confidenceLabel === 'LOW' ? '#f8717122' : '#64748b22',
                             color: msg.confidenceLabel === 'HIGH' ? '#4ade80' : msg.confidenceLabel === 'MEDIUM' ? '#60a5fa' : msg.confidenceLabel === 'LIMITED' ? '#fbbf24' : msg.confidenceLabel === 'LOW' ? '#f87171' : '#64748b'
                           }}>{msg.confidenceLabel}</div>
                           {msg.telemetry && <div style={{ fontSize: 8, color: T.text3, fontWeight: 700 }}>{msg.telemetry.retrieval_chunks} chunks • {msg.telemetry.detected_intent}</div>}
                        </div>
                        <div className="scholarly-answer" style={{ 
                          fontSize: 15, lineHeight: 1.8, color: T.text, 
                          background: (msg.intent === 'SYNTHESIS' || msg.intent === 'EXPLORATORY') ? 'rgba(201,169,110,0.02)' : 'rgba(255,255,255,0.01)', 
                          padding: '32px 40px', borderRadius: 24, border: `1px solid ${(msg.intent === 'SYNTHESIS' || msg.intent === 'EXPLORATORY') ? `${T.accent}33` : T.border}`, 
                          boxShadow: (msg.intent === 'SYNTHESIS' || msg.intent === 'EXPLORATORY') ? `0 20px 60px ${T.accent}05` : 'none'
                        }}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        
                        {/* Evidence Relationship Visualization */}
                        {msg.relationships && (
                          <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, marginTop: 8 }}>
                             <div style={{ fontSize: 9, fontWeight: 900, color: T.text3, letterSpacing: 1.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GitBranch size={12} /> EVIDENCE RELATIONSHIP TREE
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {Array.isArray(msg.relationships) && msg.relationships.map((rel, ri) => (
                                  <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12, borderLeft: `1px solid ${T.border}` }}>
                                     <div style={{ width: 6, height: 6, borderRadius: '50%', background: rel.type === 'supporting' ? '#4ade80' : T.accent }} />
                                     <div style={{ fontSize: 11, fontWeight: 700, color: T.text2 }}>{rel.source}</div>
                                     <div style={{ fontSize: 9, color: T.text3 }}>{rel.type.toUpperCase()}</div>
                                     <div style={{ flex: 1, height: 1, background: T.border, opacity: 0.3 }} />
                                     <div style={{ fontSize: 10, fontWeight: 900, color: T.accent }}>{Math.round(rel.credibility * 100)}% TRUST</div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        {msg.contradictions && msg.contradictions.length > 0 && (
                          <div style={{ padding: 16, borderRadius: 16, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 12 }}>
                            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                            <div>
                               <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', marginBottom: 4 }}>CONTRADICTION DETECTED</div>
                                {Array.isArray(msg.contradictions) && msg.contradictions.map((c, ci) => (
                                 <div key={ci} style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{c.explanation}</div>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* INPUT: Forensic Interrogation */}
        <div style={{ padding: '24px 64px', background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 24, border: `1px solid ${T.border}` }}>
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', color: T.text3 }}><TargetIcon size={18} /></div>
            <input 
              style={{ flex: 1, background: 'none', border: 'none', color: T.text, padding: '12px 0', fontSize: 14, outline: 'none' }}
              placeholder={`Interrogate vault using ${activeMode} mode...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: 16, background: loading ? 'rgba(255,255,255,0.05)' : T.accent, color: T.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? <RefreshCw className="spin" size={20} /> : <SendIcon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Evidence Deep-Dive & Timeline */}
      <div style={{ width: 380, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: T.accent, letterSpacing: 1.5, marginBottom: 4 }}>ANALYSIS CENTER</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Forensic Details</div>
          </div>
          <Clock size={18} style={{ color: T.text3 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {selectedSource ? (
            <div style={{ padding: 20, animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: T.accent, letterSpacing: 1 }}>SOURCE INSPECTION</div>
                <button onClick={() => setSelectedSource(null)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 10, fontWeight: 800 }}>CLOSE</button>
              </div>
              <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                   <div style={{ fontSize: 10, color: T.text3, fontWeight: 800 }}>SOURCE TYPE</div>
                   <div style={{ fontSize: 10, color: T.accent, fontWeight: 900 }}>{selectedSource?.credibility?.type?.toUpperCase() || 'N/A'}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, marginBottom: 12 }}>{selectedSource.metadata.source}</div>
                <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}` }}>
                   <div style={{ fontSize: 9, color: T.text3, fontWeight: 800, marginBottom: 4 }}>TRUST RATIONALE</div>
                   <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.5 }}>{selectedSource?.credibility?.rationale || 'No rationale available.'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                 <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 8, color: T.text3, fontWeight: 800, marginBottom: 4 }}>ALIGNMENT</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.accent }}>{selectedSource.metadata.alignment}</div>
                 </div>
                 <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 8, color: T.text3, fontWeight: 800, marginBottom: 4 }}>RELIABILITY</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#4ade80' }}>{selectedSource?.credibility?.score ? Math.round(selectedSource.credibility.score * 100) : 0}%</div>
                 </div>
              </div>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 12, letterSpacing: 1 }}>EVIDENCE EXCERPT</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: T.text2, fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 16, border: `1px solid ${T.border}` }}>"{selectedSource.text}"</div>
            </div>
          ) : (
            <InvestigationPanel sessionId={sessionId} T={T} />
          )}
        </div>
      </div>
    </div>
  );
}
