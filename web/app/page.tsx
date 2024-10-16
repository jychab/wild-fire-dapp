'use client';

import { Blinks } from '@/components/blinks/blinks-feature';
import { Categories, useCategory } from '@/components/ui/ui-provider';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
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

  return (
    <div className="w-full flex flex-1 items-center justify-center">
      <div
        ref={containerRef}
        className="w-full max-w-lg sm:p-4 overflow-y-scroll h-[calc(100vh-8rem)] scrollbar-none snap-mandatory snap-y"
      >
        {posts.map((post) => (
          <Blinks key={post.id} blinksDetail={post} />
        ))}
        {loading && (
          <div className="flex flex-col items-center justify-center w-full py-4">
            <span>Loading posts...</span>
            <div className="loading loading-dots" />
          </div>
        )}
      </div>
    </div>
  );
}
