import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit,
  FoldVertical,
  GraduationCap,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  UnfoldVertical,
  Wallet,
} from 'lucide-react';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import DashboardLayout from '@/components/DashboardLayout';
import TableLoading from '@/components/TableLoading';
import DeleteDialog from '@/components/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Fee } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFeesApi, type FeePayload } from '@/services/endpoints/admin-fees';

const FEE_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function FeeForm({
  item,
  onClose,
  onSave,
  saving,
  grades,
  classes,
  sections,
}: {
  item: Fee | null;
  onClose: () => void;
  onSave: (payload: FeePayload, id?: number) => Promise<void>;
  saving: boolean;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number }>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    title: item?.title || '',
    amount: item?.amount || 0,
    grade_id: item?.grade_id || 0,
    classroom_id: item?.classroom_id || 0,
    section_id: item?.section_id || 0,
    description: item?.description || '',
    year: item?.year || String(new Date().getFullYear()),
    month: item?.month || 'january',
    type: item?.type || 'monthly',
  });
  const classesByGrade = useMemo(() => classes.filter(c => c.grade_id === form.grade_id), [classes, form.grade_id]);
  const sectionsByClass = useMemo(() => sections.filter(s => s.class_id === form.classroom_id), [sections, form.classroom_id]);
  const months = FEE_MONTHS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.grade_id || !form.classroom_id || !form.section_id || !form.month) {
      toast({ title: 'Validation error', description: 'Please fill all required fee fields.', variant: 'destructive' });
      return;
    }
    try {
      await onSave(
        {
          title: form.title.trim(),
          amount: Number(form.amount || 0),
          grade_id: form.grade_id,
          classroom_id: form.classroom_id,
          section_id: form.section_id,
          description: form.description || '',
          year: form.year || '',
          month: form.month,
          type: form.type,
        },
        item?.id,
      );
      toast({ title: t('crud.save') });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save fee';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <FormDialog open title={item ? `${t('crud.edit')}` : `${t('crud.addNew')}`} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.title')} id="fee-title" required>
        <FormInput id="fee-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={100} />
      </FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('col.amount')} id="fee-amount" required>
          <FormInput id="fee-amount" type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
        </FormField>
        <FormField label={t('col.year')} id="fee-year">
          <FormInput id="fee-year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        </FormField>
        <FormField label="Month" id="fee-month">
          <FormSelect title="Month" id="fee-month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.grade')} id="fee-grade" required>
          <FormSelect title={t('col.grade')} id="fee-grade" value={form.grade_id} onChange={e => setForm(f => ({ ...f, grade_id: Number(e.target.value), classroom_id: 0, section_id: 0 }))}>
            <option value={0}>Select grade</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.class')} id="fee-class" required>
          <FormSelect title={t('col.class')} id="fee-class" value={form.classroom_id} disabled={!form.grade_id} onChange={e => setForm(f => ({ ...f, classroom_id: Number(e.target.value), section_id: 0 }))}>
            <option value={0}>{form.grade_id ? 'Select class' : 'Select grade first'}</option>
            {classesByGrade.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.section')} id="fee-section" required>
          <FormSelect title={t('col.section')} id="fee-section" value={form.section_id} disabled={!form.classroom_id} onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}>
            <option value={0}>{form.classroom_id ? 'Select section' : 'Select class first'}</option>
            {sectionsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.type')} id="fee-type">
          <FormSelect id="fee-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="monthly">monthly</option>
            <option value="half-monthly">half-monthly</option>
            <option value="book">book</option>
            <option value="other">other</option>
          </FormSelect>
        </FormField>
      </div>
      <FormField label={t('col.description')} id="fee-description">
        <FormInput id="fee-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </FormField>
    </FormDialog>
  );
}

