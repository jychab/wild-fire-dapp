'use client';
import { Blinks } from '@/components/blinks/blinks-feature';
import { useGetPostsFromAddress } from '@/components/content/content-data-access';
import { useCategory } from '@/components/ui/ui-provider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const { category } = useCategory();
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
                  ? 'w-full flex items-center justify-center '
                  : 'w-full flex items-center justify-center '
              }
            >
              <div className="max-w-lg w-full sm:py-4">
                <Blinks blinksDetail={post} />
              </div>
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
