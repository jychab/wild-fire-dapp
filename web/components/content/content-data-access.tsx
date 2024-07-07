import { DAS } from '@/types/das';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Content } from '../upload/upload.data-access';

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
      if (!address) return;

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
  mintsUri,
}: {
  mintsUri: string[];
}) {
  const { connection } = useConnection();
  const queries = mintsUri.map((uri) => {
    return {
      queryKey: [
        'get-mint-uri-metadata',
        { endpoint: connection.rpcEndpoint, uri },
      ],
      queryFn: async () => {
        try {
          const uriMetadata = await (await fetch(uri)).json();
          const name = uriMetadata.name;
          const symbol = uriMetadata.symbol;
          const imageUrl = uriMetadata.image;
          const description = uriMetadata.description;
          const content = uriMetadata.content;
          return {
            name: name as string,
            symbol: symbol as string,
            image: imageUrl as string,
            description: description as string | undefined,
            content: content as Content[] | undefined,
          };
        } catch (e) {
          return null;
        }
      },
    };
  });
  return useQueries({ queries });
}
