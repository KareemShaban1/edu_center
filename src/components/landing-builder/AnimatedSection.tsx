import { motion, type Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { AnimationType } from '@/types/landing';
import { cn } from '@/lib/utils';

const variants: Record<AnimationType, Variants> = {
  none: {},
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  },
  'slide-left': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  },
  'slide-right': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
  },
  float: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: [0, -8, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  'scroll-reveal': {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  },
  parallax: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
  },
};

interface AnimatedSectionProps {
  animation?: AnimationType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  editMode?: boolean;
  onClick?: () => void;
}

export function AnimatedSection({ animation = 'fade-in', className, style, children, editMode, onClick }: AnimatedSectionProps) {
  if (editMode) {
    return <div className={className} style={style} onClick={onClick} role="presentation">{children}</div>;
  }
  return (
    <motion.section
      className={cn(className)}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants[animation] ?? variants['fade-in']}
    >
      {children}
    </motion.section>
  );
}

export function InlineEditable({
  value,
  onChange,
  editMode,
  className,
  style,
  multiline,
  tag: Tag = 'span',
  onClick,
}: {
  value: string;
  onChange?: (v: string) => void;
  editMode?: boolean;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  onClick?: (e: React.MouseEvent) => void;
}) {
  if (!editMode || !onChange) {
    return multiline
      ? <Tag className={cn('max-w-full break-words', className)} style={{ whiteSpace: 'pre-wrap', ...style }} onClick={onClick}>{value}</Tag>
      : <Tag className={cn('max-w-full break-words', className)} style={style} onClick={onClick}>{value}</Tag>;
  }
  if (multiline) {
    return (
      <textarea
        className={cn('w-full max-w-full min-w-0 bg-transparent border border-dashed border-primary/30 rounded px-2 py-1 resize-none', className)}
        style={style}
        value={value}
        onChange={e => onChange(e.target.value)}
        onClick={onClick}
        rows={3}
      />
    );
  }
  return (
    <input
      className={cn('w-full max-w-full min-w-0 bg-transparent border border-dashed border-primary/30 rounded px-2 py-0.5', className)}
      style={style}
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={onClick}
    />
  );
}
