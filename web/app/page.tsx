'use client';

import {
  ContentGrid,
  StackedContentGrid,
  ValidateContent,
} from '@/components/content/content-feature';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
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
  const [posts, setPosts] = useState<PostBlinksDetail[]>();
  const [category, setCategory] = useState(Categories.FOR_YOU);

  useEffect(() => {
    switch (category) {
      case Categories.FOR_YOU:
        fetchPostByAddress(publicKey || new PublicKey(NATIVE_MINT)).then(
          (result) => {
            if (result) {
              setPosts(result.posts || []);
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
    <div className="flex flex-col w-full items-center gap-4 py-4 sm:gap-8 overflow-y-scroll scrollbar-none">
      <ul className="hidden sm:flex menu gap-4 menu-horizontal">
        {Object.values(Categories).map((x) => (
          <li key={x} onClick={() => setCategory(x)}>
            <a className={`${category == x ? 'active' : ''} rounded-full`}>
              {x}
            </a>
          </li>
        ))}
      </ul>
      <div className="max-w-lg w-full px-4">
        {category === Categories.FOR_YOU ? (
          <StackedContentGrid posts={posts} />
        ) : (
          <ContentGrid posts={posts} />
        )}
      </div>
      {posts && posts.length > 0 && category === Categories.FOR_YOU && (
        <ValidateContent posts={posts} setPosts={setPosts} />
      )}
    </div>
  );
}
