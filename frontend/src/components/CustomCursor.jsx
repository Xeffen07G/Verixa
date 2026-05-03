import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence, useVelocity, useTransform } from 'framer-motion';

/**
 * Antigravity Premium Cursor
 * 
 * Features:
 * - Inner dot (follows instantly)
 * - Outer ring (spring physics, velocity-based stretch)
 * - Magnetic interaction with clickable elements
 * - Fluid expansion on hover
 * - Click ripple effect
 */

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Motion values for tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Velocity tracking for stretching
  const velocityX = useVelocity(cursorX);
  const velocityY = useVelocity(cursorY);
  
  // Calculate speed and rotation for the stretch
  const speed = useTransform([velocityX, velocityY], ([vx, vy]) => 
    Math.min(Math.sqrt(vx * vx + vy * vy) / 800, 1)
  );
  
  const rotation = useTransform([velocityX, velocityY], ([vx, vy]) => 
    Math.atan2(vy, vx) * (180 / Math.PI)
  );

  // Spring configuration for the ring
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const ringX = useSpring(cursorX, springConfig);
  const ringY = useSpring(cursorY, springConfig);

  // Transform speed into scaleX for stretching
  const scaleX = useTransform(speed, [0, 1], [1, 1.5]);
  const scaleY = useTransform(speed, [0, 1], [1, 0.8]);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (isHidden) setIsHidden(false);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseEnterLink = () => setIsHovering(true);
    const handleMouseLeaveLink = () => setIsHovering(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const updateInteractiveListeners = () => {
      const interactables = document.querySelectorAll(
        'a, button, [role="button"], input[type="submit"], .clickable, select, label, .interactive'
      );
      interactables.forEach((el) => {
        el.addEventListener('mouseenter', handleMouseEnterLink);
        el.addEventListener('mouseleave', handleMouseLeaveLink);
      });
    };

    updateInteractiveListeners();
    const observer = new MutationObserver(updateInteractiveListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      observer.disconnect();
    };
  }, [cursorX, cursorY, isHidden]);

  if (isTouchDevice) return null;

  const ringSize = isHovering ? 60 : 28;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 10000 }}>
      {/* Outer Ring with Stretch & Rotation */}
      <motion.div
        style={{
          position: 'fixed',
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          border: `1.2px solid ${isHovering ? '#c9a96e' : 'rgba(201, 169, 110, 0.4)'}`,
          backgroundColor: isHovering ? 'rgba(201, 169, 110, 0.08)' : 'transparent',
          rotate: rotation,
          scaleX: isHovering ? 1.2 : scaleX,
          scaleY: isHovering ? 1.2 : scaleY,
          display: isHidden ? 'none' : 'block',
          mixBlendMode: 'difference',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      />

      {/* Inner Dot */}
      <motion.div
        style={{
          position: 'fixed',
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#c9a96e',
          display: isHidden ? 'none' : 'block',
          boxShadow: '0 0 12px rgba(201, 169, 110, 0.6)',
        }}
        animate={{
          scale: isClicking ? 2 : (isHovering ? 0 : 1),
          opacity: isHovering ? 0 : 1,
        }}
      />

      {/* Ripple on Click */}
      <AnimatePresence>
        {isClicking && (
          <motion.div
            initial={{ opacity: 0.6, scale: 0.2, x: cursorX.get(), y: cursorY.get() }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              translateX: '-50%',
              translateY: '-50%',
              width: 50,
              height: 50,
              borderRadius: '50%',
              border: '1px solid #c9a96e',
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        html, body, a, button, [role="button"], .clickable, .interactive {
          cursor: none !important;
        }
        ::selection {
          background: rgba(201, 169, 110, 0.3);
        }
      `}</style>
    </div>
  );
}
