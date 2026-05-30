import React from 'react';
import { cn } from '@/lib/utils';
import { brand } from '@/components/auth/login-theme';

const B = brand;

function Panel({ children, className, idPrefix = 'dash' }: { children: React.ReactNode; className?: string; idPrefix?: string }) {
  const gradId = `${idPrefix}-panel-bg`;
  return (
    <svg viewBox="0 0 480 320" fill="none" className={cn('h-auto w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="480" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor={B.crimsonBright} stopOpacity="0.06" />
          <stop offset="1" stopColor={B.surface} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="480" height="320" rx="24" fill={`url(#${gradId})`} stroke={B.crimsonBright} strokeOpacity="0.15" strokeWidth="1.5" />
      {children}
    </svg>
  );
}

export function AdminDashboardPreview({ className, idPrefix }: { className?: string; idPrefix?: string }) {
  return (
    <Panel className={className} idPrefix={idPrefix ?? 'admin'}>
      <rect x="28" y="28" width="120" height="264" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.2" strokeWidth="1.25" />
      {[52, 84, 116, 148, 180].map((y, i) => (
        <rect key={y} x="44" y={y} width={i === 0 ? 88 : 72} height="10" rx="4" fill={B.crimson} fillOpacity={i === 0 ? 0.45 : 0.18} />
      ))}
      <rect x="168" y="28" width="284" height="72" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="188" y="48" width="96" height="32" rx="8" fill={B.crimsonBright} fillOpacity="0.2" />
      <rect x="296" y="48" width="96" height="32" rx="8" fill={B.crimson} fillOpacity="0.12" />
      <rect x="404" y="48" width="28" height="32" rx="8" fill={B.crimsonDark} fillOpacity="0.15" />
      <rect x="168" y="116" width="136" height="176" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="188" y="136" width="96" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x="188" y={160 + i * 28} width="96" height="16" rx="4" fill={B.crimsonBright} fillOpacity={0.12 + i * 0.04} />
      ))}
      <rect x="316" y="116" width="136" height="176" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <path d="M336 200v-56l28 16 28-16v56" stroke={B.crimsonBright} strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="336" y="220" width="96" height="8" rx="3" fill={B.crimson} fillOpacity="0.2" />
      <rect x="336" y="240" width="72" height="8" rx="3" fill={B.crimson} fillOpacity="0.15" />
    </Panel>
  );
}

export function TeacherDashboardPreview({ className, idPrefix }: { className?: string; idPrefix?: string }) {
  return (
    <Panel className={className} idPrefix={idPrefix ?? 'teacher'}>
      <rect x="28" y="28" width="424" height="56" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="48" y="46" width="120" height="10" rx="4" fill={B.crimsonBright} fillOpacity="0.45" />
      <rect x="360" y="42" width="72" height="28" rx="8" fill={B.crimson} fillOpacity="0.18" />
      <rect x="28" y="100" width="200" height="192" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="48" y="120" width="80" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="48" y={148 + i * 44} width="160" height="32" rx="8" fill={B.crimsonBright} fillOpacity={0.08 + i * 0.04} stroke={B.crimson} strokeOpacity="0.15" strokeWidth="1" />
          <circle cx="64" cy={164 + i * 44} r="6" fill={B.crimsonBright} fillOpacity="0.5" />
          <rect x="80" y={158 + i * 44} width="88" height="8" rx="3" fill={B.crimson} fillOpacity="0.25" />
        </g>
      ))}
      <rect x="244" y="100" width="208" height="88" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="264" y="120" width="64" height="48" rx="8" fill={B.crimsonBright} fillOpacity="0.22" />
      <rect x="340" y="128" width="92" height="8" rx="3" fill={B.crimson} fillOpacity="0.3" />
      <rect x="340" y="148" width="72" height="8" rx="3" fill={B.crimson} fillOpacity="0.18" />
      <rect x="244" y="204" width="208" height="88" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      {[0, 1, 2].map(i => (
        <rect key={i} x="264" y={224 + i * 16} width={160 - i * 24} height="8" rx="3" fill={B.crimson} fillOpacity="0.2" />
      ))}
    </Panel>
  );
}

