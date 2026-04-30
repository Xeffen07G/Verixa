import React from 'react';

/**
 * Premium skeleton loading cards that mimic ClaimCard shape
 * Shows shimmer animation while AI is processing
 */

function SkeletonLine({ width = '100%', height = 12, style = {}, theme }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: `linear-gradient(90deg, ${theme.surface2} 25%, ${theme.shimmer} 50%, ${theme.surface2} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
      ...style,
    }} />
  );
}

function SkeletonCircle({ size = 44, style = {}, theme }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, flexShrink: 0,
      background: `linear-gradient(90deg, ${theme.surface2} 25%, ${theme.shimmer} 50%, ${theme.surface2} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function SkeletonClaimCard({ index = 0, darkMode = true }) {
  const theme = darkMode ? {
    bg: '#13131a', border: 'rgba(255,255,255,0.06)',
    surface2: 'rgba(255,255,255,0.04)', shimmer: 'rgba(201,169,110,0.08)',
  } : {
    bg: '#f0ede6', border: 'rgba(0,0,0,0.08)',
    surface2: 'rgba(0,0,0,0.04)', shimmer: 'rgba(90,66,26,0.1)',
  };

  return (
    <div style={{
      borderRadius: 14, marginBottom: 12, overflow: 'hidden',
      border: `1.5px solid ${theme.border}`, background: theme.bg,
      padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
      animation: `fadeUp 0.4s ease forwards`,
      animationDelay: `${index * 0.12}s`,
      opacity: 0,
    }}>
      <SkeletonCircle theme={theme} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletonLine width="85%" height={14} theme={theme} />
        <SkeletonLine width="65%" height={14} theme={theme} style={{ animationDelay: '0.15s' }} />
        <SkeletonLine width="30%" height={22} theme={theme} style={{ borderRadius: 999, animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

export function SkeletonScoreBanner({ darkMode = true }) {
  const theme = darkMode ? {
    surface2: 'rgba(255,255,255,0.06)', shimmer: 'rgba(201,169,110,0.12)',
  } : {
    surface2: 'rgba(0,0,0,0.06)', shimmer: 'rgba(90,66,26,0.12)',
  };

  return (
    <div style={{
      background: darkMode ? 'rgba(22,101,52,0.3)' : 'rgba(22,101,52,0.15)',
      borderRadius: 16, padding: '28px 32px', marginBottom: 24,
      animation: 'skeleton-pulse 2s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <SkeletonLine width={100} height={10} theme={theme} style={{ marginBottom: 12 }} />
          <SkeletonLine width={120} height={50} theme={theme} style={{ marginBottom: 8 }} />
          <SkeletonLine width={140} height={14} theme={theme} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 60, height: 50, borderRadius: 8, background: 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SkeletonLoading({ darkMode = true, count = 4 }) {
  return (
    <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
      <SkeletonScoreBanner darkMode={darkMode} />
      <div style={{
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <SkeletonLine width={160} height={10} theme={darkMode ? {
          surface2: 'rgba(255,255,255,0.04)', shimmer: 'rgba(201,169,110,0.08)',
        } : {
          surface2: 'rgba(0,0,0,0.04)', shimmer: 'rgba(90,66,26,0.1)',
        }} />
      </div>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonClaimCard key={i} index={i} darkMode={darkMode} />
      ))}
    </div>
  );
}
