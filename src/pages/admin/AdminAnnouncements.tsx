import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  FoldVertical,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  Paperclip,
  Plus,
  Search,
  Trash2,
  UnfoldVertical,
  Upload,
  X,
} from 'lucide-react';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import MediaPreviewList, { formatMediaSize } from '@/components/MediaPreviewList';
import DashboardLayout from '@/components/DashboardLayout';
import TableLoading from '@/components/TableLoading';
import DeleteDialog from '@/components/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { matchAdminScopeRow, useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAnnouncementsApi, type AnnouncementItemPayload, type AnnouncementSavePayload } from '@/services/endpoints/admin-announcements';
import type { ApiError, MediaFile } from '@/types/models';

const ANNOUNCEMENT_TYPES: AnnouncementSavePayload['type'][] = ['homework', 'quiz', 'exam', 'others'];

function announcementTypeLabel(type: string, t: (key: string) => string) {
  if (type === 'homework') return t('nav.homework');
  if (type === 'quiz') return t('nav.quizzes');
  if (type === 'exam') return t('nav.exams');
  return t('announcements.type.others');
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const err = error as ApiError;
    const first = err.errors ? Object.values(err.errors).flat().find(Boolean) : undefined;
    if (first) return String(first);
    if (err.message) return err.message;
  }
  return fallback;
}

