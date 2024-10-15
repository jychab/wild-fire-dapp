'use client';

import { Blinks } from '@/components/blinks/blinks-feature';
import { Categories, useCategory } from '@/components/ui/ui-provider';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<PostBlinksDetail[]>([]);
  const { category } = useCategory();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const currentRef = postRefs.current[currentIndex];
    if (!currentRef) return;
    let threshold = 50;
    const isAtBottom =
      currentRef.scrollHeight - currentRef.scrollTop <=
      currentRef.clientHeight + 1 + threshold;

    const isAtTop = currentRef.scrollTop <= threshold;
    const offsetY = info.offset.y;

    if (
      Math.abs(offsetY) > threshold &&
      ((offsetY < 0 && isAtBottom) || (offsetY > 0 && isAtTop))
    ) {
      // Swipe left or right
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex + (offsetY < 0 ? 1 : -1);
        return Math.min(Math.max(newIndex, 0), posts.length - 1);
      });
    } else {
      // Reset to current index if not swiped enough
      setCurrentIndex((prevIndex) => prevIndex);
    }
  };

  const y = useMotionValue(0);
  const opacity = useTransform(y, [-150, 0, 150], [0.5, 1, 0.5]);

  return (
    <div className="w-full flex flex-1 items-center justify-center">
      <div className="w-full sm:max-w-[650px] items-center justify-center flex relative ">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            ref={(el) => {
              postRefs.current[index] = el;
            }}
            className={`w-full max-w-lg h-[calc(100vh-8rem)] scrollbar-none overflow-scroll ${
              currentIndex === index ? 'block' : 'hidden'
            }`}
            onDragEnd={handleDragEnd} // Handle drag end event
            style={{
              y,
              opacity,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          >
            <Blinks blinksDetail={post} />
            <button
              disabled={currentIndex == 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="hidden sm:flex gap-4 absolute top-1/2 left-0 btn rounded-full btn-primary"
            >
              <IconChevronLeft />
            </button>
            <button
              disabled={currentIndex == posts.length - 1}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="hidden sm:flex gap-4 absolute top-1/2 right-0 btn rounded-full btn-primary"
            >
              <IconChevronRight />
            </button>
          </motion.div>
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
