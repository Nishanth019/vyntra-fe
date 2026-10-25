import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';

/**
 * Loads data for a screen and reloads it each time the screen comes into focus, so lists stay
 * current after adding or editing on another screen. Wrap `fetcher` in useCallback.
 */
export function useResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // The newest fetcher; answers to an older one (e.g. the month before a switch) are dropped.
  const latest = useRef(fetcher);
  useLayoutEffect(() => {
    latest.current = fetcher;
  }, [fetcher]);

  const load = useCallback(
    () =>
      fetcher().then(
        (result) => {
          if (latest.current !== fetcher) return;
          setData(result);
          setError('');
        },
        (e) => {
          if (!(e instanceof ApiError)) throw e;
          if (latest.current === fetcher) setError(e.message);
        },
      ),
    [fetcher],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /** Pull-to-refresh. */
  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function retry() {
    setError('');
    load();
  }

  return { data, setData, error, refreshing, refresh, retry };
}
