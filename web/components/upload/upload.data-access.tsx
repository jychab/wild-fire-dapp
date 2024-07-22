'use client';

import { createOrEditPost } from '@/utils/firebase/functions';
import { generateMintApiEndPoint } from '@/utils/helper/proxy';
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
import { ContentType } from './upload-ui';

export type UploadContent = BlinkContent | PostContent;

export interface BaseContent {
  type: ContentType;
  createdAt?: number;
  updatedAt?: number;
  mint: string;
  id: string;
}
export interface BlinkContent extends BaseContent {
  uri: string;
}

export interface PostContent extends BaseContent {
  carousel: Carousel[];
  caption: string;
  uri?: string;
}

export type Carousel = ImageContent | VideoContent;

export interface ImageContent {
  uri: string;
  fileType: string;
}

export interface VideoContent {
  uri: string;
  fileType: string;
  duration: number;
}

interface UploadArgs {
  content: UploadContent;
}

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'upload-mint-content',
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
        const hashFeedContent = details.additionalMetadata.find(
          (x) => x[0] == 'hashfeed'
        )?.[1];
        await createOrEditPost(mint.toBase58(), [input.content]);
        if (
          !hashFeedContent ||
          hashFeedContent !== generateMintApiEndPoint(mint)
        ) {
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
            ixs.push(
              await updateMetadata(
                connection,
                wallet.publicKey!,
                mint,
                x[0],
                x[1]
              )
            );
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
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
          client.refetchQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint },
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
