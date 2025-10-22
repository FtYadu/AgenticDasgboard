'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { DashboardSnapshot, LogEntry, createLogStream, getSnapshot } from './api';

export function useDashboardSnapshot() {
  const { data, error, isLoading, mutate } = useSWR<DashboardSnapshot>(
    '/api/snapshot',
    async () => getSnapshot(),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    const eventSource = createLogStream();
    if (!eventSource) {
      return undefined;
    }

    const handler = (event: MessageEvent<string>) => {
      const entry: LogEntry = JSON.parse(event.data);
      mutate((current) => {
        if (!current) return current;
        const existing = current.logs.filter((log) => log.id !== entry.id);
        return {
          ...current,
          logs: [entry, ...existing].slice(0, 50),
        };
      }, { revalidate: false });
    };

    eventSource.onmessage = handler;

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  return {
    snapshot: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
