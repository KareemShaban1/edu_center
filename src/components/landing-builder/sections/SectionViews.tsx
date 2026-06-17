import type { LandingPageTheme, LandingSection, LocalizedText, TextRole } from '@/types/landing';
import { localized } from '@/lib/landing/defaults';
import { resolveLandingAssetUrl } from '@/lib/landing/media-url';
import { resolveSectionLayout } from '@/lib/landing/section-layouts';
import { resolveTextStyle } from '@/lib/landing/typography';
import { SectionImage } from '../SectionImage';
import { useTypography } from '../TypographyContext';
import { AnimatedSection, InlineEditable } from '../AnimatedSection';
import { cn } from '@/lib/utils';
import {
  BookOpen, Users, Clock, Award, CheckCircle, Star, Phone, Mail,
  MapPin, ChevronDown, Send, MessageCircle,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Users, Clock, Award, CheckCircle, Star,
};

/** Shared responsive section heading classes */
const SECTION_TITLE = 'text-2xl @sm:text-3xl font-bold text-center mb-8 @sm:mb-12';
const SECTION_TITLE_SM = 'text-xl @sm:text-2xl font-bold text-center mb-6 @sm:mb-8';

interface SectionProps {
  section: LandingSection;
  locale: 'en' | 'ar';
  theme: LandingPageTheme;
  editMode?: boolean;
  onContentChange?: (content: Record<string, unknown>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

function sectionStyle(section: LandingSection, theme: LandingPageTheme): React.CSSProperties {
  const s = section.style ?? {};
  const bgImage = s.backgroundGradient
    ?? (s.backgroundImage ? `url(${resolveLandingAssetUrl(s.backgroundImage)})` : undefined);

  return {
    backgroundColor: s.backgroundColor ?? theme.backgroundColor,
    backgroundImage: bgImage,
    backgroundSize: s.backgroundImage && !s.backgroundGradient ? 'cover' : undefined,
    backgroundPosition: s.backgroundImage && !s.backgroundGradient ? 'center' : undefined,
    backgroundRepeat: s.backgroundImage && !s.backgroundGradient ? 'no-repeat' : undefined,
    color: s.textColor ?? theme.textColor,
    paddingTop: `clamp(2rem, 5vw, ${s.paddingTop ?? 64}px)`,
    paddingBottom: `clamp(2rem, 5vw, ${s.paddingBottom ?? 64}px)`,
    borderRadius: s.borderRadius,
    boxShadow: s.boxShadow,
  };
}

function contentImageUrl(content: Record<string, unknown>, key = 'imageUrl'): string {
  return resolveLandingAssetUrl(content[key] as string | undefined);
}

function loc(content: Record<string, unknown>, key: string, locale: 'en' | 'ar') {
  return localized(content, key, locale);
}

function StyledText({
  fieldKey,
  role = 'body',
  tag: Tag = 'span',
  className,
  children,
  section,
  theme,
}: {
  fieldKey: string;
  role?: TextRole;
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  children: React.ReactNode;
  section: LandingSection;
  theme: LandingPageTheme;
}) {
  const typo = useTypography();
  const style = resolveTextStyle(fieldKey, section, theme, role);
  const isSelected = typo?.selectedTextKey === fieldKey && typo?.editMode;

  return (
    <Tag
      className={cn('max-w-full break-words min-w-0', className, isSelected && 'ring-2 ring-primary ring-offset-1 rounded-sm')}
      style={style}
      onClick={typo?.editMode ? e => { e.stopPropagation(); typo.onTextFieldSelect?.(fieldKey); } : undefined}
      role={typo?.editMode ? 'button' : undefined}
    >
      {children}
    </Tag>
  );
}

function locEdit(
  content: Record<string, unknown>,
  key: string,
  locale: 'en' | 'ar',
  editMode: boolean | undefined,
  onContentChange: ((c: Record<string, unknown>) => void) | undefined,
  section: LandingSection,
  theme: LandingPageTheme,
  role: TextRole = 'body',
  className?: string,
  multiline?: boolean,
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p',
) {
  const typo = useTypography();
  const val = content[key] as LocalizedText | undefined;
  const text = val ? val[locale] : '';
  const style = resolveTextStyle(key, section, theme, role);
  const isSelected = typo?.selectedTextKey === key && editMode;

  const handleClick = editMode
    ? (e: React.MouseEvent) => { e.stopPropagation(); typo?.onTextFieldSelect?.(key); }
    : undefined;

  return (
    <InlineEditable
      tag={tag}
      multiline={multiline}
      className={cn(className, isSelected && 'ring-2 ring-primary ring-offset-1')}
      style={style}
      value={text}
      editMode={editMode}
      onClick={handleClick}
      onChange={v => {
        if (!onContentChange || !val) return;
        onContentChange({ [key]: { ...val, [locale]: v } });
      }}
    />
  );
}

function HeroStatCell({
  stat,
  index,
  stats,
  locale,
  section,
  theme,
  editMode,
  onContentChange,
}: {
  stat: { value: string; label: LocalizedText };
  index: number;
  stats: { value: string; label: LocalizedText }[];
  locale: 'en' | 'ar';
  section: LandingSection;
  theme: LandingPageTheme;
  editMode?: boolean;
  onContentChange?: (content: Record<string, unknown>) => void;
}) {
  const typo = useTypography();
  const valueKey = `stat_value_${index}`;
  const labelKey = `stat_label_${index}`;
  const valueStyle = resolveTextStyle(valueKey, section, theme, 'stat');
  const labelStyle = resolveTextStyle(labelKey, section, theme, 'label');

  const updateStat = (patch: Partial<{ value: string; label: LocalizedText }>) => {
    if (!onContentChange) return;
    onContentChange({
      stats: stats.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  return (
    <div className="text-center">
      <InlineEditable
        className={cn(
          typo?.selectedTextKey === valueKey && editMode && 'ring-2 ring-primary ring-offset-1 rounded-sm',
        )}
        style={valueStyle}
        value={stat.value}
        editMode={editMode}
        onClick={editMode ? e => { e.stopPropagation(); typo?.onTextFieldSelect?.(valueKey); } : undefined}
        onChange={v => updateStat({ value: v })}
      />
      <InlineEditable
        className={cn(
          'opacity-70 block',
          typo?.selectedTextKey === labelKey && editMode && 'ring-2 ring-primary ring-offset-1 rounded-sm',
        )}
        style={labelStyle}
        value={stat.label[locale]}
        editMode={editMode}
        onClick={editMode ? e => { e.stopPropagation(); typo?.onTextFieldSelect?.(labelKey); } : undefined}
        onChange={v => updateStat({ label: { ...stat.label, [locale]: v } })}
      />
    </div>
  );
}

/** Renders localized text with typography; editable in builder via TypographyContext. */
function LocStyledInner({
  content,
  fieldKey,
  locale,
  section,
  theme,
  role = 'body',
  tag = 'span',
  className,
  multiline,
}: {
  content: Record<string, unknown>;
  fieldKey: string;
  locale: 'en' | 'ar';
  section: LandingSection;
  theme: LandingPageTheme;
  role?: TextRole;
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  multiline?: boolean;
}) {
  const typo = useTypography();
  if (typo?.editMode && typo.onContentChange) {
    return locEdit(content, fieldKey, locale, true, typo.onContentChange, section, theme, role, className, multiline, tag as 'span' | 'h1' | 'h2' | 'h3' | 'p');
  }
  return (
    <StyledText fieldKey={fieldKey} role={role} tag={tag} className={className} section={section} theme={theme}>
      {loc(content, fieldKey, locale)}
    </StyledText>
  );
}

function locStyled(
  content: Record<string, unknown>,
  key: string,
  locale: 'en' | 'ar',
  section: LandingSection,
  theme: LandingPageTheme,
  role: TextRole = 'body',
  tag: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div' = 'span',
  className?: string,
  multiline?: boolean,
) {
  return (
    <LocStyledInner
      content={content}
      fieldKey={key}
      locale={locale}
      section={section}
      theme={theme}
      role={role}
      tag={tag}
      className={className}
      multiline={multiline}
    />
  );
}

function SectionWrapper({ section, theme, editMode, isSelected, onSelect, children }: SectionProps & { children: React.ReactNode }) {
  return (
    <AnimatedSection
      animation={section.animation}
      editMode={editMode}
      className={cn('relative w-full overflow-hidden', editMode && 'cursor-pointer', isSelected && 'ring-2 ring-primary ring-offset-2')}
      style={sectionStyle(section, theme)}
      {...(editMode ? { onClick: onSelect } : {})}
    >
      <div className="container mx-auto w-full max-w-6xl px-4 @sm:px-6 @lg:px-8">{children}</div>
    </AnimatedSection>
  );
}

export function HeroSection(props: SectionProps) {
  const { section, locale, theme, editMode, onContentChange } = props;
  const c = section.content;
  const stats = (c.stats as { value: string; label: LocalizedText }[]) ?? [];
  const layout = resolveSectionLayout(section);

  const badge = (
    <span className="inline-block px-4 py-1 rounded-full" style={{ backgroundColor: `${theme.primaryColor}20` }}>
      {locEdit(c, 'badge', locale, editMode, onContentChange, section, theme, 'label')}
    </span>
  );
  const ctas = (
    <div className="flex flex-col @sm:flex-row flex-wrap gap-3 @sm:gap-4">
      <Button size="lg" className="w-full @sm:w-auto" style={{ backgroundColor: theme.primaryColor }}>
        {locEdit(c, 'ctaPrimary', locale, editMode, onContentChange, section, theme, 'button')}
      </Button>
      <Button size="lg" variant="outline" className="w-full @sm:w-auto">
        {locEdit(c, 'ctaSecondary', locale, editMode, onContentChange, section, theme, 'button')}
      </Button>
    </div>
  );
  const statsBlock = c.showStats && stats.length > 0 && (
    <div className="grid grid-cols-2 @sm:grid-cols-3 gap-3 @sm:gap-4 pt-4 @sm:pt-6">
      {stats.map((s, i) => (
        <HeroStatCell
          key={i}
          stat={s}
          index={i}
          stats={stats}
          locale={locale}
          section={section}
          theme={theme}
          editMode={editMode}
          onContentChange={onContentChange}
        />
      ))}
    </div>
  );
  const imageBlock = (
    <div className="aspect-[4/3] @sm:aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden" style={{ borderRadius: theme.borderRadius }}>
      {contentImageUrl(c) ? (
        <SectionImage src={c.imageUrl as string} alt="" className="w-full h-full object-cover" />
      ) : (
        <BookOpen className="w-24 h-24 opacity-20" style={{ color: theme.primaryColor }} />
      )}
    </div>
  );

  if (layout === 'centered') {
    return (
      <SectionWrapper {...props}>
        <div className="max-w-3xl mx-auto text-center space-y-4 @sm:space-y-6">
          {badge}
          {locEdit(c, 'headline', locale, editMode, onContentChange, section, theme, 'heading', 'text-center', false, 'h1')}
          {locEdit(c, 'subheadline', locale, editMode, onContentChange, section, theme, 'body', 'text-center', true, 'p')}
          <div className="flex flex-col @sm:flex-row flex-wrap justify-center gap-3 @sm:gap-4">
            <Button size="lg" className="w-full @sm:w-auto" style={{ backgroundColor: theme.primaryColor }}>
              {locEdit(c, 'ctaPrimary', locale, editMode, onContentChange, section, theme, 'button')}
            </Button>
            <Button size="lg" variant="outline" className="w-full @sm:w-auto">
              {locEdit(c, 'ctaSecondary', locale, editMode, onContentChange, section, theme, 'button')}
            </Button>
          </div>
          <div className="max-w-md mx-auto">{imageBlock}</div>
          {statsBlock}
        </div>
      </SectionWrapper>
    );
  }

  if (layout === 'background') {
    const bgUrl = contentImageUrl(c);
    return (
      <SectionWrapper {...props}>
        <div
          className="relative rounded-2xl overflow-hidden px-6 py-12 @sm:px-10 @sm:py-16"
          style={{
            borderRadius: theme.borderRadius,
            backgroundImage: bgUrl ? `linear-gradient(rgba(15,23,42,0.72), rgba(15,23,42,0.72)), url(${bgUrl})` : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative max-w-2xl space-y-4 @sm:space-y-6 text-white">
            {badge}
            {locEdit(c, 'headline', locale, editMode, onContentChange, section, theme, 'heading', undefined, false, 'h1')}
            {locEdit(c, 'subheadline', locale, editMode, onContentChange, section, theme, 'body', 'opacity-90', true, 'p')}
            {ctas}
            {statsBlock}
          </div>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper {...props}>
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8 @lg:gap-12 items-center">
        <div className="space-y-4 @sm:space-y-6 order-2 @lg:order-1">
          {badge}
          {locEdit(c, 'headline', locale, editMode, onContentChange, section, theme, 'heading', undefined, false, 'h1')}
          {locEdit(c, 'subheadline', locale, editMode, onContentChange, section, theme, 'body', undefined, true, 'p')}
          {ctas}
          {statsBlock}
        </div>
        <div className="order-1 @lg:order-2">{imageBlock}</div>
      </div>
    </SectionWrapper>
  );
}

export function ContentBlockSection(props: SectionProps & { contentKey?: string; titleKey?: string }) {
  const { section, locale, theme, editMode, onContentChange, titleKey = 'title', contentKey = 'body' } = props;
  const c = section.content;
  const layout = resolveSectionLayout(section);
  const imageBlock = (
    <div
      className="aspect-[4/3] @sm:aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden"
      style={{ borderRadius: theme.borderRadius }}
    >
      {contentImageUrl(c) ? (
        <SectionImage src={c.imageUrl as string} alt="" className="w-full h-full object-cover" />
      ) : (
        <BookOpen className="w-24 h-24 opacity-20" style={{ color: theme.primaryColor }} />
      )}
    </div>
  );
  const textBlock = (
    <div className="space-y-4 @sm:space-y-6">
      {locEdit(c, titleKey, locale, editMode, onContentChange, section, theme, 'heading', undefined, false, 'h2')}
      {locEdit(c, contentKey, locale, editMode, onContentChange, section, theme, 'body', undefined, true, 'p')}
    </div>
  );

  if (layout === 'split-right' || layout === 'split-left') {
    return (
      <SectionWrapper {...props}>
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8 @lg:gap-12 items-center">
          <div className={cn('space-y-4 @sm:space-y-6', layout === 'split-right' ? 'order-2 @lg:order-1' : 'order-2 @lg:order-2')}>
            {textBlock}
          </div>
          <div className={cn(layout === 'split-right' ? 'order-1 @lg:order-2' : 'order-1 @lg:order-1')}>
            {imageBlock}
          </div>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper {...props}>
      <div className="max-w-3xl mx-auto text-center space-y-4 @sm:space-y-6">
        {contentImageUrl(c) && <div className="max-w-sm mx-auto">{imageBlock}</div>}
        {locEdit(c, titleKey, locale, editMode, onContentChange, section, theme, 'heading', 'text-center', false, 'h2')}
        {locEdit(c, contentKey, locale, editMode, onContentChange, section, theme, 'body', 'text-center', true, 'p')}
      </div>
    </SectionWrapper>
  );
}

export function FeaturesSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as { icon?: string; title: LocalizedText; desc: LocalizedText }[]) ?? [];
  const layout = resolveSectionLayout(section);

  const renderItem = (item: typeof items[number], i: number, centered = true) => {
    const Icon = ICON_MAP[item.icon ?? 'BookOpen'] ?? BookOpen;
    return (
      <div
        key={i}
        className={cn(
          'p-6 rounded-xl border bg-white/50 space-y-4',
          centered ? 'text-center' : 'flex gap-4 items-start',
        )}
        style={{ borderRadius: theme.borderRadius }}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
            centered && 'mx-auto',
          )}
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: theme.primaryColor }} />
        </div>
        <div className={cn(centered ? 'space-y-2' : 'min-w-0')}>
          <h3 className="font-semibold text-lg">{item.title[locale]}</h3>
          <p className="text-sm opacity-70">{item.desc[locale]}</p>
        </div>
      </div>
    );
  };

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'list' ? (
        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, i) => renderItem(item, i, false))}
        </div>
      ) : (
        <div className={cn(
          'grid gap-6 @sm:gap-8',
          layout === 'grid-2' ? 'grid-cols-1 @sm:grid-cols-2' : 'grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3',
        )}>
          {items.map((item, i) => renderItem(item, i))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function TestimonialsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as { name: string; role: LocalizedText; text: LocalizedText; rating?: number }[]) ?? [];
  const layout = resolveSectionLayout(section);

  const renderCard = (item: typeof items[number], i: number, featured = false) => (
    <div
      key={i}
      className={cn(
        'p-6 rounded-xl border bg-white shadow-sm space-y-4',
        featured && 'p-8 @md:col-span-2',
      )}
      style={{ borderRadius: theme.borderRadius }}
    >
      <div className="flex gap-1">
        {Array.from({ length: item.rating ?? 5 }).map((_, j) => (
          <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className={cn('italic opacity-80', featured && 'text-lg')}>{`"${item.text[locale]}"`}</p>
      <div>
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm opacity-60">{item.role[locale]}</div>
      </div>
    </div>
  );

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'stacked' ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {items.map((item, i) => renderCard(item, i))}
        </div>
      ) : layout === 'featured' && items.length > 0 ? (
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-6 @sm:gap-8">
          {renderCard(items[0], 0, true)}
          {items.slice(1).map((item, i) => renderCard(item, i + 1))}
        </div>
      ) : (
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-6 @sm:gap-8">
          {items.map((item, i) => renderCard(item, i))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function PricingSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const plans = (c.plans as { name: LocalizedText; price: string; period: LocalizedText; featured?: boolean; features: LocalizedText[] }[]) ?? [];
  const layout = resolveSectionLayout(section);

  const renderPlan = (plan: typeof plans[number], i: number) => (
    <div
      key={i}
      className={cn(
        'p-6 @sm:p-8 rounded-xl border space-y-6 shrink-0',
        layout === 'horizontal' ? 'min-w-[280px] snap-center' : '',
        plan.featured && layout !== 'horizontal' && 'ring-2 @md:scale-105 bg-white shadow-lg z-10',
      )}
      style={{ borderRadius: theme.borderRadius, ...(plan.featured ? { borderColor: theme.primaryColor } : {}) }}
    >
      <h3 className="text-lg @sm:text-xl font-bold">{plan.name[locale]}</h3>
      <div>
        <span className="text-3xl @sm:text-4xl font-bold" style={{ color: theme.primaryColor }}>{plan.price}</span>
        <span className="opacity-60">{plan.period[locale]}</span>
      </div>
      <ul className="space-y-2">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: theme.primaryColor }} />
            {f[locale]}
          </li>
        ))}
      </ul>
      <Button className="w-full" style={{ backgroundColor: theme.primaryColor }}>{locale === 'ar' ? 'اختر الخطة' : 'Choose Plan'}</Button>
    </div>
  );

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'horizontal' ? (
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {plans.map((plan, i) => renderPlan(plan, i))}
        </div>
      ) : (
        <div className={cn(
          'grid gap-6 @sm:gap-8',
          layout === 'cards-2' ? 'grid-cols-1 @sm:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3',
        )}>
          {plans.map((plan, i) => renderPlan(plan, i))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function FaqSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as { q: LocalizedText; a: LocalizedText }[]) ?? [];
  const layout = resolveSectionLayout(section);

  if (layout === 'two-column') {
    return (
      <SectionWrapper {...props}>
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-6 @sm:gap-8">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border p-5 space-y-2 bg-white/60" style={{ borderRadius: theme.borderRadius }}>
              <h3 className="font-semibold">{item.q[locale]}</h3>
              <p className="text-sm opacity-80">{item.a[locale]}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <Accordion type="single" collapsible className="max-w-2xl mx-auto">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{item.q[locale]}</AccordionTrigger>
            <AccordionContent>{item.a[locale]}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionWrapper>
  );
}

export function StatisticsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const stats = (c.stats as { value: string; label: LocalizedText }[]) ?? [];
  const layout = resolveSectionLayout(section);

  const renderStat = (s: typeof stats[number], i: number, card = false) => (
    <div
      key={i}
      className={cn('text-center', card && 'rounded-xl border bg-white/60 p-6 shadow-sm')}
      style={card ? { borderRadius: theme.borderRadius } : undefined}
    >
      <div className="text-2xl @sm:text-4xl font-bold mb-1 @sm:mb-2" style={{ color: theme.primaryColor }}>{s.value}</div>
      <div className="opacity-70">{s.label[locale]}</div>
    </div>
  );

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'inline' ? (
        <div className="flex flex-wrap justify-center gap-8 @sm:gap-12 rounded-2xl border bg-white/40 px-6 py-8" style={{ borderRadius: theme.borderRadius }}>
          {stats.map((s, i) => renderStat(s, i))}
        </div>
      ) : layout === 'cards' ? (
        <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 @sm:gap-6">
          {stats.map((s, i) => renderStat(s, i, true))}
        </div>
      ) : (
        <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 @sm:gap-8">
          {stats.map((s, i) => renderStat(s, i))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function WhatsappSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const phone = (c.phone as string) || '';
  return (
    <SectionWrapper {...props}>
      <div className="text-center space-y-6 max-w-xl mx-auto px-2">
        <MessageCircle className="w-12 h-12 @sm:w-16 @sm:h-16 mx-auto" style={{ color: '#25D366' }} />
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
        {locStyled(c, 'message', locale, section, theme, 'body', 'p', 'opacity-80', true)}
        <Button size="lg" className="bg-[#25D366] hover:bg-[#20bd5a]" asChild>
          <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            {locStyled(c, 'buttonLabel', locale, section, theme, 'button', 'span')}
          </a>
        </Button>
      </div>
    </SectionWrapper>
  );
}

export function ContactFormSection(props: SectionProps) {
  const { section, locale, theme, editMode, onContentChange } = props;
  const c = section.content;
  return (
    <SectionWrapper {...props}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM + ' mb-2')}
          {locStyled(c, 'subtitle', locale, section, theme, 'body', 'p', 'opacity-70')}
        </div>
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          <Input placeholder={locale === 'ar' ? 'الاسم' : 'Name'} />
          <Input type="email" placeholder={locale === 'ar' ? 'البريد' : 'Email'} />
          <Input placeholder={locale === 'ar' ? 'الهاتف' : 'Phone'} />
          <Textarea placeholder={locale === 'ar' ? 'رسالتك' : 'Message'} rows={4} />
          <Button type="submit" className="w-full" style={{ backgroundColor: theme.primaryColor }}>
            {locEdit(c, 'submitLabel', locale, editMode, onContentChange, section, theme, 'button')}
          </Button>
        </form>
      </div>
    </SectionWrapper>
  );
}

export function CountdownSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const target = new Date(c.targetDate as string).getTime();
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { v: remaining.d, l: locale === 'ar' ? 'يوم' : 'Days' },
    { v: remaining.h, l: locale === 'ar' ? 'ساعة' : 'Hours' },
    { v: remaining.m, l: locale === 'ar' ? 'دقيقة' : 'Min' },
    { v: remaining.s, l: locale === 'ar' ? 'ثانية' : 'Sec' },
  ];

  return (
    <SectionWrapper {...props}>
      <div className="text-center space-y-6 @sm:space-y-8 px-2">
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
        <div className="flex flex-wrap justify-center gap-2 @sm:gap-4">
          {units.map(u => (
            <div key={u.l} className="w-14 h-14 @sm:w-20 @sm:h-20 rounded-xl flex flex-col items-center justify-center bg-white shadow" style={{ borderRadius: theme.borderRadius }}>
              <span className="text-lg @sm:text-2xl font-bold" style={{ color: theme.primaryColor }}>{u.v}</span>
              <span className="text-xs opacity-60">{u.l}</span>
            </div>
          ))}
        </div>
        <Button size="lg" className="w-full @sm:w-auto" style={{ backgroundColor: theme.primaryColor }}>
          {locStyled(c, 'cta', locale, section, theme, 'button', 'span')}
        </Button>
      </div>
    </SectionWrapper>
  );
}

