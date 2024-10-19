import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { generateMintApiEndPoint } from '@/utils/helper/endpoints';
import { DAS } from '@/utils/types/das';
import { GetPostsResponse, PostBlinksDetail } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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

export function useGetPostsFromMint({
  collectionMint,
  publicKey,
  selectedTab,
}: {
  collectionMint: PublicKey | null;
  publicKey: PublicKey | null;
  selectedTab: ProfileTabsEnum;
}) {
  return useInfiniteQuery({
    queryKey: [
      'get-posts-from-mint',
      { collectionMint, address: publicKey, selectedTab },
    ],
    queryFn: (ctx) =>
      fetchPostFromMint(
        selectedTab,
        collectionMint,
        publicKey,
        10,
        ctx.pageParam
      ),
    getNextPageParam: (lastGroup) => lastGroup.nextPage,
    initialPageParam: 0,
    enabled: !!collectionMint && !!selectedTab,
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

async function fetchPostFromMint(
  selectedTab: ProfileTabsEnum,
  mint: PublicKey | null,
  address: PublicKey | null,
  limit: number = 15,
  page: number = 0
) {
  let newPosts: PostBlinksDetail[] = [];

  if (selectedTab == ProfileTabsEnum.POSTS && mint) {
    const uriMetadata = await (
      await fetch(generateMintApiEndPoint(mint, limit, page * limit))
    ).json();
    let posts = uriMetadata as GetPostsResponse | undefined;
    newPosts = posts?.posts || [];
  }
  if (selectedTab == ProfileTabsEnum.FAVOURTIES && address) {
    const docData = await getDocs(
      query(
        collectionGroup(db, `Post`),
        where('softDelete', '==', false),
        where('likes', 'array-contains', address.toBase58()),
        orderBy('createdAt', 'desc')
      )
    );
    newPosts = docData.docs.map((x) => x.data() as PostBlinksDetail);
  }

  const hasMorePosts = newPosts.length === limit;
  return { rows: newPosts, nextPage: hasMorePosts ? page + 1 : undefined };
}
