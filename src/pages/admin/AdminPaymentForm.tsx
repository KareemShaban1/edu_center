import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminPaymentsApi, type PaymentFeeOption } from '@/services/endpoints/admin-payments';

interface PaymentRow {
  id?: number | null;
  student_id: number;
  student_name: string;
  payment_date: string;
  fee_id: number | null;
  payment_status: 'paid' | 'unpaid';
  month: string;
  amount: number;
  notes: string;
}

export default function AdminPaymentForm() {
  const { sectionId, date: dateParam } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();

  const section = ((bootstrap?.sections || []) as Array<{ id: number; name: string; grade_id: number; class_id: number }>).find(s => s.id === Number(sectionId));
  const grade = ((bootstrap?.grades || []) as Array<{ id: number; name: string }>).find(g => g.id === section?.grade_id);
  const cls = ((bootstrap?.classes || []) as Array<{ id: number; name: string }>).find(c => c.id === section?.class_id);

  const today = new Date().toISOString().split('T')[0];
  const paymentDate = dateParam || today;
  const isToday = !dateParam;

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [fees, setFees] = useState<PaymentFeeOption[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const selectedFee = useMemo(
    () => fees.find(f => f.id === selectedFeeId) ?? null,
    [fees, selectedFeeId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'section', Number(sectionId), paymentDate, selectedFeeId],
    queryFn: () => adminPaymentsApi.getSectionDate(Number(sectionId), paymentDate, selectedFeeId),
    enabled: Boolean(sectionId && paymentDate),
  });

  const sectionFees = useMemo(() => {
    if (!section) return [] as PaymentFeeOption[];
    const all = (bootstrap?.fees || []) as Array<PaymentFeeOption & { grade_id?: number; classroom_id?: number; section_id?: number }>;
    return all
      .filter(f => Number(f.section_id) === section.id)
      .map(f => ({
        id: f.id,
        title: f.title,
        amount: Number(f.amount),
        year: f.year,
        month: f.month,
        type: f.type,
      }));
  }, [bootstrap?.fees, section]);

  useEffect(() => {
    if (data?.rows) setRows(data.rows.map(r => ({ ...r, payment_date: r.payment_date || paymentDate, amount: Number(r.amount || 0) })));
    const sectionFeeIds = new Set(sectionFees.map(f => f.id));
    const apiFees = (data?.fees || []).filter(f => sectionFeeIds.has(f.id));
    const feesToUse = apiFees.length > 0 ? apiFees : sectionFees;
    if (feesToUse.length) {
      setFees(feesToUse);
      const backendSelectedFee = (data?.selected_fee_id as number | null | undefined) ?? feesToUse[0]?.id ?? null;
      if (!selectedFeeId || !feesToUse.some(f => f.id === selectedFeeId)) {
        setSelectedFeeId(backendSelectedFee);
      }
    } else {
      setFees([]);
      setSelectedFeeId(null);
    }
  }, [data, sectionFees, paymentDate, selectedFeeId]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminPaymentsApi.saveSectionDate(
        Number(sectionId),
        paymentDate,
        rows.map(r => ({
          id: r.id ?? null,
          student_id: r.student_id,
          payment_date: r.payment_date,
          fee_id: r.fee_id,
          payment_status: r.payment_status,
          month: r.month,
          amount: r.amount,
          notes: r.notes,
        })),
      ),
  });

  const updateRow = (studentId: number, patch: Partial<PaymentRow>) => {
    setRows(prev => prev.map(r => (r.student_id === studentId ? { ...r, ...patch } : r)));
  };

  const handleFeeFilterChange = (feeId: number) => {
    setSelectedFeeId(feeId);
  };

  const handleFeeChange = (studentId: number, feeId: number) => {
    const fee = fees.find(f => f.id === feeId);
    updateRow(studentId, {
      fee_id: feeId,
      amount: fee?.amount || 0,
      month: fee?.month || '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (!selectedFeeId) {
        toast({ title: 'Missing fee', description: 'Please choose a fee first.', variant: 'destructive' });
        return;
      }
      if (rows.some(r => !r.payment_date)) {
        toast({ title: 'Missing date', description: 'Please set payment date for each student.', variant: 'destructive' });
        return;
      }
      await saveMutation.mutateAsync();
      toast({ title: t('crud.save'), description: `${t('payments.savedForDate')} ${paymentDate}` });
      navigate('/admin/payments');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save payments';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  const paidCount = useMemo(() => rows.filter(r => r.payment_status === 'paid').length, [rows]);
  const unpaidCount = useMemo(() => rows.filter(r => r.payment_status === 'unpaid').length, [rows]);
  const totalAmount = useMemo(() => rows.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + Number(r.amount || 0), 0), [rows]);

  if (!section) {
    return <DashboardLayout><p className="text-muted-foreground">{t('crud.noData')}</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={isToday ? '/admin/payments' : `/admin/payments/section/${sectionId}/history`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">{isToday ? t('payments.today') : t('payments.forDate')} {paymentDate}</h1>
            <p className="text-sm text-muted-foreground">{grade?.name} — {cls?.name} — {section.name}</p>
          </div>
        </div>
        {rows.length > 0 && (
          <Button onClick={handleSubmit} className="gap-2" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? t('crud.saving') : t('crud.save')}
          </Button>
        )}
      </div>

      {isLoading && <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">Loading...</div>}

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('col.fee')}</span>
            <select
              title="Fee"
              value={selectedFeeId ?? ''}
              onChange={e => handleFeeFilterChange(Number(e.target.value))}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>{t('filter.select_fee')}</option>
              {fees.map(fee => (
                <option key={fee.id} value={fee.id}>
                  {fee.title} ({Number(fee.amount).toFixed(2)})
                </option>
              ))}
            </select>
            {fees.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No fees for this section. <Link to="/admin/fees" className="text-primary hover:underline">Create a fee</Link> first.
              </p>
            )}
          </label>
          <div className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('col.year')}</span>
            <div className="w-full rounded border border-input bg-muted/30 px-3 py-2 text-sm">
              {selectedFee?.year || '-'}
            </div>
          </div>
          <div className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('col.month')}</span>
            <div className="w-full rounded border border-input bg-muted/30 px-3 py-2 text-sm">
              {selectedFee?.month || '-'}
            </div>
          </div>
          <div className="text-sm">
            <span className="mb-1 block text-muted-foreground">{t('col.type')}</span>
            <div className="w-full rounded border border-input bg-muted/30 px-3 py-2 text-sm">
              {selectedFee?.type || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{paidCount}</p>
          <p className="text-xs text-muted-foreground">{t('payments.paid')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{unpaidCount}</p>
          <p className="text-xs text-muted-foreground">{t('payments.unpaid')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-success">{totalAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{t('payments.totalPaid')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-start font-medium text-muted-foreground w-10">#</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.name')}</th>
                {/* <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.fee')}</th> */}
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.date')}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.month')}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.amount')}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.status')}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.notes')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{t('crud.noData')}</td></tr>
              ) : rows.map((row, idx) => (
                <tr
                  key={row.student_id}
                  className={`border-b border-border/50 ${
                    row.payment_status === 'paid'
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/10'
                      : 'bg-rose-500/20 hover:bg-rose-500/10'
                  }`}
                >
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{row.student_name}</td>
                  {/* <td className="px-3 py-2">
                    <select
                      title="Fee"
                      className="w-44 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={row.fee_id ?? ''}
                      onChange={e => handleFeeChange(row.student_id, Number(e.target.value))}
                      disabled={!selectedFeeId}
                    >
                      <option value="" disabled>{t('filter.select_fee')}</option>
                      {fees.map(fee => <option key={fee.id} value={fee.id}>{fee.title}</option>)}
                    </select>
                  </td> */}
                  <td className="px-3 py-2">
                    <input
                      title={t('col.date')}
                      type="date"
                      value={row.payment_date}
                      onChange={e => updateRow(row.student_id, { payment_date: e.target.value })}
                      className="w-36 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      title={t('col.month')}
                      type="text"
                      value={row.month}
                      onChange={e => updateRow(row.student_id, { month: e.target.value })}
                      className="w-28 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      title={t('col.amount')}
                      type="number"
                      min="0"
                      value={row.amount}
                      onChange={e => updateRow(row.student_id, { amount: Number(e.target.value) })}
                      className="w-24 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        title={t('col.status')}
                        className="w-24 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={row.payment_status}
                        onChange={e => updateRow(row.student_id, { payment_status: e.target.value as 'paid' | 'unpaid' })}
                      >
                        <option value="paid">{t('payments.paid')}</option>
                        <option value="unpaid">{t('payments.unpaid')}</option>
                      </select>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                           row.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {row.payment_status === 'paid' ? t('payments.paid') : t('payments.unpaid')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      title={t('col.notes')}
                      type="text"
                      value={row.notes}
                      onChange={e => updateRow(row.student_id, { notes: e.target.value })}
                      className="w-full min-w-[140px] rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