export function FooterSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const links = (c.links as { label: LocalizedText; url: string }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      <div className="flex flex-col @md:flex-row justify-between items-center gap-4 pt-4 border-t opacity-80">
        {locStyled(c, 'copyright', locale, section, theme, 'body', 'p', 'text-sm')}
        <div className="flex flex-wrap justify-center gap-4 @sm:gap-6">
          {links.map((l, i) => (
            <a key={i} href={l.url} className="text-sm hover:underline">{l.label[locale]}</a>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

export function GenericListSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as LocalizedText[]) ?? (c.benefits as LocalizedText[]) ?? [];
  const layout = resolveSectionLayout(section);

  const getLabel = (item: LocalizedText | string) =>
    typeof item === 'object' && 'en' in item ? item[locale] : String(item);

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'cards' ? (
        <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border bg-white/60 p-5 flex items-start gap-3" style={{ borderRadius: theme.borderRadius }}>
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.primaryColor }} />
              <span>{getLabel(item)}</span>
            </div>
          ))}
        </div>
      ) : layout === 'columns-2' ? (
        <ul className="max-w-4xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: theme.primaryColor }} />
              <span>{getLabel(item)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="max-w-xl mx-auto space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: theme.primaryColor }} />
              <span>{getLabel(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionWrapper>
  );
}

export function ExperienceSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as { year: string; title: LocalizedText; org: LocalizedText }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="max-w-2xl mx-auto space-y-6">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col @sm:flex-row gap-1 @sm:gap-4 @sm:border-l-2 @sm:pl-6 pl-4 border-l-2" style={{ borderColor: theme.primaryColor }}>
            <div className="text-sm font-mono opacity-60 @sm:w-28 shrink-0">{item.year}</div>
            <div>
              <div className="font-semibold">{item.title[locale]}</div>
              <div className="text-sm opacity-70">{item.org[locale]}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function BranchSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const branches = (c.branches as { name: LocalizedText; address: LocalizedText; phone: string }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:gap-6">
        {branches.map((b, i) => (
          <div key={i} className="p-6 rounded-xl border space-y-2" style={{ borderRadius: theme.borderRadius }}>
            <div className="font-semibold text-lg">{b.name[locale]}</div>
            <div className="flex items-center gap-2 text-sm opacity-70"><MapPin className="w-4 h-4" />{b.address[locale]}</div>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4" />{b.phone}</div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function NewsletterSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  return (
    <SectionWrapper {...props}>
      <div className="max-w-lg mx-auto text-center space-y-4 px-2">
        <Send className="w-10 h-10 mx-auto opacity-60" />
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
        {locStyled(c, 'subtitle', locale, section, theme, 'body', 'p', 'opacity-70')}
        <div className="flex flex-col @sm:flex-row gap-2">
          <Input placeholder={loc(c, 'placeholder', locale)} readOnly className="flex-1" />
          <Button className="w-full @sm:w-auto shrink-0" style={{ backgroundColor: theme.primaryColor }}>
            {locStyled(c, 'buttonLabel', locale, section, theme, 'button', 'span')}
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}

export function VideoSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const url = c.videoUrl as string;
  return (
    <SectionWrapper {...props}>
      <div className="text-center space-y-6">
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
        <div className="aspect-video max-w-3xl mx-auto rounded-xl overflow-hidden bg-slate-100" style={{ borderRadius: theme.borderRadius }}>
          {url ? (
            <iframe src={url} className="w-full h-full" allowFullScreen title="video" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-40">Video</div>
          )}
        </div>
        {locStyled(c, 'caption', locale, section, theme, 'body', 'p', 'opacity-70')}
      </div>
    </SectionWrapper>
  );
}

export function CurriculumSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const modules = (c.modules as { title: LocalizedText; lessons: number }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="space-y-4 max-w-2xl mx-auto">
        {modules.map((m, i) => (
          <div key={i} className="flex flex-col @sm:flex-row @sm:justify-between @sm:items-center gap-1 @sm:gap-4 p-4 rounded-lg border" style={{ borderRadius: theme.borderRadius }}>
            <span className="font-medium text-start">{m.title[locale]}</span>
            <span className="text-sm opacity-60 shrink-0">{m.lessons} {locale === 'ar' ? 'دروس' : 'lessons'}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function SuccessStoriesSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const stories = (c.stories as { student: LocalizedText; before: string; after: string; subject: LocalizedText }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:gap-6">
        {stories.map((s, i) => (
          <div key={i} className="p-6 rounded-xl border text-center" style={{ borderRadius: theme.borderRadius }}>
            <div className="font-bold text-lg mb-2">{s.student[locale]}</div>
            <div className="text-sm opacity-60 mb-4">{s.subject[locale]}</div>
            <div className="flex flex-wrap justify-center items-center gap-2 @sm:gap-4">
              <span className="text-red-500 line-through">{s.before}</span>
              <ChevronDown className="w-4 h-4 rotate-[-90deg] shrink-0" />
              <span className="text-xl @sm:text-2xl font-bold" style={{ color: theme.primaryColor }}>{s.after}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function LeadFormSection(props: SectionProps) {
  const { section, locale, theme, editMode, onContentChange } = props;
  const c = section.content;
  return (
    <SectionWrapper {...props}>
      <div className="max-w-md mx-4 @sm:mx-auto p-4 @sm:p-8 rounded-2xl shadow-lg bg-white space-y-4" style={{ borderRadius: theme.borderRadius }}>
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', 'text-2xl font-bold text-center')}
        <Input placeholder={locale === 'ar' ? 'الاسم' : 'Name'} />
        <Input placeholder={locale === 'ar' ? 'الهاتف' : 'Phone'} />
        <Input placeholder={locale === 'ar' ? 'الصف' : 'Grade'} />
        <Input placeholder={locale === 'ar' ? 'المادة' : 'Subject'} />
        <Button className="w-full" style={{ backgroundColor: theme.primaryColor }}>
          {locEdit(c, 'submitLabel', locale, editMode, onContentChange, section, theme, 'button')}
        </Button>
      </div>
    </SectionWrapper>
  );
}

export function MapsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
      <div className="aspect-video max-w-3xl mx-auto rounded-xl bg-slate-100 flex items-center justify-center" style={{ borderRadius: theme.borderRadius }}>
        {(c.embedUrl as string) ? (
          <iframe src={c.embedUrl as string} className="w-full h-full rounded-xl" title="map" loading="lazy" />
        ) : (
          <div className="text-center opacity-60">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            {locStyled(c, 'address', locale, section, theme, 'body', 'div')}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

export function GallerySection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const images = ((c.images as string[]) ?? []).filter(Boolean);
  const layout = resolveSectionLayout(section);
  const placeholders = Array.from({ length: layout === 'grid-3' ? 6 : 4 });

  const renderImage = (img: string | undefined, i: number, className?: string) => (
    img ? (
      <SectionImage key={i} src={img} alt="" className={cn('object-cover rounded-lg aspect-square', className)} style={{ borderRadius: theme.borderRadius }} />
    ) : (
      <div key={i} className={cn('aspect-square rounded-lg bg-slate-100', className)} style={{ borderRadius: theme.borderRadius }} />
    )
  );

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      {layout === 'featured' && images.length > 0 ? (
        <div className="grid grid-cols-2 @md:grid-cols-4 gap-4">
          {renderImage(images[0], 0, 'col-span-2 row-span-2 aspect-auto min-h-[240px]')}
          {images.slice(1, 5).map((img, i) => renderImage(img, i + 1))}
        </div>
      ) : (
        <div className={cn(
          'grid gap-4',
          layout === 'grid-3' ? 'grid-cols-2 @md:grid-cols-3' : 'grid-cols-2 @md:grid-cols-4',
        )}>
          {images.length > 0
            ? images.map((img, i) => renderImage(img, i))
            : placeholders.map((_, i) => renderImage(undefined, i))}
        </div>
      )}
    </SectionWrapper>
  );
}

export function TeachingMethodSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const steps = (c.steps as { title: LocalizedText; desc: LocalizedText }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-2 @sm:grid-cols-4 gap-4 @sm:gap-6">
        {steps.map((step, i) => (
          <div key={i} className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>{i + 1}</div>
            <h3 className="font-semibold">{step.title[locale]}</h3>
            <p className="text-sm opacity-70">{step.desc[locale]}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function CertificationsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const items = (c.items as { name: LocalizedText; issuer: LocalizedText }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:gap-6 max-w-2xl mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border" style={{ borderRadius: theme.borderRadius }}>
            <Award className="w-8 h-8 shrink-0" style={{ color: theme.primaryColor }} />
            <div>
              <div className="font-semibold">{item.name[locale]}</div>
              <div className="text-sm opacity-60">{item.issuer[locale]}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function CourseDetailsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  return (
    <SectionWrapper {...props}>
      <div className="max-w-3xl mx-auto space-y-6">
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
        <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg border">
            <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: theme.primaryColor }} />
            {locStyled(c, 'duration', locale, section, theme, 'label', 'div', 'font-medium')}
          </div>
          <div className="p-4 rounded-lg border">
            <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: theme.primaryColor }} />
            {locStyled(c, 'level', locale, section, theme, 'label', 'div', 'font-medium')}
          </div>
          <div className="p-4 rounded-lg border">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: theme.primaryColor }} />
            {locStyled(c, 'format', locale, section, theme, 'label', 'div', 'font-medium')}
          </div>
        </div>
        {locStyled(c, 'body', locale, section, theme, 'body', 'p', 'text-center opacity-80', true)}
      </div>
    </SectionWrapper>
  );
}

export function TeamSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const members = (c.members as { name: LocalizedText; role: LocalizedText; imageUrl?: string }[]) ?? [];
  const layout = resolveSectionLayout(section);

  if (layout === 'list') {
    return (
      <SectionWrapper {...props}>
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
        <div className="max-w-3xl mx-auto space-y-4">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border bg-white/60 p-4" style={{ borderRadius: theme.borderRadius }}>
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {m.imageUrl && <SectionImage src={m.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div>
                <div className="font-semibold">{m.name[locale]}</div>
                <div className="text-sm opacity-60">{m.role[locale]}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className={cn(
        'grid gap-6 @sm:gap-8',
        layout === 'grid-4'
          ? 'grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4'
          : 'grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3',
      )}>
        {members.map((m, i) => (
          <div key={i} className="text-center space-y-3">
            <div className="w-24 h-24 rounded-full mx-auto bg-slate-200 overflow-hidden">
              {m.imageUrl && <SectionImage src={m.imageUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="font-semibold">{m.name[locale]}</div>
            <div className="text-sm opacity-60">{m.role[locale]}</div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function BlogSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const posts = (c.posts as { title: LocalizedText; excerpt: LocalizedText; date: string }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:gap-6">
        {posts.map((p, i) => (
          <div key={i} className="p-6 rounded-xl border space-y-2" style={{ borderRadius: theme.borderRadius }}>
            <div className="text-xs opacity-50">{p.date}</div>
            <h3 className="font-semibold text-lg">{p.title[locale]}</h3>
            <p className="text-sm opacity-70">{p.excerpt[locale]}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function LogosSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const logos = (c.logos as string[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', 'text-2xl font-bold text-center mb-8 opacity-80')}
      <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
        {logos.length > 0 ? logos.filter(Boolean).map((l, i) => (
          <SectionImage key={i} src={l} alt="" className="h-12 object-contain" />
        )) : (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-24 h-12 bg-slate-200 rounded" />)
        )}
      </div>
    </SectionWrapper>
  );
}

export function StudentResultsSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const results = (c.results as { year: string; passRate: string; topScore: string }[]) ?? [];
  return (
    <SectionWrapper {...props}>
      {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE)}
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 @sm:gap-6 max-w-xl mx-auto">
        {results.map((r, i) => (
          <div key={i} className="p-6 rounded-xl border text-center" style={{ borderRadius: theme.borderRadius }}>
            <div className="text-2xl font-bold mb-4">{r.year}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-sm opacity-60">{locale === 'ar' ? 'نسبة النجاح' : 'Pass Rate'}</div><div className="text-xl font-bold" style={{ color: theme.primaryColor }}>{r.passRate}</div></div>
              <div><div className="text-sm opacity-60">{locale === 'ar' ? 'أعلى درجة' : 'Top Score'}</div><div className="text-xl font-bold" style={{ color: theme.primaryColor }}>{r.topScore}</div></div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function SubjectOverviewSection(props: SectionProps) {
  const { section, locale, theme } = props;
  const c = section.content;
  const topics = (c.topics as LocalizedText[]) ?? [];
  return (
    <SectionWrapper {...props}>
      <div className="max-w-3xl mx-auto text-center space-y-4 @sm:space-y-6 px-2">
        {locStyled(c, 'title', locale, section, theme, 'heading', 'h2', SECTION_TITLE_SM)}
        {locStyled(c, 'body', locale, section, theme, 'body', 'p', 'opacity-80', true)}
        <div className="flex flex-wrap justify-center gap-3">
          {topics.map((t, i) => (
            <span key={i} className="px-4 py-2 rounded-full text-sm border" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>{t[locale]}</span>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
