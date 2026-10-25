import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, type PgRoom, type PgRoomInput } from '@/lib/api';
import { AMENITIES } from '@/lib/pg';

type RoomFormProps = {
  room?: PgRoom;
  onSubmit: (input: PgRoomInput) => Promise<void>;
  /** Editing only: removes the room (allowed once nobody lives in it). */
  onDelete?: () => Promise<void>;
};

export function RoomForm({ room, onSubmit, onDelete }: RoomFormProps) {
  const theme = useTheme();
  const [number, setNumber] = useState(room?.room_number ?? '');
  const [floor, setFloor] = useState(room?.floor ?? '');
  const [isAc, setIsAc] = useState(room?.is_ac ?? false);
  const [rent, setRent] = useState(room ? String(Number(room.rent_per_bed)) : '');
  const [beds, setBeds] = useState(room?.beds.length ?? 2);
  const [amenities, setAmenities] = useState<string[]>(room?.amenities ?? []);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const taken = room?.beds.filter((bed) => bed.occupant).length ?? 0;

  async function submit() {
    const next: Record<string, string> = {};
    if (!number.trim()) next.room_number = 'Enter the room number.';
    if (!rent.trim() || !(Number(rent) >= 0)) next.rent_per_bed = 'Enter the rent per bed.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await onSubmit({
        room_number: number.trim(),
        floor: floor.trim(),
        is_ac: isAc,
        rent_per_bed: Number(rent).toFixed(2),
        amenities,
        bed_count: beds,
      });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    setDeleting(true);
    setFormError('');
    try {
      await onDelete();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setFormError(e.message);
      setDeleting(false);
    }
  }

  return (
    <Screen>
      {formError ? <ErrorBanner message={formError} /> : null}
      <Card title="Room">
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Room Number"
              required
              icon="bed"
              placeholder="e.g. 101"
              autoCapitalize="characters"
              value={number}
              onChangeText={setNumber}
              error={errors.room_number}
            />
          </View>
          <View style={styles.flex}>
            <TextField label="Floor" placeholder="e.g. 1, Ground" value={floor} onChangeText={setFloor} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Chip label="Non-AC" selected={!isAc} onPress={() => setIsAc(false)} />
          </View>
          <View style={styles.flex}>
            <Chip label="AC" selected={isAc} onPress={() => setIsAc(true)} />
          </View>
        </View>
        <TextField
          label="Rent Per Bed (₹ a month)"
          required
          icon="rupee"
          keyboardType="decimal-pad"
          placeholder="0"
          value={rent}
          onChangeText={(text) => setRent(text.replace(/[^\d.]/g, ''))}
          error={errors.rent_per_bed}
        />
      </Card>

      <Card title="Beds" subtitle={taken ? `${taken} taken. Only free beds can be removed.` : 'How many people share this room.'}>
        <View style={styles.stepper}>
          <StepButton icon="minus" label="One bed less" disabled={beds <= Math.max(1, taken)} onPress={() => setBeds(beds - 1)} />
          <Text style={[styles.bedCount, { color: theme.text }]}>
            {beds} bed{beds === 1 ? '' : 's'}
          </Text>
          <StepButton icon="add" label="One bed more" disabled={beds >= 30} onPress={() => setBeds(beds + 1)} />
        </View>
        {errors.bed_count ? <Text style={[styles.error, { color: theme.danger }]}>{errors.bed_count}</Text> : null}
      </Card>

      <Card title="In the Room" subtitle="Optional">
        <View style={styles.chips}>
          {AMENITIES.map((item) => {
            const selected = amenities.includes(item.value);
            return (
              <View key={item.value} style={styles.chip}>
                <Chip
                  label={item.label}
                  selected={selected}
                  onPress={() =>
                    setAmenities(selected ? amenities.filter((a) => a !== item.value) : [...amenities, item.value])
                  }
                />
              </View>
            );
          })}
        </View>
      </Card>

      {/* Repeated by the button: on a long form the one at the top is out of sight. */}
      {formError ? <ErrorBanner message={formError} /> : null}
      <Button title={room ? 'Save Room' : 'Add Room'} icon={room ? 'check' : 'add'} loading={submitting} onPress={submit} />
      {onDelete ? (
        <Button
          title="Remove Room"
          icon="trash"
          variant="danger"
          loading={deleting}
          disabled={taken > 0}
          style={{ backgroundColor: theme.dangerSoft }}
          onPress={remove}
        />
      ) : null}
    </Screen>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: 'add' | 'minus'; label: string; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: theme.primarySoft },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Icon name={icon} color={theme.primary} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  flex: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
  bedCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  error: {
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
