'use client';

import { SHORT_STALE_TIME } from '@/utils/consts';
import { createOrEditPost } from '@/utils/firebase/functions';
import { generatePostApiEndPoint, proxify } from '@/utils/helper/proxy';
import { PostContent } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

interface UploadArgs {
  post: any;
}

export function useUploadMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'upload-mint-post',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: UploadArgs) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;

      try {
        await createOrEditPost(mint.toBase58(), input.post);
        return 'Success';
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}`);
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        router.push(`/profile?mintId=${mint?.toBase58()}`);
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

export function checkUrlIsValid(uri: string) {
  try {
    const result = new URL(uri);
    return result;
  } catch (e) {
    return;
  }
}

export function useGetPost({
  mint,
  postId,
}: {
  mint: PublicKey | null;
  postId: string | undefined;
}) {
  return useQuery({
    queryKey: ['get-post', { mint, postId }],
    queryFn: async () => {
      if (!mint || !postId) return null;
      const response = await (
        await fetch(proxify(generatePostApiEndPoint(mint.toBase58(), postId)))
      ).json();
      let post = response as PostContent | undefined;
      return post;
    },
    enabled: !!mint && !!postId,
    staleTime: SHORT_STALE_TIME,
  });
}
