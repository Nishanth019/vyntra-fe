import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SubscriptionBanner } from '@/components/subscription-banner';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { PageWidth, Radius, shadow, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api, type PgBed, type PgRoom } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';
import { isPg } from '@/lib/pg';

/** A PG's rooms, floor by floor, with every bed: who's on it, or free to fill. */
export default function RoomsScreen() {
  const { account } = useBusiness();
  return isPg(account) ? <PgRooms /> : <EmptyState icon="bed" title="Rooms are for PGs" />;
}

function PgRooms() {
  const { account } = useBusiness();
  const wide = useWideLayout();
  const fetchRooms = useCallback(() => api.pgRooms(account.id).then(({ results }) => results), [account.id]);
  const { data: rooms, error, refreshing, refresh, retry } = useResource(fetchRooms);
  const params = { id: account.id };
  const addRoom = () => router.push({ pathname: '/business/[id]/pg/rooms/new', params });

  const beds = rooms?.flatMap((room) => room.beds) ?? [];
  const free = beds.filter((bed) => !bed.occupant).length;

  // Rooms grouped by floor, in the order the server sorted them.
  const floors = new Map<string, PgRoom[]>();
  for (const room of rooms ?? []) {
    const floor = room.floor?.trim() || '';
    floors.set(floor, [...(floors.get(floor) ?? []), room]);
  }

  return (
    <>
      <TabHeader
        title="Rooms"
        subtitle={rooms ? `${beds.length} beds · ${free} free` : 'Beds and who is on them'}
        action={<HeaderButton icon="add" label="Add room" filled onPress={addRoom} />}
      />
      {!rooms ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={wide ? PageWidth.desktop : PageWidth.phone}>
          <SubscriptionBanner />
          {error ? <ErrorBanner message={error} /> : null}
          {rooms.length === 0 ? (
            <EmptyState
              icon="bed"
              title="No rooms yet"
              message="Add your rooms with how many beds each has. Then move tenants in, bed by bed."
              action={<Button title="Add Room" icon="add" onPress={addRoom} />}
            />
          ) : (
            [...floors.entries()].map(([floor, floorRooms]) => (
              <View key={floor} style={styles.floor}>
                {floors.size > 1 || floor ? <FloorTitle floor={floor} /> : null}
                <View style={[styles.grid, wide && styles.gridWide]}>
                  {floorRooms.map((room) => (
                    <View key={room.id} style={wide ? styles.cellWide : null}>
                      <RoomCard room={room} />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </Screen>
      )}
    </>
  );
}

function FloorTitle({ floor }: { floor: string }) {
  const theme = useTheme();
  const label = !floor ? 'Other rooms' : /^\d+$/.test(floor) ? `Floor ${floor}` : floor;
  return <Text style={[styles.floorTitle, { color: theme.text }]}>{label}</Text>;
}

function RoomCard({ room }: { room: PgRoom }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const free = room.beds.filter((bed) => !bed.occupant).length;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit room ${room.room_number}`}
        onPress={() =>
          router.push({ pathname: '/business/[id]/pg/rooms/[roomId]', params: { id: account.id, roomId: room.id } })
        }
        style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}>
        <View style={styles.flex}>
          <Text style={[styles.roomName, { color: theme.text }]}>Room {room.room_number}</Text>
          <Text style={[styles.roomMeta, { color: theme.textSecondary }]}>
            {[room.is_ac ? 'AC' : 'Non-AC', `${formatMoney(room.rent_per_bed)}/bed`].join(' · ')}
          </Text>
        </View>
        <Text style={[styles.free, { color: free ? theme.success : theme.textSecondary }]}>
          {free ? `${free} free` : 'Full'}
        </Text>
        <Icon name="edit" color={theme.textSecondary} size={18} />
      </Pressable>
      <View style={styles.beds}>
        {room.beds.map((bed) => (
          <BedTile key={bed.id} bed={bed} />
        ))}
      </View>
    </View>
  );
}

function BedTile({ bed }: { bed: PgBed }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const occupant = bed.occupant;
  const leaving = occupant?.tenancy_status === 'NOTICE';

  function open() {
    if (occupant) {
      router.push({
        pathname: '/business/[id]/pg/tenants/[memberId]',
        params: { id: account.id, memberId: occupant.member_id },
      });
    } else {
      router.push({ pathname: '/business/[id]/pg/tenants/new', params: { id: account.id, bedId: bed.id } });
    }
  }

  const tint = occupant ? (leaving ? theme.warningSoft : theme.primarySoft) : theme.successSoft;
  const color = occupant ? (leaving ? theme.warning : theme.primary) : theme.success;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={occupant ? `Bed ${bed.label}: ${occupant.name}` : `Bed ${bed.label}: free, add a tenant`}
      onPress={open}
      style={({ pressed }) => [styles.bed, { backgroundColor: tint }, pressed && styles.pressed]}>
      <Icon name={occupant ? 'bed' : 'add'} color={color} size={18} />
      <View style={styles.flex}>
        <Text style={[styles.bedLabel, { color }]}>Bed {bed.label}</Text>
        <Text style={[styles.bedName, { color: theme.text }]} numberOfLines={1}>
          {occupant ? occupant.name : 'Free'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  floor: {
    gap: Spacing.three - 4,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  grid: {
    gap: Spacing.three - 4,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWide: {
    width: '49%',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three - 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  roomName: {
    fontSize: 17,
    fontWeight: '800',
  },
  roomMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  free: {
    fontSize: 13,
    fontWeight: '700',
  },
  beds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexBasis: '47%',
    flexGrow: 1,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  bedLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  bedName: {
    fontSize: 14,
    fontWeight: '600',
  },
});
