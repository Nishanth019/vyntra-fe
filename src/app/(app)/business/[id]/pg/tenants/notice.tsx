import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useResource } from '@/hooks/use-resource';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgSettings, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { addDays, isValidISODate, toISODate } from '@/lib/dates';

export default function GiveNoticeScreen() {
  const { account } = useBusiness();
  const { data: tenant, error, retry } = useTenant();
  const fetchSettings = useCallback(() => api.pgSettings(account.id), [account.id]);
  const settings = useResource(fetchSettings);
  if (!tenant || !settings.data) return <LoadingState error={error || settings.error} onRetry={retry} />;
  return <NoticeForm tenant={tenant} settings={settings.data} />;
}

function NoticeForm({ tenant, settings }: { tenant: PgTenantProfile; settings: PgSettings }) {
  const { account } = useBusiness();
  const [leaveDate, setLeaveDate] = useState(toISODate(addDays(new Date(), settings.notice_period_days)));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!isValidISODate(leaveDate)) {
      setError('Choose the leaving date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.pgTenantAction(account.id, {
        action: 'notice',
        member_id: tenant.id,
        leave_date: leaveDate,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.fieldErrors.leave_date || e.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}
      <TenantSummary tenant={tenant} />
      <Card
        title="Leaving Date"
        subtitle={`They keep the bed and pay rent until then. No bills are made after it. Your notice period is ${settings.notice_period_days} days.`}>
        <DateField label="Leaving On" required value={leaveDate} onChange={setLeaveDate} />
        <TextField label="Reason (Optional)" placeholder="e.g. Moving to another city" value={reason} onChangeText={setReason} />
      </Card>
      <Button title="Save Notice" icon="calendar" loading={submitting} onPress={submit} />
    </Screen>
  );
}
