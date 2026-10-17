import { router, useLocalSearchParams } from "expo-router";
import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MemberRow } from "@/components/member-row";
import { TabHeader, TabsContext } from "@/components/tab-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ErrorBanner } from "@/components/ui/error-banner";
import { HeaderButton } from "@/components/ui/header-button";
import { EmptyState } from "@/components/ui/states";
import { TextField } from "@/components/ui/text-field";
import { PageWidth, Radius, Spacing } from "@/constants/theme";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useResource } from "@/hooks/use-resource";
import { useTheme } from "@/hooks/use-theme";
import { useWideLayout } from "@/hooks/use-wide-layout";
import { api } from "@/lib/api";
import { useBusiness } from "@/lib/business";
import {
  AUTO_INACTIVE_NOTE,
  isMemberFilterKey,
  MEMBER_FILTERS,
  type MemberFilterKey,
} from "@/lib/member-filters";

export default function MembersScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  // In a desktop browser the list is centered at the same width as the header.
  const page = useWideLayout()
    ? ({ width: "100%", maxWidth: PageWidth.desktop + 40, alignSelf: "center" } as const)
    : null;
  const params = useLocalSearchParams<{ filter?: string }>();

  const [filter, setFilter] = useState<MemberFilterKey>(
    isMemberFilterKey(params.filter) ? params.filter : "all",
  );
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  // Keeps the selected filter chip in view (e.g. "Dues Pending" opened from Home).
  const chipsRef = useRef<ScrollView>(null);
  const chipX = useRef<Partial<Record<MemberFilterKey, number>>>({});
  useEffect(() => {
    const x = chipX.current[filter];
    if (x !== undefined)
      chipsRef.current?.scrollTo({
        x: Math.max(0, x - Spacing.three),
        animated: true,
      });
  }, [filter]);

  // Home tiles and notifications open this tab with a filter.
  useEffect(() => {
    if (isMemberFilterKey(params.filter)) selectFilter(params.filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.filter]);

  // Filter counts come from the dashboard, which also has the unread notifications for the bell.
  const { setUnread } = use(TabsContext);
  const fetchDashboard = useCallback(
    () => api.dashboard(account.id),
    [account.id],
  );
  const { data: dashboard, refresh: refreshCounts } =
    useResource(fetchDashboard);
  const counts = dashboard?.members;
  useEffect(() => {
    if (dashboard) setUnread(dashboard.unread_notifications);
  }, [dashboard, setUnread]);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchPage = useCallback(
    (page: number) => {
      const query = MEMBER_FILTERS.find((item) => item.key === filter)!.query(
        new Date(),
      );
      return api.members({
        business_account_id: account.id,
        ...query,
        search: search || undefined,
        page,
      });
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

  const addMember = () =>
    router.push({
      pathname: "/business/[id]/members/new",
      params: { id: account.id },
    });

  return (
    <>
      <TabHeader
        title="Members"
        subtitle="Manage your members"
        action={
          <HeaderButton
            icon="add"
            label="Add member"
            filled
            onPress={addMember}
          />
        }
      />

      <View style={[styles.search, page]}>
        <TextField
          label="Search members"
          hideLabel
          icon="search"
          placeholder="Search name, phone, email or ID"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      {/* Phones swipe through the filters; desktop shows them all, wrapping onto more lines. */}
      <ScrollView
        ref={chipsRef}
        horizontal={!page}
        scrollEnabled={!page}
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersScroll, page]}
        contentContainerStyle={[styles.filters, page && styles.filtersWrap]}
      >
        {MEMBER_FILTERS.map((item) => (
          <View
            key={item.key}
            onLayout={(event) => {
              chipX.current[item.key] = event.nativeEvent.layout.x;
              if (item.key === filter)
                chipsRef.current?.scrollTo({
                  x: Math.max(0, event.nativeEvent.layout.x - Spacing.three),
                  animated: false,
                });
            }}
          >
            <Chip
              pill
              label={item.label}
              count={counts?.[item.key] ?? 0}
              selected={item.key === filter}
              onPress={() => selectFilter(item.key)}
            />
          </View>
        ))}
      </ScrollView>

      {filter === "expired" || filter === "inactive" ? (
        <View style={[styles.note, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.noteText, { color: theme.primary }]}>
            {AUTO_INACTIVE_NOTE}
          </Text>
        </View>
      ) : null}

      {list.error ? (
        <View style={styles.error}>
          <ErrorBanner message={list.error} />
        </View>
      ) : null}

      {!list.items ? (
        list.error ? null : (
          <ActivityIndicator
            color={theme.primary}
            size="large"
            style={styles.loader}
          />
        )
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(member) => String(member.id)}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              onPress={() =>
                router.push({
                  pathname: "/business/[id]/members/[memberId]",
                  params: { id: account.id, memberId: item.id },
                })
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
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          ListFooterComponent={
            list.loadingMore ? (
              <ActivityIndicator color={theme.primary} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="personOff"
              title="No Members Found"
              message={
                search
                  ? `Nobody matches "${search}".`
                  : filter === "all"
                    ? "Add your first member to get started."
                    : undefined
              }
              action={
                filter === "all" && !search ? (
                  <Button
                    title="Add Member"
                    icon="personAdd"
                    onPress={addMember}
                  />
                ) : null
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
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.two,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filters: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.three,
  },
  error: {
    paddingHorizontal: Spacing.three + 4,
  },
  note: {
    marginHorizontal: Spacing.three + 4,
    marginBottom: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
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
