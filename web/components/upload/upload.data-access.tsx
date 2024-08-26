'use client';

import revalidateTags from '@/app/action';
import {
  createOrEditPost,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { generatePostApiEndPoint } from '@/utils/helper/endpoints';
import { getAssociatedTokenStateAccount } from '@/utils/helper/mint';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
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
    mutationFn: async (input: any) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        if (input.campaign && input.campaign.amount > 0) {
          const source = getAssociatedTokenAddressSync(
            new PublicKey(input.campaign.mint),
            wallet.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          const destination = getAssociatedTokenAddressSync(
            new PublicKey(input.campaign.mint),
            getAssociatedTokenStateAccount(mint),
            true,
            TOKEN_2022_PROGRAM_ID
          );
          const ixs = [];
          try {
            await getAccount(
              connection,
              destination,
              undefined,
              TOKEN_2022_PROGRAM_ID
            );
          } catch (e) {
            ixs.push(
              createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey,
                destination,
                getAssociatedTokenStateAccount(mint),
                new PublicKey(input.campaign.mint),
                TOKEN_2022_PROGRAM_ID
              )
            );
          }

          ixs.push(
            createTransferCheckedInstruction(
              source,
              mint,
              destination,
              wallet.publicKey,
              input.campaign.amount,
              0,
              undefined,
              TOKEN_2022_PROGRAM_ID
            )
          );
          signature = await buildAndSendTransaction({
            connection,
            ixs,
            signTransaction: wallet.signTransaction,
            publicKey: wallet.publicKey,
          });
        } else if (input.campaign && input.campaign.amount < 0) {
          const { partialTx } = await withdrawFromCampaign(
            input.campaign.id,
            input.campaign.amount,
            input.id
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
        await createOrEditPost(mint.toBase58(), input);
        return { signature, input };
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
                  res.input.id
                ),
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

export function checkUrlIsValid(uri: string) {
  try {
    const result = new URL(uri);
    return result;
  } catch (e) {
    return;
  }
}
