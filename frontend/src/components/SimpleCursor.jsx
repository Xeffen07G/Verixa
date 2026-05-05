import React, { useEffect } from 'react';

/**
 * Native Gold Cursor
 * - Uses CSS cursor property with an SVG data URI
 * - Behaves exactly like a normal browser cursor (no lag, no sticking)
 * - Premium gold styling with a crisp white border
 */
export default function SimpleCursor() {
  useEffect(() => {
    // Standard arrow shape SVG in gold
    const goldCursor = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 3.21V20.8L10.5 15.8L13.5 22.8L16 21.7L13 14.7L20.2 14.7L5.5 3.21Z' fill='%23c9a96e' stroke='white' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E")`;
    
    // Pointer (hover) shape SVG in gold
    const goldPointer = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 3C9 2.44772 9.44772 2 10 2C10.5523 2 11 2.44772 11 3V10H13V5C13 4.44772 13.4477 4 14 4C14.5523 4 15 4.44772 15 5V10H17V8C17 7.44772 17.4477 7 18 7C18.5523 7 19 7.44772 19 8V14C19 18.4183 15.4183 22 11 22C6.58172 22 3 18.4183 3 14V11C3 10.4477 3.44772 10 4 10C4.55228 10 5 10.4477 5 11V14H7V4C7 3.44772 7.44772 3 8 3C8.55228 3 9 3.44772 9 3Z' fill='%23c9a96e' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E")`;

    const style = document.createElement('style');
    style.id = 'gold-cursor-styles';
    style.innerHTML = `
      * {
        cursor: ${goldCursor}, auto !important;
      }
      a, button, [role="button"], input, select, textarea, .clickable, .interactive, .cursor-pointer {
        cursor: ${goldPointer}, pointer !important;
      }
      
      /* Smooth selection highlight to match gold theme */
      ::selection {
        background: rgba(201, 169, 110, 0.3);
        color: inherit;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('gold-cursor-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  return null; // This component now only manages global styles
}
