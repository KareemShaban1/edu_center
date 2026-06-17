import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EMERALD = '#0d9488';
const BOARD = '#115e59';

const float = (delay = 0) => ({
  animate: {
    y: [0, -10, 0],
    transition: { duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay },
  },
});

/** Decorative hero artwork — Egypt education center motif */
export function LandingHeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('max-h-[min(380px,55vw)] w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="landing-hero-grad" x1="72" y1="48" x2="420" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ba181b" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="landing-bar-grad" x1="200" y1="220" x2="380" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ba181b" stopOpacity="0.75" />
          <stop offset="1" stopColor="#a4161a" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="landing-glow" x1="260" y1="80" x2="420" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ba181b" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="landing-board-grad" x1="72" y1="72" x2="212" y2="168" gradientUnits="userSpaceOnUse">
          <stop stopColor={BOARD} />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>

      <motion.g {...float(0)}>
        <rect x="40" y="32" width="440" height="320" rx="28" stroke="#ba181b" strokeOpacity="0.2" strokeWidth="1.5" fill="url(#landing-hero-grad)" />
      </motion.g>

      <motion.g {...float(0.3)}>
        <rect x="72" y="72" width="140" height="96" rx="12" stroke="#0f766e" strokeOpacity="0.35" strokeWidth="1.25" fill="url(#landing-board-grad)" />
        <text x="142" y="108" textAnchor="middle" fill="#ecfdf5" fontSize="11" fontWeight="700" direction="rtl">
          مركز
        </text>
        <text x="142" y="124" textAnchor="middle" fill="#99f6e4" fontSize="9" direction="rtl">
          تعليمي
        </text>
        <path d="M88 136h108M88 148h88M88 160h96" stroke="#99f6e4" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M196 148c8-6 16-6 24 0v20c-8 6-16 6-24 0v-20z" fill={EMERALD} fillOpacity="0.35" stroke={EMERALD} strokeOpacity="0.5" strokeWidth="1" />
      </motion.g>

      <motion.g {...float(0.6)}>
        <rect x="236" y="72" width="212" height="192" rx="14" stroke="#ba181b" strokeOpacity="0.18" strokeWidth="1.25" fill="#ffffff" fillOpacity="0.85" />
        <ellipse cx="342" cy="120" rx="80" ry="40" fill="url(#landing-glow)" />
        <rect x="260" y="104" width="88" height="12" rx="4" fill="#ba181b" fillOpacity="0.55" />
        <rect x="260" y="128" width="164" height="8" rx="3" fill="#a4161a" fillOpacity="0.25" />
        <rect x="260" y="148" width="140" height="8" rx="3" fill="#a4161a" fillOpacity="0.2" />
        <rect x="260" y="168" width="156" height="8" rx="3" fill="#a4161a" fillOpacity="0.2" />
        <rect x="260" y="196" width="72" height="48" rx="8" fill="url(#landing-bar-grad)" />
        <rect x="344" y="196" width="72" height="48" rx="8" fill="#ba181b" fillOpacity="0.12" />
        <path d="M284 238v-28l24 14 24-14v28" stroke="#ba181b" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="376" cy="220" r="10" stroke="#a4161a" strokeOpacity="0.55" strokeWidth="2" />
      </motion.g>

      <path d="M96 296h328" stroke="#ba181b" strokeOpacity="0.2" strokeWidth="1.25" strokeDasharray="6 10" />

      <motion.g {...float(0.9)}>
        <rect x="88" y="312" width="96" height="28" rx="8" fill="#ba181b" fillOpacity="0.25" />
        <rect x="200" y="312" width="120" height="28" rx="8" stroke="#a4161a" strokeOpacity="0.35" strokeWidth="1.25" fill="#ffffff" fillOpacity="0.5" />
      </motion.g>

      <motion.g
        animate={{ rotate: [0, 4, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '428px', originY: '96px' }}
      >
        <path d="M412 96l16-16 16 16M428 80v48" stroke="#ba181b" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="428" cy="152" r="22" stroke="#ba181b" strokeOpacity="0.25" strokeWidth="1.5" fill="#ba181b" fillOpacity="0.08" />
        <path d="M428 142v12m0 8h.02" stroke="#ba181b" strokeOpacity="0.65" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

/** Subtle geometric grid inspired by Islamic patterns */
export function LandingGeometricPattern({ className }: { className?: string }) {
  const patternId = React.useId().replace(/:/g, '');
  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} aria-hidden>
      <defs>
        <pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M24 0v48M0 24h48" stroke="#ba181b" strokeOpacity="0.07" strokeWidth="0.75" />
          <circle cx="24" cy="24" r="1.5" fill="#ba181b" fillOpacity="0.1" />
          <path d="M24 8l8 8-8 8-8-8z" stroke="#a4161a" strokeOpacity="0.06" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/** Dot grid for section backgrounds */
export function LandingDotPattern({ className }: { className?: string }) {
  const patternId = React.useId().replace(/:/g, '');
  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} aria-hidden>
      <defs>
        <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="#ba181b" fillOpacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
