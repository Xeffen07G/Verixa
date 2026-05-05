import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Premium Gold Arrow Cursor with Glitter Effect
 * - Custom SVG gold arrow
 * - Dynamic glitter particles trailing the motion
 * - High-performance spring physics
 */
export default function SimpleCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // High-fidelity spring for the main arrow
  const springConfig = { damping: 30, stiffness: 400, mass: 0.6 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Rotation based on movement direction (optional but adds "beautiful" feel)
  const [rotation, setRotation] = useState(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      // Only update rotation if moving significantly
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        setRotation(angle);
      }

      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      if (isHidden) setIsHidden(false);
    };

    const handleOver = (e) => {
      const target = e.target.closest('a, button, [role="button"], input, .clickable, .interactive, .cursor-pointer');
      setIsHovering(!!target);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [mouseX, mouseY, isHidden]);

  if (isTouchDevice) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        pointerEvents: 'none', 
        zIndex: 999999,
        opacity: isHidden ? 0 : 1,
        transition: 'opacity 0.5s ease'
      }}
    >
      {/* Glitter Particles (Dust) */}
      {[...Array(6)].map((_, i) => (
        <GlitterParticle 
          key={i} 
          mouseX={mouseX} 
          mouseY={mouseY} 
          delay={i * 0.05} 
          isHovering={isHovering}
        />
      ))}

      {/* Main Gold Arrow */}
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          rotate: rotation,
          willChange: 'transform',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        animate={{
          scale: isHovering ? 1.2 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            filter: 'drop-shadow(0 0 8px rgba(201, 169, 110, 0.6))',
          }}
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8d5a3" />
              <stop offset="50%" stopColor="#c9a96e" />
              <stop offset="100%" stopColor="#a07b42" />
            </linearGradient>
          </defs>
          <path 
            d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" 
            fill="url(#goldGrad)" 
            stroke="#c9a96e"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <style>{`
        * { cursor: none !important; }
      `}</style>
    </div>
  );
}

function GlitterParticle({ mouseX, mouseY, delay, isHovering }) {
  const particleX = useSpring(mouseX, { damping: 15 + Math.random() * 10, stiffness: 100 + Math.random() * 50, mass: 0.8 });
  const particleY = useSpring(mouseY, { damping: 15 + Math.random() * 10, stiffness: 100 + Math.random() * 50, mass: 0.8 });
  
  const offset = useRef({
    x: (Math.random() - 0.5) * 40,
    y: (Math.random() - 0.5) * 40
  });

  return (
    <motion.div
      style={{
        position: 'absolute',
        x: particleX,
        y: particleY,
        translateX: offset.current.x,
        translateY: offset.current.y,
        width: 2,
        height: 2,
        borderRadius: '50%',
        backgroundColor: '#e8d5a3',
        boxShadow: '0 0 4px #c9a96e',
        opacity: 0.4,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: isHovering ? [0.4, 0.8, 0.4] : 0.4,
      }}
      transition={{
        duration: 1 + Math.random(),
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random()
      }}
    />
  );
}
