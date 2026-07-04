import { cn } from '@/lib/utils';

type DecorVariant = 'default' | 'students' | 'teachers' | 'attendance' | 'finance' | 'exams' | 'alerts';

function themeStroke(token: string, opacity = 1) {
  if (token === '--primary') {
    return opacity < 1
      ? `color-mix(in srgb, var(--primary) ${Math.round(opacity * 100)}%, transparent)`
      : 'var(--primary)';
  }
  return opacity < 1 ? `hsl(var(${token}) / ${opacity})` : `hsl(var(${token}))`;
}

function themeFill(token: string, opacity = 0.15) {
  if (token === '--primary') {
    return `color-mix(in srgb, var(--primary) ${Math.round(opacity * 100)}%, transparent)`;
  }
  return `hsl(var(${token}) / ${opacity})`;
}

const decorTokens: Record<DecorVariant, string> = {
  default: '--primary',
  students: '--info',
  teachers: '--exams',
  attendance: '--success',
  finance: '--warning',
  exams: '--exams',
  alerts: '--destructive',
};

function StudentsDecor({ a, b }: { a: string; b: string }) {
  return (
    <>
      <circle cx="88" cy="36" r="26" fill={b} />
      <path
        d="M48 34 L88 18 L128 34 L88 50 Z"
        fill={b}
        stroke={a}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M58 50 V72 C58 82 118 82 118 72 V50"
        fill="none"
        stroke={a}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="88" cy="34" r="3" fill={a} opacity="0.5" />
    </>
  );
}

function TeachersDecor({ a, b }: { a: string; b: string }) {
  return (
    <>
      <circle cx="92" cy="34" r="26" fill={b} />
      <circle cx="88" cy="38" r="14" fill={b} stroke={a} strokeWidth="2" opacity="0.9" />
      <path
        d="M58 96 C58 76 72 66 88 66 C104 66 118 76 118 96"
        fill={b}
        stroke={a}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M72 44 H104 M88 44 V52"
        stroke={a}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </>
  );
}

function DefaultDecor({ a, b }: { a: string; b: string }) {
  return (
    <>
      <circle cx="88" cy="32" r="28" fill={b} />
      <circle cx="72" cy="56" r="18" fill={b} />
      <path
        d="M20 95 Q60 55 100 75"
        stroke={a}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <rect x="12" y="68" width="36" height="24" rx="6" fill={b} stroke={a} strokeWidth="1.5" opacity="0.6" />
    </>
  );
}

export function StatCardDecor({
  variant = 'default',
  statKey,
  className,
}: {
  variant?: DecorVariant;
  statKey?: string;
  className?: string;
}) {
  const token = decorTokens[variant] ?? decorTokens.default;
  const a = themeStroke(token);
  const b = themeFill(token, 0.18);

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('pointer-events-none absolute -end-4 -top-2 h-32 w-32 opacity-40', className)}
      aria-hidden
    >

       <DefaultDecor a={a} b={b} />
    </svg>
  );
}

export function AttendanceRing({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <svg viewBox="0 0 44 44" className={cn('h-11 w-11', className)} aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="hsl(var(--success))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export function TeacherHeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="teacherHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--exams))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="12" y="20" width="88" height="64" rx="10" fill="url(#teacherHeroGrad)" />
      <rect x="24" y="32" width="64" height="5" rx="2.5" fill="hsl(var(--exams))" opacity="0.4" />
      <rect x="24" y="44" width="48" height="5" rx="2.5" fill="hsl(var(--exams))" opacity="0.28" />
      <rect x="24" y="56" width="56" height="5" rx="2.5" fill="hsl(var(--exams))" opacity="0.22" />
      <rect x="24" y="68" width="40" height="5" rx="2.5" fill="hsl(var(--primary))" opacity="0.2" />
      <circle cx="152" cy="52" r="30" fill="hsl(var(--info) / 0.12)" />
      <path
        d="M138 52 L148 62 L168 42"
        stroke="hsl(var(--info))"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M108 118 C128 102 148 110 168 96 C178 88 186 92 194 86"
        stroke="hsl(var(--exams))"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
      <rect x="36" y="112" width="28" height="20" rx="5" fill="hsl(var(--warning) / 0.2)" />
      <circle cx="128" cy="126" r="9" fill="hsl(var(--success) / 0.2)" />
    </svg>
  );
}

export function ParentHeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="parentHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="56" cy="56" r="34" fill="url(#parentHeroGrad)" />
      <circle cx="56" cy="48" r="14" fill="hsl(var(--info) / 0.25)" />
      <path
        d="M32 96 C32 78 42 68 56 68 C70 68 80 78 80 96"
        fill="hsl(var(--info) / 0.2)"
        stroke="hsl(var(--info))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="118" cy="72" r="22" fill="hsl(var(--primary) / 0.15)" />
      <circle cx="118" cy="66" r="9" fill="hsl(var(--primary) / 0.3)" />
      <path
        d="M104 98 C104 86 110 80 118 80 C126 80 132 86 132 98"
        fill="hsl(var(--primary) / 0.12)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M88 118 C104 108 120 112 136 104"
        stroke="hsl(var(--success))"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <circle cx="158" cy="118" r="10" fill="hsl(var(--warning) / 0.2)" />
      <path
        d="M148 52 L156 60 L172 44"
        stroke="hsl(var(--success))"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function AdminHeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={cn('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="adminHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--exams))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="8" y="24" width="72" height="52" rx="10" fill="url(#adminHeroGrad)" />
      <rect x="20" y="36" width="48" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.35" />
      <rect x="20" y="48" width="36" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.25" />
      <rect x="20" y="60" width="42" height="6" rx="3" fill="hsl(var(--primary))" opacity="0.2" />
      <circle cx="148" cy="48" r="32" fill="hsl(var(--success) / 0.12)" />
      <path
        d="M132 48 L144 60 L164 36"
        stroke="hsl(var(--success))"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M100 120 C120 100 140 108 160 92 C170 84 180 88 192 80"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <circle cx="48" cy="118" r="10" fill="hsl(var(--warning) / 0.2)" />
      <circle cx="120" cy="128" r="8" fill="hsl(var(--exams) / 0.2)" />
    </svg>
  );
}
