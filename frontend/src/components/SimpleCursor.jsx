import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Static Gold Arrow Cursor
 * - Clean gold SVG arrow
 * - No particles or complex animations
 * - Simple spring-based following
 */
export default function SimpleCursor() {
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Simple, smooth follow spring
  const springConfig = { damping: 30, stiffness: 400 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (isHidden) setIsHidden(false);
    };

    window.addEventListener('mousemove', moveCursor);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
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
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* Main Gold Arrow (Static) */}
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          willChange: 'transform',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ 
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
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
          />
        </svg>
      </motion.div>

      <style>{`
        /* Hide native cursor globally to use the gold arrow */
        * { cursor: none !important; }
        
        /* Ensure selection still works but without the native pointer */
        ::selection { background: rgba(201, 169, 110, 0.3); }
      `}</style>
    </div>
  );
}
