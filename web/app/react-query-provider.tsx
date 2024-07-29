'use client';

import indexedDbPersister from '@/utils/indexDB/indexedDbPersister';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ReactNode } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours,queries:
      },
    },
  });

  const asyncStoragePersister = createAsyncStoragePersister({
    storage: indexedDbPersister,
    key: 'REACT_QUERY_OFFLINE_CACHE',
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