export function StudentDashboardPreview({ className, idPrefix }: { className?: string; idPrefix?: string }) {
  return (
    <Panel className={className} idPrefix={idPrefix ?? 'student'}>
      <rect x="28" y="28" width="200" height="120" rx="14" fill={B.crimsonBright} fillOpacity="0.12" stroke={B.crimsonBright} strokeOpacity="0.25" strokeWidth="1.25" />
      <rect x="48" y="48" width="100" height="10" rx="4" fill={B.crimsonDark} fillOpacity="0.35" />
      <rect x="48" y="72" width="140" height="8" rx="3" fill={B.crimson} fillOpacity="0.25" />
      <rect x="48" y="88" width="120" height="8" rx="3" fill={B.crimson} fillOpacity="0.18" />
      <rect x="48" y="112" width="80" height="24" rx="8" fill={B.crimsonBright} fillOpacity="0.35" />
      <rect x="244" y="28" width="208" height="120" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <circle cx="348" cy="88" r="36" stroke={B.crimsonBright} strokeOpacity="0.35" strokeWidth="6" fill="none" strokeDasharray="180 60" />
      <text x="348" y="94" textAnchor="middle" fill={B.crimsonDark} fontSize="16" fontWeight="700">
        92%
      </text>
      <rect x="28" y="164" width="424" height="128" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="48" y="184" width="72" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x="48" y={208 + i * 28} width="120" height="8" rx="3" fill={B.crimson} fillOpacity="0.2" />
          <rect x="380" y={206 + i * 28} width="52" height="12" rx="6" fill={B.crimsonBright} fillOpacity={0.15 + i * 0.08} />
        </g>
      ))}
    </Panel>
  );
}

export function ParentDashboardPreview({ className, idPrefix }: { className?: string; idPrefix?: string }) {
  return (
    <Panel className={className} idPrefix={idPrefix ?? 'parent'}>
      <rect x="28" y="28" width="424" height="72" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <circle cx="68" cy="64" r="22" fill={B.crimsonBright} fillOpacity="0.2" />
      <rect x="104" y="50" width="120" height="10" rx="4" fill={B.crimson} fillOpacity="0.35" />
      <rect x="104" y="68" width="88" height="8" rx="3" fill={B.crimson} fillOpacity="0.18" />
      <rect x="340" y="48" width="92" height="32" rx="8" fill={B.crimsonBright} fillOpacity="0.15" stroke={B.crimson} strokeOpacity="0.2" strokeWidth="1" />
      <rect x="28" y="116" width="200" height="176" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="48" y="136" width="80" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
      {[92, 78, 85].map((pct, i) => (
        <g key={i}>
          <rect x="48" y={164 + i * 36} width="160" height="24" rx="6" fill={B.crimsonBright} fillOpacity="0.08" />
          <rect x="56" y={172 + i * 36} width={`${pct * 1.4}`} height="8" rx="4" fill={B.crimsonBright} fillOpacity="0.35" />
        </g>
      ))}
      <rect x="244" y="116" width="208" height="176" rx="14" fill={B.surface} stroke={B.crimsonBright} strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="264" y="136" width="96" height="8" rx="3" fill={B.crimson} fillOpacity="0.35" />
      <rect x="264" y="160" width="168" height="48" rx="10" fill={B.crimsonDark} fillOpacity="0.08" stroke={B.crimsonBright} strokeOpacity="0.15" strokeWidth="1" />
      <rect x="280" y="176" width="72" height="8" rx="3" fill={B.crimson} fillOpacity="0.25" />
      <rect x="280" y="192" width="120" height="8" rx="3" fill={B.crimsonBright} fillOpacity="0.35" />
      <rect x="264" y="224" width="168" height="48" rx="10" fill={B.crimsonBright} fillOpacity="0.1" stroke={B.crimson} strokeOpacity="0.12" strokeWidth="1" />
    </Panel>
  );
}

export type DashboardRoleKey = 'admin' | 'teacher' | 'student' | 'parent';

export const dashboardPreviews: Record<DashboardRoleKey, React.FC<{ className?: string; idPrefix?: string }>> = {
  admin: AdminDashboardPreview,
  teacher: TeacherDashboardPreview,
  student: StudentDashboardPreview,
  parent: ParentDashboardPreview,
};

export const dashboardPreviewByGuard: Record<string, React.FC<{ className?: string; idPrefix?: string }>> = {
  users: AdminDashboardPreview,
  admin: AdminDashboardPreview,
  teacher: TeacherDashboardPreview,
  student: StudentDashboardPreview,
  parent: ParentDashboardPreview,
};
