import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { ApiError, type Paginated } from '@/lib/api';

type PageState<T> = { items: T[]; page: number; hasMore: boolean; count: number };

/**
 * A paginated API list for a FlatList: loads page 1 on focus and whenever `fetchPage` changes
 * (wrap it in useCallback with its filters as deps), and appends pages on `loadMore`.
 */
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<Paginated<T>>) {
  const [state, setState] = useState<PageState<T> | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // The newest fetchPage; answers to an older one (e.g. the filter before a switch) are dropped.
  const latest = useRef(fetchPage);
  useLayoutEffect(() => {
    latest.current = fetchPage;
  }, [fetchPage]);

  const loadFirstPage = useCallback(
    () =>
      fetchPage(1).then(
        (result) => {
          if (latest.current !== fetchPage) return;
          setState({ items: result.results, page: 1, hasMore: result.next !== null, count: result.count });
          setError('');
        },
        (e) => {
          if (!(e instanceof ApiError)) throw e;
          if (latest.current === fetchPage) setError(e.message);
        },
      ),
    [fetchPage],
  );

  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [loadFirstPage]),
  );

  async function loadMore() {
    if (!state?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchPage(state.page + 1);
      if (latest.current !== fetchPage) return;
      setState({
        items: [...state.items, ...result.results],
        page: state.page + 1,
        hasMore: result.next !== null,
        count: result.count,
      });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }

  function retry() {
    setError('');
    loadFirstPage();
  }

  /** Shows the loading state until the next load, e.g. when switching filters. */
  function reset() {
    setState(null);
  }

  /** Replaces one loaded item, e.g. after checking a member out. */
  function updateItem(match: (item: T) => boolean, next: T) {
    setState((current) => current && { ...current, items: current.items.map((item) => (match(item) ? next : item)) });
  }

  return {
    items: state?.items ?? null,
    /** Total across all pages. */
    count: state?.count ?? 0,
    error,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
    retry,
    reset,
    updateItem,
  };
}
