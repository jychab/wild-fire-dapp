'use client';

import { GetPostsResponse, PostContent } from '@/utils/types/post';
import { FC } from 'react';
import { DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  post: PostContent | undefined | null;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({ post }) => {
  return (
    <div className="flex flex-col w-full items-center sm:py-4">
      <div className="max-w-lg w-full">
        <DisplayContent
          expandAll={true}
          blinksDetail={post}
          showMintDetails={true}
          editable={true}
        />
      </div>
    </div>
  );
};

interface ContentGridProps {
  posts: GetPostsResponse | undefined | null;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
  hideUserPanel?: boolean;
}
export const ContentGrid: FC<ContentGridProps> = ({
  posts,
  hideComment = false,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
  hideUserPanel = false,
}) => {
  return posts ? (
    <div
      className={`grid grid-cols-1 sm:gap-2 ${
        multiGrid ? 'grid-cols-2 lg:grid-cols-5' : ''
      }`}
    >
      {posts.posts.map((x) => (
        <DisplayContent
          key={x.id}
          blinksDetail={x}
          hideUserPanel={hideUserPanel}
          hideComment={hideComment}
          showMintDetails={showMintDetails}
          editable={editable}
          multiGrid={multiGrid}
          expandAll={!multiGrid}
        />
      ))}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full ">
      <div className="loading loading-dots" />
    </div>
  );
};
