import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Beautiful Gold Cursor
 * - Elegant gold gradient and glow
 * - Minimalist dual-layer design
 * - Fluid spring-based motion
 */
export default function SimpleCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth, high-fidelity spring motion
  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
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
        transition: 'opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      {/* Outer Ring / Glow */}
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1px solid rgba(201, 169, 110, 0.3)',
          background: 'radial-gradient(circle, rgba(201, 169, 110, 0.15) 0%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={{
          scale: isHovering ? 1.4 : 1,
          opacity: isHovering ? 0.8 : 0.4,
          borderColor: isHovering ? 'rgba(201, 169, 110, 0.6)' : 'rgba(201, 169, 110, 0.3)',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      />

      {/* Inner Precision Dot (Gold) */}
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e8d5a3 0%, #c9a96e 100%)',
          boxShadow: '0 0 10px rgba(201, 169, 110, 0.8)',
          zIndex: 2,
        }}
        animate={{
          scale: isHovering ? 0.6 : 1,
        }}
      />

      <style>{`
        /* Keep native cursor hidden on interactive elements but show custom pointer hint */
        a, button, [role="button"], input, .clickable, .interactive {
          cursor: none !important;
        }
        
        /* Apply smooth transition to all elements cursor property */
        * {
          transition: cursor 0.2s ease;
        }
      `}</style>
    </div>
  );
}
