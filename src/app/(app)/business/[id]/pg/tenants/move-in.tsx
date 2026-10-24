import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { initialStay, StayFields, stayInput, validateStay, type StayErrors } from '@/components/pg/stay-fields';
import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgRoom, type PgSettings, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';

/** A past tenant coming back: a new stay on a bed, with its own first bill. */
export default function MoveInScreen() {
  const { account } = useBusiness();
  const { data: tenant, error, retry } = useTenant();
  const fetchData = useCallback(() => Promise.all([api.pgRooms(account.id), api.pgSettings(account.id)]), [account.id]);
  const extra = useResource(fetchData);
  if (!tenant || !extra.data) return <LoadingState error={error || extra.error} onRetry={retry} />;
  return <MoveInForm tenant={tenant} rooms={extra.data[0].results} settings={extra.data[1]} />;
}

function MoveInForm({ tenant, rooms, settings }: { tenant: PgTenantProfile; rooms: PgRoom[]; settings: PgSettings }) {
  const { account } = useBusiness();
  const [stay, setStay] = useState(() => initialStay(settings, rooms));
  const [errors, setErrors] = useState<StayErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const next = validateStay(stay);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await api.pgTenantAction(account.id, { action: 'move_in', member_id: tenant.id, ...stayInput(stay) });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ bed: e.fieldErrors.bed_id, rent: e.fieldErrors.rent });
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <TenantSummary tenant={tenant} />
      <StayFields values={stay} onChange={setStay} errors={errors} rooms={rooms} />
      <Button title="Move In" icon="login" loading={submitting} onPress={submit} />
    </Screen>
  );
}
