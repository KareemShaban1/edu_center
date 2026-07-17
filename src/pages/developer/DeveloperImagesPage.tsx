import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Image as ImageIcon, RefreshCcw, Search, Upload, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WEBSITE_IMAGES, type WebsiteImageDefinition } from '@/config/website-images';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveAssetUrl } from '@/lib/asset-url';
import { toast } from '@/hooks/use-toast';
import { websiteImagesApi } from '@/services/endpoints/website-images';

interface ImageDimensions {
  width: number;
  height: number;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ImageCard({
  image,
  dimensions,
  onDimensions,
  onReplace,
  onReset,
  replacing,
  isAr,
}: {
  image: WebsiteImageDefinition;
  dimensions?: ImageDimensions;
  onDimensions: (dimensions: ImageDimensions) => void;
  onReplace: (file: File) => void;
  onReset: () => void;
  replacing: boolean;
  isAr: boolean;
}) {
  const { data: overrides = {} } = useQuery({
    queryKey: ['website-images'],
    queryFn: websiteImagesApi.list,
  });
  const override = overrides[image.key];
  const src = resolveAssetUrl(override?.url) || image.defaultUrl;
  const actual = override?.width && override?.height
    ? { width: override.width, height: override.height }
    : dimensions;
  const matchesRecommendation = actual
    ? actual.width === image.recommendedWidth && actual.height === image.recommendedHeight
    : false;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-muted/40 p-3">
        <img
          src={src}
          alt={image.name}
          className={image.fit === 'cover' ? 'h-full w-full object-cover' : 'h-full w-full object-contain'}
          onLoad={event => onDimensions({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })}
        />
        <Badge className="absolute end-3 top-3" variant={override ? 'default' : 'secondary'}>
          {override ? (isAr ? 'معدلة' : 'Replaced') : (isAr ? 'أصلية' : 'Original')}
        </Badge>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold">{image.name}</h2>
            <Badge variant="outline">{image.category}</Badge>
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">{image.defaultUrl}</p>
          <p className="mt-2 text-sm text-muted-foreground">{image.pages.join(' · ')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/60 p-2.5">
            <p className="text-xs text-muted-foreground">{isAr ? 'الحجم الفعلي' : 'Actual size'}</p>
            <p className="mt-1 font-medium">{actual ? `${actual.width} × ${actual.height}px` : '—'}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <p className="text-xs text-muted-foreground">{isAr ? 'الحجم المطلوب' : 'Recommended'}</p>
            <p className="mt-1 font-medium">{image.recommendedWidth} × {image.recommendedHeight}px</p>
          </div>
        </div>

        {actual && (
          <div className={matchesRecommendation ? 'flex items-center gap-2 text-sm text-emerald-600' : 'flex items-center gap-2 text-sm text-amber-600'}>
            {matchesRecommendation
              ? <CheckCircle2 className="h-4 w-4" />
              : <XCircle className="h-4 w-4" />}
            {matchesRecommendation
              ? (isAr ? 'الأبعاد مطابقة' : 'Dimensions match')
              : (isAr ? 'يفضل استخدام الحجم المطلوب' : 'Recommended dimensions differ')}
            {override?.bytes ? <span className="text-muted-foreground">· {formatBytes(override.bytes)}</span> : null}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild className="flex-1 gap-2" disabled={replacing}>
            <label>
              <Upload className="h-4 w-4" />
              {replacing ? (isAr ? 'جارٍ الرفع...' : 'Uploading...') : (isAr ? 'تغيير الصورة' : 'Replace image')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
                className="sr-only"
                disabled={replacing}
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) onReplace(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </Button>
          {override && (
            <Button type="button" variant="outline" size="icon" onClick={onReset} title={isAr ? 'استعادة الأصل' : 'Restore original'}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DeveloperImagesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dimensions, setDimensions] = useState<Record<string, ImageDimensions>>({});
  const [replacingKey, setReplacingKey] = useState<string | null>(null);

  useQuery({
    queryKey: ['website-images'],
    queryFn: websiteImagesApi.list,
  });

  const replaceMutation = useMutation({
    mutationFn: ({ key, file }: { key: string; file: File }) => websiteImagesApi.replace(key, file),
    onMutate: ({ key }) => setReplacingKey(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['website-images'] });
      toast({ title: isAr ? 'تم تغيير الصورة' : 'Image replaced' });
    },
    onError: error => toast({
      title: isAr ? 'تعذر تغيير الصورة' : 'Could not replace image',
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive',
    }),
    onSettled: () => setReplacingKey(null),
  });

  const resetMutation = useMutation({
    mutationFn: websiteImagesApi.reset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['website-images'] });
      toast({ title: isAr ? 'تمت استعادة الصورة الأصلية' : 'Original image restored' });
    },
  });

  const categories = useMemo(
    () => [...new Set(WEBSITE_IMAGES.map(image => image.category))],
    [],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return WEBSITE_IMAGES.filter(image => {
      if (category !== 'all' && image.category !== category) return false;
      if (!query) return true;
      return `${image.name} ${image.defaultUrl} ${image.pages.join(' ')}`.toLowerCase().includes(query);
    });
  }, [category, search]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{isAr ? 'مكتبة صور الموقع' : 'Website image library'}</h1>
        <p className="page-description">
          {isAr
            ? 'معاينة صور صفحات الموقع، مقارنة أبعادها، وتغييرها من مكان واحد.'
            : 'Preview website images, compare their dimensions, and replace them from one place.'}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={isAr ? 'ابحث عن صورة أو صفحة...' : 'Search images or pages...'}
              className="ps-9"
            />
          </div>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{isAr ? 'كل الأقسام' : 'All categories'}</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            {filtered.length} / {WEBSITE_IMAGES.length}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(image => (
          <ImageCard
            key={image.key}
            image={image}
            dimensions={dimensions[image.key]}
            onDimensions={value => setDimensions(current => ({ ...current, [image.key]: value }))}
            onReplace={file => replaceMutation.mutate({ key: image.key, file })}
            onReset={() => resetMutation.mutate(image.key)}
            replacing={replacingKey === image.key}
            isAr={isAr}
          />
        ))}
      </div>
    </div>
  );
}
