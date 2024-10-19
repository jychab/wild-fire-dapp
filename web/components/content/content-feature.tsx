'use client';

import { PostBlinksDetail } from '@/utils/types/post';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FC, useEffect, useRef } from 'react';
import { Blinks } from '../blinks/blinks-feature';
interface ContentGridProps {
  posts: PostBlinksDetail[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
}
export const ContentGrid: FC<ContentGridProps> = ({
  posts,
  hasNextPage = false,
  isFetchingNextPage,
  fetchNextPage,
  isFetching,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? posts.length + 1 : posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 5,
    measureElement: (element) => {
      const height = (element as HTMLDivElement).offsetHeight;
      return height;
    },
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= posts.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    posts.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  useEffect(() => {
    if (parentRef.current && rowVirtualizer.scrollOffset != null) {
      parentRef.current.scrollTo({
        top: rowVirtualizer.scrollOffset,
        behavior: 'auto',
      });
    }
  }, [rowVirtualizer.scrollOffset, posts]);

  return (
    <div ref={parentRef} className="w-full overflow-y-scroll scrollbar-none">
      <div
        className="grid grid-cols-3 md:grid-cols-5 "
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index === posts.length;
          if (isLoaderRow) {
            return hasNextPage ? (
              <div
                key={virtualRow.key}
                className="flex items-center justify-center w-full py-4 col-span-3"
              >
                <span>Loading more...</span>
              </div>
            ) : (
              <div
                key={virtualRow.key}
                className="flex items-center justify-center w-full py-4 col-span-3"
              >
                <span>Nothing more to load</span>
              </div>
            );
          }
          const post = posts[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`w-full`}
            >
              <Blinks blinksDetail={post} multiGrid={true} />
            </div>
          );
        })}
      </div>
      {isFetching && !isFetchingNextPage ? (
        <div className="flex flex-col items-center justify-center w-full col-span-3 py-4">
          <span>Loading posts...</span>
          <div className="loading loading-dots" />
        </div>
      ) : null}
    </div>
  );
};
