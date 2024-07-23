'use client';

import { db } from '@/utils/firebase/firebase';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
  getMint,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { program } from '../../utils/helper/transcationInstructions';
import { PostContent } from '../upload/upload.data-access';
import { AuthorityData } from './profile-ui';

export function useGetMintTransferFeeConfig({
  mint,
}: {
  mint: Mint | undefined | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-transfer-fee-config',
      { endpoint: connection.rpcEndpoint, mint: mint?.address },
    ],
    queryFn: () => mint && getTransferFeeConfig(mint),
    enabled: !!mint,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetMintDetails({
  mint,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  mint: PublicKey | null;
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
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetMintSummaryDetails({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-summary-details',
      { endpoint: connection.rpcEndpoint, mint: mint ? mint : null },
    ],
    queryFn: async () => {
      if (!mint) return;
      const result = await getDoc(
        doc(db, `Mint/${mint.toBase58()}/TokenInfo/Summary`)
      );
      return result.data() as {
        currentPriceInLamports: number;
        currentHoldersCount: number;
        holdersChange24hPercent: number;
        history24hPrice: number;
      };
    },
    enabled: !!mint,
    staleTime: 60 * 1000,
  });
}

export function useGetToken({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () =>
      address &&
      connection
        .getProgramAccounts(program.programId, {
          filters: [
            {
              dataSize: 123,
            },
            {
              memcmp: {
                offset: 8,
                bytes: address.toBase58(),
              },
            },
          ],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((acc) => {
              return program.coder.accounts.decode(
                'tokenState',
                acc.account.data
              ) as AuthorityData;
            });
          } else {
            return null;
          }
        }),
    enabled: !!address,
    staleTime: 15 * 60 * 1000,
  });
}

export function useGetLargestAccountFromMint({
  mint,
}: {
  mint: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-largest-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      if (!mint) return null;
      const result = await connection.getTokenLargestAccounts(
        mint,
        'confirmed'
      );
      return Promise.all(
        result.value.map(async (x) => {
          const owner = (
            await getAccount(
              connection,
              x.address,
              undefined,
              TOKEN_2022_PROGRAM_ID
            )
          )?.owner;
          return {
            ...x,
            owner,
          };
        })
      );
    },
    staleTime: 1000 * 60, //1mins
    enabled: !!mint,
  });
}

export function useGetTokenDetails({
  mint,
  withContent = true,
}: {
  mint: PublicKey | null;
  withContent?: boolean;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token-details', { endpoint: connection.rpcEndpoint, mint }],
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

      if (!data) {
        return null;
      }
      if (!withContent) {
        return data;
      }

      try {
        const hashFeedUri =
          data.mint_extensions?.metadata?.additional_metadata.find(
            (x) => x[0] == 'hashfeed'
          )?.[1];
        if (hashFeedUri) {
          const uriMetadata = await (await fetch(proxify(hashFeedUri))).json();
          let content = uriMetadata.content as PostContent[] | undefined;
          return {
            ...data,
            additionalInfoData: { content },
          } as DAS.GetAssetResponse;
        } else {
          return data;
        }
      } catch (e) {
        return data;
      }
    },
    enabled: !!mint,
    staleTime: 5 * 60 * 1000,
  });
}
