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
    mutationFn: async (input: any) => {
      if (!wallet.publicKey || !mint) return;
      try {
        await createOrEditPost(mint.toBase58(), input);
        return input;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}`);
        return;
      }
    },
    onSuccess: (input) => {
      if (input) {
        transactionToast('Success');
        router.push(`/profile?mintId=${mint?.toBase58()}`);
        return Promise.all([
          client.invalidateQueries({
            queryKey: ['get-post', { mint, postId: input.id }],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-mint', { mint }],
          }),
          client.invalidateQueries({
            queryKey: ['get-posts-from-address', { address: wallet.publicKey }],
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
