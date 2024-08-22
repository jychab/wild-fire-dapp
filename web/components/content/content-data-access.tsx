import { SHORT_STALE_TIME } from '@/utils/consts';
import { deletePost } from '@/utils/firebase/functions';
import { generateAddressApiEndPoint } from '@/utils/helper/endpoints';
import { GetPostsResponse } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTransactionToast } from '../ui/ui-layout';

export function useRemoveContentMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const router = useRouter();

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

    onSuccess: async (signature) => {
      if (signature) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-posts-from-mint', { mint }],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-address', { address: wallet.publicKey }],
          }),
        ]);
        transactionToast(signature);
        router.push(`profile/?mintId=${mint?.toBase58()}`);
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
  return useQuery({
    queryKey: ['get-posts-from-address', { address }],
    queryFn: async () => {
      if (!address) return null;
      const result = await fetch(generateAddressApiEndPoint(address));
      const posts = (await result.json()) as GetPostsResponse | undefined;
      return posts;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
};
