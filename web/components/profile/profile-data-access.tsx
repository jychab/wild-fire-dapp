import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { fetchTokenDetails } from '@/utils/helper/mint';
import { fetchPostByCreator, fetchPostByMint } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
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
      return fetchTokenDetails(mint);
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}

async function fetchPostFromMint(
  selectedTab: ProfileTabsEnum,
  mint: PublicKey | null,
  address: PublicKey | null,
  limit: number,
  startAfter?: number
) {
  let newPosts: PostBlinksDetail[] = [];

  if (selectedTab == ProfileTabsEnum.POSTS && mint) {
    const posts = await fetchPostByMint(
      mint,
      limit,
      startAfter == 0 ? undefined : startAfter
    );
    newPosts = posts?.posts || [];
  }
  if (selectedTab == ProfileTabsEnum.FAVOURTIES && address) {
    const posts = await fetchPostByCreator(
      address,
      limit,
      startAfter == 0 ? undefined : startAfter
    );
    newPosts = posts || [];
  }

  const hasMorePosts = newPosts.length === limit;
  return {
    rows: newPosts,
    nextPage: hasMorePosts
      ? newPosts[newPosts.length - 1].createdAt
      : undefined,
  };
}
