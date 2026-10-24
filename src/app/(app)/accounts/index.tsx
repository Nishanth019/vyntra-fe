import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { IconBadge } from '@/components/ui/icon-badge';
import { ListCard } from '@/components/ui/list-card';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

/** The admin's organisations of one business type, or a prompt to add the first one. */
export default function AccountsScreen() {
  const params = useLocalSearchParams<{ typeId: string; typeName: string }>();
  const typeId = Number(params.typeId);
  const typeName = params.typeName ?? 'Business';

  const fetchAccounts = useCallback(
    () =>
      api
        .businessAccounts()
        .then(({ results }) => results.filter((account) => account.business_type.id === typeId)),
    [typeId],
  );
  const { data: accounts, error, refreshing, refresh, retry } = useResource(fetchAccounts);

  function addOrganisation() {
    router.push({ pathname: '/accounts/new', params: { typeId: params.typeId, typeName } });
  }

  if (!accounts) return <LoadingState error={error} onRetry={retry} />;

  if (accounts.length === 0) {
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        {error ? <ErrorBanner message={error} /> : null}
        <GetStartedCard typeName={typeName} onAdd={addOrganisation} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Choose an organisation"
      subtitle={`Pick which ${typeName.toLowerCase()} you want to manage.`}
      onRefresh={refresh}
      refreshing={refreshing}>
      {error ? <ErrorBanner message={error} /> : null}
      <View style={styles.list}>
        {accounts.map((account) => (
          <ListCard
            key={account.id}
            title={account.name}
            subtitle={[account.city, account.state].filter(Boolean).join(', ') || account.contact_no}
            onPress={() => router.push({ pathname: '/business/[id]', params: { id: account.id } })}
          />
        ))}
      </View>
      <Button title="Add Organisation" icon="add" variant="secondary" onPress={addOrganisation} />
    </Screen>
  );
}

function GetStartedCard({ typeName, onAdd }: { typeName: string; onAdd: () => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.heroTop, { backgroundColor: theme.primary }]}>
        <View style={[styles.heroLogo, { backgroundColor: theme.onPrimary }]}>
          <Text style={[styles.heroLogoText, { color: theme.primary }]}>V</Text>
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.heroTitle, { color: theme.onPrimary }]}>Manage Your {typeName}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.onPrimary }]}>
            Add your organisation to start managing your {typeName.toLowerCase()}.
          </Text>
        </View>
      </View>
      <View style={styles.heroBody}>
        <Card tone="primary">
          <View style={styles.featureRow}>
            <IconBadge name="store" />
            <View style={styles.heroText}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>Add Your Organisation</Text>
              <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                Create your {typeName.toLowerCase()} organisation to manage{' '}
                {typeName.startsWith('PG') ? 'rooms, tenants and rent' : 'members, plans and memberships'} in one place.
              </Text>
            </View>
          </View>
        </Card>
        <Button title="Add Organisation" icon="add" onPress={onAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.lg + 4,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  heroLogo: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: 28,
    fontWeight: '800',
  },
  heroText: {
    flex: 1,
    gap: Spacing.one,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.9,
  },
  heroBody: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
