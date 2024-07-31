import { SHORT_STALE_TIME } from '@/utils/consts';
import { deletePost } from '@/utils/firebase/functions';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import { PostContent } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransactionToast } from '../ui/ui-layout';

export async function getAssetBatch({
  ids,
  connection,
}: {
  ids: string[];
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
      method: 'getAssetBatch',
      params: {
        ids: ids,
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse[];
  return data;
}

export async function getAsset({
  mint,
  connection,
}: {
  mint: PublicKey;
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
      method: 'getAsset',
      params: {
        id: mint.toBase58(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponse;
  return data;
}

export async function getTokenBalancesFromOwner({
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
      method: 'getTokenAccounts',
      id: '',
      params: {
        page: 1,
        limit: 100,
        displayOptions: {
          showZeroBalance: false,
        },
        owner: address.toBase58(),
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetTokenAccountsResponse;

  return data;
}

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const wallet = useWallet();
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
              { endpoint: connection.rpcEndpoint, mint, withContent: true },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-posts-from-address',
              { endpoint: connection.rpcEndpoint, address: wallet.publicKey },
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

export const getPostsFromAddress = ({
  address,
}: {
  address: PublicKey | null;
}) => {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-posts-from-address',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      const result = await fetch(
        proxify(
          `https://api.hashfeed.social/getPosts?address=${address.toBase58()}`
        )
      );
      const posts = (await result.json()).posts as PostContent[];
      return posts;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME, // 15 minutes
  });
};
