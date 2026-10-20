import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorBanner } from '@/components/ui/error-banner';
import { ListCard } from '@/components/ui/list-card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api, type BusinessType } from '@/lib/api';
import { defaultBusiness } from '@/lib/default-business';
import { useSession } from '@/lib/session';

const fetchBusinessTypes = () => api.businessTypes().then(({ results }) => results);

/**
 * First screen after login: opens the admin's default business, or lets them pick a business type.
 * `?switch=1` (Switch Business) always shows the picker.
 */
export default function BusinessTypesScreen() {
  const { admin } = useSession();
  const { switch: switching } = useLocalSearchParams<{ switch?: string }>();
  const [checkingDefault, setCheckingDefault] = useState(!switching);
  const { data: types, error, refreshing, refresh, retry } = useResource(fetchBusinessTypes);

  useEffect(() => {
    if (switching || !admin) return;
    defaultBusiness.get(admin.id).then((id) => {
      if (id) router.replace({ pathname: '/business/[id]', params: { id } });
      else setCheckingDefault(false);
    });
  }, [admin, switching]);

  // Always show the list, so an admin with one organisation can still add another.
  function open(type: BusinessType) {
    router.push({ pathname: '/accounts', params: { typeId: type.id, typeName: type.name } });
  }

  if (checkingDefault || !types) return <LoadingState error={checkingDefault ? '' : error} onRetry={retry} />;

  return (
    <Screen
      title={`Hi, ${admin?.full_name.split(' ')[0]} 👋`}
      subtitle="What do you run? Choose your business type to get started."
      onRefresh={refresh}
      refreshing={refreshing}>
      {error ? <ErrorBanner message={error} /> : null}

      {types.length === 0 ? (
        <EmptyState icon="store" title="No business types yet" message="Please check back soon." />
      ) : (
        <View style={styles.list}>
          {types.map((type) => (
            <ListCard key={type.id} title={type.name} subtitle={type.description} onPress={() => open(type)} />
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
