import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Simple Cursor Animation
 * - Small dot with a subtle ring
 * - Smooth spring-based following
 * - Scales up slightly on hover
 */
export default function SimpleCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Use a faster, tighter spring for "simple" feel
  const springConfig = { damping: 25, stiffness: 400 };
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
      const target = e.target.closest('a, button, [role="button"], input, .clickable, .interactive');
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
        transition: 'opacity 0.2s'
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1.5px solid #c9a96e',
          backgroundColor: isHovering ? 'rgba(201, 169, 110, 0.1)' : 'transparent',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: '#c9a96e',
        }}
        animate={{
          scale: isHovering ? 0.5 : 1,
        }}
      />
      <style>{`
        /* Minimal hide native cursor on interactive elements */
        a, button, [role="button"], input, .clickable, .interactive {
          cursor: crosshair !important;
        }
      `}</style>
    </div>
  );
}
