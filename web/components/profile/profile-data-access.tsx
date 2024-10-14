import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { generateMintApiEndPoint, proxify } from '@/utils/helper/endpoints';
import { getDerivedMint } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { GetPostsResponse, PostContent } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { ProfileTabsEnum } from './profile-feature';

export function useGetPostsFromCreator({
  creator,
  selectedTab,
}: {
  creator: PublicKey | null;
  selectedTab: ProfileTabsEnum;
}) {
  return useQuery({
    queryKey: ['get-posts-from-creator', { creator, selectedTab }],
    queryFn: async () => {
      try {
        if (!creator) return null;
        if (selectedTab == ProfileTabsEnum.TRADE) return null;
        if (selectedTab == ProfileTabsEnum.POSTS) {
          const mint = getDerivedMint(creator);
          const uriMetadata = await (
            await fetch(proxify(generateMintApiEndPoint(mint)))
          ).json();
          let posts = uriMetadata as GetPostsResponse | undefined;
          return posts;
        }
        if (selectedTab == ProfileTabsEnum.FAVOURTIES) {
          const docData = await getDocs(
            query(
              collectionGroup(db, `Post`),
              where('softDelete', '==', false),
              where('likes', 'array-contains', creator.toBase58()),
              orderBy('createdAt', 'desc')
            )
          );
          return {
            posts: docData.docs.map((x) => x.data() as PostContent),
          } as GetPostsResponse;
        }
        return null;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    enabled: !!creator,
  });
}
export function useGetMintSummaryDetails({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-mint-summary-details', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const result = await getDoc(
        doc(db, `Mint/${mint.toBase58()}/TokenInfo/Summary`)
      );
      if (result.exists()) {
        return result.data() as {
          currentHoldersCount?: number;
          holdersChange24hPercent?: number;
          currentPrice?: number;
          priceChange24hPercent?: number;
        };
      } else {
        return null;
      }
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}
export function useGetTokenDetails({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-token-details', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const docData = await getDoc(doc(db, `Mint/${mint.toBase58()}`));
      if (docData.exists()) {
        const parsedData = JSON.parse(
          docData.data().das
        ) as DAS.GetAssetResponse;
        if (
          parsedData.content?.links &&
          !parsedData.content.links.image &&
          parsedData.content?.json_uri
        ) {
          parsedData.content.links.image = (
            await (await fetch(parsedData.content?.json_uri)).json()
          ).image as string;
        }
        return parsedData;
      } else {
        const docData = await getDoc(
          doc(db, `Mint/${mint.toBase58()}/Temporary/Profile`)
        );
        if (docData.exists()) {
          return { ...docData.data(), temporary: true } as DAS.GetAssetResponse;
        }
      }
      return null;
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}
