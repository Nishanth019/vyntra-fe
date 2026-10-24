import { router } from 'expo-router';

import { RoomForm } from '@/components/pg/room-form';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewRoomScreen() {
  const { account } = useBusiness();

  return (
    <RoomForm
      onSubmit={async (input) => {
        await api.createPgRoom(account.id, input);
        router.back();
      }}
    />
  );
}
