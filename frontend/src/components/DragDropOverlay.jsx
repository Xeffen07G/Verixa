import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../utils/api';

/**
 * Global Drag & Drop overlay — works on every page
 * Accepts PDF, images (jpg/png/webp), and text files (.txt/.md/.csv)
 * Routes to appropriate page after processing
 */
export default function DragDropOverlay({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const dragCounter = useRef(0);
  const navigate = useNavigate();

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = useCallback(async (file) => {
    const type = file.type;
    const name = file.name.toLowerCase();

    // ── PDF ──
    if (type === 'application/pdf') {
      setProcessing(true);
      setProcessingMsg('Extracting text from PDF...');
      try {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await api.post('/api/pdf', formData);
        const data = res.data;
        // Store extracted text and navigate
        sessionStorage.setItem('verixa-dragdrop-text', data.text);
        navigate('/verify?source=dragdrop');
      } catch (e) {
        alert('PDF Error: ' + e.message);
      } finally {
        setProcessing(false);
        setProcessingMsg('');
      }
      return;
    }

    // ── Images ──
    if (type.startsWith('image/')) {
      setProcessing(true);
      setProcessingMsg('Preparing image for analysis...');
      try {
        const arrayBuffer = await file.arrayBuffer();
        const res = await api.post('/api/image/upload', arrayBuffer, {
          headers: { 'Content-Type': file.type }
        });
        const data = res.data;
        sessionStorage.setItem('verixa-dragdrop-image-result', JSON.stringify(data));
        sessionStorage.setItem('verixa-dragdrop-image-preview', URL.createObjectURL(file));
        navigate('/image?source=dragdrop');
      } catch (e) {
        alert('Image Error: ' + e.message);
      } finally {
        setProcessing(false);
        setProcessingMsg('');
      }
      return;
    }

    // ── Text files ──
    if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv') || name.endsWith('.json')) {
      setProcessing(true);
      setProcessingMsg('Reading text file...');
      try {
        const text = await file.text();
        if (!text || text.trim().length < 5) throw new Error('File is empty or too short');
        sessionStorage.setItem('verixa-dragdrop-text', text.slice(0, 10000));
        navigate('/verify?source=dragdrop');
      } catch (e) {
        alert('File Error: ' + e.message);
      } finally {
        setProcessing(false);
        setProcessingMsg('');
      }
      return;
    }

    alert(`Unsupported file type: ${type || name}\n\nSupported: PDF, Images (JPG/PNG/WEBP), Text files (.txt, .md, .csv)`);
  }, [navigate]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Attach to window for global coverage
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDragging(false);
        dragCounter.current = 0;
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      {children}

      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(10, 10, 15, 0.75)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            width: '80%', maxWidth: 520, padding: '60px 40px',
            border: '2px dashed rgba(201, 169, 110, 0.5)',
            borderRadius: 24, textAlign: 'center',
            background: 'rgba(201, 169, 110, 0.04)',
            animation: 'skeleton-pulse 2s ease-in-out infinite',
          }}>
            <div style={{
              fontSize: 56, marginBottom: 20,
              animation: 'float 2s ease-in-out infinite',
            }}>
              📂
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 32, fontWeight: 300,
              color: '#f5f3ef', marginBottom: 12,
            }}>
              Drop your file here
            </div>
            <p style={{
              fontSize: 14, color: 'rgba(245, 243, 239, 0.5)',
              lineHeight: 1.7, margin: '0 0 24px',
            }}>
              VeriXa will automatically process it
            </p>
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            }}>
              {[
                { icon: '📄', label: 'PDF', color: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)' },
                { icon: '🖼️', label: 'Images', color: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' },
                { icon: '📝', label: 'Text', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
              ].map(f => (
                <span key={f.label} style={{
                  padding: '6px 16px', borderRadius: 999,
                  background: f.color, border: `1px solid ${f.border}`,
                  fontSize: 12, color: '#f5f3ef', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{f.icon}</span> {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 48, height: 48,
            border: '2px solid rgba(201,169,110,0.2)',
            borderTop: '2px solid #c9a96e',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 24, fontWeight: 300,
            color: '#f5f3ef',
          }}>
            {processingMsg}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(245,243,239,0.4)' }}>
            Please wait while VeriXa processes your file
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
