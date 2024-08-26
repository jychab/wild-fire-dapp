import revalidateTags from '@/app/action';
import { SHORT_STALE_TIME } from '@/utils/consts';
import { deletePost, withdrawFromCampaign } from '@/utils/firebase/functions';
import { generateAddressApiEndPoint, proxify } from '@/utils/helper/endpoints';
import { fetchPost } from '@/utils/helper/post';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { GetPostsResponse } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
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
    mutationFn: async (id: string) => {
      if (!mint || !id || !wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        const post = await fetchPost(mint.toBase58(), id);
        if (!post) return;
        if (post.campaign) {
          const { partialTx } = await withdrawFromCampaign(
            post.campaign.id,
            post.campaign.tokensRemaining,
            id
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
        await deletePost(mint.toBase58(), id);
        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: async (signature) => {
      if (signature) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-posts-from-mint', { mint }],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-address', { address: wallet.publicKey }],
          }),
        ]);
        revalidateTags('post');
        transactionToast(signature);
        router.push(`profile/?mintId=${mint?.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export const useGetPostsFromAddress = ({
  address,
}: {
  address: PublicKey | null;
}) => {
  return useQuery({
    queryKey: ['get-posts-from-address', { address }],
    queryFn: async () => {
      if (!address) return null;
      const result = await fetch(proxify(generateAddressApiEndPoint(address)));
      const posts = (await result.json()) as GetPostsResponse | undefined;
      return posts;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
};
