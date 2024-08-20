import { LONG_STALE_TIME, SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { DAS } from '@/utils/types/das';
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';

export function useGetSummary() {
  return useQuery({
    queryKey: ['get-summary', {}],
    queryFn: async () => {
      const result = await getDoc(doc(db, `Summary/mints`));
      if (result.exists()) {
        const summary = result.data() as {
          all: string[];
          allTokenPrices: {
            marketCap: number;
            mint: string;
          }[];
        };
        const tokenMap = new Map(
          summary.allTokenPrices.map(({ mint, marketCap }) => [mint, marketCap])
        );
        return { ...summary, allTokenPrices: tokenMap };
      } else {
        return null;
      }
    },
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGetAssetsBatch({ mints }: { mints: string[] }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-assets-batch', { mints }],
    queryFn: async () => {
      const response = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '',
          method: 'getAssetBatch',
          params: {
            ids: mints,
          },
        }),
      });
      const data = (await response.json()).result as DAS.GetAssetResponse[];
      return data;
    },
    enabled: !!mints && mints.length > 0,
    staleTime: LONG_STALE_TIME,
  });
}
