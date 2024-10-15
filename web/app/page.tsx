'use client';

import { StackContentGrid } from '@/components/content/content-feature';
import { Categories, useCategory } from '@/components/ui/ui-provider';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<PostBlinksDetail[]>();
  const { category } = useCategory();
  useEffect(() => {
    switch (category) {
      case Categories.FOR_YOU:
        fetchPostByAddress(publicKey || new PublicKey(NATIVE_MINT)).then(
          (result) => {
            if (result) {
              setPosts(result.posts);
            }
          }
        );
        break;
      default:
        fetchPostByCategories('post', category, 'tags').then((result) => {
          if (result) {
            setPosts(result);
          }
        });
        break;
    }
  }, [category, publicKey]);

  return (
    <div className="w-full flex flex-col justify-center items-center scroll-container scrollbar-none">
      <StackContentGrid posts={posts} />
    </div>
  );
}
