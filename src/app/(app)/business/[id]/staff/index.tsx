import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { PersonRow } from '@/components/member-row';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { EmptyState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { memberName } from '@/lib/format';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

export default function StaffScreen() {
  const theme = useTheme();
  const { account } = useBusiness();

  const [isActive, setIsActive] = useState<boolean | undefined>(true);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');

  // Wait until typing pauses before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchPage = useCallback(
    (page: number) =>
      api.staffList({ business_account_id: account.id, is_active: isActive, search: search || undefined, page }),
    [account.id, isActive, search],
  );
  const list = usePaginatedList(fetchPage);

  const params = { id: account.id };
  const addStaff = () => router.push({ pathname: '/business/[id]/staff/new', params });

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderButton icon="personAdd" label="Add staff" onPress={addStaff} /> }} />

      <View style={[styles.toolbar, { borderColor: theme.border }]}>
        <TextField
          label="Search staff"
          hideLabel
          icon="search"
          placeholder="Name, phone, email or employee ID"
          autoCapitalize="none"
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filters}>
          {FILTERS.map((filter) => (
            <View key={filter.label} style={styles.flex}>
              <Chip
                label={filter.label}
                selected={filter.value === isActive}
                onPress={() => {
                  if (filter.value === isActive) return;
                  list.reset();
                  setIsActive(filter.value);
                }}
              />
            </View>
          ))}
        </View>
      </View>

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
          keyExtractor={(staff) => String(staff.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} />
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
          renderItem={({ item }) => (
            <PersonRow
              name={memberName(item)}
              details={[item.role, `#${item.employee_code}${item.phone ? ` · ${item.phone}` : ''}`]}
              muted={!item.is_active}
              trailing={
                <StatusPill label={item.is_active ? 'Active' : 'Inactive'} tone={item.is_active ? 'success' : 'neutral'} />
              }
              onPress={() =>
                router.push({ pathname: '/business/[id]/staff/[staffId]', params: { ...params, staffId: item.id } })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="staff"
              title="No Staff Found"
              message={search ? `Nobody matches "${search}".` : 'Add trainers, front desk and other staff.'}
              action={search ? null : <Button title="Add Staff" icon="personAdd" onPress={addStaff} />}
            />
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  toolbar: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  error: {
    padding: Spacing.three,
    paddingBottom: 0,
  },
  loader: {
    marginTop: Spacing.six,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.two + 2,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
