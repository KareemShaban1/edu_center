import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Layout, Sparkles, Copy, Globe, GlobeLock, Trash2, BarChart3,
  GraduationCap, BookOpen, Calendar, Building2,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import { adminLandingApi } from '@/services/endpoints/admin-landing';
import { getPublicLandingPath, resolvePublicLandingTenant } from '@/lib/tenant-routes';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { LANDING_TEMPLATES, getTemplateById } from '@/lib/landing/templates';
import { SUBJECT_LABELS, TEACHER_SUBJECT_TEMPLATES } from '@/lib/landing/constants';
import { LandingTemplatePreview } from '@/components/landing-builder/LandingTemplatePreview';
import type { LandingPageType, LandingPageListItem } from '@/types/landing';
import { toast } from 'sonner';

const FEATURED_TEACHER_TEMPLATE_IDS = ['teacher-arabic-premium'] as const;

const TYPE_ICONS: Record<string, React.ElementType> = {
  teacher: GraduationCap,
  course: BookOpen,
  event: Calendar,
  center: Building2,
  branch: Building2,
};

function templatePickerActivate(
  e: React.KeyboardEvent<HTMLDivElement>,
  onActivate: () => void,
) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onActivate();
  }
}

export default function AdminLandingPages() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('math');

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: () => adminLandingApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => adminLandingApi.create(),
    onSuccess: page => navigate(`/admin/landing/${page.id}/edit`),
  });

  const templateMutation = useMutation({
    mutationFn: (templateId: string) => adminLandingApi.createFromTemplate(templateId),
    onSuccess: page => { setTemplateOpen(false); navigate(`/admin/landing/${page.id}/edit`); },
  });

  const teacherMutation = useMutation({
    mutationFn: () => adminLandingApi.generateFromTeacher(Number(selectedTeacher), selectedSubject as import('@/lib/landing/constants').TeacherSubjectKey),
    onSuccess: page => { setTeacherOpen(false); navigate(`/admin/landing/${page.id}/edit`); toast.success(t('landing.teacherPageCreated')); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminLandingApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing-pages'] }); toast.success(t('landing.deleteSuccess')); },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminLandingApi.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => adminLandingApi.unpublish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => adminLandingApi.duplicate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing-pages'] }); toast.success(t('landing.duplicateSuccess')); },
  });

  const filtered = pages.filter((p: LandingPageListItem) => {
    const title = p.title[locale].toLowerCase();
    const matchSearch = !search || title.includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const teachers = bootstrap?.teachers ?? [];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('landing.title')}</h1>
            <p className="text-muted-foreground">{t('landing.desc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTeacherOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1" />{t('landing.generateTeacherPage')}
            </Button>
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <Layout className="w-4 h-4 mr-1" />{t('landing.fromTemplate')}
            </Button>
            <Button onClick={() => createMutation.mutate()}>
              <Plus className="w-4 h-4 mr-1" />{t('landing.newPage')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={t('landing.searchPages')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('landing.allTypes')}</SelectItem>
              {(['teacher', 'course', 'event', 'branch', 'center', 'exam_prep', 'summer_course', 'custom'] as LandingPageType[]).map(tp => (
                <SelectItem key={tp} value={tp}>{t(`landing.type.${tp}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">{t('landing.loading')}</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Layout className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="font-semibold mb-2">{t('landing.noPages')}</h3>
              <p className="text-muted-foreground mb-4">{t('landing.noPagesDesc')}</p>
              <Button onClick={() => createMutation.mutate()}><Plus className="w-4 h-4 mr-1" />{t('landing.newPage')}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((page: LandingPageListItem) => {
              const Icon = TYPE_ICONS[page.type] ?? Layout;
              return (
                <Card key={page.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
                        <div>
                          <CardTitle className="text-base">{page.title[locale]}</CardTitle>
                          <CardDescription className="text-xs">/{page.slug}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                        {t(`landing.status.${page.status}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{t(`landing.type.${page.type}`)}</span>
                      <span>{page.visitors ?? 0} {t('landing.visitors')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/admin/landing/${page.id}/edit`)}>
                        {t('landing.edit')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/landing/${page.id}/analytics`)}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">···</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {page.status === 'published' ? (
                            <DropdownMenuItem onClick={() => unpublishMutation.mutate(page.id)}>
                              <GlobeLock className="w-4 h-4 mr-2" />{t('landing.unpublish')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => publishMutation.mutate(page.id)}>
                              <Globe className="w-4 h-4 mr-2" />{t('landing.publish')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => window.open(getPublicLandingPath(page.slug, resolvePublicLandingTenant(), { preview: page.status !== 'published' }), '_blank')}>
                            <Globe className="w-4 h-4 mr-2" />{t('landing.preview')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(page.id)}>
                            <Copy className="w-4 h-4 mr-2" />{t('landing.duplicate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(page.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />{t('crud.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Library Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{t('landing.templateLibrary')}</DialogTitle></DialogHeader>
          <Tabs defaultValue="teacher" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="teacher">{t('landing.teacherTemplates')}</TabsTrigger>
              <TabsTrigger value="other">{t('landing.otherTemplates')}</TabsTrigger>
            </TabsList>
            <TabsContent value="teacher" className="overflow-auto flex-1 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {FEATURED_TEACHER_TEMPLATE_IDS.map(templateId => {
                  const tmpl = getTemplateById(templateId);
                  if (!tmpl) return null;
                  return (
                    <div
                      key={templateId}
                      role="button"
                      tabIndex={0}
                      className="relative col-span-full cursor-pointer overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
                      onClick={() => templateMutation.mutate(templateId)}
                      onKeyDown={e => templatePickerActivate(e, () => templateMutation.mutate(templateId))}
                    >
                      <Badge className="mb-2" variant="default">{t('landing.template.featured')}</Badge>
                      <div className="font-medium text-lg">{tmpl.name[locale]}</div>
                      <div className="text-sm text-muted-foreground mt-1">{tmpl.description[locale]}</div>
                      {tmpl.thumbnail ? (
                        <img
                          src={tmpl.thumbnail}
                          alt=""
                          className="mt-3 w-full rounded-lg border object-cover object-top"
                          style={{ maxHeight: 220 }}
                        />
                      ) : (
                        <LandingTemplatePreview templateId={templateId} locale={locale} />
                      )}
                      <div className="text-xs text-primary mt-2 font-medium">{t('landing.clickToUse')}</div>
                    </div>
                  );
                })}

                {TEACHER_SUBJECT_TEMPLATES.map(key => {
                  const templateId = `teacher-${key}`;
                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => templateMutation.mutate(templateId)}
                      onKeyDown={e => templatePickerActivate(e, () => templateMutation.mutate(templateId))}
                    >
                      <div className="font-medium">{SUBJECT_LABELS[key][locale]}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t('landing.clickToUse')}</div>
                      <LandingTemplatePreview templateId={templateId} locale={locale} />
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="other" className="overflow-auto flex-1 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {LANDING_TEMPLATES.filter(tmpl => tmpl.category !== 'teacher').map(tmpl => (
                  <div
                    key={tmpl.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => templateMutation.mutate(tmpl.id)}
                    onKeyDown={e => templatePickerActivate(e, () => templateMutation.mutate(tmpl.id))}
                  >
                    <div className="font-medium">{tmpl.name[locale]}</div>
                    <div className="text-xs text-muted-foreground mt-1">{tmpl.description[locale]}</div>
                    <LandingTemplatePreview templateId={tmpl.id} locale={locale} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Generate Teacher Page Dialog */}
      <Dialog open={teacherOpen} onOpenChange={setTeacherOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('landing.generateTeacherPage')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('nav.teachers')}</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger><SelectValue placeholder={t('landing.selectTeacher')} /></SelectTrigger>
                <SelectContent>
                  {teachers.map(tch => (
                    <SelectItem key={tch.id} value={String(tch.id)}>{tch.name} — {tch.specialization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('landing.subject')}</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEACHER_SUBJECT_TEMPLATES.map(key => (
                    <SelectItem key={key} value={key}>{SUBJECT_LABELS[key][locale]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherOpen(false)}>{t('crud.cancel')}</Button>
            <Button disabled={!selectedTeacher || teacherMutation.isPending} onClick={() => teacherMutation.mutate()}>
              {t('landing.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
