import type { LandingPageTheme, LandingSection } from '@/types/landing';
import { resolveSectionLayout } from '@/lib/landing/section-layouts';
import { ComponentRenderer } from '../ComponentRenderer';
import { AnimatedSection } from '../AnimatedSection';
import { cn } from '@/lib/utils';

interface CustomSectionViewProps {
  section: LandingSection;
  locale: 'en' | 'ar';
  theme: LandingPageTheme;
  editMode?: boolean;
  isSelected?: boolean;
  selectedComponentId?: string | null;
  onSelect?: () => void;
  onSelectComponent?: (componentId: string) => void;
}

function sectionStyle(section: LandingSection, theme: LandingPageTheme): React.CSSProperties {
  const s = section.style ?? {};
  return {
    backgroundColor: s.backgroundColor ?? theme.backgroundColor,
    color: s.textColor ?? theme.textColor,
    paddingTop: `clamp(2rem, 5vw, ${s.paddingTop ?? 64}px)`,
    paddingBottom: `clamp(2rem, 5vw, ${s.paddingBottom ?? 64}px)`,
    borderRadius: s.borderRadius,
    boxShadow: s.boxShadow,
  };
}

export function CustomSectionView({
  section,
  locale,
  theme,
  editMode,
  isSelected,
  selectedComponentId,
  onSelect,
  onSelectComponent,
}: CustomSectionViewProps) {
  const layout = resolveSectionLayout(section);
  const components = [...(section.components ?? [])].sort((a, b) => a.order - b.order);

  const gridClass =
    layout === 'three-column'
      ? 'grid grid-cols-1 @md:grid-cols-3 gap-6'
      : layout === 'two-column'
        ? 'grid grid-cols-1 @md:grid-cols-2 gap-6'
        : 'flex flex-col gap-6';

  return (
    <AnimatedSection
      animation={section.animation}
      editMode={editMode}
      className={cn(
        'relative w-full overflow-hidden',
        editMode && 'cursor-pointer',
        isSelected && 'ring-2 ring-primary ring-offset-2',
      )}
      style={sectionStyle(section, theme)}
      {...(editMode ? { onClick: onSelect } : {})}
    >
      <div className="container mx-auto w-full max-w-6xl px-4 @sm:px-6 @lg:px-8">
        {components.length === 0 ? (
          <div className="text-center py-12 text-sm opacity-50 border border-dashed rounded-lg">
            {locale === 'ar' ? 'أضف مكوّنات من لوحة الخصائص' : 'Add components from the properties panel'}
          </div>
        ) : (
          <div className={gridClass}>
            {components.map(component => (
              <ComponentRenderer
                key={component.id}
                component={component}
                locale={locale}
                theme={theme}
                editMode={editMode}
                isSelected={selectedComponentId === component.id}
                onSelect={() => onSelectComponent?.(component.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
