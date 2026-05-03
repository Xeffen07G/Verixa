import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

/**
 * Magnetic Fluid Cursor
 * 
 * A premium, organic cursor experience featuring:
 * - Gooey fluid physics using SVG filters
 * - Multi-layered trailing blobs for a liquid feel
 * - Magnetic expansion on hover
 * - Glassmorphic center with backdrop blur
 */

const BLOBS_COUNT = 6;

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Core cursor position
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Define springs individually to comply with Rules of Hooks
  const spring1 = { x: useSpring(mouseX, { damping: 20, stiffness: 200 }), y: useSpring(mouseY, { damping: 20, stiffness: 200 }) };
  const spring2 = { x: useSpring(mouseX, { damping: 22, stiffness: 180 }), y: useSpring(mouseY, { damping: 22, stiffness: 180 }) };
  const spring3 = { x: useSpring(mouseX, { damping: 24, stiffness: 160 }), y: useSpring(mouseY, { damping: 24, stiffness: 160 }) };
  const spring4 = { x: useSpring(mouseX, { damping: 26, stiffness: 140 }), y: useSpring(mouseY, { damping: 26, stiffness: 140 }) };
  const spring5 = { x: useSpring(mouseX, { damping: 28, stiffness: 120 }), y: useSpring(mouseY, { damping: 28, stiffness: 120 }) };
  const spring6 = { x: useSpring(mouseX, { damping: 30, stiffness: 100 }), y: useSpring(mouseY, { damping: 30, stiffness: 100 }) };

  const trailSprings = [spring1, spring2, spring3, spring4, spring5, spring6];

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
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
  }, [mouseX, mouseY, isHidden]);

  if (isTouchDevice) return null;

  const blobSize = isHovering ? 80 : 32;
  const mainDotSize = isHovering ? 0 : 8;

  return (
    <div 
      className="cursor-container"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none', 
        zIndex: 999999
      }}
    >
      {/* SVG Filter for Gooey Effect */}
      <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix 
            in="blur" 
            mode="matrix" 
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12" 
            result="goo" 
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      {/* Trailing Fluid Blobs */}
      <div style={{ filter: 'url(#goo)', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {trailSprings.map((spring, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              x: spring.x,
              y: spring.y,
              translateX: '-50%',
              translateY: '-50%',
              width: blobSize - (i * 3),
              height: blobSize - (i * 3),
              borderRadius: '50%',
              backgroundColor: i === 0 ? 'rgba(201, 169, 110, 0.5)' : 'rgba(201, 169, 110, 0.25)',
              opacity: isHidden ? 0 : 1 - (i * 0.12),
            }}
            animate={{
              scale: isClicking ? 0.7 : [1, 1.05, 0.98, 1],
            }}
            transition={{
              scale: isClicking 
                ? { type: 'spring', stiffness: 400, damping: 10 }
                : { duration: 2 + i, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        ))}
      </div>

      {/* Glassmorphic Core Dot */}
      <motion.div
        style={{
          position: 'absolute',
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: mainDotSize,
          height: mainDotSize,
          borderRadius: '50%',
          backgroundColor: 'rgba(232, 213, 163, 0.8)',
          boxShadow: '0 0 20px rgba(201, 169, 110, 0.6)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: isHidden ? 'none' : 'block',
        }}
        animate={{
          scale: isClicking ? 2 : 1,
          opacity: isHovering ? 0 : 1,
        }}
      />

      {/* Hover Pulse Effect */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            style={{
              position: 'absolute',
              x: mouseX,
              y: mouseY,
              translateX: '-50%',
              translateY: '-50%',
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '1px solid rgba(201, 169, 110, 0.3)',
              backgroundColor: 'rgba(201, 169, 110, 0.05)',
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
