import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import {
  getAssetBatch,
  getHolders as getMintSummaryInfo,
} from '@/utils/helper/mint';
import { Summary } from '@/utils/types/token';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useConnection } from 'unified-wallet-adapter-with-telegram';

export function useGetSummary() {
  return useQuery({
    queryKey: ['get-summary'],
    queryFn: async () => {
      const result = await getDoc(doc(db, `Summary/mints`));
      if (result.exists()) {
        return result.data() as Summary;
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
  summary: Summary | null | undefined;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['generate-trending-list', summary],
    queryFn: async () => {
      if (!summary) return null;

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
      const metadatas = await getAssetBatch(
        connection,
        filteredList.map((x) => x.memberMint)
      );
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
    enabled: !!summary,
  });
}
