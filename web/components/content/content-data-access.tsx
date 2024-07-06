import { getTokenMetadata } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Content } from '../upload/upload.data-access';

export function useGetAllTokenAccountsFromOwner({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-all-token-accounts-from-address',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return;
      let allTokenAccounts = new Set<{
        address: string;
        mint: string;
        owner: string;
        amount: number;
        frozen: boolean;
        token_extensions: {
          transfer_fee_amount: {
            withheld_amount: number;
          };
        };
      }>();
      let cursor;

      while (true) {
        let params: {
          limit: number;
          owner: string;
          cursor?: any;
          options: any;
        } = {
          limit: 1000,
          owner: address.toBase58(),
          options: {
            showZeroBalance: false,
          },
        };

        if (cursor != undefined) {
          params.cursor = cursor;
        }

        const response = await fetch(connection.rpcEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '',
            method: 'getTokenAccounts',
            params: params,
          }),
        });
        const data = await response.json();

        if (!data.result || data.result.token_accounts.length === 0) {
          break;
        }

        data.result.token_accounts.forEach((account: any) => {
          allTokenAccounts.add(account);
        });
        cursor = data.result.cursor;
      }
      return Array.from(allTokenAccounts);
    },
    enabled: !!address,
    staleTime: 1000 * 5 * 60,
  });
}

export function useGetMultipleMintMetadata({ mints }: { mints: PublicKey[] }) {
  const { connection } = useConnection();
  const queries = mints.map((mint) => {
    return {
      queryKey: [
        'get-mint-metadata',
        { endpoint: connection.rpcEndpoint, mint },
      ],
      queryFn: () =>
        mint &&
        getTokenMetadata(connection, mint).then(async (details) => {
          if (!details) return null;
          const uriMetadata = await (await fetch(details.uri)).json();
          const imageUrl = uriMetadata.image;
          const description = uriMetadata.description;
          const content = uriMetadata.content;
          return {
            metaData: details,
            image: imageUrl as string,
            description: description as string | undefined,
            content: content as Content[] | undefined,
          };
        }),
    };
  });
  return useQueries({ queries });
}
