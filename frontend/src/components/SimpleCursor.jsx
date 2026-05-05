import React, { useEffect } from 'react';

/**
 * Premium Golden Cartoon Cursor
 * - Recreates the requested golden arrow with orange outline
 * - 32x32px for maximum browser compatibility
 * - Sunburst rays on click/active state
 */
export default function SimpleCursor() {
  useEffect(() => {
    // Tip at 0,0 for precise clicking
    const cursorPath = "M0 0 L24 16 L12 16 L15 24 L10 25 L7 17 L0 24 Z";
    
    // Normal State
    const normalSvg = `<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='${cursorPath}' fill='%23FFD700' stroke='%23D35400' stroke-width='1.5' stroke-linejoin='round'/%3E
      <path d='M2 3 L16 13 L11 13 L2 3 Z' fill='white' fill-opacity='0.3'/%3E
    </svg>`;

    // Clicked State (with sunburst rays)
    const activeSvg = `<svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M0 0 L-4 -4 M0 0 L0 -5 M0 0 L4 -4 M0 0 L-5 0 M0 0 L5 0' stroke='%23D35400' stroke-width='2' stroke-linecap='round' transform='translate(0,0)'/%3E
      <path d='${cursorPath}' fill='%23FFD700' stroke='%23D35400' stroke-width='1.5' stroke-linejoin='round'/%3E
    </svg>`;

    const goldCursor = `url("data:image/svg+xml,${normalSvg.replace(/#/g, '%23')}") 0 0, auto`;
    const goldActive = `url("data:image/svg+xml,${activeSvg.replace(/#/g, '%23')}") 0 0, auto`;
    
    const style = document.createElement('style');
    style.id = 'gold-cursor-styles';
    style.innerHTML = `
      * {
        cursor: ${goldCursor} !important;
      }
      *:active {
        cursor: ${goldActive} !important;
      }
      a, button, [role="button"], input, select, textarea, .clickable, .interactive, .cursor-pointer {
        cursor: ${goldCursor} !important;
      }
      a:active, button:active {
        cursor: ${goldActive} !important;
      }
      ::selection {
        background: rgba(255, 215, 0, 0.3);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('gold-cursor-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  return null;
}
