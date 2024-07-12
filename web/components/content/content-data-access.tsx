import { uploadMetadata } from '@/utils/firebase/functions';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
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
  mints: { mint: PublicKey; asset: DAS.GetAssetResponse }[];
}) {
  const { connection } = useConnection();
  const queries = mints.map(({ mint, asset }) => {
    return {
      queryKey: [
        'get-content-from-mint',
        { endpoint: connection.rpcEndpoint, mint: mint },
      ],
      queryFn: async () => {
        try {
          const hashFeedUri =
            asset.mint_extensions?.metadata?.additional_metadata.find(
              (x) => x[0] == 'hashfeed'
            )?.[1];
          if (!hashFeedUri) {
            return null;
          }
          const uriMetadata = await (await fetch(proxify(hashFeedUri))).json();
          const name = asset.content?.metadata.name;
          const symbol = asset.content?.metadata.symbol;
          const imageUrl = asset.content?.links?.image;
          const description = asset.content?.metadata.description;
          const content = uriMetadata.content as UploadContent[] | undefined;
          return {
            mint: mint,
            name: name,
            symbol: symbol,
            image: imageUrl,
            description: description,
            content: content,
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
      if (!wallet.publicKey || !mint || !id) return;
      let signature: TransactionSignature = '';
      try {
        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const hashFeedContent = details.additionalMetadata.find(
          (x) => x[0] == 'hashfeed'
        )?.[1];

        if (hashFeedContent) {
          const uriMetadata = await (
            await fetch(
              proxify(
                hashFeedContent, // content uri
                true
              )
            )
          ).json();
          let currentContent = uriMetadata.content as
            | UploadContent[]
            | undefined;
          if (!currentContent) return;
          const newContent = currentContent.filter((x) => x.id != id);
          newContent.sort((a, b) => b.updatedAt - a.updatedAt);
          const payload = {
            ...uriMetadata,
            content: newContent,
          };
          await uploadMetadata(JSON.stringify(payload), mint, 'content');
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
