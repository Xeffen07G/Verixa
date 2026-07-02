import React, { useState } from 'react';

export default function ActiveDevelopmentBanner() {
  const [visible, setVisible] = useState(() => {
    return localStorage.getItem('verixa_active_dev_banner_dismissed') !== 'true';
  });

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem('verixa_active_dev_banner_dismissed', 'true');
    setVisible(false);
  };

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: '#07070a',
      borderBottom: '1px solid rgba(201, 169, 110, 0.4)',
      color: '#f5f3ef',
      padding: '8px 40px 8px 16px',
      fontSize: '12px',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      boxSizing: 'border-box',
      textAlign: 'center',
      minHeight: '34px',
      letterSpacing: '0.03em'
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#c9a96e' }}>🚧</span>
        <span>VeriXa is under active development. We're continuously improving the platform and refining the user experience.</span>
      </span>
      <button 
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          right: '16px',
          background: 'none',
          border: 'none',
          color: '#c9a96e',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          opacity: 0.8,
          transition: 'opacity 0.2s',
          lineHeight: 1
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.8}
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  );
}
