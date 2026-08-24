import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload, FileText, Send, RefreshCw, Copy, Plus, File, CheckCircle2, ChevronLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../styles/DocumentIntelligence.css';

export default function DocumentIntelligence() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState(null); // 'uploading', 'extracting', 'indexing', 'ready', null
  const [activeDoc, setActiveDoc] = useState(null);
  const [recentInvestigations, setRecentInvestigations] = useState([]);
  const [currentInvestigationId, setCurrentInvestigationId] = useState(null);
  const [showSourcesIdx, setShowSourcesIdx] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const queryInFlightRef = useRef(false);

  const sessionId = useMemo(() => currentInvestigationId || `session_${Math.random().toString(36).slice(2, 9)}`, [currentInvestigationId]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    fetchDocuments();
    fetchRecentInvestigations();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, authLoading, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/rag/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentInvestigations = async () => {
    try {
      const res = await api.get('/api/boards');
      setRecentInvestigations(res.data.boards || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewDocumentFlow = () => {
    setActiveDoc(null);
    setMessages([]);
    setUploadState(null);
    setCurrentInvestigationId(null);
  };

  const getInitialMessageForDoc = (doc) => {
    if (doc.status === 'failed' || doc.extractionFailed || doc.status === 'FAILED_EXTRACT') {
      return [
        {
          role: 'ai',
          content: `We couldn't read enough text from **${doc.filename}**. Try a text-based PDF or an OCR-processed copy.`,
          timestamp: new Date(),
          isError: true
        }
      ];
    } else if (doc.queryable !== true) {
      return [
        {
          role: 'ai',
          content: `This document isn't ready for conversation yet.`,
          timestamp: new Date(),
          isError: true
        }
      ];
    } else {
      return [
        {
          role: 'ai',
          content: `**${doc.filename}** is ready. I've indexed the document and can answer questions grounded in its contents. What would you like to explore?`,
          timestamp: new Date(),
          isFirstGreeting: true
        }
      ];
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate client-side that file is a PDF (Phase 8)
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      setMessages([
        {
          role: 'ai',
          content: "This file type isn't supported yet. Please upload a PDF.",
          timestamp: new Date(),
          isError: true
        }
      ]);
      return;
    }

    setUploadState('uploading');
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // Simulate step progression
      setTimeout(() => setUploadState('extracting'), 800);

      const { data } = await api.post('/api/pdf/ingest', formData);
      
      setUploadState('indexing');
      fetchDocuments();

      // Automatically create a chat session board
      const boardRes = await api.post('/api/boards', {
        title: file.name,
        description: `Conversational session with ${file.name}.`
      });
      fetchRecentInvestigations();
      setCurrentInvestigationId(boardRes.data.board.id);

      let step = 0;
      const MAX_POLL_ATTEMPTS = 30; // 60s max at 2s intervals
      if (pollingRef.current) clearInterval(pollingRef.current);
      const poll = setInterval(async () => {
        try {
          step++;
          if (step === 2) setUploadState('extracting');
          if (step === 4) setUploadState('indexing');

          // Finite polling timeout
          if (step > MAX_POLL_ATTEMPTS) {
            clearInterval(poll);
            pollingRef.current = null;
            setUploadState(null);
            setMessages([
              {
                role: 'ai',
                content: `Processing **${file.name}** is taking longer than expected. Please try again or upload a different file.`,
                timestamp: new Date(),
                isError: true
              }
            ]);
            return;
          }

          const s = await api.get(`/api/pdf/status/${data.docId}`);
          if (s.data.status === 'failed' || s.data.success === false) {
            clearInterval(poll);
            pollingRef.current = null;
            setUploadState(null);
            setMessages([
              { 
                role: 'ai', 
                content: `We couldn't read **${file.name}**. It may be scanned, protected, or contain no extractable text. Try another file or an OCR-processed copy.`, 
                timestamp: new Date(),
                isError: true
              }
            ]);
            return;
          }

          if (s.data.queryable) {
            clearInterval(poll);
            pollingRef.current = null;
            setUploadState('ready');
            fetchDocuments();
            
            const updatedDocs = await api.get('/api/rag/documents');
            const foundDoc = (updatedDocs.data.documents || []).find(d => d.filename === file.name || d.id === data.docId);
            if (foundDoc) {
              setActiveDoc(foundDoc);
              setMessages(getInitialMessageForDoc(foundDoc));
            }

            setTimeout(() => setUploadState(null), 1000);
          }
        } catch (e) {
          clearInterval(poll);
          pollingRef.current = null;
          setUploadState(null);
        }
      }, 2000);
      pollingRef.current = poll;
    } catch (err) {
      console.error(err);
      setUploadState(null);
    }
  };

  const handleSend = async (customPrompt = '') => {
    const queryText = (customPrompt || input).trim();
    if (!queryText || loading || queryInFlightRef.current) return;

    queryInFlightRef.current = true;
    setMessages(prev => [...prev, { role: 'user', content: queryText, timestamp: new Date() }]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/rag/query', { 
        query: queryText, 
        sessionId, 
        mode: 'Deep Analysis',
        documentId: activeDoc?.id 
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.answer,
        sources: res.data.sources || [],
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Failed to retrieve context. Please verify connectivity.", isError: true }]);
    } finally {
      setLoading(false);
      queryInFlightRef.current = false;
    }
  };

  const selectLibraryDoc = (doc) => {
    setActiveDoc(doc);
    setCurrentInvestigationId(doc.id);
    setMessages(getInitialMessageForDoc(doc));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag and Drop Listeners for empty canvas
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerQuickAction = (action) => {
    let prompt = '';
    switch (action) {
      case 'Summarize':
        prompt = 'Provide a summary of the core arguments and conclusions of this document.';
        break;
      case 'Key Insights':
        prompt = 'Identify and list the key insights or takeaways from this document.';
        break;
      case 'Explain Simply':
        prompt = 'Explain the key concepts of this document in simple terms.';
        break;
      case 'Generate Report':
        prompt = 'Format a structured report summarizing the contents of this document.';
        break;
      case 'Find Contradictions':
        prompt = 'Identify any logical gaps, inconsistencies, or contradictions within this document.';
        break;
      case 'Extract Tables':
        prompt = 'Identify and extract any tabular details, statistics, or metrics from the text.';
        break;
      default:
        return;
    }
    handleSend(prompt);
  };

  // Client-side parser to transform backend Source markers into interactive page citations
  const renderMessageContent = (msg) => {
    let content = msg.content;
    if (msg.role === 'ai' && msg.sources && msg.sources.length > 0) {
      content = content.replace(/\[Source (\d+)\]/g, (match, num) => {
        const idx = parseInt(num, 10);
        const src = msg.sources.find(s => s.id === idx);
        if (src && src.metadata && src.metadata.page !== undefined) {
          return `**[Page ${src.metadata.page}]**`;
        }
        return match;
      });
    }
    return content;
  };

  const getMetadataSubtitle = () => {
    if (!activeDoc) return '';
    const parts = [];
    if (activeDoc.pages && activeDoc.pages !== 'N/A' && activeDoc.pages !== 'N/A pages') {
      parts.push(`${activeDoc.pages} pages`);
    }
    if (activeDoc.language && activeDoc.language !== 'N/A') {
      parts.push(activeDoc.language);
    }
    if (activeDoc.uploadTime) {
      parts.push(`Uploaded ${new Date(activeDoc.uploadTime).toLocaleDateString()}`);
    } else {
      parts.push('Uploaded today');
    }
    if (activeDoc.queryable === true) {
      parts.push('Ready for conversation.');
    }
    return parts.join(' • ');
  };

  return (
    <div className="di-layout">
      {/* LEFT SIDEBAR: Library (~20%) */}
      <div className="di-sidebar-left">
        <div className="di-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/')} 
            title="Back to Landing Page" 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#c9a96e', 
              cursor: 'pointer', 
              padding: '6px', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(201, 169, 110, 0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(201, 169, 110, 0.12)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(201, 169, 110, 0.05)'}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="di-sidebar-title">Library</div>
        </div>

        <button className="di-new-btn" onClick={startNewDocumentFlow}>
          <Plus size={14} />
          New Document
        </button>

        <div className="di-sidebar-content">
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className={`di-doc-item ${activeDoc?.id === doc.id ? 'active' : ''}`}
              onClick={() => selectLibraryDoc(doc)}
            >
              <File size={14} style={{ color: 'var(--di-accent)', opacity: 0.6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="di-doc-title">{doc.filename}</div>
                <div className="di-doc-meta">
                  {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Today'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CANVAS: Conversation & Workspace (~80%) */}
      <div className="di-main" onDragOver={handleDragOver} onDrop={handleDrop}>
        {uploadState ? (
          <div className="di-loader-container">
            <RefreshCw className="spin" size={24} color="var(--di-accent)" />
            <div className="di-loader-text">
              {uploadState === 'uploading' && 'Uploading document...'}
              {uploadState === 'extracting' && 'Reading pages...'}
              {uploadState === 'indexing' && 'Understanding content...'}
              {uploadState === 'ready' && 'Ready.'}
            </div>
          </div>
        ) : !activeDoc ? (
          /* Empty State - Centered Upload Desk */
          <div className="di-empty-container">
            <div className="di-empty-title">Document Intelligence</div>
            <div className="di-empty-subtitle">
              Upload your document to start a conversation.
            </div>
            
            <div className="di-dropzone" onClick={() => fileInputRef.current.click()}>
              <Upload size={24} style={{ color: 'var(--di-accent)', marginBottom: 12, opacity: 0.7 }} />
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Drag & drop files here or click to browse</div>
              <div className="di-supported-formats">PDF</div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileUpload(e.target.files[0])} 
                style={{ display: 'none' }} 
                accept=".pdf" 
              />
            </div>
          </div>
        ) : (
          /* Conversational Workspace */
          <>
            <div className="di-chat-header">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="di-chat-title">{activeDoc.filename}</div>
                <div className="di-chat-subtitle">
                  {getMetadataSubtitle()}
                </div>
              </div>
            </div>

            <div className={`di-feed ${messages.length === 1 ? 'centered' : ''}`}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`di-message ${msg.role}`}>
                  <div className="di-bubble">
                    <ReactMarkdown>{renderMessageContent(msg)}</ReactMarkdown>

                    {/* Compact Document Preview (Polished details block) */}
                    {msg.isFirstGreeting && (
                      <div style={{
                        marginTop: '16px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px dashed rgba(255, 255, 255, 0.05)',
                        maxWidth: '520px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <FileText size={16} color="var(--di-accent)" />
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--di-text-primary)' }}>{activeDoc.filename}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--di-text-muted)', lineHeight: '1.5' }}>
                          Status: Ingested & Indexed • Text excerpt secured. Context boundaries parsed.
                        </div>
                      </div>
                    )}
                    
                    {/* Suggestion Chips placed directly under first AI greeting */}
                    {msg.isFirstGreeting && activeDoc?.queryable === true && (
                      <div className="di-chips-container">
                        {['Summarize', 'Key Insights', 'Explain Simply', 'Generate Report', 'Find Contradictions', 'Extract Tables'].map(action => (
                          <button 
                            key={action} 
                            className="di-chip"
                            onClick={() => triggerQuickAction(action)}
                            disabled={loading}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.role === 'ai' && !msg.isFirstGreeting && (
                      <div className="di-msg-actions">
                        <button className="di-msg-action-btn" onClick={() => navigator.clipboard.writeText(msg.content)}>
                          Copy
                        </button>
                        {msg.sources && msg.sources.length > 0 && (
                          <div style={{ position: 'relative' }}>
                            <button 
                              className="di-msg-action-btn"
                              onClick={() => setShowSourcesIdx(showSourcesIdx === idx ? null : idx)}
                            >
                              Sources ({msg.sources.length})
                            </button>
                            {showSourcesIdx === idx && (
                              <div className="di-sources-tooltip">
                                {msg.sources.map((s, si) => (
                                  <div key={si} className="di-source-item">
                                    • {s.label || s.filename || 'Source segment'} (Score: {Math.round((s.score || 0.8) * 100)}%)
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {activeDoc?.queryable === true && (
                          <button className="di-msg-action-btn" onClick={() => triggerQuickAction('Summarize')}>
                            Continue
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="di-input-container">
              <div className="di-input-wrapper">
                <textarea
                  className="di-input"
                  placeholder={activeDoc?.queryable !== true ? "Conversation disabled for this document." : "Ask anything about this document..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={activeDoc?.queryable !== true}
                />
                <button 
                  className="di-send-btn"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || activeDoc?.queryable !== true}
                >
                  {loading ? <RefreshCw className="spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
