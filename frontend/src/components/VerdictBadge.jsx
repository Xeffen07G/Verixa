import React from 'react';

const CONFIG = {
  'True':           { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.25)'   },
  'False':          { color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.25)'  },
  'Partially True': { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)'   },
  'Unverifiable':   { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)',  border: 'rgba(156,163,175,0.2)'   },
};

export default function VerdictBadge({ verdict, size = 'sm' }) {
  const cfg = CONFIG[verdict] || CONFIG['Unverifiable'];
  const padding = size === 'lg' ? '5px 16px' : '3px 10px';
  const fontSize = size === 'lg' ? 12 : 10;

  return (
    <span style={{
      display: 'inline-block',
      padding,
      borderRadius: 999,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      fontSize,
      fontWeight: 700,
      color: cfg.color,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {verdict}
    </span>
  );
}
