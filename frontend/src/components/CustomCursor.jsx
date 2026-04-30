import React, { useEffect, useRef, useState } from 'react';

/**
 * VeriXa Custom Cursor — Golden arrow pointer + click sparkles
 * 
 * - Custom SVG arrow cursor via CSS (replaces default everywhere)
 * - Tiny sparkle particles on click
 * - Hides on mobile/touch devices
 */

// Golden arrow SVG cursor (encoded as data URI)
const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28" fill="none">
  <path d="M2 2L10 26L13 16L22 12L2 2Z" fill="rgb(201,169,110)" fill-opacity="0.9" stroke="rgb(35,30,20)" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M3.5 4L9.5 22L12 14.5L19 11.5L3.5 4Z" fill="url(%23g)" fill-opacity="0.5"/>
  <defs><linearGradient id="g" x1="3" y1="4" x2="19" y2="12"><stop stop-color="rgb(232,213,163)"/><stop offset="1" stop-color="rgb(201,169,110)" stop-opacity="0.2"/></linearGradient></defs>
</svg>`;

const CURSOR_POINTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M8 2v16l4-4h3l5 8 3-2-5-8h4L8 2z" fill="rgb(201,169,110)" fill-opacity="0.95" stroke="rgb(35,30,20)" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M9.5 5v12l3-3h2.5l4 6.5 1.5-1-4-6.5h3L9.5 5z" fill="url(%23g2)" fill-opacity="0.4"/>
  <defs><linearGradient id="g2" x1="9" y1="5" x2="20" y2="13"><stop stop-color="rgb(232,213,163)"/><stop offset="1" stop-color="rgb(201,169,110)" stop-opacity="0.2"/></linearGradient></defs>
</svg>`;

const encodedCursor = `data:image/svg+xml,${encodeURIComponent(CURSOR_SVG)}`;
const encodedPointer = `data:image/svg+xml,${encodeURIComponent(CURSOR_POINTER_SVG)}`;

export default function CustomCursor() {
  const animFrame = useRef(null);
  const sparklesRef = useRef([]);
  const canvasRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    // Inject cursor CSS globally
    const style = document.createElement('style');
    style.id = 'verixa-cursor-style';
    style.textContent = `
      *, *::before, *::after {
        cursor: url('${encodedCursor}') 2 2, auto !important;
      }
      a, button, [role="button"], input[type="submit"], input[type="button"],
      select, label[for], .clickable, [onclick] {
        cursor: url('${encodedPointer}') 8 2, pointer !important;
      }
      input[type="text"], input[type="email"], input[type="password"],
      input[type="search"], input[type="url"], input[type="number"],
      textarea, [contenteditable="true"] {
        cursor: url('${encodedCursor}') 2 2, text !important;
      }
    `;
    document.head.appendChild(style);

    const onClick = (e) => {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2;
        sparklesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          size: 1.5 + Math.random() * 2,
        });
      }
    };

    document.addEventListener('click', onClick, { passive: true });

    const animate = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sparklesRef.current = sparklesRef.current.filter(s => s.life > 0);
        for (const s of sparklesRef.current) {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.04;
          s.life -= 0.025;
          s.vx *= 0.98;

          const alpha = s.life * 0.8;
          const r = s.size * s.life;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - r);
          ctx.lineTo(s.x + r * 0.3, s.y);
          ctx.lineTo(s.x, s.y + r);
          ctx.lineTo(s.x - r * 0.3, s.y);
          ctx.closePath();
          ctx.fillStyle = `rgba(201, 169, 110, ${alpha})`;
          ctx.fill();
        }
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      document.removeEventListener('click', onClick);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      const existingStyle = document.getElementById('verixa-cursor-style');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9997,
      }}
    />
  );
}
