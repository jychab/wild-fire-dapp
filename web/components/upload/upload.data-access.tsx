'use client';

import { Scope } from '@/utils/enums/das';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { uploadMetadata } from '../../utils/firebase/functions';
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
        let hashFeedMetadata;
        let currentContent;
        if (hashFeedContent) {
          hashFeedMetadata = await (
            await fetch(
              proxify(
                hashFeedContent, // content uri
                true
              )
            )
          ).json();
          currentContent = hashFeedMetadata.content as
            | UploadContent[]
            | undefined;
        }
        currentContent =
          currentContent?.filter((x) => x.id != input.content.id) || [];
        const newContent = currentContent.concat([input.content]);
        newContent.sort((a, b) => b.updatedAt - a.updatedAt);

        const payload = {
          ...hashFeedMetadata,
          content: newContent,
        };
        const uri = await uploadMetadata(
          JSON.stringify(payload),
          mint,
          'hashfeed'
        );
        if (hashFeedContent) {
          return 'Success';
        }
        // create the additional metadata
        let fieldsToUpdate: [string, string][] = [['hashfeed', uri]];
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
              { endpoint: connection.rpcEndpoint, mint, skipCache: true },
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

export function useGetAuthorisedMintInYourWallet({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-list-of-authorised-mints-from-wallet',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '',
          method: 'searchAssets',
          params: {
            tokenType: 'fungible',
            ownerAddress: address.toBase58(),
            page: 1, // Starts at 1
            limit: 1000,
            displayOptions: {
              showZeroBalance: false,
            },
          },
        }),
      });
      const data = (await response.json()).result as DAS.GetAssetResponseList;
      return data.items.filter(
        (x) =>
          x.authorities?.find(
            (x) =>
              x.scopes.includes(Scope.FULL) || x.scopes.includes(Scope.METADATA)
          )?.address == address.toBase58()
      );
    },
    enabled: !!address,
  });
}
