import { deletePost } from '@/utils/firebase/functions';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import { useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactionToast } from '../ui/ui-layout';
import { UploadContent } from '../upload/upload.data-access';
import { ContentWithMetada } from './content-ui';

export async function getAllFungibleTokensFromOwner({
  address,
  connection,
}: {
  address: PublicKey;
  connection: Connection;
}) {
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
}

export async function getMultipleMintUriMetadata({
  mints,
}: {
  mints: DAS.GetAssetResponse[];
}) {
  const queries = await Promise.all(
    mints.map(async (asset) => {
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
        mint: new PublicKey(asset.id),
        name: name,
        symbol: symbol,
        image: imageUrl,
        description: description,
        content: content,
      };
    })
  );
  return queries;
}

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
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
      if (!mint || !id) return;
      await deletePost(mint.toBase58(), id);
      return 'Success';
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
export const fetchContentPage = async (
  pageParam: number,
  pageLength: number,
  publicKey: PublicKey,
  whitelistedMint: DAS.GetAssetResponse | null | undefined,
  connection: Connection
): Promise<ContentWithMetada[]> => {
  const allTokenAccounts = await getAllFungibleTokensFromOwner({
    address: publicKey,
    connection,
  });

  const tokenAccounts = whitelistedMint
    ? allTokenAccounts?.items.find((x) => x.id === whitelistedMint.id) ==
      undefined
      ? allTokenAccounts?.items.concat(whitelistedMint)
      : allTokenAccounts.items
    : allTokenAccounts?.items;

  const sortedTokenAccounts = tokenAccounts?.sort((a, b) => {
    const priceComparison =
      (b.token_info?.price_info?.price_per_token || 0) -
      (a.token_info?.price_info?.price_per_token || 0);
    if (priceComparison !== 0) return priceComparison;
    return 0;
  });

  const mints =
    sortedTokenAccounts?.slice(
      pageParam * pageLength,
      (pageParam + 1) * pageLength
    ) || [];

  const allMintMetadataQuery = await getMultipleMintUriMetadata({ mints });

  const content = allMintMetadataQuery
    .filter((x) => x && x.content !== undefined)
    .map((x) => {
      return x!.content?.map((y) => {
        return {
          ...y,
          name: x!.name,
          symbol: x!.symbol,
          image: x!.image,
          mint: x!.mint,
        };
      });
    });

  return content.reduce(
    (acc, val) => acc!.concat(val!),
    []
  ) as ContentWithMetada[];
};
