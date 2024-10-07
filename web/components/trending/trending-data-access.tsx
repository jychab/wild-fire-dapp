import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { getHolders } from '@/utils/helper/mint';
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
            ids: data.all.map((x) => x.memberMint),
          },
        }),
      });
      const metadatas = (await response.json())
        .result as DAS.GetAssetResponse[];
      const filteredList = data.allTokenPrices
        .sort((a, b) => b.price * b.supply - a.price * a.supply)
        .slice(0, 10);
      const holdersPromises = filteredList.map((x) =>
        getHolders(x.collectionMint)
      );
      const holdersData = await Promise.all(holdersPromises);

      return filteredList.map((x, i) => {
        const metadata = metadatas.find((y) => y.id == x.memberMint);
        const holders = holdersData[i];
        return {
          memberMint: x.memberMint,
          collectionMint: x.collectionMint,
          image: metadata?.content?.links?.image,
          name: metadata?.content?.metadata.name,
          price: x.price,
          supply: x.supply,
          holders: holders?.currentHoldersCount,
          holders24HrPercent: holders?.holdersChange24hPercent,
        };
      });
    },
    staleTime: SHORT_STALE_TIME,
  });
}
