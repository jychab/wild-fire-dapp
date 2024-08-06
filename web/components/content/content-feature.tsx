'use client';

import { GetPostsResponse } from '@/utils/types/post';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { useGetPost } from '../upload/upload.data-access';
import { DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  mintId: string;
  id: string;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({
  mintId,
  id,
}) => {
  const { data: post } = useGetPost({
    mint: new PublicKey(mintId),
    postId: id,
  });
  return (
    post && (
      <div className="flex flex-col w-full items-center sm:py-4">
        <div className="max-w-lg w-full">
          <DisplayContent
            expandAll={true}
            blinksDetail={post}
            showMintDetails={true}
          />
        </div>
      </div>
    )
  );
};

interface ContentGridProps {
  posts: GetPostsResponse | undefined | null;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
}
export const ContentGrid: FC<ContentGridProps> = ({
  posts,
  hideComment = false,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
}) => {
  return posts ? (
    <div
      className={`grid grid-cols-1 sm:gap-2 ${
        multiGrid ? 'grid-cols-2 lg:grid-cols-5' : 'pb-32'
      }`}
    >
      {posts.posts.map((x) => (
        <DisplayContent
          key={x.id}
          blinksDetail={x}
          hideComment={hideComment}
          showMintDetails={showMintDetails}
          editable={editable}
          multiGrid={multiGrid}
        />
      ))}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full ">
      <div className="loading loading-dots" />
    </div>
  );
};
