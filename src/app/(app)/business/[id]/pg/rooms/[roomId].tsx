import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { RoomForm } from '@/components/pg/room-form';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';

export default function EditRoomScreen() {
  const { account } = useBusiness();
  const roomId = Number(useLocalSearchParams<{ roomId: string }>().roomId);
  const fetchRoom = useCallback(
    () => api.pgRooms(account.id).then(({ results }) => ({ room: results.find((room) => room.id === roomId) ?? null })),
    [account.id, roomId],
  );
  const { data, error, retry } = useResource(fetchRoom);

  if (!data) return <LoadingState error={error} onRetry={retry} />;
  const room = data.room;
  if (!room) return <EmptyState icon="bed" title="Room not found" />;

  return (
    <RoomForm
      room={room}
      onSubmit={async (input) => {
        await api.updatePgRoom(account.id, room.id, input);
        router.back();
      }}
      onDelete={async () => {
        const ok = await confirm('Remove room?', `Room ${room.room_number} and its beds will be removed.`, 'Remove');
        if (!ok) return;
        await api.deletePgRoom(account.id, room.id);
        router.back();
      }}
    />
  );
}
