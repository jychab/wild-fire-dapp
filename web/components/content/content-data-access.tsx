import { uploadMetadata } from '@/utils/firebase/functions';
import { proxify } from '@/utils/helper/proxy';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  getAdditionalRentForUpdatedMetadata,
  updateMetadata,
} from '@/utils/helper/transcationInstructions';
import { DAS } from '@/utils/types/das';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { UploadContent } from '../upload/upload.data-access';

export function useGetAllFungibleTokensFromOwner({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-all-fungible-tokens-from-address',
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
            ownerAddress: address.toBase58(),
            tokenType: 'fungible',
            options: {
              showZeroBalance: false,
            },
          },
        }),
      });
      const data = (await response.json()).result as DAS.GetAssetResponseList;
      return data;
    },
    enabled: !!address,
    staleTime: 1000 * 5 * 60,
  });
}

export function useGetMultipleMintUriMetadata({
  mints,
}: {
  mints: { mint: PublicKey; uri: string }[];
}) {
  const { connection } = useConnection();
  const queries = mints.map((mint) => {
    return {
      queryKey: [
        'get-mint-uri-metadata',
        { endpoint: connection.rpcEndpoint, mint: mint.mint, uri: mint.uri },
      ],
      queryFn: async () => {
        try {
          const uriMetadata = await (await fetch(proxify(mint.uri))).json();
          const name = uriMetadata.name;
          const symbol = uriMetadata.symbol;
          const imageUrl = uriMetadata.image;
          const description = uriMetadata.description;
          const content = uriMetadata.content;
          return {
            mint: mint.mint,
            name: name as string,
            symbol: symbol as string,
            image: imageUrl as string,
            description: description as string | undefined,
            content: content as UploadContent[] | undefined,
          };
        } catch (e) {
          return null;
        }
      },
    };
  });
  return useQueries({ queries });
}

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'remove-mint-content',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (id: string) => {
      let signature: TransactionSignature = '';
      let ixs: TransactionInstruction[] = [];
      try {
        if (!wallet.publicKey || !mint || !id) return;
        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const uriMetadata = await (
          await fetch(proxify(details.uri, true))
        ).json();
        const currentContent = uriMetadata.content as
          | UploadContent[]
          | undefined;
        if (!currentContent) return;
        const newContent = currentContent.filter((x) => x.id != id);
        newContent.sort((a, b) => b.updatedAt - a.updatedAt);
        let fieldsToUpdate: [string, string][] = [];
        const payload = {
          ...uriMetadata,
          content: newContent,
        };
        const uri = await uploadMetadata(JSON.stringify(payload), mint);
        fieldsToUpdate.push(['uri', uri]);
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
          publicKey: wallet.publicKey!,
          signTransaction: wallet.signTransaction!,
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
