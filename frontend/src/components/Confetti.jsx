import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Gold particle confetti celebration animation
 * Fires when verification score >= 90%
 * Canvas-based for smooth 60fps performance
 */
export default function Confetti({ trigger = true, duration = 3500 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const startTimeRef = useRef(null);

  const COLORS = [
    '#c9a96e', '#e8d5a3', '#a07b42', '#d4b87a',
    '#f5e6c0', '#b8963c', '#dcc28e', '#c4a252',
    '#ffffff', '#ffd700', '#ffcc00',
  ];

  const createParticle = useCallback((canvas) => {
    const type = Math.random();
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      size: type > 0.7 ? Math.random() * 4 + 2 : Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      gravity: 0.08 + Math.random() * 0.06,
      drag: 0.98 + Math.random() * 0.015,
      opacity: 1,
      type: type > 0.85 ? 'star' : type > 0.5 ? 'rect' : 'circle',
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.08 + 0.02,
    };
  }, []);

  const drawStar = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](Math.cos(angle) * size, Math.sin(angle) * size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Burst: create initial particles
    particlesRef.current = [];
    for (let i = 0; i < 120; i++) {
      particlesRef.current.push(createParticle(canvas));
    }

    startTimeRef.current = Date.now();
    let emitTimer = 0;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        // Fade out remaining
        let anyAlive = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (const p of particlesRef.current) {
          p.opacity -= 0.03;
          if (p.opacity > 0) {
            anyAlive = true;
            updateAndDraw(ctx, p);
          }
        }
        
        if (anyAlive) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          // Cleanup
          particlesRef.current = [];
        }
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Emit more particles in first 1.5s
      emitTimer++;
      if (elapsed < 1500 && emitTimer % 3 === 0) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push(createParticle(canvas));
        }
      }

      // Update & draw
      for (const p of particlesRef.current) {
        updateAndDraw(ctx, p);
      }

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(
        p => p.opacity > 0 && p.y < canvas.height + 50
      );

      animRef.current = requestAnimationFrame(animate);
    };

    const updateAndDraw = (ctx, p) => {
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.x += p.vx + Math.sin(p.wobble) * 0.5;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.type === 'star') {
        drawStar(ctx, p.x, p.y, p.size, p.rotation);
      } else if (p.type === 'rect') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [trigger, duration, createParticle]);

  if (!trigger) return null;

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
        zIndex: 9999,
      }}
    />
  );
}
