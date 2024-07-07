'use client';

import { DAS } from '@/utils/types/das';
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTokenMetadata,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { program } from '../../utils/helper/transcationInstructions';
import { Content } from '../upload/upload.data-access';
import { AuthorityData } from './dashboard-ui';

export function useGetMintTransferFeeConfig({
  mint,
}: {
  mint: Mint | undefined;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-transfer-fee-config',
      { endpoint: connection.rpcEndpoint, mint: mint?.address },
    ],
    queryFn: () => mint && getTransferFeeConfig(mint),
    enabled: !!mint,
  });
}

export function useGetMintDetails({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-details',
      { endpoint: connection.rpcEndpoint, mint: mint ? mint : null },
    ],
    queryFn: () =>
      mint && getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID),
    enabled: !!mint,
  });
}

export function useGetMintMetadata({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-mint-metadata', { endpoint: connection.rpcEndpoint, mint }],
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
    enabled: !!mint,
  });
}

export function useGetToken({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () =>
      address &&
      connection
        .getProgramAccounts(program(connection).programId, {
          filters: [
            {
              dataSize: 120,
            },
            {
              memcmp: {
                offset: 88,
                bytes: address.toBase58(),
              },
            },
          ],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((acc) => {
              return program(connection).coder.accounts.decode(
                'authority',
                acc.account.data
              ) as AuthorityData;
            });
          } else {
            return null;
          }
        }),
  });
}

export function useGetAllTokenAccountsFromMint({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-all-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      let allTokenAccounts = new Set<DAS.TokenAccounts>();
      let cursor;

      while (true) {
        let params: {
          limit: number;
          mint: string;
          cursor?: any;
          options: any;
        } = {
          limit: 1000,
          mint: mint.toBase58(),
          options: {
            showZeroBalance: true,
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
        const data = (await response.json())
          .result as DAS.GetTokenAccountsResponse;

        if (!data || !data.token_accounts || data.token_accounts.length == 0) {
          break;
        }

        data.token_accounts.forEach((account) => {
          allTokenAccounts.add(account);
        });
        cursor = data.cursor;
      }
      return Array.from(allTokenAccounts);
    },
    staleTime: 1000 * 5 * 60,
  });
}
