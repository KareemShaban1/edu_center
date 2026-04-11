import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';

export default function AdminSettings() {
  const { t } = useLocale();
  const [form, setForm] = useState({
    schoolName: 'EduCenter Academy',
    email: 'info@educenter.com',
    phone: '+966500000000',
    address: '123 Education St, Riyadh',
    locale: 'en',
    timezone: 'Asia/Riyadh',
    currentYear: '2024',
    currentTerm: 'Term 2',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t('section.saveSettings'), description: t('crud.save') });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.settings')}</h1>
        <p className="page-description">{t('page.settings.desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-display font-semibold">{t('section.schoolInfo')}</h3>
          <FormField label={t('section.schoolName')} id="set-name" required>
            <FormInput id="set-name" value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} required maxLength={200} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('section.schoolEmail')} id="set-email">
              <FormInput id="set-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255} />
            </FormField>
            <FormField label={t('section.schoolPhone')} id="set-phone">
              <FormInput id="set-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
            </FormField>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-display font-semibold">{t('section.academicSettings')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('misc.language')} id="set-locale">
              <FormSelect id="set-locale" value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))}>
                <option value="en">English</option><option value="ar">العربية</option>
              </FormSelect>
            </FormField>
            <FormField label="Timezone" id="set-tz">
              <FormSelect id="set-tz" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">US Eastern</option>
              </FormSelect>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('section.currentYear')} id="set-year">
              <FormInput id="set-year" value={form.currentYear} onChange={e => setForm(f => ({ ...f, currentYear: e.target.value }))} maxLength={4} />
            </FormField>
            <FormField label={t('section.gradeSystem')} id="set-term">
              <FormSelect id="set-term" value={form.currentTerm} onChange={e => setForm(f => ({ ...f, currentTerm: e.target.value }))}>
                <option>Term 1</option><option>Term 2</option>
              </FormSelect>
            </FormField>
          </div>
        </div>

        <Button type="submit">{t('section.saveSettings')}</Button>
      </form>
    </DashboardLayout>
  );
}
