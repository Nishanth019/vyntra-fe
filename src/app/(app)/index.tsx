import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorBanner } from '@/components/ui/error-banner';
import { ListCard } from '@/components/ui/list-card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api, ApiError, type BusinessType } from '@/lib/api';
import { useSession } from '@/lib/session';

const fetchBusinessTypes = () => api.businessTypes().then(({ results }) => results);

/** First screen after login: the admin picks which kind of business they run. */
export default function BusinessTypesScreen() {
  const { admin } = useSession();
  const { data: types, error, refreshing, refresh, retry } = useResource(fetchBusinessTypes);

  const [openError, setOpenError] = useState('');
  const [openingId, setOpeningId] = useState<number | null>(null);

  // Exactly one business of this type → open it; otherwise list them (or offer to create the first).
  async function open(type: BusinessType) {
    setOpenError('');
    setOpeningId(type.id);
    try {
      const { results } = await api.businessAccounts();
      const accounts = results.filter((account) => account.business_type.id === type.id);

      if (accounts.length === 1) router.push({ pathname: '/business/[id]', params: { id: accounts[0].id } });
      else router.push({ pathname: '/accounts', params: { typeId: type.id, typeName: type.name } });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setOpenError(e.message);
    } finally {
      setOpeningId(null);
    }
  }

  if (!types) return <LoadingState error={error} onRetry={retry} />;

  return (
    <Screen
      title={`Hi, ${admin?.full_name.split(' ')[0]} 👋`}
      subtitle="What do you run? Choose your business type to get started."
      onRefresh={refresh}
      refreshing={refreshing}>
      {openError || error ? <ErrorBanner message={openError || error} /> : null}

      {types.length === 0 ? (
        <EmptyState icon="store" title="No business types yet" message="Please check back soon." />
      ) : (
        <View style={styles.list}>
          {types.map((type) => (
            <ListCard
              key={type.id}
              title={type.name}
              subtitle={type.description}
              loading={openingId === type.id}
              disabled={openingId !== null && openingId !== type.id}
              onPress={() => open(type)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
});
