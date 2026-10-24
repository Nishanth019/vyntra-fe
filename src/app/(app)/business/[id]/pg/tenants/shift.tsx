import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { BedPicker, type BedChoice } from '@/components/pg/bed-picker';
import { TenantSummary } from '@/components/pg/tenant-summary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { useResource } from '@/hooks/use-resource';
import { useTenant } from '@/hooks/use-tenant';
import { api, ApiError, type PgRoom, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function ShiftBedScreen() {
  const { account } = useBusiness();
  const { data: tenant, error, retry } = useTenant();
  const fetchRooms = useCallback(() => api.pgRooms(account.id).then(({ results }) => results), [account.id]);
  const rooms = useResource(fetchRooms);
  if (!tenant || !rooms.data) return <LoadingState error={error || rooms.error} onRetry={retry} />;
  return <ShiftForm tenant={tenant} rooms={rooms.data} />;
}

function ShiftForm({ tenant, rooms }: { tenant: PgTenantProfile; rooms: PgRoom[] }) {
  const { account } = useBusiness();
  const [choice, setChoice] = useState<BedChoice | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rent, setRent] = useState(String(Number(tenant.tenancy?.rent ?? 0)));
  const [errors, setErrors] = useState<{ bed?: string; rent?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const next: typeof errors = {};
    if (!choice) next.bed = 'Choose the new bed.';
    if (!rent.trim() || !(Number(rent) >= 0)) next.rent = 'Enter the monthly rent.';
    setErrors(next);
    setFormError('');
    if (!choice || Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await api.pgTenantAction(account.id, {
        action: 'shift',
        member_id: tenant.id,
        bed_id: choice.bed.id,
        rent: Number(rent).toFixed(2),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ bed: e.fieldErrors.bed_id, rent: e.fieldErrors.rent });
      setFormError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <TenantSummary tenant={tenant} />
      <Card title="Move to" subtitle="Bills already made stay the same; the new rent starts from the next bill.">
        <SelectField
          label="New Room & Bed"
          icon="bed"
          placeholder="Choose a free bed"
          value={choice ? `Room ${choice.room.room_number} · Bed ${choice.bed.label}` : undefined}
          error={errors.bed}
          onPress={() => setPickerOpen(true)}
        />
        <TextField
          label="Monthly Rent (₹)"
          icon="rupee"
          keyboardType="decimal-pad"
          value={rent}
          onChangeText={(text) => setRent(text.replace(/[^\d.]/g, ''))}
          error={errors.rent}
        />
      </Card>
      <Button title="Shift Bed" icon="swap" loading={submitting} onPress={submit} />
      <BedPicker
        visible={pickerOpen}
        rooms={rooms}
        onClose={() => setPickerOpen(false)}
        onSelect={(next) => {
          setChoice(next);
          setRent(String(Number(next.room.rent_per_bed)));
        }}
      />
    </Screen>
  );
}
