import revalidateTags from '@/app/action';
import { MEDIUM_STALE_TIME } from '@/utils/consts';
import {
  deleteCampaign,
  deletePost,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { getDerivedMemberMint, getDerivedMint } from '@/utils/helper/mint';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { PostCampaign } from '@/utils/types/campaigns';
import { PostBlinksDetail } from '@/utils/types/post';
import {
  Action,
  ActionConfig,
  setProxyUrl,
  unfurlUrlToActionApiUrl,
} from '@dialectlabs/blinks';
import { NATIVE_MINT } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { Categories } from '../ui/ui-provider';

export function useGetPostsFromAddress({
  category,
  publicKey,
}: {
  publicKey: PublicKey | null;
  category: Categories;
}) {
  return useInfiniteQuery({
    queryKey: ['get-posts-from-address', { category, address: publicKey }],
    queryFn: (ctx) =>
      fetchPostsFromAddress(
        category,
        publicKey || NATIVE_MINT,
        10,
        ctx.pageParam
      ),
    getNextPageParam: (lastGroup) => lastGroup.nextPage,
    initialPageParam: 0,
    enabled: !!category,
  });
}

export function useRemoveContentMutation({
  mint,
  postId,
}: {
  mint: PublicKey | null;
  postId: string | null;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationKey: [
      'remove-mint-content',
      {
        mint,
      },
    ],
    mutationFn: async (postCampaign: PostCampaign | null | undefined) => {
      if (!mint || !postId || !wallet.publicKey || !wallet.signTransaction)
        return;
      let signature: TransactionSignature = '';
      try {
        if (
          postCampaign?.budget &&
          !(
            postCampaign?.mintToSend ==
              getDerivedMemberMint(mint, 0).toBase58() &&
            getDerivedMint(wallet.publicKey).toBase58() == mint.toBase58()
          )
        ) {
          const { partialTx } = await withdrawFromCampaign(
            postCampaign.id,
            postCampaign.tokensRemaining,
            postId
          );
          const partialSignedTx = VersionedTransaction.deserialize(
            Buffer.from(partialTx, 'base64')
          );
          signature = await buildAndSendTransaction({
            connection,
            publicKey: wallet.publicKey,
            partialSignedTx,
            signTransaction: wallet.signTransaction,
          });
        }
        await deletePost(mint.toBase58(), postId);
        await deleteCampaign(undefined, postId);
        return { signature };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-posts-from-mint', { mint }],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-address', { address: wallet.publicKey }],
          }),
        ]);
        revalidateTags('post');
        transactionToast(result.signature || 'Success');
        router.push(`token/?mintId=${mint?.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export function useGetActionFromApiUrlQuery({
  url,
  adapter,
}: {
  url: string | undefined;
  adapter: ActionConfig | null;
}) {
  return useQuery({
    queryKey: ['get-action', { url, adapter: adapter != null }],
    queryFn: async () => {
      if (!adapter || !url) return null;
      let apiUrl = await unfurlUrlToActionApiUrl(url);
      if (!apiUrl) {
        apiUrl = url;
      }
      if (apiUrl) {
        setProxyUrl('https://proxify.blinksfeed.com');
        const action = await Action.fetch(apiUrl).catch(() => null);
        if (action) {
          action.setAdapter(adapter);
          return action;
        }
      }
      return null;
    },
    staleTime: MEDIUM_STALE_TIME,
    enabled: !!adapter && !!url,
  });
}

async function fetchPostsFromAddress(
  category: Categories,
  address: PublicKey,
  limit: number = 15,
  page: number = 0
) {
  let newPosts: PostBlinksDetail[] = [];
  if (category === Categories.FOR_YOU) {
    const result = await fetchPostByAddress(address, limit, page * limit);
    if (result) {
      newPosts = result.posts || [];
    }
  } else {
    const result = await fetchPostByCategories(
      'post',
      category,
      'tags',
      limit,
      page * limit
    );
    if (result) {
      newPosts = result;
    }
  }
  const hasMorePosts = newPosts.length === limit;
  return { rows: newPosts, nextPage: hasMorePosts ? page + 1 : undefined };
}
