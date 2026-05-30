import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { brand, guardPreviewCopy } from '@/components/auth/login-theme';
import { dashboardPreviewByGuard } from '@/components/landing/LandingDashboardPreviews';
import { LandingGeometricPattern } from '@/components/landing/LandingHeroIllustration';

const B = brand;

type LoginDashboardPreviewProps = {
  guard: string;
  isAr: boolean;
  className?: string;
};

export function LoginDashboardPreview({ guard, isAr, className }: LoginDashboardPreviewProps) {
  const Preview = dashboardPreviewByGuard[guard] ?? dashboardPreviewByGuard.users;
  const copy = guardPreviewCopy[guard] ?? guardPreviewCopy.users;

  return (
    <div className={cn('relative flex flex-col', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
        <LandingGeometricPattern className="opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
      </div>

      <div className="relative rounded-3xl border p-6 sm:p-8" style={{ borderColor: `${B.crimsonBright}22`, backgroundColor: B.surface }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={guard}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
          >
            <Preview idPrefix={`login-${guard}`} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${guard}-copy`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative mt-6 text-center lg:text-start"
        >
          <h2 className="font-display text-xl font-bold sm:text-2xl" style={{ color: B.charcoal }}>
            {isAr ? copy.titleAr : copy.titleEn}
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: B.textMuted }}>
            {isAr ? copy.descAr : copy.descEn}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
