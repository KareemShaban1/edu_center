import React from 'react';
import { cn } from '@/lib/utils';
import { brand } from '@/components/auth/login-theme';

const B = brand;

function Frame({ children, className, idPrefix }: { children: React.ReactNode; className?: string; idPrefix: string }) {
  const gradId = `${idPrefix}-feat-bg`;
  return (
    <svg viewBox="0 0 400 260" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="400" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor={B.crimsonBright} stopOpacity="0.08" />
          <stop offset="1" stopColor={B.surface} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" rx="20" fill={`url(#${gradId})`} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      {children}
    </svg>
  );
}

export function StudentsFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="students" className={className}>
      {[0, 1, 2].map(i => (
        <g key={i}>
          <circle cx={80 + i * 120} cy="72" r="28" fill={B.crimsonBright} fillOpacity={0.15 + i * 0.05} stroke={B.crimson} strokeOpacity="0.2" strokeWidth="1" />
          <rect x={52 + i * 120} y="112" width="56" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
          <rect x={44 + i * 120} y="128" width="72" height="6" rx="2" fill={B.crimson} fillOpacity="0.18" />
        </g>
      ))}
      <rect x="32" y="160" width="336" height="72" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.15" strokeWidth="1" />
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x="48" y={176 + i * 14} width={280 - i * 40} height="6" rx="2" fill={B.crimsonBright} fillOpacity={0.12 + i * 0.04} />
      ))}
    </Frame>
  );
}

export function AttendanceFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="attendance" className={className}>
      <rect x="32" y="36" width="160" height="188" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1" />
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x="48" y={56 + i * 32} width="128" height="22" rx="6" fill={B.crimsonBright} fillOpacity="0.06" />
          <circle cx="62" cy={67 + i * 32} r="6" fill={i < 4 ? B.crimsonBright : B.crimson} fillOpacity={i < 4 ? 0.5 : 0.2} />
          <rect x="78" y={62 + i * 32} width="72" height="6" rx="2" fill={B.crimson} fillOpacity="0.25" />
        </g>
      ))}
      <rect x="208" y="36" width="160" height="88" rx="12" fill={B.crimsonBright} fillOpacity="0.12" stroke={B.crimsonBright} strokeOpacity="0.2" strokeWidth="1" />
      <path d="M248 72l16 16 32-32" stroke={B.crimsonBright} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="228" y="96" width="120" height="8" rx="3" fill={B.crimsonDark} fillOpacity="0.3" />
      <rect x="208" y="136" width="160" height="88" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.15" strokeWidth="1" />
      <rect x="224" y="152" width="128" height="8" rx="3" fill={B.crimson} fillOpacity="0.3" />
      <rect x="224" y="172" width="96" height="6" rx="2" fill={B.crimson} fillOpacity="0.18" />
      <rect x="224" y="188" width="112" height="6" rx="2" fill={B.crimson} fillOpacity="0.18" />
    </Frame>
  );
}

export function ExamsFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="exams" className={className}>
      <rect x="32" y="40" width="200" height="180" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1" />
      <rect x="52" y="60" width="120" height="10" rx="4" fill={B.crimsonBright} fillOpacity="0.4" />
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x="52" y={88 + i * 28} width="160" height="16" rx="4" fill={B.crimson} fillOpacity="0.1" />
          <circle cx="64" cy={96 + i * 28} r="5" stroke={B.crimsonBright} strokeWidth="1.5" fill="none" />
        </g>
      ))}
      <rect x="248" y="40" width="120" height="180" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1" />
      {[72, 48, 88, 56].map((h, i) => (
        <rect key={i} x={268 + i * 22} y={200 - h} width="14" height={h} rx="4" fill={B.crimsonBright} fillOpacity={0.2 + i * 0.12} />
      ))}
      <rect x="268" y="204" width="80" height="6" rx="2" fill={B.crimson} fillOpacity="0.2" />
    </Frame>
  );
}

export function FeesFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="fees" className={className}>
      <rect x="32" y="48" width="336" height="64" rx="12" fill={B.crimsonBright} fillOpacity="0.1" stroke={B.crimsonBright} strokeOpacity="0.2" strokeWidth="1" />
      <rect x="52" y="68" width="80" height="8" rx="3" fill={B.crimsonDark} fillOpacity="0.35" />
      <rect x="280" y="64" width="72" height="28" rx="8" fill={B.crimsonBright} fillOpacity="0.35" />
      {[0, 1, 2].map(i => (
        <rect key={i} x="32" y={128 + i * 44} width="336" height="36" rx="10" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.12" strokeWidth="1" />
      ))}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="48" y={140 + i * 44} width="100" height="8" rx="3" fill={B.crimson} fillOpacity="0.25" />
          <rect x="280" y={138 + i * 44} width="72" height="12" rx="6" fill={i === 0 ? B.crimsonBright : B.crimson} fillOpacity={i === 0 ? 0.4 : 0.2} />
        </g>
      ))}
    </Frame>
  );
}

export function LibraryFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="library" className={className}>
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={40 + i * 88} y="48" width="64" height="88" rx="6" fill={B.crimsonBright} fillOpacity={0.1 + i * 0.05} stroke={B.crimson} strokeOpacity="0.15" strokeWidth="1" />
      ))}
      <rect x="32" y="152" width="336" height="72" rx="12" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.15" strokeWidth="1" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="48" y={168 + i * 18} width="200" height="6" rx="2" fill={B.crimson} fillOpacity="0.2" />
          <rect x="280" y={166 + i * 18} width="56" height="10" rx="5" fill={B.crimsonBright} fillOpacity={0.15 + i * 0.08} />
        </g>
      ))}
    </Frame>
  );
}

export function LiveClassesFeatureIllustration({ className }: { className?: string }) {
  return (
    <Frame idPrefix="live" className={className}>
      <rect x="32" y="40" width="336" height="180" rx="14" fill={B.charcoal} fillOpacity="0.06" stroke={B.crimsonBright} strokeOpacity="0.2" strokeWidth="1.25" />
      <circle cx="200" cy="120" r="40" fill={B.crimsonBright} fillOpacity="0.15" stroke={B.crimsonBright} strokeOpacity="0.35" strokeWidth="2" />
      <path d="M188 108l24 14v-28l-24 14z" fill={B.crimsonBright} fillOpacity="0.6" />
      {[
        { x: 56, y: 56 },
        { x: 320, y: 56 },
        { x: 56, y: 180 },
        { x: 320, y: 180 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="16" fill={B.surface} stroke={B.crimson} strokeOpacity="0.25" strokeWidth="1" />
      ))}
      <rect x="120" y="200" width="160" height="8" rx="3" fill={B.crimson} fillOpacity="0.25" />
    </Frame>
  );
}

export type FeatureIllustrationKey =
  | 'students'
  | 'attendance'
  | 'exams'
  | 'fees'
  | 'library'
  | 'live';

export const featureIllustrations: Record<FeatureIllustrationKey, React.FC<{ className?: string }>> = {
  students: StudentsFeatureIllustration,
  attendance: AttendanceFeatureIllustration,
  exams: ExamsFeatureIllustration,
  fees: FeesFeatureIllustration,
  library: LibraryFeatureIllustration,
  live: LiveClassesFeatureIllustration,
};
