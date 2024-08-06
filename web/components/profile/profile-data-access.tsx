'use client';

import { db } from '@/utils/firebase/firebase';
import { DAS } from '@/utils/types/das';
import { getAccount } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { program } from '../../utils/helper/transcationInstructions';

import { LONG_STALE_TIME, SHORT_STALE_TIME } from '@/utils/consts';
import { generateMintApiEndPoint, proxify } from '@/utils/helper/proxy';
import { GetPostsResponse } from '@/utils/types/post';
import { TokenState } from '@/utils/types/program';

export function useGetMintSummaryDetails({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-summary-details',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      if (!mint) return null;
      const result = await getDoc(
        doc(db, `Mint/${mint.toBase58()}/TokenInfo/Summary`)
      );
      if (result.exists()) {
        return result.data() as {
          currentHoldersCount: number;
          holdersChange24hPercent: number;
        };
      } else {
        return null;
      }
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGetToken({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      if (!address) return null;
      const result = await connection.getProgramAccounts(program.programId, {
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
      });
      if (result.length > 0) {
        const tokenState: TokenState = program.coder.accounts.decode(
          'tokenState',
          result[0].account.data
        );
        return tokenState;
      } else {
        const mintData = await getDocs(
          query(
            collection(db, `Mint`),
            where('admin', '==', address.toBase58()),
            limit(1)
          )
        );
        if (mintData.empty) {
          return null;
        } else {
          return {
            mint: mintData.docs[0].data().mint,
            admin: mintData.docs[0].data().admin,
            mutable: 0,
          } as TokenState;
        }
      }
    },

    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });
}

export function useGetLargestAccountFromMint({
  mint,
  tokenProgram,
}: {
  mint: PublicKey | null;
  tokenProgram: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-largest-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint, tokenProgram },
    ],
    queryFn: async () => {
      if (!mint || !tokenProgram) return null;
      const result = await connection.getTokenLargestAccounts(
        mint,
        'confirmed'
      );
      return Promise.all(
        result.value.map(async (x) => {
          const owner = (
            await getAccount(connection, x.address, undefined, tokenProgram)
          )?.owner;
          return {
            ...x,
            owner,
          };
        })
      );
    },
    staleTime: SHORT_STALE_TIME,
    enabled: !!mint && !!tokenProgram,
  });
}

export function useGetTokenDetails({ mint }: { mint: PublicKey | null }) {
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
      return data;
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGetPostsFromMint({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-posts-from-mint', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const uriMetadata = await (
        await fetch(proxify(generateMintApiEndPoint(mint)))
      ).json();
      let posts = uriMetadata as GetPostsResponse | undefined;
      return posts;
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}
