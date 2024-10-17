import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { getHolders as getMintSummaryInfo } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useConnection } from 'unified-wallet-adapter-with-telegram';

export function useGenerateTrendingList() {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['generate-trending-list'],
    queryFn: async () => {
      let data;
      const result = await getDoc(doc(db, `Summary/mints`));
      if (result.exists()) {
        data = result.data() as {
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
            ids: data.initializedMints.map((x) => x.memberMint),
          },
        }),
      });
      const metadatas = (await response.json())
        .result as DAS.GetAssetResponse[];
      const filteredList = data.allTokenPrices
        .filter(
          (x) =>
            data.initializedMints.find(
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
