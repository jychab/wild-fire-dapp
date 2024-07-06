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
import { uploadMetadata } from '../firebase/functions';
import {
  getAdditionalRentForUpdatedMetadata,
  updateMetadata,
} from '../program/instructions';
import { useTransactionToast } from '../ui/ui-layout';
import { buildAndSendTransaction } from '../utils/transactionBuilder';
import { ContentType } from './upload-ui';

export interface Content {
  fileType?: string;
  type: ContentType;
  uri: string;
  date: number;
}

interface UploadArgs {
  content: Content[];
}

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'edit-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: UploadArgs) => {
      let signature: TransactionSignature = '';

      let tx: TransactionInstruction[] = [];
      try {
        if (!wallet.publicKey || !mint) return;

        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const uriMetadata = await (await fetch(details.uri)).json();
        const currentContent = uriMetadata.content as Content[] | undefined;
        const newContent = currentContent
          ? currentContent.concat(input.content)
          : input.content;
        newContent.sort((a, b) => b.date - a.date);

        let fieldsToUpdate = new Map<string, string>();

        toast('Uploading metadata...');
        const payload = {
          ...uriMetadata,
          content: newContent,
        };
        console.log(payload);
        const uri = await uploadMetadata(JSON.stringify(payload), mint);
        fieldsToUpdate.set('uri', uri);
        const lamports = await getAdditionalRentForUpdatedMetadata(
          connection,
          mint,
          fieldsToUpdate
        );
        if (lamports > 0) {
          tx.push(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: mint,
              lamports: lamports,
            })
          );
        }
        for (let x of fieldsToUpdate) {
          tx.push(
            await updateMetadata(
              connection,
              wallet.publicKey!,
              mint,
              x[0],
              x[1]
            )
          );
        }

        if (tx.length == 0) return;
        signature = await buildAndSendTransaction(
          connection,
          tx,
          wallet.publicKey!,
          wallet.signTransaction!,
          'confirmed'
        );

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
