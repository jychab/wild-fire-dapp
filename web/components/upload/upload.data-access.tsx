'use client';

import { createOrEditPost } from '@/utils/firebase/functions';
import { generateMintApiEndPoint } from '@/utils/helper/proxy';
import { PostContent } from '@/utils/types/post';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  getAdditionalRentForUpdatedMetadata,
  updateMetadata,
} from '../../utils/helper/transcationInstructions';
import { useTransactionToast } from '../ui/ui-layout';

interface UploadArgs {
  post: PostContent;
}

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'upload-mint-post',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: UploadArgs) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const hashFeedPosts = details.additionalMetadata.find(
          (x) => x[0] == 'hashfeed'
        )?.[1];
        await createOrEditPost(mint.toBase58(), [input.post]);
        if (!hashFeedPosts || hashFeedPosts !== generateMintApiEndPoint(mint)) {
          // create the additional metadata
          let fieldsToUpdate: [string, string][] = [
            ['hashfeed', generateMintApiEndPoint(mint)],
          ];
          let ixs: TransactionInstruction[] = [];
          const lamports = await getAdditionalRentForUpdatedMetadata(
            connection,
            mint,
            fieldsToUpdate
          );
          if (lamports > 0) {
            ixs.push(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mint,
                lamports: lamports,
              })
            );
          }
          for (let x of fieldsToUpdate) {
            ixs.push(await updateMetadata(wallet.publicKey!, mint, x[0], x[1]));
          }
          if (ixs.length == 0) return;
          signature = await buildAndSendTransaction({
            connection,
            ixs,
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
          });
        } else {
          return 'Success';
        }
        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        router.push(`/profile?mintId=${mint?.toBase58()}`);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint, withContent: true },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-posts-from-address',
              { endpoint: connection.rpcEndpoint, address: wallet.publicKey },
            ],
          }),
        ]);
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
