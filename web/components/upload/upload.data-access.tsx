'use client';

import revalidateTags from '@/app/action';
import { db } from '@/utils/firebase/firebase';
import {
  createOrEditCampaign,
  createOrEditPost,
  getAvailableAmountInEscrow,
} from '@/utils/firebase/functions';
import { generatePostApiEndPoint } from '@/utils/helper/endpoints';
import {
  getAmountAfterTransferFee,
  getAssociatedTokenStateAccount,
} from '@/utils/helper/mint';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { PostCampaign } from '@/utils/types/campaigns';
import { PostContent } from '@/utils/types/post';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { TempPostCampaign } from './upload-ui';

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const transactionToast = useTransactionToast();
  const { connection } = useConnection();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'upload-mint-post',
      {
        mint,
      },
    ],
    mutationFn: async ({
      postContent,
      postCampaign,
    }: {
      postContent: Partial<PostContent>;
      postCampaign?: Partial<TempPostCampaign>;
    }) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        if (
          postCampaign &&
          postCampaign.mintToSend &&
          postCampaign.mintToSendTokenProgram
        ) {
          const currentTokensRemaining =
            postCampaign?.initialTokensRemaining || 0;
          let difference =
            (postCampaign.tokensRemaining || 0) - currentTokensRemaining;
          const differenceAmountAfterTransferFee =
            difference > 0
              ? await getAmountAfterTransferFee(
                  difference,
                  new PublicKey(postCampaign.mintToSend),
                  connection,
                  new PublicKey(postCampaign.mintToSendTokenProgram)
                )
              : difference;
          postCampaign.budget =
            (postCampaign?.initialBudget || 0) +
            differenceAmountAfterTransferFee;
          postCampaign.tokensRemaining =
            currentTokensRemaining + differenceAmountAfterTransferFee;
          const currentBalance = await getAvailableAmountInEscrow(
            postCampaign.mintToSend,
            postCampaign.mintToSendTokenProgram
          );
          difference = difference - Math.max(currentBalance, 0);
          if (difference > 0) {
            const ixs = await buildSendToDistributorIxs(
              postCampaign,
              wallet.publicKey,
              mint,
              new PublicKey(postCampaign.mintToSend),
              connection,
              difference
            );
            signature = await buildAndSendTransaction({
              connection,
              ixs,
              signTransaction: wallet.signTransaction,
              publicKey: wallet.publicKey,
            });
          }
        }
        await createOrEditPost(mint.toBase58(), postContent);
        if (postCampaign) {
          delete postCampaign.initialTokensRemaining;
          delete postCampaign.initialBudget;
          await createOrEditCampaign(postCampaign);
        }
        return { signature, postId: postContent.id };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}`);
        return;
      }
    },
    onSuccess: async (res) => {
      if (res) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-posts-from-mint', { mint }],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-blink-action',
              {
                actionUrl: generatePostApiEndPoint(
                  mint!.toBase58(),
                  res.postId!
                ),
                publicKey: wallet.publicKey,
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-address', { address: wallet.publicKey }],
          }),
        ]);
        revalidateTags('post');
        transactionToast(res.signature || 'Success');
        router.push(`/profile?mintId=${mint?.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

async function buildSendToDistributorIxs(
  postCampaign: Partial<TempPostCampaign>,
  publicKey: PublicKey,
  mint: PublicKey,
  mintToSend: PublicKey,
  connection: Connection,
  difference: number
) {
  const tokenProgram = postCampaign.mintToSendTokenProgram
    ? new PublicKey(postCampaign.mintToSendTokenProgram)
    : TOKEN_2022_PROGRAM_ID;
  const source = getAssociatedTokenAddressSync(
    mintToSend,
    publicKey,
    false,
    tokenProgram
  );
  const escrowAccount = getAssociatedTokenStateAccount(mint);
  const destination = getAssociatedTokenAddressSync(
    mintToSend,
    escrowAccount,
    true,
    tokenProgram
  );
  const ixs = [];
  try {
    await getAccount(connection, destination, undefined, tokenProgram);
  } catch (e) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        publicKey,
        destination,
        escrowAccount,
        mintToSend,
        tokenProgram
      )
    );
  }
  ixs.push(
    createTransferCheckedInstruction(
      source,
      mintToSend,
      destination,
      publicKey,
      Math.round(difference * 10 ** (postCampaign.mintToSendDecimals || 0)),
      postCampaign.mintToSendDecimals || 0,
      undefined,
      tokenProgram
    )
  );
  return ixs;
}

export function useGetPostCampaign({
  address,
  postId,
}: {
  address: PublicKey | null;
  postId: string | null;
}) {
  return useQuery({
    queryKey: ['get-post-campaign', { address, postId }],
    queryFn: async () => {
      if (!address || !postId) return null;
      const docData = await getDoc(
        doc(db, `Admin/${address.toBase58()}/PostCampaigns/${postId}`)
      );
      if (docData.exists()) {
        return docData.data() as PostCampaign;
      }
      return null;
    },
    enabled: !!address && !!postId,
  });
}

export function checkUrlIsValid(uri: string) {
  try {
    const result = new URL(uri);
    return result;
  } catch (e) {
    return;
  }
}