export default function AdminFees() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const fees = useMemo(
    () => [...((bootstrap?.fees || []) as Fee[])].sort((a, b) => b.id - a.id),
    [bootstrap?.fees],
  );
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [editItem, setEditItem] = useState<Fee | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<Fee | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: FeePayload; id?: number }) => (
      id ? adminFeesApi.update(id, payload) : adminFeesApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFeesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows: scopeFilteredRows,
    appliedCount: scopeAppliedCount,
    clearFilters: clearScopeFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, fees);

  const filteredRows = useMemo(() => {
    let rows = monthFilter ? scopeFilteredRows.filter(f => f.month === monthFilter) : scopeFilteredRows;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(fee => {
        const gradeName = grades.find(g => g.id === fee.grade_id)?.name ?? '';
        const className = classes.find(c => c.id === fee.classroom_id)?.name ?? '';
        const sectionName = sections.find(s => s.id === fee.section_id)?.name ?? '';
        return [fee.title, fee.type, fee.month, fee.year, gradeName, className, sectionName]
          .some(value => String(value).toLowerCase().includes(q));
      });
    }
    return [...rows].sort((a, b) => b.id - a.id);
  }, [scopeFilteredRows, monthFilter, search, grades, classes, sections]);

  const appliedCount = scopeAppliedCount + (monthFilter ? 1 : 0);
  const clearFilters = () => {
    clearScopeFilters();
    setMonthFilter('');
  };

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Fee[]>>();
    for (const fee of filteredRows) {
      const gradeId = fee.grade_id ?? 0;
      const classId = fee.classroom_id ?? 0;
      if (!map.has(gradeId)) map.set(gradeId, new Map());
      const classMap = map.get(gradeId)!;
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(fee);
    }
    return map;
  }, [filteredRows]);

  const visibleGrades = useMemo(() => {
    const list = gradeFilter ? grades.filter(g => g.id === Number(gradeFilter)) : [...grades];
    return list
      .filter(g => grouped.get(g.id) && Array.from(grouped.get(g.id)!.values()).some(arr => arr.length > 0))
      .sort((a, b) => {
        const aMax = Math.max(0, ...(grouped.get(a.id) ? Array.from(grouped.get(a.id)!.values()).flat().map(f => f.id) : [0]));
        const bMax = Math.max(0, ...(grouped.get(b.id) ? Array.from(grouped.get(b.id)!.values()).flat().map(f => f.id) : [0]));
        if (bMax !== aMax) return bMax - aMax;
        return b.id - a.id;
      });
  }, [grades, gradeFilter, grouped]);

  const statTotal = filteredRows.length;
  const statGrades = useMemo(() => new Set(filteredRows.map(f => f.grade_id)).size, [filteredRows]);
  const statClasses = useMemo(
    () => new Set(filteredRows.map(f => `${f.grade_id}-${f.classroom_id}`)).size,
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
    fees.forEach(fee => keys.add(`${fee.grade_id}-${fee.classroom_id}`));
    setExpandedClasses(keys);
  }, [grades, fees]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    filteredRows.forEach(fee => {
      if (fee.grade_id) gIds.add(fee.grade_id);
      cKeys.add(`${fee.grade_id}-${fee.classroom_id}`);
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

  const visibleClassesForGrade = (gradeId: number, classMap?: Map<number, Fee[]>) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    const filtered = classFilter ? list.filter(c => c.id === Number(classFilter)) : list;
    return filtered.slice().sort((a, b) => {
      const aMax = Math.max(0, ...(classMap?.get(a.id) || []).map(f => f.id));
      const bMax = Math.max(0, ...(classMap?.get(b.id) || []).map(f => f.id));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  };

  const paymentsPath = (fee: Fee) => {
    const sectionId = fee.section_id;
    if (!sectionId) return '/admin/payments';
    const query = `?fee_id=${fee.id}`;
    return fee.has_payments
      ? `/admin/payments/section/${sectionId}/history${query}`
      : `/admin/payments/section/${sectionId}/today${query}`;
  };

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">{t('nav.fees')}</h1>
          <p className="page-description">{t('page.fees.desc')}</p>
        </div>
        <Button onClick={() => setEditItem('new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> {t('crud.addNew')}
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statTotal}</p>
              <p className="text-xs text-muted-foreground">{t('page.feesAdmin.statTotal')}</p>
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
        monthFilter={monthFilter}
        showMonth
        monthOptions={FEE_MONTHS}
        onMonthChange={setMonthFilter}
        onGradeChange={handleGradeChange}
        onClassChange={handleClassChange}
        onSectionChange={setSectionFilter}
        appliedCount={appliedCount}
        onClear={clearFilters}
        resultCount={filteredRows.length}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            className="ps-9"
            placeholder={t('page.feesAdmin.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('page.feesAdmin.searchPlaceholder')}
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
                {search.trim() ? t('page.feesAdmin.emptySearch') : t('page.feesAdmin.noFeesYet')}
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
            const feeCount = classMap
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
                    {feeCount}
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
                      const classFees = classMap?.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);
                      if (search.trim() && classFees.length === 0) return null;

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
                            <span className="text-xs tabular-nums text-muted-foreground">({classFees.length})</span>
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {classExpanded && classFees.length > 0 && (
                            <div className="grid gap-3 p-3 pt-0 sm:grid-cols-2 xl:grid-cols-3">
                              {classFees.map(fee => {
                                const section = sections.find(s => s.id === fee.section_id);
                                const canDelete = !fee.has_payments;
                                return (
                                  <article
                                    key={fee.id}
                                    className="flex flex-col rounded-xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
                                  >
                                    <div className="mb-3 flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Wallet className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold leading-tight">{fee.title}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {section?.name ?? '—'} · {fee.month} {fee.year}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">
                                            {Number(fee.amount).toLocaleString()}
                                          </Badge>
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] capitalize">
                                            {fee.type}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-auto flex flex-wrap items-center justify-between gap-1 border-t border-border/60 pt-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 px-2">
                                            <Link to={paymentsPath(fee)} aria-label={t('page.feesAdmin.viewPayments')}>
                                              <DollarSign className="h-3.5 w-3.5" />
                                              <span className="hidden sm:inline">{t('page.feesAdmin.viewPayments')}</span>
                                              {fee.payments_count ? (
                                                <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px] tabular-nums">
                                                  {fee.payments_count}
                                                </Badge>
                                              ) : null}
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('page.feesAdmin.viewPayments')}</TooltipContent>
                                      </Tooltip>
                                      <div className="flex items-center gap-0.5">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                              onClick={() => setEditItem(fee)}
                                              aria-label={t('crud.edit')}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('crud.edit')}</TooltipContent>
                                        </Tooltip>
                                        {canDelete ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteItem(fee)}
                                                aria-label={t('crud.delete')}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('crud.delete')}</TooltipContent>
                                          </Tooltip>
                                        ) : null}
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && classFees.length === 0 && (
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
        <FeeForm
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
    </DashboardLayout>
  );
}
