'use client';

import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { generateMintApiEndPoint, proxify } from '@/utils/helper/endpoints';
import { DAS } from '@/utils/types/das';
import { GetPostsResponse } from '@/utils/types/post';
import { getMultipleAccounts } from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';

export function useGetMintSummaryDetails({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-mint-summary-details', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const result = await getDoc(
        doc(db, `Mint/${mint.toBase58()}/TokenInfo/Summary`)
      );
      if (result.exists()) {
        return result.data() as {
          currentHoldersCount?: number;
          holdersChange24hPercent?: number;
          currentPrice?: number;
          priceChange24hPercent?: number;
        };
      } else {
        return null;
      }
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
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
      const accounts = await getMultipleAccounts(
        connection,
        result.value.map((x) => x.address),
        undefined,
        tokenProgram
      );
      return accounts;
    },
    staleTime: SHORT_STALE_TIME,
    enabled: !!mint && !!tokenProgram,
  });
}

export function useGetTokenDetails({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-token-details', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const docData = await getDoc(doc(db, `Mint/${mint.toBase58()}`));
      if (docData.exists()) {
        const parsedData = JSON.parse(
          docData.data().das
        ) as DAS.GetAssetResponse;
        if (
          parsedData.content?.links &&
          !parsedData.content.links.image &&
          parsedData.content?.json_uri
        ) {
          parsedData.content.links.image = (
            await (await fetch(parsedData.content?.json_uri)).json()
          ).image as string;
        }
        return parsedData;
      } else {
        const docData = await getDoc(
          doc(db, `Mint/${mint.toBase58()}/Temporary/Profile`)
        );
        if (docData.exists()) {
          return { ...docData.data(), temporary: true } as DAS.GetAssetResponse;
        }
      }
      return null;
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

export function useGetTokenAccountFromAddress({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token-accounts-from-address', { address }],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getTokenAccounts',
          id: '',
          params: {
            page: 1,
            limit: 1000,
            displayOptions: {
              showZeroBalance: true,
            },
            owner: address.toBase58(),
          },
        }),
      });
      const data = (await response.json())
        .result as DAS.GetTokenAccountsResponse;
      return data || null;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
}
