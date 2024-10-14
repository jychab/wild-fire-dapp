'use client';

import { PostBlinksDetail } from '@/utils/types/post';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { FC, useEffect, useRef, useState } from 'react';
import { Blinks } from '../blinks/blinks-feature';

interface ContentGridProps {
  posts: PostBlinksDetail[] | undefined | null;
  multiGrid?: boolean;
}
export const ContentGrid: FC<ContentGridProps> = ({
  posts,
  multiGrid = false,
}) => {
  return posts ? (
    <div className={`grid w-full h-full grid-cols-3 lg:grid-cols-5`}>
      {posts?.map((x) => (
        <Blinks key={x.id} blinksDetail={x} multiGrid={multiGrid} />
      ))}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full ">
      <div className="loading loading-dots" />
    </div>
  );
};

export const StackContentGrid: FC<ContentGridProps> = ({
  posts,
  multiGrid = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0); // Track horizontal touch start position
  const touchEndX = useRef(0); // Track horizontal touch end position
  const contentRef = useRef<HTMLDivElement>(null);
  // Helper function to handle swipes (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX; // Get initial touch X position
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX; // Track touch movement along X axis
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50; // Swipe distance threshold

    if (deltaX > swipeThreshold && posts && currentIndex < posts.length - 1) {
      // Swipe left (next post)
      setCurrentIndex((prev) => prev + 1); // Move to the next post
    } else if (deltaX < -swipeThreshold && currentIndex > 0) {
      // Swipe right (previous post)
      setCurrentIndex((prev) => prev - 1); // Move to the previous post
    }
  };
  // Navigation buttons click handlers
  const handlePrevPost = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNextPost = () => {
    if (posts && currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      handleNextPost();
    } else if (event.key === 'ArrowLeft') {
      handlePrevPost();
    }
  };

  // Attach and clean up the keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex]);

  return !!posts ? (
    <div
      className="relative flex flex-col gap-4 w-full p-4"
      onTouchStart={handleTouchStart} // For mobile swipe
      onTouchMove={handleTouchMove} // For mobile swipe
      onTouchEnd={handleTouchEnd} // For mobile swipe
    >
      <button
        className={`absolute -left-16 top-1/2 btn btn-primary rounded-full ${
          currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handlePrevPost}
        disabled={currentIndex === 0}
      >
        <IconChevronLeft size={24} />
      </button>
      {/* Right Navigation Button */}
      <button
        className={`absolute -right-16 top-1/2 btn btn-primary rounded-full ${
          currentIndex === posts.length - 1
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
        onClick={handleNextPost}
        disabled={currentIndex === posts.length - 1}
      >
        <IconChevronRight size={24} />
      </button>
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div
            key={post.id}
            className={`${index === currentIndex ? 'block' : 'hidden'}`}
          >
            <Blinks blinksDetail={post} multiGrid={multiGrid} />
          </div>
        ))
      ) : (
        <div className="rounded-box p-4 w-full h-96 items-center justify-center flex flex-col gap-4">
          <span>You've reached the end of your feed</span>
          <span>Refreshing in 15mins ...</span>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full">
      <div className="loading loading-dots" />
    </div>
  );
};
