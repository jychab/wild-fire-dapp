import { SHORT_STALE_TIME } from '@/utils/consts';
import { deletePost } from '@/utils/firebase/functions';
import { proxify } from '@/utils/helper/proxy';
import { DAS } from '@/utils/types/das';
import { GetPostsResponse } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransactionToast } from '../ui/ui-layout';

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
              { endpoint: connection.rpcEndpoint, mint },
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

export const useGetPostsFromAddress = ({
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
      const posts = (await result.json()) as GetPostsResponse | undefined;
      return posts;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME, // 15 minutes
  });
};
