import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { GetPostsResponse, PostContent } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import {
  collectionGroup,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

export function useGetPostsFromCreator({
  creator,
}: {
  creator: PublicKey | null;
}) {
  return useQuery({
    queryKey: ['get-posts-from-creator', { creator }],
    queryFn: async () => {
      if (!creator) return null;
      const docData = await getDocs(
        query(
          collectionGroup(db, `Post`),
          where('creator', '==', creator.toBase58()),
          orderBy('createdAt', 'desc')
        )
      );
      return {
        posts: docData.docs.map((x) => x.data() as PostContent),
      } as GetPostsResponse;
    },
    enabled: !!creator,
    staleTime: SHORT_STALE_TIME,
  });
}
