'use client';

import {
  ContentGrid,
  StackContentGrid,
} from '@/components/content/content-feature';
import { AppHero } from '@/components/ui/ui-component';
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
    <div className="flex flex-col w-full items-center overflow-y-scroll scrollbar-none sm:p-4">
      <div className="items-center justify-center w-full flex flex-col gap-2">
        {category == Categories.FOR_YOU ? (
          <div className="max-w-lg w-full h-full">
            <StackContentGrid posts={posts} />
          </div>
        ) : (
          <div className="max-w-5xl w-full h-full">
            <AppHero title={category} subtitle={undefined} />
            <ContentGrid posts={posts} multiGrid={true} />
          </div>
        )}
      </div>
    </div>
  );
}
