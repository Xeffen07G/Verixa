import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — Animate elements when they scroll into view
 * 
 * Props:
 *   animation: 'fadeUp' | 'fadeIn' | 'fadeLeft' | 'fadeRight' | 'scaleIn' | 'blurIn'
 *   delay: delay in ms before animation starts
 *   duration: animation duration in ms
 *   threshold: intersection threshold (0-1)
 *   once: if true, only animate once (default true)
 *   distance: pixel distance for directional animations
 *   className: additional CSS class
 *   style: additional inline styles
 *   as: HTML tag to render (default 'div')
 */

const ANIMATIONS = {
  fadeUp: (distance = 40) => ({
    hidden: { opacity: 0, transform: `translateY(${distance}px)` },
    visible: { opacity: 1, transform: 'translateY(0)' },
  }),
  fadeIn: () => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }),
  fadeLeft: (distance = 50) => ({
    hidden: { opacity: 0, transform: `translateX(-${distance}px)` },
    visible: { opacity: 1, transform: 'translateX(0)' },
  }),
  fadeRight: (distance = 50) => ({
    hidden: { opacity: 0, transform: `translateX(${distance}px)` },
    visible: { opacity: 1, transform: 'translateX(0)' },
  }),
  scaleIn: () => ({
    hidden: { opacity: 0, transform: 'scale(0.85)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  }),
  blurIn: () => ({
    hidden: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)' },
    visible: { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
  }),
  slideUp: (distance = 60) => ({
    hidden: { opacity: 0, transform: `translateY(${distance}px) scale(0.97)` },
    visible: { opacity: 1, transform: 'translateY(0) scale(1)' },
  }),
  rotateIn: () => ({
    hidden: { opacity: 0, transform: 'rotate(-5deg) scale(0.9)' },
    visible: { opacity: 1, transform: 'rotate(0) scale(1)' },
  }),
};

export default function ScrollReveal({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
  distance = undefined,
  className = '',
  style = {},
  as: Tag = 'div',
  stagger = 0,
  staggerIndex = 0,
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const animFn = ANIMATIONS[animation] || ANIMATIONS.fadeUp;
  const states = animFn(distance);
  const totalDelay = delay + (stagger * staggerIndex);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(isVisible ? states.visible : states.hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.23, 1, 0.32, 1) ${totalDelay}ms, transform ${duration}ms cubic-bezier(0.23, 1, 0.32, 1) ${totalDelay}ms, filter ${duration}ms ease ${totalDelay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * StaggerContainer — Wraps children and staggers their reveal
 */
export function StaggerContainer({ children, stagger = 100, animation = 'fadeUp', ...props }) {
  return (
    <>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return (
          <ScrollReveal animation={animation} stagger={stagger} staggerIndex={i} {...props}>
            {child}
          </ScrollReveal>
        );
      })}
    </>
  );
}

/**
 * AnimatedText — Animate text character by character or word by word
 */
export function AnimatedText({
  text,
  type = 'word', // 'word' | 'char'
  animation = 'fadeUp',
  stagger = 50,
  delay = 0,
  style = {},
  className = '',
  as: Tag = 'span',
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const units = type === 'char' ? text.split('') : text.split(' ');

  return (
    <Tag ref={ref} className={className} style={{ ...style, display: 'inline-flex', flexWrap: 'wrap', gap: type === 'char' ? 0 : '0.3em' }}>
      {units.map((unit, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) rotate(0)' : 'translateY(20px) rotate(2deg)',
            transition: `opacity 0.5s ease ${delay + i * stagger}ms, transform 0.5s cubic-bezier(0.23,1,0.32,1) ${delay + i * stagger}ms`,
          }}
        >
          {unit}{type === 'char' ? '' : ''}
        </span>
      ))}
    </Tag>
  );
}
