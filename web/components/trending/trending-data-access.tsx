import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { getHolders as getMintSummaryInfo } from '@/utils/helper/mint';
import { program } from '@/utils/program/instructions';
import { DAS } from '@/utils/types/das';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';

export function useGetSummary() {
  return useQuery({
    queryKey: ['get-summary'],
    queryFn: async () => {
      const result = await getDoc(doc(db, `Summary/mints`));
      if (result.exists()) {
        return result.data() as {
          all: { collectionMint: string; memberMint: string }[];
          allTokenPrices: {
            collectionMint: string;
            memberMint: string;
            price: number;
            supply: number;
            volume: number;
          }[];
          initializedMints: {
            collectionMint: string;
            memberMint: string;
          }[];
        };
      } else {
        return null;
      }
    },
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGenerateTrendingList({
  summary,
}: {
  summary: {
    all: { collectionMint: string; memberMint: string }[];
    allTokenPrices: {
      collectionMint: string;
      memberMint: string;
      price: number;
      supply: number;
      volume: number;
    }[];
    initializedMints: {
      collectionMint: string;
      memberMint: string;
    }[];
  } | null;
}) {
  return useQuery({
    queryKey: ['generate-trending-list', summary],
    queryFn: async () => {
      if (!summary) return null;
      const metadatas = await getAssetBatch(
        summary.initializedMints.map((x) => x.memberMint)
      );
      const filteredList = summary.allTokenPrices
        .filter(
          (x) =>
            summary.initializedMints.find(
              (y) => y.collectionMint == x.collectionMint
            ) != undefined
        )
        .sort((a, b) => (b.volume || 0) - (a.volume || 0))
        .slice(0, 10);
      const mintInfoPromises = filteredList.map((x) =>
        getMintSummaryInfo(x.collectionMint)
      );
      const mintData = await Promise.all(mintInfoPromises);

      return filteredList.map((x, i) => {
        const metadata = metadatas.find((y) => y.id == x.memberMint);
        const holders = mintData[i];
        return {
          memberMint: x.memberMint,
          collectionMint: x.collectionMint,
          image: metadata?.content?.links?.image,
          name: metadata?.content?.metadata.name,
          price: holders?.currentPrice,
          price24HrPercent: holders?.priceChange24hPercent,
          holders: holders?.currentHoldersCount,
          holders24HrPercent: holders?.holdersChange24hPercent,
        };
      });
    },
    staleTime: SHORT_STALE_TIME,
  });
}
export async function getAssetBatch(mints: string[]) {
  if (mints.length == 0) return [];
  const response = await fetch(program.provider.connection.rpcEndpoint, {
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
  const result = (await response.json()).result as DAS.GetAssetResponse[];
  return result;
}
