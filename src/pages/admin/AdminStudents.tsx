import CrudPage, { CrudColumn } from '@/components/CrudPage';
import type { Student } from '@/types/models';

type StudentRow = Student & { parent_name?: string };
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import StatusBadge from '@/components/StatusBadge';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import { Search, UserMinus, UserPlus } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { adminStudentsApi } from '@/services/endpoints/admin-students';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/FormFields';
import { useMemo, useState } from 'react';

function AssignByCodePanel({ onAssigned }: { onAssigned: () => Promise<void> }) {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [result, setResult] = useState<{
    student: Student & { is_assigned: boolean };
    parent: { id: number; name: string; email: string; is_assigned: boolean } | null;
  } | null>(null);

  const handleSearch = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ title: 'Enter a student code', variant: 'destructive' });
      return;
    }

    setSearching(true);
    setResult(null);
    try {
      const data = await adminStudentsApi.searchByCode(trimmed);
      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Student not found';
      toast({ title: 'Search failed', description: message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!result) return;
    setAssigning(true);
    try {
      await adminStudentsApi.assignToCenter(result.student.id);
      toast({
        title: 'Assigned to center',
        description: `${result.student.name} and linked parent were assigned to this center.`,
      });
      setResult(null);
      setCode('');
      await onAssigned();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign student';
      toast({ title: 'Assign failed', description: message, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!result) return;
    if (!window.confirm(`Unassign ${result.student.name} from this center? Their parent will be unassigned too if they have no other students here.`)) {
      return;
    }

    setUnassigning(true);
    try {
      await adminStudentsApi.unassignFromCenter(result.student.id);
      toast({
        title: 'Unassigned from center',
        description: `${result.student.name} can be reassigned later using their code.`,
      });
      setResult(null);
      setCode('');
      await onAssigned();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unassign student';
      toast({ title: 'Unassign failed', description: message, variant: 'destructive' });
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <Card className="mb-6 mt-2">
      <CardHeader>
        <CardTitle className="text-lg"> {t('admin.assignStudentByCode')}</CardTitle>
        <CardDescription>
          {t('admin.assignStudentByCodeDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <FormInput
            id="assign-student-code"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="STU-000001"
            maxLength={50}
            className="sm:max-w-xs"
          />
          <Button type="button" variant="secondary" onClick={handleSearch} disabled={searching}>
            <Search className="mr-2 h-4 w-4" />
            {searching ? t('admin.searching') : t('admin.searchForStudentByCode')}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{result.student.name}</p>
                <p className="text-sm text-muted-foreground">Code: {result.student.code} · {result.student.email}</p>
                {result.parent && (
                  <p className="text-sm text-muted-foreground">Parent: {result.parent.name}</p>
                )}
                {result.student.is_assigned ? (
                  <p className="mt-1 text-sm text-green-600">Already assigned to this center</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-600">Not yet assigned to this center</p>
                )}
              </div>
              {!result.student.is_assigned ? (
                <Button type="button" onClick={handleAssign} disabled={assigning}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {assigning ? 'Assigning...' : 'Assign to Center'}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleUnassign} disabled={unassigning}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  {unassigning ? 'Unassigning...' : 'Unassign from Center'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminStudents() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const parents = useMemo(
    () => ((bootstrap?.parents || []) as Array<{ id: number; name: string }>)
      .map(p => ({ id: Number(p.id), name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [bootstrap?.parents],
  );
  const students = useMemo(() => {
    const parentById = new Map(parents.map(p => [p.id, p.name]));
    return ((bootstrap?.students || []) as Student[]).map(student => ({
      ...student,
      parent_name: parentById.get(student.parent_id ?? 0) ?? student.parent?.name ?? '',
    })) as StudentRow[];
  }, [bootstrap?.students, parents]);
  const [parentFilter, setParentFilter] = useState('');

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows: scopeFilteredStudents,
    appliedCount: scopeAppliedCount,
    clearFilters: clearScopeFilters,
    handleGradeChange,
    handleClassChange,
    setSectionFilter,
  } = useAdminScopeFilters(grades, classes, sections, students);

  const filteredStudents = useMemo(() => {
    if (!parentFilter) return scopeFilteredStudents;
    const parentId = Number(parentFilter);
    return scopeFilteredStudents.filter(student => student.parent_id === parentId);
  }, [scopeFilteredStudents, parentFilter]);

  const appliedCount = scopeAppliedCount + (parentFilter ? 1 : 0);
  const clearFilters = () => {
    clearScopeFilters();
    setParentFilter('');
  };

  const unassignMutation = useMutation({
    mutationFn: (id: number) => adminStudentsApi.unassignFromCenter(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
      toast({ title: 'Unassigned from center', description: 'Student can be reassigned using their code.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Unassign failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleUnassignStudent = async (student: Student) => {
    if (!window.confirm(`Unassign ${student.name} from this center?`)) {
      return;
    }
    await unassignMutation.mutateAsync(student.id);
  };

  const columns: CrudColumn<StudentRow>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'gender', label: t('col.gender'), render: s => <span className="capitalize"> {t(`gender.${s.gender}`)}</span> },
    { key: 'status', label: t('col.status'), render: s => <StatusBadge status={s.status} label={t(`status.${s.status}`)} /> },
    { key: 'grade_name', label: t('col.grade'), render: s => `${s.grade_name}` },
    { key: 'class_name', label: t('col.class'), render: s => `${s.class_name}` },
    { key: 'section_name', label: t('col.section'), render: s => `${s.section_name}` },
    { key: 'parent_name', label: t('col.parent'), render: s => s.parent_name || '—' },
  ];

  const refreshStudents = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
  };

  return (
    <CrudPage<StudentRow>
      title={t('nav.students')}
      description={t('page.students.desc')}
      topContent={(
        <>
          <AssignByCodePanel onAssigned={refreshStudents} />
          <AdminScopeFilterBar
            grades={gradeOptions}
            classesByGrade={classesByGrade}
            sectionsByClass={sectionsByClass}
            gradeFilter={gradeFilter}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            parents={parents}
            parentFilter={parentFilter}
            onParentChange={setParentFilter}
            onGradeChange={handleGradeChange}
            onClassChange={handleClassChange}
            onSectionChange={setSectionFilter}
            appliedCount={appliedCount}
            onClear={clearFilters}
            resultCount={filteredStudents.length}
          />
        </>
      )}
      columns={columns}
      data={filteredStudents}
      searchKeys={['name', 'email', 'code', 'grade_name', 'class_name', 'section_name', 'parent_name']}
      canCreate={false}
      canEdit={false}
      canDelete={false}
      renderExtraActions={student => (
        <button
          type="button"
          onClick={() => void handleUnassignStudent(student)}
          disabled={unassignMutation.isPending}
          className="rounded-lg p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          aria-label={t('admin.unassignFromCenter')}
          title={t('admin.unassignFromCenter')}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    />
  );
}
