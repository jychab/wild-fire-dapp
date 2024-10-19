'use client';
import { Blinks } from '@/components/blinks/blinks-feature';
import { useGetPostsFromAddress } from '@/components/content/content-data-access';
import { useCategory } from '@/components/ui/ui-provider';
import { PostBlinksDetail } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const { category } = useCategory();
  const [draggedResult, setDraggedResult] = useState<boolean | undefined>();
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    useGetPostsFromAddress({ category, publicKey });
  const allRows = data ? data.pages.flatMap((d) => d.rows) : [];

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 600,
    overscan: 5,
    measureElement: (element) => {
      const height = (element as HTMLDivElement).offsetHeight;
      return height;
    },
  });

  useEffect(() => {
    if (parentRef.current && rowVirtualizer.scrollOffset != null) {
      parentRef.current.scrollTo({
        top: rowVirtualizer.scrollOffset,
        behavior: 'auto',
      });
    }
  }, [rowVirtualizer.scrollOffset, data]);

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.9, 1, 0.9]);
  const likeOpacity = useTransform(x, [0, 50], [0, 0.85]);
  const dislikeOpacity = useTransform(x, [-50, 0], [0.85, 0]);

  const Post = (index: number, post: PostBlinksDetail) => {
    return (
      <motion.div
        onPointerDown={() => setCurrentIndex(index)}
        key={post.id}
        className={`w-full max-w-lg sm:py-4`}
        dragSnapToOrigin
        style={{
          x: currentIndex == index ? x : undefined,
          opacity: currentIndex == index ? opacity : undefined,
        }}
        drag={'x'}
        dragConstraints={{ left: -200, right: 200 }}
        dragTransition={{
          bounceStiffness: 600,
          bounceDamping: 20,
        }}
      >
        <motion.div
          style={{
            x: currentIndex == index ? x : undefined,
            opacity: currentIndex == index ? likeOpacity : 0,
          }}
          className="absolute z-20 top-[250px] right-1/2 btn btn-outline btn-error font-bold text-3xl cursor-default"
        >
          <span>Like</span>
          <IconThumbUp className=" fill-error" />
        </motion.div>
        <motion.div
          style={{
            x: currentIndex == index ? x : undefined,
            opacity: currentIndex == index ? dislikeOpacity : 0,
          }}
          className="absolute z-20 top-[250px] left-1/2 btn btn-outline btn-error font-bold text-3xl cursour-default"
        >
          <span>Dislike</span>
          <IconThumbDown className=" fill-error" />
        </motion.div>
        <Blinks
          setDraggedResult={setDraggedResult}
          draggedResult={draggedResult}
          blinksDetail={post}
        />
      </motion.div>
    );
  };
  return (
    <div
      ref={parentRef}
      className="w-full h-[calc(100vh-8rem)] sm:h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-none"
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index === allRows.length;
          if (isLoaderRow) {
            return hasNextPage ? (
              <div
                key={virtualRow.key}
                className="flex items-center justify-center w-full py-4"
              >
                <span>Loading more...</span>
              </div>
            ) : (
              <div
                key={virtualRow.key}
                className="flex items-center justify-center w-full py-4"
              >
                <span>Nothing more to load</span>
              </div>
            );
          }
          const post = allRows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={
                virtualRow.index % 2
                  ? 'ListItemOdd w-full flex items-center justify-center'
                  : 'ListItemEven w-full flex items-center justify-center'
              }
            >
              {Post(virtualRow.index, post)}
            </div>
          );
        })}
      </div>
      {isFetching && !isFetchingNextPage ? (
        <div className="flex flex-col items-center justify-center w-full py-4">
          <span>Loading posts...</span>
          <div className="loading loading-dots" />
        </div>
      ) : null}
    </div>
  );
}
