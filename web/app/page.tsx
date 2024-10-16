'use client';

import { Blinks } from '@/components/blinks/blinks-feature';
import { Categories, useCategory } from '@/components/ui/ui-provider';
import { fetchPostByAddress, fetchPostByCategories } from '@/utils/helper/post';
import { PostBlinksDetail } from '@/utils/types/post';
import { NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  motion,
  PanInfo,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<PostBlinksDetail[]>([]);
  const { category } = useCategory();
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draggedResult, setDraggedResult] = useState<boolean | undefined>();
  const [endOfPost, setEndOfPost] = useState(false);
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
      const result = await fetchPostByCategories('post', category, 'tags');
      if (result) {
        newPosts = result;
      }
    }
    setPosts(newPosts);
    setLoading(false);
  };

  useEffect(() => {
    loadMorePosts();
  }, [category, publicKey]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [posts]);

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 150;
    const offsetX = info.offset.x;
    if (Math.abs(offsetX) > threshold) {
      setDraggedResult(offsetX > 0);
      if (currentIndex + 1 > posts.length - 1) {
        setEndOfPost(true);
      }
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        return Math.min(Math.max(newIndex, 0), posts.length - 1);
      });
    }
  };

  const x = useMotionValue(0);
  const controls = useDragControls();
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8]);
  const rotate = useTransform(x, [-150, 150], [-30, 30]);

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center overflow-y-scroll scrollbar-none p-4 overflow-x-hidden h-[calc(100vh-8rem)] sm:h-[calc(100vh-4rem)]"
    >
      {endOfPost ? (
        <div className="flex flex-col items-center justify-center w-full py-4">
          <span>You've reached the end of your feed.</span>
          <span>Refreshing in 15mins...</span>
        </div>
      ) : (
        posts.map((post, index) => (
          <motion.div
            key={post.id}
            className={`max-w-lg w-full  ${
              currentIndex === index ? 'block' : 'hidden'
            }`}
            dragSnapToOrigin
            dragControls={controls}
            onDragEnd={handleDragEnd}
            style={{
              x,
              opacity,
              scale,
              rotate,
            }}
            drag={'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          >
            <Blinks
              setDraggedResult={setDraggedResult}
              draggedResult={draggedResult}
              blinksDetail={post}
            />
          </motion.div>
        ))
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center w-full py-4">
          <span>Loading posts...</span>
          <div className="loading loading-dots" />
        </div>
      )}
    </div>
  );
}
