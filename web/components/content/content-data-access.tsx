import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
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
