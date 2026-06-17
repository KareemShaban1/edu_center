import type { Variants, Transition } from 'framer-motion';

const spring: Transition = { type: 'spring', stiffness: 80, damping: 18 };
const smooth: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

export const heroTextReveal: Variants = {
  hidden: { opacity: 0, x: 48, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { ...smooth, delay: i * 0.12 },
  }),
};

export const heroTextRevealRtl: Variants = {
  hidden: { opacity: 0, x: -48, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { ...smooth, delay: i * 0.12 },
  }),
};

export const heroIllustration: Variants = {
  hidden: { opacity: 0, scale: 0.82, rotate: -3, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { ...spring, delay: 0.2 },
  },
};

export const heroFloat = {
  y: [0, -12, 0],
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
};

export const sectionHeading: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smooth,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

export const featureCard: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.92, rotateX: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { ...spring, delay: i * 0.08 },
  }),
};

export const roleCard: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 16, delay: i * 0.12 },
  }),
};

export const rolePreview: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14, delay: 0.25 },
  },
};

export const whyUsItem: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...spring, delay: i * 0.1 },
  }),
};

export const whyUsIllustration: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...spring, delay: 0.3 },
  },
};

export const whyUsIllustrationRtl: Variants = {
  hidden: { opacity: 0, x: -60, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...spring, delay: 0.3 },
  },
};

export const rocketFloat = {
  y: [0, -6, 0],
  rotate: [0, 3, 0, -3, 0],
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

export const ctaSection: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export const ctaItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...smooth, delay: 0.2 + i * 0.1 },
  }),
};

export const headerSlide: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export const badgePop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 14, delay: 0.4 + i * 0.1 },
  }),
};

export function getCtaButtonPulse(primaryHex: string) {
  return {
    scale: [1, 1.03, 1],
    boxShadow: [
      `0 8px 24px ${hexToRgba(primaryHex, 0.27)}`,
      `0 12px 32px ${hexToRgba(primaryHex, 0.45)}`,
      `0 8px 24px ${hexToRgba(primaryHex, 0.27)}`,
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
