import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { brand } from '@/components/auth/login-theme';
import { LandingGeometricPattern } from '@/components/landing/LandingHeroIllustration';
import { EDUCATION_EGYPT_IMAGES } from '@/lib/education-assets';

const B = brand;
const EMERALD = '#0d9488';

const float = (delay = 0) => ({
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4 + delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay },
  },
});

/** Decorative education scene for auth / marketing side panels */
export function EgyptEducationScene({
  variant = 'classroom',
  className,
}: {
  variant?: 'classroom' | 'student' | 'parent' | 'platform';
  className?: string;
}) {
  const imageSrc =
    variant === 'student'
      ? EDUCATION_EGYPT_IMAGES.studentLearning
      : variant === 'parent'
        ? EDUCATION_EGYPT_IMAGES.parentSupport
        : variant === 'platform'
          ? EDUCATION_EGYPT_IMAGES.centerCampus
          : EDUCATION_EGYPT_IMAGES.heroClassroom;

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
        <LandingGeometricPattern className="opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
      </div>
      <motion.div
        {...float(0.2)}
        className="relative overflow-hidden rounded-3xl border shadow-lg"
        style={{ borderColor: `${B.crimsonBright}22`, backgroundColor: B.surface }}
      >
        <img
          src={imageSrc}
          alt=""
          className="block w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
      <motion.div
        {...float(0.6)}
        className="absolute -bottom-3 inset-inline-start-6 rounded-xl border px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-sm"
        style={{ borderColor: `${EMERALD}44`, backgroundColor: B.surface, color: B.charcoal }}
      >
        {variant === 'parent' ? 'متابعة شفافة' : variant === 'student' ? 'تعلّم بثقة' : 'تعليم في مصر'}
      </motion.div>
    </div>
  );
}

/** Inline SVG accent — open Arabic book with geometric motif */
export function EgyptEducationBookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn('h-12 w-12', className)} aria-hidden>
      <path
        d="M8 12c8-4 16-4 24 0v40c-8-4-16-4-24 0V12z"
        fill={`${B.crimsonBright}22`}
        stroke={B.crimsonBright}
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M56 12c-8-4-16-4-24 0v40c8-4 16-4 24 0V12z"
        fill={`${EMERALD}22`}
        stroke={EMERALD}
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <path d="M32 12v40" stroke={B.charcoal} strokeOpacity="0.15" strokeWidth="1" />
      <text x="22" y="36" fill={B.crimsonDark} fontSize="10" fontWeight="700" direction="rtl">
        علم
      </text>
      <text x="42" y="36" fill={EMERALD} fontSize="10" fontWeight="700" direction="rtl">
        معرفة
      </text>
    </svg>
  );
}
