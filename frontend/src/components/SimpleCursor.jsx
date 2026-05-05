import React, { useEffect } from 'react';

/**
 * Native Gold Cursor
 * - Uses CSS cursor property with an SVG data URI
 * - Behaves exactly like a normal browser cursor (no lag, no sticking)
 * - Premium gold styling with a crisp white border
 */
export default function SimpleCursor() {
  useEffect(() => {
    // Premium Gold Aeroplane/Arrow shape SVG in gold
    const goldCursor = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 4L6 28.5L7 29.5L16 25.5L25 29.5L26 28.5L16 4Z' fill='%23c9a96e' stroke='white' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 16 16, auto`;
    
    // Gold Pointer for links
    const goldPointer = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 4L6 28.5L7 29.5L16 25.5L25 29.5L26 28.5L16 4Z' fill='%23e8d5a3' stroke='white' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 16 16, pointer`;

    const style = document.createElement('style');
    style.id = 'gold-cursor-styles';
    style.innerHTML = `
      * {
        cursor: ${goldCursor} !important;
      }
      a, button, [role="button"], input, select, textarea, .clickable, .interactive, .cursor-pointer {
        cursor: ${goldPointer} !important;
      }
      
      ::selection {
        background: rgba(201, 169, 110, 0.3);
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
