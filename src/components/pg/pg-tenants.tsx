import { router, useLocalSearchParams } from 'expo-router';
import { use, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { isTenantFilterKey, TENANT_FILTERS, type TenantFilterKey } from '@/components/pg/tenant-filters';
import { TenantRow } from '@/components/pg/tenant-row';
import { SubscriptionBanner } from '@/components/subscription-banner';
import { TabHeader, TabsContext } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { EmptyState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { PageWidth, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

/** A PG's tenants: living here, rent due, leaving, moved out. */
export function PgTenants() {
  const theme = useTheme();
  const { account } = useBusiness();
  const page = useWideLayout()
    ? ({ width: '100%', maxWidth: PageWidth.desktop + 40, alignSelf: 'center' } as const)
    : null;
  const params = useLocalSearchParams<{ filter?: string }>();

  const [filter, setFilter] = useState<TenantFilterKey>(isTenantFilterKey(params.filter) ? params.filter : 'living');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');

  // Home tiles and notifications open this tab with a filter.
  useEffect(() => {
    if (isTenantFilterKey(params.filter)) selectFilter(params.filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.filter]);

  const { setUnread } = use(TabsContext);
  const fetchStats = useCallback(() => Promise.all([api.pgDashboard(account.id), api.pgSettings(account.id)]), [account.id]);
  const { data, refresh: refreshCounts } = useResource(fetchStats);
  const [stats, settings] = data ?? [null, null];
  useEffect(() => {
    if (stats) setUnread(stats.unread_notifications);
  }, [stats, setUnread]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchPage = useCallback(
    (pageNumber: number) =>
      api.pgTenants({
        business_account_id: account.id,
        ...TENANT_FILTERS.find((item) => item.key === filter)!.query,
        search: search || undefined,
        page: pageNumber,
      }),
    [account.id, filter, search],
  );
  const list = usePaginatedList(fetchPage);

  function selectFilter(key: TenantFilterKey) {
    if (key === filter) return;
    list.reset();
    setFilter(key);
  }

  const addTenant = () => router.push({ pathname: '/business/[id]/pg/tenants/new', params: { id: account.id } });

  return (
    <>
      <TabHeader
        title="Tenants"
        subtitle="Who lives where and who owes rent"
        action={<HeaderButton icon="add" label="Add tenant" filled onPress={addTenant} />}
      />

      <View style={[styles.search, page]}>
        <SubscriptionBanner />
        <TextField
          label="Search tenants"
          hideLabel
          icon="search"
          placeholder="Search name, phone or room"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <ScrollView
        horizontal={!page}
        scrollEnabled={!page}
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersScroll, page]}
        contentContainerStyle={[styles.filters, page && styles.filtersWrap]}>
        {TENANT_FILTERS.map((item) => (
          <Chip
            key={item.key}
            pill
            label={item.label}
            count={stats && item.count ? item.count(stats) : undefined}
            selected={item.key === filter}
            onPress={() => selectFilter(item.key)}
          />
        ))}
      </ScrollView>

      {list.error ? (
        <View style={styles.error}>
          <ErrorBanner message={list.error} />
        </View>
      ) : null}

      {!list.items ? (
        list.error ? null : <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(tenant) => String(tenant.id)}
          renderItem={({ item }) => (
            <TenantRow
              tenant={item}
              upiId={settings?.upi_id}
              onPress={() =>
                router.push({ pathname: '/business/[id]/pg/tenants/[memberId]', params: { id: account.id, memberId: item.id } })
              }
            />
          )}
          contentContainerStyle={[styles.list, page]}
          keyboardShouldPersistTaps="handled"
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={() => Promise.all([list.refresh(), refreshCounts()])}
              tintColor={theme.primary}
            />
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="personOff"
              title={filter === 'dues' && !search ? 'No rent pending' : 'No tenants found'}
              message={
                search
                  ? `Nobody matches "${search}".`
                  : filter === 'living'
                    ? 'Add your first tenant to a bed to get started.'
                    : undefined
              }
              action={
                filter === 'living' && !search ? <Button title="Add Tenant" icon="personAdd" onPress={addTenant} /> : null
              }
            />
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  error: {
    paddingHorizontal: Spacing.three + 4,
  },
  loader: {
    marginTop: Spacing.six,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
});
