import revalidateTags from '@/app/action';
import { MEDIUM_STALE_TIME } from '@/utils/consts';
import {
  deleteCampaign,
  deletePost,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { getDerivedMemberMint, getDerivedMint } from '@/utils/helper/mint';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { PostCampaign } from '@/utils/types/campaigns';
import {
  Action,
  ActionConfig,
  setProxyUrl,
  unfurlUrlToActionApiUrl,
} from '@dialectlabs/blinks';
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
        const action = await Action.fetch(apiUrl).catch(() => null);
        if (action) {
          setProxyUrl('https://proxify.blinksfeed.com');
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
