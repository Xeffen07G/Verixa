import React, { useEffect } from 'react';

/**
 * Native Gold Cursor
 * - Uses CSS cursor property with an SVG data URI
 * - Behaves exactly like a normal browser cursor (no lag, no sticking)
 * - Premium gold styling with a crisp white border
 */
export default function SimpleCursor() {
  useEffect(() => {
  useEffect(() => {
    // Premium Cartoon Golden Arrow
    // Path: M2 2 L22 18 L14 18 L18 26 L14 28 L10 20 L4 24 Z (Approx)
    // Refined Path for the specific look:
    const cursorPath = "M4 4 L24 20 L15 20 L18 28 L14 30 L11 22 L4 28 Z";
    
    const normalSvg = `<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='${cursorPath}' fill='%23FFD700' stroke='%23E67E22' stroke-width='2' stroke-linejoin='round'/%3E
      <path d='M6 7 L20 18 L14 18 L6 7 Z' fill='white' fill-opacity='0.2'/%3E
    </svg>`;

    const activeSvg = `<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M4 4 L1 1 M4 4 L4 0 M4 4 L8 1 M4 4 L2 4 M4 4 L0 4' stroke='%23E67E22' stroke-width='2' stroke-linecap='round'/%3E
      <path d='${cursorPath}' fill='%23FFD700' stroke='%23E67E22' stroke-width='2' stroke-linejoin='round'/%3E
      <path d='M6 7 L20 18 L14 18 L6 7 Z' fill='white' fill-opacity='0.2'/%3E
    </svg>`;

    const goldCursor = `url("data:image/svg+xml,${normalSvg.replace(/#/g, '%23')}") 4 4, auto`;
    const goldActive = `url("data:image/svg+xml,${activeSvg.replace(/#/g, '%23')}") 4 4, auto`;
    
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
