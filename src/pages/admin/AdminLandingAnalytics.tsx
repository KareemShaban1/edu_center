import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MousePointer, FileText } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { adminLandingApi } from '@/services/endpoints/admin-landing';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#b91c1c', '#1e293b', '#f59e0b', '#10b981'];

export default function AdminLandingAnalytics() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();

  const { data: page } = useQuery({
    queryKey: ['landing-page', pageId],
    queryFn: () => adminLandingApi.get(pageId!),
    enabled: !!pageId,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['landing-analytics', pageId],
    queryFn: () => adminLandingApi.getAnalytics(pageId!),
    enabled: !!pageId,
  });

  if (isLoading || !analytics) {
    return (
      <DashboardLayout role="admin">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </DashboardLayout>
    );
  }

  const deviceData = [
    { name: t('landing.mobile'), value: analytics.deviceStats.mobile },
    { name: t('landing.tablet'), value: analytics.deviceStats.tablet },
    { name: t('landing.desktop'), value: analytics.deviceStats.desktop },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/landing')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('landing.analytics')}</h1>
            <p className="text-muted-foreground">{page?.title.en}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('landing.totalVisitors')}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{analytics.visitors.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('landing.uniqueVisitors')}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('landing.conversionRate')}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{analytics.conversionRate}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('landing.leads')}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{analytics.leads}</div></CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>{t('landing.dailyViews')}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#b91c1c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('landing.deviceStats')}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('landing.trafficSources')}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.trafficSources}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('landing.engagement')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" />{t('landing.formSubmissions')}</div>
                <span className="font-bold">{analytics.formSubmissions}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2"><MousePointer className="w-4 h-4 text-muted-foreground" />{t('landing.ctaClicks')}</div>
                <span className="font-bold">{analytics.ctaClicks}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
