import revalidateTags from '@/app/action';
import {
  deleteCampaign,
  deletePost,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { getDerivedMemberMint, getDerivedMint } from '@/utils/helper/mint';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { PostCampaign } from '@/utils/types/campaigns';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
        const partialSignedTx = await deletePost(mint.toBase58(), postId);
        let tx = VersionedTransaction.deserialize(
          Buffer.from(partialSignedTx, 'base64')
        );
        signature = await buildAndSendTransaction({
          connection: connection,
          partialSignedTx: tx,
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });
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
        router.push(`profile/?mintId=${mint?.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}