function AnnouncementForm({
  item,
  onClose,
  onSave,
  saving,
  grades,
  classes,
  sections,
}: {
  item: AnnouncementItemPayload | null;
  onClose: () => void;
  onSave: (payload: AnnouncementSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number }>;
}) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: item?.title || '',
    content: item?.content || '',
    grade_id: item?.grade_id || 0,
    class_id: item?.class_id || 0,
    section_id: item?.section_id || 0,
    type: item?.type || 'others',
    time: item?.time || '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const classesByGrade = useMemo(() => classes.filter(c => c.grade_id === form.grade_id), [classes, form.grade_id]);
  const sectionsByClass = useMemo(() => sections.filter(s => s.class_id === form.class_id), [sections, form.class_id]);

  const existingMedia = useMemo(
    () => (item?.media || []).filter(m => !removeMediaIds.includes(Number(m.id))),
    [item?.media, removeMediaIds],
  );

  const pendingMedia = useMemo<MediaFile[]>(
    () => files.map((file, index) => ({
      id: `pending-${index}-${file.name}`,
      name: file.name,
      file_name: file.name,
      size: file.size,
      type: file.type,
      mime_type: file.type,
      url: URL.createObjectURL(file),
    })),
    [files],
  );

  const toggleRemoveMedia = (id: number) => {
    setRemoveMediaIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.grade_id || !form.class_id || !form.section_id) {
      toast({ title: t('crud.saveFailed'), description: t('crud.requiredFields'), variant: 'destructive' });
      return;
    }
    onSave(
      {
        title: form.title.trim(),
        content: form.content.trim(),
        grade_id: form.grade_id,
        class_id: form.class_id,
        section_id: form.section_id,
        type: form.type as AnnouncementSavePayload['type'],
        time: form.time || null,
        files,
        remove_media_ids: removeMediaIds,
      },
      item?.id,
    )
      .then(() => {
        toast({ title: t('crud.save') });
        onClose();
      })
      .catch((error: unknown) => {
        toast({
          title: t('crud.saveFailed'),
          description: apiErrorMessage(error, t('crud.saveFailed')),
          variant: 'destructive',
        });
      });
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.title')} id="ann-title" required>
        <FormInput id="ann-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={200} />
      </FormField>
      <FormField label={t('col.content')} id="ann-content" required>
        <FormTextarea id="ann-content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required maxLength={2000} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.grade')} id="ann-grade" required>
          <FormSelect id="ann-grade" value={form.grade_id} onChange={e => setForm(f => ({ ...f, grade_id: Number(e.target.value), class_id: 0, section_id: 0 }))}>
            <option value={0}>{t('auth.selectGrade')}</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.class')} id="ann-class" required>
          <FormSelect id="ann-class" value={form.class_id} disabled={!form.grade_id} onChange={e => setForm(f => ({ ...f, class_id: Number(e.target.value), section_id: 0 }))}>
            <option value={0}>{form.grade_id ? t('auth.selectClass') : t('auth.selectGradeFirst')}</option>
            {classesByGrade.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('col.section')} id="ann-section" required>
          <FormSelect id="ann-section" value={form.section_id} disabled={!form.class_id} onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}>
            <option value={0}>{form.class_id ? t('auth.selectSection') : t('auth.selectClassFirst')}</option>
            {sectionsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.type')} id="ann-type">
          <FormSelect id="ann-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {ANNOUNCEMENT_TYPES.map(type => (
              <option key={type} value={type}>{announcementTypeLabel(type, t)}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label={t('col.date')} id="ann-time">
          <FormInput id="ann-time" type="datetime-local" value={form.time || ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
        </FormField>
      </div>

      {item && (item.media?.length || 0) > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">{t('col.media')}</label>
          <div className="space-y-2 rounded-lg border border-border p-3">
            {(item.media || []).map(m => {
              const mediaId = Number(m.id);
              const marked = removeMediaIds.includes(mediaId);
              return (
                <div key={String(m.id)} className={`flex items-center justify-between rounded-md px-2 py-1.5 ${marked ? 'bg-destructive/10' : 'bg-muted/30'}`}>
                  <span className="truncate text-sm">{m.file_name || m.name}</span>
                  <button
                    type="button"
                    title={marked ? t('crud.delete') : t('crud.delete')}
                    onClick={() => toggleRemoveMedia(mediaId)}
                    className={`rounded p-1 ${marked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">{t('col.addFiles')}</label>
        <input
          ref={fileRef}
          title={t('col.media')}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <Upload className="h-4 w-4" /> {t('col.addFiles')}
        </button>
      </div>

      {(existingMedia.length > 0 || pendingMedia.length > 0) && (
        <div>
          <label className="mb-2 block text-sm font-medium">{t('crud.view')}</label>
          <MediaPreviewList media={[...existingMedia, ...pendingMedia]} />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{file.name} · {formatMediaSize(file.size)}</span>
                  <button
                    type="button"
                    title={t('crud.delete')}
                    aria-label={t('crud.delete')}
                    onClick={() => removePendingFile(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FormDialog>
  );
}

export default function AdminAnnouncements() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<AnnouncementItemPayload | null>(null);
  const [editItem, setEditItem] = useState<AnnouncementItemPayload | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<AnnouncementItemPayload | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminAnnouncementsApi.list(),
  });
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: AnnouncementSavePayload; id?: number }) => (
      id ? adminAnnouncementsApi.update(id, payload) : adminAnnouncementsApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminAnnouncementsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows: scopeFilteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(
    grades,
    classes,
    sections,
    announcements,
    undefined,
    (row, filters) => {
      if (!matchAdminScopeRow(row, filters, classes, sections)) return false;
      if (filters.dateFilter) {
        const time = String(row.time || row.created_at || '').slice(0, 10);
        if (time !== filters.dateFilter) return false;
      }
      return true;
    },
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = scopeFilteredRows;
    if (q) {
      rows = rows.filter(item => [
        item.title,
        item.content,
        item.type,
        announcementTypeLabel(item.type, t),
        item.grade_name,
        item.class_name,
        item.section_name,
      ].some(value => String(value || '').toLowerCase().includes(q)));
    }
    return [...rows].sort((a, b) => b.id - a.id);
  }, [scopeFilteredRows, search, t]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, AnnouncementItemPayload[]>>();
    for (const item of filteredRows) {
      const gradeId = item.grade_id ?? 0;
      const classId = item.class_id ?? 0;
      if (!map.has(gradeId)) map.set(gradeId, new Map());
      const classMap = map.get(gradeId)!;
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(item);
    }
    return map;
  }, [filteredRows]);

  const visibleGrades = useMemo(() => {
    const list = gradeFilter ? grades.filter(g => g.id === Number(gradeFilter)) : [...grades];
    return list
      .filter(g => grouped.get(g.id) && Array.from(grouped.get(g.id)!.values()).some(arr => arr.length > 0))
      .sort((a, b) => {
        const aMax = Math.max(0, ...(grouped.get(a.id) ? Array.from(grouped.get(a.id)!.values()).flat().map(i => i.id) : [0]));
        const bMax = Math.max(0, ...(grouped.get(b.id) ? Array.from(grouped.get(b.id)!.values()).flat().map(i => i.id) : [0]));
        if (bMax !== aMax) return bMax - aMax;
        return b.id - a.id;
      });
  }, [grades, gradeFilter, grouped]);

  const statTotal = filteredRows.length;
  const statGrades = useMemo(() => new Set(filteredRows.map(i => i.grade_id)).size, [filteredRows]);
  const statClasses = useMemo(
    () => new Set(filteredRows.map(i => `${i.grade_id}-${i.class_id}`)).size,
    [filteredRows],
  );

  const expandAll = useCallback(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    classes.forEach(cls => keys.add(`${cls.grade_id}-${cls.id}`));
    setExpandedClasses(keys);
  }, [grades, classes]);

  const collapseAll = useCallback(() => {
    setExpandedGrades(new Set());
    setExpandedClasses(new Set());
  }, []);

  useEffect(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    announcements.forEach(item => keys.add(`${item.grade_id}-${item.class_id}`));
    setExpandedClasses(keys);
  }, [grades, announcements]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    filteredRows.forEach(item => {
      if (item.grade_id) gIds.add(item.grade_id);
      cKeys.add(`${item.grade_id}-${item.class_id}`);
    });
    setExpandedGrades(prev => new Set([...prev, ...gIds]));
    setExpandedClasses(prev => new Set([...prev, ...cKeys]));
  }, [search, filteredRows]);

  const toggleGrade = (id: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClass = (key: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleClassesForGrade = (gradeId: number, classMap?: Map<number, AnnouncementItemPayload[]>) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    const filtered = classFilter ? list.filter(c => c.id === Number(classFilter)) : list;
    return filtered.slice().sort((a, b) => {
      const aMax = Math.max(0, ...(classMap?.get(a.id) || []).map(i => i.id));
      const bMax = Math.max(0, ...(classMap?.get(b.id) || []).map(i => i.id));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">{t('nav.announcements')}</h1>
          <p className="page-description">{t('page.announcements.desc')}</p>
        </div>
        <Button onClick={() => setEditItem('new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> {t('crud.addNew')}
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statTotal}</p>
              <p className="text-xs text-muted-foreground">{t('page.announcementsAdmin.statTotal')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statGrades}</p>
              <p className="text-xs text-muted-foreground">{t('page.sectionsAdmin.statGrades')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statClasses}</p>
              <p className="text-xs text-muted-foreground">{t('page.sectionsAdmin.statClasses')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminScopeFilterBar
        grades={gradeOptions}
        classesByGrade={classesByGrade}
        sectionsByClass={sectionsByClass}
        gradeFilter={gradeFilter}
        classFilter={classFilter}
        sectionFilter={sectionFilter}
        dateFilter={dateFilter}
        showDate
        onGradeChange={handleGradeChange}
        onClassChange={handleClassChange}
        onSectionChange={setSectionFilter}
        onDateChange={setDateFilter}
        appliedCount={appliedCount}
        onClear={clearFilters}
        resultCount={filteredRows.length}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            className="ps-9"
            placeholder={t('page.announcementsAdmin.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('page.announcementsAdmin.searchPlaceholder')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={expandAll}>
            <UnfoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.expandAll')}
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={collapseAll}>
            <FoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.collapseAll')}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <Card className="border-border/80 shadow-card">
            <CardContent>
              <TableLoading />
            </CardContent>
          </Card>
        ) : visibleGrades.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.trim() ? t('page.announcementsAdmin.emptySearch') : t('page.announcementsAdmin.noItemsYet')}
              </p>
              {!search.trim() && (
                <Button variant="secondary" size="sm" className="mt-2 gap-1.5" onClick={() => setEditItem('new')}>
                  <Plus className="h-4 w-4" />
                  {t('crud.addNew')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const itemCount = classMap
              ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0)
              : 0;

            return (
              <section
                key={grade.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
              >
                <button
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-4 text-start transition-colors hover:from-primary/20"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.grade')}</p>
                    <h2 className="font-display text-lg font-semibold leading-tight">{grade.name}</h2>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-medium tabular-nums">
                    {itemCount}
                  </Badge>
                  {gradeExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {gradeExpanded && (
                  <div className="space-y-4 p-4">
                    {visibleClassesForGrade(grade.id, classMap).map(cls => {
                      const classItems = classMap?.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);
                      if (search.trim() && classItems.length === 0) return null;

                      return (
                        <div key={cls.id} className="rounded-xl border border-border/70 bg-muted/20">
                          <button
                            type="button"
                            onClick={() => toggleClass(classKey)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-muted/40"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.class')}</p>
                              <p className="text-sm font-semibold leading-tight">{cls.name}</p>
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">({classItems.length})</span>
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {classExpanded && classItems.length > 0 && (
                            <div className="grid gap-3 p-3 pt-0 sm:grid-cols-2 xl:grid-cols-3">
                              {classItems.map(item => {
                                const section = sections.find(s => s.id === item.section_id);
                                const mediaCount = item.media?.length || 0;
                                return (
                                  <article
                                    key={item.id}
                                    className="flex flex-col rounded-xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
                                  >
                                    <div className="mb-3 flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Megaphone className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold leading-tight">{item.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.content}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {section?.name ?? item.section_name ?? '—'} · {item.time || item.created_at}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                            {announcementTypeLabel(item.type, t)}
                                          </Badge>
                                          {mediaCount > 0 && (
                                            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] tabular-nums">
                                              <Paperclip className="h-3 w-3" />
                                              {mediaCount}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-auto flex items-center justify-end gap-0.5 border-t border-border/60 pt-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setViewItem(item)}
                                            aria-label={t('crud.view')}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('crud.view')}</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setEditItem(item)}
                                            aria-label={t('crud.edit')}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('crud.edit')}</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeleteItem(item)}
                                            aria-label={t('crud.delete')}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('crud.delete')}</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && classItems.length === 0 && (
                            <p className="px-4 pb-3 text-xs text-muted-foreground">{t('crud.noData')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {editItem !== null && (
        <AnnouncementForm
          item={editItem === 'new' ? null : editItem}
          onClose={() => setEditItem(null)}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
          grades={grades}
          classes={classes}
          sections={sections}
        />
      )}

      {deleteItem && (
        <DeleteDialog
          open
          onClose={() => setDeleteItem(null)}
          onConfirm={async () => {
            try {
              await deleteMutation.mutateAsync(deleteItem.id);
              toast({ title: t('crud.deleted'), description: t('crud.deletedDesc') });
            } catch {
              toast({ title: t('crud.deleteFailed'), description: t('crud.deleteFailedDesc'), variant: 'destructive' });
            } finally {
              setDeleteItem(null);
            }
          }}
        />
      )}

      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewItem.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p><strong>{t('col.content')}:</strong> {viewItem.content}</p>
              <p><strong>{t('col.type')}:</strong> {announcementTypeLabel(viewItem.type, t)}</p>
              <p><strong>{t('col.grade')}:</strong> {viewItem.grade_name || '—'}</p>
              <p><strong>{t('col.class')}:</strong> {viewItem.class_name || '—'}</p>
              <p><strong>{t('col.section')}:</strong> {viewItem.section_name || '—'}</p>
              <p><strong>{t('col.date')}:</strong> {viewItem.time || viewItem.created_at}</p>
              <div>
                <p className="mb-2 font-medium">{t('col.media')}</p>
                <MediaPreviewList media={viewItem.media || []} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
