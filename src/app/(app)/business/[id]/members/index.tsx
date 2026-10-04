import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { MemberRow } from '@/components/member-row';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { EmptyState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { fetchMemberCounts, isMemberFilterKey, MEMBER_FILTERS, type MemberFilterKey } from '@/lib/member-filters';

export default function MembersScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [filter, setFilter] = useState<MemberFilterKey>(isMemberFilterKey(params.filter) ? params.filter : 'all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');

  const fetchCounts = useCallback(() => fetchMemberCounts(account.id), [account.id]);
  const { data: counts, refresh: refreshCounts } = useResource(fetchCounts);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchPage = useCallback(
    (page: number) => {
      const query = MEMBER_FILTERS.find((item) => item.key === filter)!.query(new Date());
      return api.members({ business_account_id: account.id, ...query, search: search || undefined, page });
    },
    [account.id, filter, search],
  );
  // Reloads on focus (e.g. back from adding a member) and whenever the filter or search changes.
  const list = usePaginatedList(fetchPage);

  async function refresh() {
    await Promise.all([list.refresh(), refreshCounts()]);
  }

  function selectFilter(key: MemberFilterKey) {
    if (key === filter) return;
    list.reset();
    setFilter(key);
  }

  function toggleSearch() {
    if (searchOpen) setSearchText('');
    setSearchOpen(!searchOpen);
  }

  const addMember = () => router.push({ pathname: '/business/[id]/members/new', params: { id: account.id } });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderButton icon={searchOpen ? 'close' : 'search'} label="Search members" onPress={toggleSearch} />
              <HeaderButton icon="personAdd" label="Add member" onPress={addMember} />
            </View>
          ),
        }}
      />

      <View style={[styles.toolbar, { borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {MEMBER_FILTERS.map((item) => (
            <View key={item.key} style={styles.filter}>
              <Chip
                label={item.label}
                count={counts?.[item.key] ?? 0}
                selected={item.key === filter}
                onPress={() => selectFilter(item.key)}
              />
            </View>
          ))}
        </ScrollView>
        {searchOpen ? (
          <View style={styles.search}>
            <TextField
              label="Search members"
              hideLabel
              icon="search"
              placeholder="Name, phone, email or member ID"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoFocus
              returnKeyType="search"
            />
          </View>
        ) : null}
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
          keyExtractor={(member) => String(member.id)}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              onPress={() =>
                router.push({
                  pathname: '/business/[id]/members/[memberId]',
                  params: { id: account.id, memberId: item.id },
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={refresh} tintColor={theme.primary} />}
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="personOff"
              title="No Members Found"
              message={
                search ? `Nobody matches "${search}".` : filter === 'all' ? 'Add your first member to get started.' : undefined
              }
              action={
                filter === 'all' && !search ? <Button title="Add Member" icon="personAdd" onPress={addMember} /> : null
              }
            />
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filters: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  filter: {
    width: 128,
  },
  search: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
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
