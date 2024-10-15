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
