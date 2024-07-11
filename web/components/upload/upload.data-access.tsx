import { proxify } from '@/utils/helper/proxy';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uploadMetadata } from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  getAdditionalRentForUpdatedMetadata,
  updateMetadata,
} from '../../utils/helper/transcationInstructions';
import { useTransactionToast } from '../ui/ui-layout';
import { ContentType } from './upload-ui';

export type Content = BlinkContent | PostContent;

export interface BaseContent {
  type: ContentType;
  createdAt: number;
  updatedAt: number;
  id: string;
}
export interface BlinkContent extends BaseContent {
  uri: string;
}

export interface PostContent extends BaseContent {
  carousel: Carousel[];
  caption: string;
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
  content: Content;
}

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

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

      let ixs: TransactionInstruction[] = [];
      try {
        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const uriMetadata = await (await fetch(proxify(details.uri))).json();
        let currentContent = uriMetadata.content as Content[] | undefined;
        currentContent =
          currentContent?.filter((x) => x.id != input.content.id) || [];
        const newContent = currentContent.concat([input.content]);
        newContent.sort((a, b) => b.updatedAt - a.updatedAt);

        let fieldsToUpdate = new Map<string, string>();

        toast('Uploading metadata...');
        const payload = {
          ...uriMetadata,
          content: newContent,
        };
        const uri = await uploadMetadata(JSON.stringify(payload), mint);
        fieldsToUpdate.set('uri', uri);
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

        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-mint-metadata',
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
