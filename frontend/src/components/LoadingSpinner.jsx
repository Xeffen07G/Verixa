import React from 'react';

export default function LoadingSpinner({ size = 20, color = '#c9a96e' }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid rgba(201,169,110,0.15)`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
