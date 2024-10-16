'use client';

import { SignInBtn } from '@/components/authentication/authentication-ui';
import { Blinks } from '@/components/blinks/blinks-feature';
import { ClaimButton } from '@/components/claim/claim-feature';
import { Categories, useCategory } from '@/components/ui/ui-provider';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true); // Indicate that the component has mounted
  }, []);
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<PostBlinksDetail[]>([]);
  const { category } = useCategory();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadMorePosts = async () => {
    if (loading) return; // Prevent multiple fetches
    setLoading(true);

    let newPosts: PostBlinksDetail[] = [];
    if (category === Categories.FOR_YOU) {
      const result = await fetchPostByAddress(
        publicKey || new PublicKey(NATIVE_MINT)
      );
      if (result) {
        newPosts = result.posts || [];
      }
    } else {
      const result = await fetchPostByCategories(
        'post',
        category,
        'tags',
        page
      );
      if (result) {
        newPosts = result;
      }
    }

    if (newPosts.length > 0) {
      setPosts((prevPosts) => [
        ...prevPosts,
        ...newPosts.filter((y) => !prevPosts.find((x) => x.id === y.id)),
      ]);
      setPage((prevPage) => prevPage + 1);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Reset posts and page when category or publicKey changes
    setPosts([]);
    setPage(1);
    loadMorePosts();
  }, [category, publicKey]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [posts]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center sm:p-4 overflow-y-scroll h-screen scrollbar-none snap-proximity snap-y"
    >
      <div className="flex w-full p-4 items-center gap-4 border-b bg-base-100 border-base-300">
        <Link
          className="sm:px-4 flex items-start justify-start gap-2 w-64"
          href="/"
        >
          <span className="sm:hidden font-luckiestguy text-xl leading-[0.75]">
            BlinksFeed
          </span>
        </Link>
        <div className="w-64 gap-4 flex items-center justify-end">
          {publicKey && <ClaimButton />}
          <SignInBtn />
        </div>
      </div>
      {posts.map((post) => (
        <div key={post.id} className="max-w-lg snap-start w-full">
          <Blinks blinksDetail={post} />
        </div>
      ))}
      {loading && (
        <div className="flex flex-col items-center justify-center w-full py-4">
          <span>Loading posts...</span>
          <div className="loading loading-dots" />
        </div>
      )}
    </div>
  );
}
