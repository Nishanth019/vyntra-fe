import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SubscriptionBanner } from '@/components/subscription-banner';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
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

const ALL = '__all__';

/** "Floor 1", "Ground" or the floor as typed; rooms without one are "No floor". */
function floorLabel(floor: string) {
  if (!floor) return 'No floor';
  return /^\d+$/.test(floor) ? `Floor ${floor}` : floor;
}

/** Ground first, then numbered floors in order, then the rest A–Z. */
function floorOrder(floor: string) {
  if (/^(g|ground|gf|0)$/i.test(floor)) return [0, 0, ''];
  if (/^\d+$/.test(floor)) return [1, Number(floor), ''];
  return [floor ? 2 : 3, 0, floor.toLowerCase()];
}

function compareFloors(a: string, b: string) {
  const [x, y] = [floorOrder(a), floorOrder(b)];
  return (x[0] as number) - (y[0] as number) || (x[1] as number) - (y[1] as number) || String(x[2]).localeCompare(String(y[2]));
}

function PgRooms() {
  const theme = useTheme();
  const { account } = useBusiness();
  const page = useWideLayout()
    ? ({ width: '100%', maxWidth: PageWidth.desktop + 40, alignSelf: 'center' } as const)
    : null;
  const fetchRooms = useCallback(() => api.pgRooms(account.id).then(({ results }) => results), [account.id]);
  const { data: rooms, error, refreshing, refresh, retry } = useResource(fetchRooms);
  const [floor, setFloor] = useState(ALL);
  const [freeOnly, setFreeOnly] = useState(false);
  const [search, setSearch] = useState('');
  const params = { id: account.id };
  const addRoom = () => router.push({ pathname: '/business/[id]/pg/rooms/new', params });

  const floorOf = (room: PgRoom) => room.floor?.trim() ?? '';
  const floors = [...new Set((rooms ?? []).map(floorOf))].sort(compareFloors);
  // A floor that no longer has rooms (e.g. its last room was removed) falls back to all floors.
  const selected = floor === ALL || floors.includes(floor) ? floor : ALL;
  const query = search.trim().toLowerCase();
  const shown = [...(rooms ?? [])]
    .sort((a, b) => compareFloors(floorOf(a), floorOf(b)) || a.room_number.localeCompare(b.room_number, undefined, { numeric: true }))
    .filter(
    (room) =>
      (selected === ALL || floorOf(room) === selected) &&
      (!freeOnly || room.beds.some((bed) => !bed.occupant)) &&
      (!query ||
        room.room_number.toLowerCase().includes(query) ||
        room.beds.some((bed) => bed.occupant?.name.toLowerCase().includes(query))),
  );
  const beds = shown.flatMap((room) => room.beds);
  const free = beds.filter((bed) => !bed.occupant).length;
  const allFree = (rooms ?? []).flatMap((room) => room.beds).filter((bed) => !bed.occupant).length;

  return (
    <>
      <TabHeader
        title="Rooms"
        subtitle="Beds and who is on them"
        action={<HeaderButton icon="add" label="Add room" filled onPress={addRoom} />}
      />
      {!rooms ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <>
          <View style={[styles.search, page]}>
            <SubscriptionBanner />
            {rooms.length ? (
              <TextField
                label="Search rooms"
                hideLabel
                icon="search"
                placeholder="Search room number or tenant"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
            ) : null}
          </View>
          {rooms.length ? (
            <ScrollView
              horizontal={!page}
              scrollEnabled={!page}
              showsHorizontalScrollIndicator={false}
              style={[styles.filtersScroll, page]}
              contentContainerStyle={[styles.filters, page && styles.filtersWrap]}>
              <Chip pill label="All floors" count={rooms.length} selected={selected === ALL} onPress={() => setFloor(ALL)} />
              {floors.map((item) => (
                <Chip
                  key={item || 'none'}
                  pill
                  label={floorLabel(item)}
                  count={rooms.filter((room) => floorOf(room) === item).length}
                  selected={selected === item}
                  onPress={() => setFloor(item)}
                />
              ))}
              <Chip pill label="Free beds" count={allFree} selected={freeOnly} onPress={() => setFreeOnly(!freeOnly)} />
            </ScrollView>
          ) : null}

          <FlatList
            data={shown}
            keyExtractor={(room) => String(room.id)}
            renderItem={({ item }) => <RoomCard room={item} />}
            contentContainerStyle={[styles.list, page]}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
            ListHeaderComponent={
              <>
                {error ? <ErrorBanner message={error} /> : null}
                {shown.length ? (
                  <View style={[styles.summary, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.summaryTitle, { color: theme.primary }]}>
                      {selected === ALL ? 'All floors' : floorLabel(selected)}
                    </Text>
                    <Text style={[styles.summaryText, { color: theme.primary }]}>
                      {shown.length} room{shown.length === 1 ? '' : 's'} · {beds.length} beds · {free} free
                    </Text>
                  </View>
                ) : null}
              </>
            }
            ListEmptyComponent={
              rooms.length === 0 ? (
                <EmptyState
                  icon="bed"
                  title="No rooms yet"
                  message="Add your rooms with how many beds each has. Then move tenants in, bed by bed."
                  action={<Button title="Add Room" icon="add" onPress={addRoom} />}
                />
              ) : (
                <EmptyState
                  icon="bed"
                  title={freeOnly ? 'No free beds here' : 'No rooms found'}
                  message={query ? `Nothing matches "${search.trim()}".` : undefined}
                />
              )
            }
          />
        </>
      )}
    </>
  );
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
            {[room.floor?.trim() ? floorLabel(room.floor.trim()) : null, room.is_ac ? 'AC' : 'Non-AC', `${formatMoney(room.rent_per_bed)}/bed`]
              .filter(Boolean)
              .join(' · ')}
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
  search: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filters: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.three,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.one,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
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
