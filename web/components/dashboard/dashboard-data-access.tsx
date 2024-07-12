'use client';

import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { program } from '../../utils/helper/transcationInstructions';
import { UploadContent } from '../upload/upload.data-access';
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

export function useGetMintDetails({
  mint,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  mint: PublicKey | undefined;
  tokenProgram?: PublicKey;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-details',
      { endpoint: connection.rpcEndpoint, mint: mint ? mint : null },
    ],
    queryFn: () => mint && getMint(connection, mint, undefined, tokenProgram),
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
    enabled: !!address,
  });
}

export function useGetLargestAccountFromMint({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-largest-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      return connection.getTokenLargestAccounts(mint, 'confirmed');
    },
    staleTime: 1000 * 60 * 10, //10mins
  });
}

export function useGetTokenDetails({
  mint,
  skipCache = false,
}: {
  mint: PublicKey | null;
  skipCache?: boolean;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-token-details',
      { endpoint: connection.rpcEndpoint, mint, skipCache },
    ],
    queryFn: async () => {
      if (!mint) return null;
      const response = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '',
          method: 'getAsset',
          params: {
            id: mint.toBase58(),
          },
        }),
      });
      const data = (await response.json()).result as DAS.GetAssetResponse;
      try {
        const imageUrl = data.content?.links?.image;
        const description = data.content?.metadata.description;
        let content;
        const hashFeedUri =
          data.mint_extensions?.metadata?.additional_metadata.find(
            (x) => x[0] == 'hashfeed'
          )?.[1];
        if (hashFeedUri) {
          const uriMetadata = await (
            await fetch(proxify(hashFeedUri, skipCache))
          ).json();
          content = uriMetadata.content as UploadContent[] | undefined;
        }
        return {
          ...data,
          additionalInfoData: { imageUrl, description, content },
        } as DAS.GetAssetResponse;
      } catch (e) {
        return data;
      }
    },
    enabled: !!mint,
  });
}
