import type { CSSProperties } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  BookOpen, CheckCircle, Star, Facebook, Instagram, Twitter, MessageCircle,
} from 'lucide-react';
import type { LandingComponent, LandingPageTheme, LocalizedText } from '@/types/landing';
import { componentText } from '@/lib/landing/component-defaults';
import { resolveLandingAssetUrl } from '@/lib/landing/media-url';
import { SectionImage } from './SectionImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, CheckCircle, Star, Users: LucideIcons.Users, Award: LucideIcons.Award,
  Clock: LucideIcons.Clock, GraduationCap: LucideIcons.GraduationCap,
};

interface ComponentRendererProps {
  component: LandingComponent;
  locale: 'en' | 'ar';
  theme: LandingPageTheme;
  editMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function alignClass(align: unknown): string {
  if (align === 'left') return 'text-start';
  if (align === 'right') return 'text-end';
  return 'text-center';
}

function wrapAlign(content: React.ReactNode, align: unknown, className?: string) {
  return <div className={cn(alignClass(align), className)}>{content}</div>;
}

export function ComponentRenderer({
  component,
  locale,
  theme,
  editMode,
  isSelected,
  onSelect,
}: ComponentRendererProps) {
  const c = component.content;
  const style = component.style as Record<string, unknown> | undefined;
  const inlineStyle: CSSProperties = {
    ...(style?.color ? { color: String(style.color) } : {}),
    ...(style?.backgroundColor ? { backgroundColor: String(style.backgroundColor) } : {}),
    ...(style?.padding ? { padding: Number(style.padding) } : {}),
  };

  const shell = (node: React.ReactNode, className?: string) => (
    <div
      className={cn(
        'relative min-w-0',
        editMode && 'cursor-pointer rounded-md transition-shadow',
        editMode && isSelected && 'ring-2 ring-primary ring-offset-2',
        className,
      )}
      style={inlineStyle}
      onClick={editMode ? e => { e.stopPropagation(); onSelect?.(); } : undefined}
      role={editMode ? 'button' : undefined}
    >
      {node}
    </div>
  );

  switch (component.type) {
    case 'heading': {
      const level = (c.level as string) || 'h2';
      const Tag = (level === 'h1' || level === 'h3' ? level : 'h2') as 'h1' | 'h2' | 'h3';
      const sizes = { h1: 'text-3xl @sm:text-4xl', h2: 'text-2xl @sm:text-3xl', h3: 'text-xl @sm:text-2xl' };
      return shell(
        wrapAlign(
          <Tag className={cn('font-bold', sizes[Tag])} style={{ color: theme.headingColor ?? theme.textColor }}>
            {componentText(c, 'text', locale)}
          </Tag>,
          c.align,
        ),
      );
    }
    case 'paragraph':
      return shell(
        wrapAlign(
          <p className="text-base leading-relaxed opacity-90 whitespace-pre-wrap">{componentText(c, 'text', locale)}</p>,
          c.align,
        ),
      );
    case 'button':
      return shell(
        wrapAlign(
          <Button
            asChild={!editMode && !!c.url}
            variant={c.variant === 'outline' ? 'outline' : 'default'}
            style={c.variant !== 'outline' ? { backgroundColor: theme.primaryColor } : undefined}
          >
            {editMode ? (
              <span>{componentText(c, 'label', locale)}</span>
            ) : (
              <a href={String(c.url || '#')}>{componentText(c, 'label', locale)}</a>
            )}
          </Button>,
          c.align,
        ),
      );
    case 'image': {
      const width = c.width === 'small' ? 'max-w-xs' : c.width === 'medium' ? 'max-w-md' : 'w-full';
      return shell(
        wrapAlign(
          c.url ? (
            <SectionImage
              src={resolveLandingAssetUrl(String(c.url))}
              alt={componentText(c, 'alt', locale)}
              className={cn('rounded-lg object-cover mx-auto', width, c.width !== 'full' && 'aspect-video')}
            />
          ) : (
            <div className={cn('aspect-video rounded-lg bg-slate-100 mx-auto', width)} />
          ),
          c.align,
        ),
      );
    }
    case 'video':
      return shell(
        wrapAlign(
          <div className="aspect-video rounded-lg overflow-hidden bg-black/5 max-w-3xl mx-auto">
            {c.url ? (
              <iframe
                title="video"
                src={String(c.url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>,
          c.align,
        ),
      );
    case 'badge':
      return shell(
        wrapAlign(
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}>
            {componentText(c, 'text', locale)}
          </span>,
          c.align,
        ),
      );
    case 'tag':
      return shell(
        wrapAlign(
          <span className="inline-block px-2.5 py-0.5 rounded border text-xs font-semibold">{componentText(c, 'text', locale)}</span>,
          c.align,
        ),
      );
    case 'icon': {
      const Icon = ICON_MAP[String(c.icon || 'BookOpen')] ?? BookOpen;
      return shell(
        wrapAlign(
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15` }}>
              <Icon className="w-6 h-6" style={{ color: theme.primaryColor }} />
            </div>
            <span className="font-medium">{componentText(c, 'label', locale)}</span>
          </div>,
          c.align,
        ),
      );
    }
    case 'card':
      return shell(
        <div className="rounded-xl border bg-white/60 p-5 space-y-3 max-w-md mx-auto" style={{ borderRadius: theme.borderRadius }}>
          {c.imageUrl ? (
            <SectionImage src={String(c.imageUrl)} alt="" className="w-full aspect-video object-cover rounded-lg" />
          ) : null}
          <h3 className="font-semibold text-lg">{componentText(c, 'title', locale)}</h3>
          <p className="text-sm opacity-80">{componentText(c, 'body', locale)}</p>
        </div>,
      );
    case 'counter':
      return shell(
        wrapAlign(
          <div>
            <div className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{String(c.value ?? '0')}</div>
            <div className="text-sm opacity-70">{componentText(c, 'label', locale)}</div>
          </div>,
          c.align,
        ),
      );
    case 'testimonial':
      return shell(
        <div className="rounded-xl border bg-white p-5 space-y-3 max-w-lg mx-auto shadow-sm" style={{ borderRadius: theme.borderRadius }}>
          <div className="flex gap-1">
            {Array.from({ length: Number(c.rating ?? 5) }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="italic opacity-80">{`"${componentText(c, 'text', locale)}"`}</p>
          <div>
            <div className="font-semibold">{String(c.name ?? '')}</div>
            <div className="text-sm opacity-60">{componentText(c, 'role', locale)}</div>
          </div>
        </div>,
      );
    case 'accordion': {
      const items = (c.items as { q: LocalizedText; a: LocalizedText }[]) ?? [];
      return shell(
        <Accordion type="single" collapsible className="max-w-2xl mx-auto">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`acc-${component.id}-${i}`}>
              <AccordionTrigger>{item.q[locale]}</AccordionTrigger>
              <AccordionContent>{item.a[locale]}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>,
      );
    }
    case 'form':
      return shell(
        <div className="max-w-md mx-auto space-y-4 rounded-xl border bg-white/60 p-5" style={{ borderRadius: theme.borderRadius }}>
          <h3 className="font-semibold text-center">{componentText(c, 'title', locale)}</h3>
          <Input placeholder={locale === 'ar' ? 'الاسم' : 'Name'} readOnly={editMode} />
          <Input type="email" placeholder={locale === 'ar' ? 'البريد' : 'Email'} readOnly={editMode} />
          <Textarea placeholder={locale === 'ar' ? 'رسالتك' : 'Message'} rows={3} readOnly={editMode} />
          <Button className="w-full" style={{ backgroundColor: theme.primaryColor }}>
            {componentText(c, 'submitLabel', locale)}
          </Button>
        </div>,
      );
    case 'progress':
      return shell(
        wrapAlign(
          <div className="max-w-md mx-auto w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>{componentText(c, 'label', locale)}</span>
              <span>{Number(c.value ?? 0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Number(c.value ?? 0)}%`, backgroundColor: theme.primaryColor }} />
            </div>
          </div>,
          c.align,
        ),
      );
    case 'timeline': {
      const items = (c.items as { year: string; title: LocalizedText; desc: LocalizedText }[]) ?? [];
      return shell(
        <div className="max-w-xl mx-auto space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-4 border-s-2 ps-4" style={{ borderColor: theme.primaryColor }}>
              <div className="text-sm font-mono opacity-60 w-16 shrink-0">{item.year}</div>
              <div>
                <div className="font-semibold">{item.title[locale]}</div>
                <div className="text-sm opacity-70">{item.desc[locale]}</div>
              </div>
            </div>
          ))}
        </div>,
      );
    }
    case 'pricing_table': {
      const plans = (c.plans as { name: LocalizedText; price: string; period: LocalizedText; featured?: boolean; features: LocalizedText[] }[]) ?? [];
      return shell(
        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn('rounded-xl border p-5 space-y-4', plan.featured && 'ring-2 shadow-lg')}
              style={{ borderRadius: theme.borderRadius, ...(plan.featured ? { borderColor: theme.primaryColor } : {}) }}
            >
              <h4 className="font-bold text-lg">{plan.name[locale]}</h4>
              <div>
                <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{plan.price}</span>
                <span className="text-sm opacity-60">{plan.period[locale]}</span>
              </div>
              <ul className="space-y-1 text-sm">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex gap-2"><CheckCircle className="w-4 h-4 shrink-0" style={{ color: theme.primaryColor }} />{f[locale]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>,
      );
    }
    case 'social_links': {
      const links = [
        { key: 'facebook', Icon: Facebook, href: String(c.facebook || '') },
        { key: 'instagram', Icon: Instagram, href: String(c.instagram || '') },
        { key: 'whatsapp', Icon: MessageCircle, href: c.whatsapp ? `https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}` : '' },
        { key: 'twitter', Icon: Twitter, href: String(c.twitter || '') },
      ].filter(l => l.href);
      return shell(
        wrapAlign(
          <div className="flex flex-wrap justify-center gap-3">
            {links.length > 0 ? links.map(({ key, Icon, href }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-muted">
                <Icon className="w-4 h-4" />
              </a>
            )) : (
              <span className="text-sm opacity-50">{locale === 'ar' ? 'أضف روابط التواصل' : 'Add social links'}</span>
            )}
          </div>,
          c.align,
        ),
      );
    }
    default:
      return shell(<div className="text-sm opacity-50">{component.type}</div>);
  }
}
