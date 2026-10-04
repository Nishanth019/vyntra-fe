import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MemberPicker } from '@/components/member-picker';
import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { addDays, daysUntil, formatDateInput, formatLongDate, isValidISODate, toISODate } from '@/lib/dates';
import { memberName } from '@/lib/format';

const MAX_PAST_DAYS = 30;

export default function MarkAttendanceScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const params = useLocalSearchParams<{ memberId?: string }>();

  const today = toISODate(new Date());
  const yesterday = toISODate(addDays(new Date(), -1));

  const [member, setMember] = useState<Member | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<{ member?: string; date?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-select the member when opened from their profile.
  useEffect(() => {
    if (!params.memberId) return;
    api.member(account.id, Number(params.memberId)).then(setMember, () => {});
  }, [account.id, params.memberId]);

  function pickDate(value: string) {
    setDate(value);
    setErrors((current) => ({ ...current, date: undefined }));
  }

  async function submit() {
    const nextErrors: typeof errors = {};
    if (!member) nextErrors.member = 'Select a member.';
    if (!isValidISODate(date)) nextErrors.date = 'Use the format YYYY-MM-DD.';
    else if (date > today) nextErrors.date = "Attendance can't be marked for a future date.";
    else if (-daysUntil(date) > MAX_PAST_DAYS) nextErrors.date = `Only the last ${MAX_PAST_DAYS} days can be marked.`;
    setErrors(nextErrors);
    setFormError('');
    if (!member || Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.markAttendance(account.id, {
        member_id: member.id,
        attendance_date: date,
        // Today records the check-in time now; a past day has no known time.
        ...(date === today ? {} : { check_in_time: null }),
      });
      router.back();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors({ member: e.fieldErrors.member_id, date: e.fieldErrors.attendance_date });
      setFormError(e.message);
      setSubmitting(false);
    }
  }

  const status = member ? membershipStatus(member) : null;

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}

      <Card icon="checkIn" title="Attendance details">
        <View style={styles.memberRow}>
          <View style={styles.flex}>
            <SelectField
              label="Member name"
              icon="search"
              placeholder="Select member"
              value={member ? `${memberName(member)} (#${member.member_code})` : undefined}
              error={errors.member}
              onPress={() => setPickerOpen(true)}
            />
          </View>
          {status ? (
            <View style={styles.status}>
              <Text style={[styles.label, { color: theme.text }]}>Status</Text>
              <StatusPill {...status} />
            </View>
          ) : null}
        </View>

        {status && status.tone === 'danger' ? (
          <Text style={[styles.note, { color: theme.danger }]}>
            This membership has expired. You can still mark attendance, but consider renewing it.
          </Text>
        ) : null}

        <View style={styles.dates}>
          <Text style={[styles.label, { color: theme.text }]}>Attendance date</Text>
          <View style={styles.chips}>
            <View style={styles.flex}>
              <Chip label="Today" selected={date === today} onPress={() => pickDate(today)} />
            </View>
            <View style={styles.flex}>
              <Chip label="Yesterday" selected={date === yesterday} onPress={() => pickDate(yesterday)} />
            </View>
          </View>
          <TextField
            label="Attendance date"
            hideLabel
            icon="calendar"
            placeholder="YYYY-MM-DD"
            keyboardType="number-pad"
            maxLength={10}
            value={date}
            onChangeText={(text) => pickDate(formatDateInput(text))}
            error={errors.date}
          />
          {isValidISODate(date) ? (
            <Text style={[styles.note, { color: theme.textSecondary }]}>{formatLongDate(date)}</Text>
          ) : null}
        </View>

        <View style={styles.infoRow}>
          <Icon name="info" color={theme.textSecondary} size={16} />
          <Text style={[styles.note, styles.flex, { color: theme.textSecondary }]}>
            Past attendance can be marked for the last {MAX_PAST_DAYS} days only.
          </Text>
        </View>
      </Card>

      <Button title="Mark Attendance" icon="check" loading={submitting} onPress={submit} />

      <MemberPicker
        visible={pickerOpen}
        activeOnly
        onClose={() => setPickerOpen(false)}
        onSelect={(selected) => {
          setMember(selected);
          setErrors((current) => ({ ...current, member: undefined }));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  status: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  dates: {
    gap: Spacing.two + 2,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
