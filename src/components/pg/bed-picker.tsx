import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PgBed, PgRoom } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';

export type BedChoice = { bed: PgBed; room: PgRoom };

/** Finds a bed (with its room) by id in a rooms list. */
export function findBed(rooms: PgRoom[], bedId: number): BedChoice | null {
  for (const room of rooms) {
    const bed = room.beds.find((item) => item.id === bedId);
    if (bed) return { bed, room };
  }
  return null;
}

type BedPickerProps = {
  visible: boolean;
  rooms: PgRoom[];
  onClose: () => void;
  onSelect: (choice: BedChoice) => void;
};

/** A sheet of every free bed, room by room. */
export function BedPicker({ visible, rooms, onClose, onSelect }: BedPickerProps) {
  const theme = useTheme();
  const { account } = useBusiness();
  const withFree = rooms.filter((room) => room.beds.some((bed) => !bed.occupant));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Choose a Free Bed</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
            <Icon name="close" color={theme.text} size={24} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {withFree.length === 0 ? (
            <EmptyState
              icon="bed"
              title="No free beds"
              message="Every bed is taken. Add a room, or add beds to a room."
              action={
                <Button
                  title="Add Room"
                  icon="add"
                  onPress={() => {
                    onClose();
                    router.push({ pathname: '/business/[id]/pg/rooms/new', params: { id: account.id } });
                  }}
                />
              }
            />
          ) : (
            withFree.map((room) => (
              <View key={room.id} style={[styles.room, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.roomName, { color: theme.text }]}>
                  Room {room.room_number}
                  <Text style={[styles.roomMeta, { color: theme.textSecondary }]}>
                    {'  '}
                    {room.is_ac ? 'AC' : 'Non-AC'} · {formatMoney(room.rent_per_bed)}/bed
                  </Text>
                </Text>
                <View style={styles.beds}>
                  {room.beds
                    .filter((bed) => !bed.occupant)
                    .map((bed) => (
                      <Pressable
                        key={bed.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Room ${room.room_number}, bed ${bed.label}`}
                        onPress={() => {
                          onSelect({ bed, room });
                          onClose();
                        }}
                        style={({ pressed }) => [
                          styles.bed,
                          { backgroundColor: theme.successSoft },
                          pressed && styles.pressed,
                        ]}>
                        <Icon name="bed" color={theme.success} size={18} />
                        <Text style={[styles.bedText, { color: theme.success }]}>Bed {bed.label}</Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three + 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingBottom: Spacing.six,
  },
  room: {
    gap: Spacing.three - 4,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '800',
  },
  roomMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  beds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  bedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
