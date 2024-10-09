import { db } from '@/utils/firebase/firebase';
import { GetPostsResponse, PostContent } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import {
  and,
  collectionGroup,
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
      if (!creator) return null;
      const q =
        selectedTab == ProfileTabsEnum.Created
          ? where('creator', '==', creator.toBase58())
          : where('likes', 'array-contains', creator.toBase58());
      try {
        const docData = await getDocs(
          query(
            collectionGroup(db, `Post`),
            and(where('softDelete', '==', false), q),
            orderBy('createdAt', 'desc')
          )
        );
        return {
          posts: docData.docs.map((x) => x.data() as PostContent),
        } as GetPostsResponse;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    enabled: !!creator,
  });
}
