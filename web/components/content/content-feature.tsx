'use client';

import { PostBlinksDetail } from '@/utils/types/post';
import { FC } from 'react';
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
  if (!posts) {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="loading loading-dots" />
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:gap-4 w-full max-w-lg h-full sm:p-4">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className={`scroll-post`}>
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
  );
};
