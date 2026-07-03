import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload, FileText, Send, RefreshCw, Copy, Plus, File, CheckCircle2
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

  const sessionId = useMemo(() => currentInvestigationId || `session_${Math.random().toString(36).slice(2, 9)}`, [currentInvestigationId]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    fetchDocuments();
    fetchRecentInvestigations();
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

  const handleFileUpload = async (file) => {
    if (!file) return;

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
      const poll = setInterval(async () => {
        try {
          // Incrementally simulate steps on client during polling
          step++;
          if (step === 2) setUploadState('extracting');
          if (step === 4) setUploadState('indexing');

          const s = await api.get(`/api/pdf/status/${data.docId}`);
          if (s.data.status === 'READY_SEMANTIC' || s.data.status === 'READY_BASIC' || s.data.status === 'completed') {
            clearInterval(poll);
            setUploadState('ready');
            fetchDocuments();
            
            // Set uploaded file as active
            const updatedDocs = await api.get('/api/rag/documents');
            const foundDoc = (updatedDocs.data.documents || []).find(d => d.filename === file.name || d.id === data.docId);
            const resolvedDoc = foundDoc || { id: data.docId, filename: file.name, pages: 12, language: 'English', uploadTime: new Date() };
            setActiveDoc(resolvedDoc);

            // Contextual welcome message in chat feed (Welcoming and capability checklist)
            setMessages([
              { 
                role: 'ai', 
                content: `I've finished reading "${file.name}".\n\nYou can ask me to:\n- summarize the document\n- explain specific sections\n- find key ideas\n- answer questions using only the uploaded content\n- generate a report`, 
                timestamp: new Date(),
                isFirstGreeting: true
              }
            ]);

            setTimeout(() => setUploadState(null), 1000);
          }
        } catch (e) {
          clearInterval(poll);
          setUploadState(null);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setUploadState(null);
    }
  };

  const handleSend = async (customPrompt = '') => {
    const queryText = (customPrompt || input).trim();
    if (!queryText || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: queryText, timestamp: new Date() }]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/rag/query', { query: queryText, sessionId, mode: 'Deep Analysis' });
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
    }
  };

  const selectRecentDoc = async (inv) => {
    setCurrentInvestigationId(inv.id);
    const match = documents.find(d => inv.title.includes(d.filename) || d.filename.includes(inv.title));
    const resolvedDoc = match || { id: inv.id, filename: inv.title, pages: 'N/A', language: 'English', uploadTime: inv.createdAt || new Date() };
    setActiveDoc(resolvedDoc);

    setMessages([
      { 
        role: 'ai', 
        content: `I've finished reading "${inv.title}".\n\nYou can ask me to:\n- summarize the document\n- explain specific sections\n- find key ideas\n- answer questions using only the uploaded content\n- generate a report`, 
        timestamp: new Date(),
        isFirstGreeting: true
      }
    ]);
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

  return (
    <div className="di-layout">
      {/* LEFT SIDEBAR: Library (~20%) */}
      <div className="di-sidebar-left">
        <div className="di-sidebar-header">
          <div className="di-sidebar-title">Library</div>
        </div>

        <button className="di-new-btn" onClick={startNewDocumentFlow}>
          <Plus size={14} />
          New Document
        </button>

        <div className="di-sidebar-content">
          {recentInvestigations.map(inv => (
            <div 
              key={inv.id} 
              className={`di-doc-item ${currentInvestigationId === inv.id ? 'active' : ''}`}
              onClick={() => selectRecentDoc(inv)}
            >
              <File size={14} style={{ color: '#c9a96e', opacity: 0.6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="di-doc-title">{inv.title}</div>
                <div className="di-doc-meta">
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Today'}
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
            <RefreshCw className="spin" size={24} color="#c9a96e" />
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
              <Upload size={24} style={{ color: '#c9a96e', marginBottom: 12, opacity: 0.7 }} />
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Drag & drop files here or click to browse</div>
              <div className="di-supported-formats">PDF • DOCX • PPTX • TXT • CSV • XLSX</div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileUpload(e.target.files[0])} 
                style={{ display: 'none' }} 
                accept=".pdf,.docx,.pptx,.txt,.csv,.xlsx" 
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
                  {activeDoc.pages || '12'} pages • {activeDoc.language || 'English'} • Uploaded {activeDoc.uploadTime ? new Date(activeDoc.uploadTime).toLocaleDateString() : 'today'} • Ready for conversation.
                </div>
              </div>
            </div>

            <div className={`di-feed ${messages.length === 1 ? 'centered' : ''}`}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`di-message ${msg.role}`}>
                  <div className="di-bubble">
                    <ReactMarkdown>{renderMessageContent(msg)}</ReactMarkdown>
                    
                    {/* Suggestion Chips placed directly under first AI greeting */}
                    {msg.isFirstGreeting && (
                      <div className="di-chips-container">
                        {['Summarize', 'Key Insights', 'Explain Simply', 'Generate Report', 'Find Contradictions', 'Extract Tables'].map(action => (
                          <button 
                            key={action} 
                            className="di-chip"
                            onClick={() => triggerQuickAction(action)}
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
                        <button className="di-msg-action-btn" onClick={() => triggerQuickAction('Summarize')}>
                          Continue
                        </button>
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
                  placeholder="Ask anything about this document..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button 
                  className="di-send-btn"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
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
