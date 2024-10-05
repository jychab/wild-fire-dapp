'use client';

import { ContentGrid } from '@/components/content/content-feature';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { GetPostsResponse } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

enum Categories {
  FOR_YOU = 'For You',
  MEMES = 'Memes',
  NFTS = 'NFTs',
  DEFI = 'Defi',
  GAMES = 'Games',
}

export default function Page() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<GetPostsResponse | undefined | null>();
  const [category, setCategory] = useState(Categories.FOR_YOU);

  useEffect(() => {
    switch (category) {
      case Categories.FOR_YOU:
        fetchPostByAddress(publicKey || new PublicKey(NATIVE_MINT)).then(
          (result) => {
            if (result) {
              setPosts(result);
            }
          }
        );
        break;
      default:
        fetchPostByCategories('post', category, 'tags').then((result) => {
          if (result) {
            setPosts({ posts: result });
          }
        });
        break;
    }
  }, [category, publicKey]);

  return (
    <div className="flex flex-col w-full absolute items-center justify-center">
      <ul className="hidden sm:flex menu gap-4 menu-horizontal p-4 ">
        {Object.values(Categories).map((x) => (
          <li key={x} onClick={() => setCategory(x)}>
            <a className={`${category == x ? 'active' : ''} rounded-full`}>
              {x}
            </a>
          </li>
        ))}
      </ul>
      <div className="max-w-lg w-full h-full sm:p-4 pb-16">
        <ContentGrid posts={posts} />
      </div>
    </div>
  );
}
