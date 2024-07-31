'use client';

import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { ContentGridProps, DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  mintId: string;
  id: string;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({
  mintId,
  id,
}) => {
  const { data: metadataQuery, isLoading } = useGetTokenDetails({
    mint: new PublicKey(mintId),
  });
  const postContent = metadataQuery?.additionalInfoData?.posts?.find(
    (x) => x.id == id
  );
  const post = postContent
    ? {
        ...postContent,
        metadata: { ...metadataQuery },
      }
    : undefined;
  return (
    <div className="flex flex-col w-full items-center sm:py-4">
      {isLoading && <div className="loading loading-dots" />}
      {!isLoading && !post && <span>No Post Found</span>}
      {post && (
        <div className="max-w-lg w-full">
          <DisplayContent expandAll={true} post={post} showMintDetails={true} />
        </div>
      )}
    </div>
  );
};
export const ContentGrid: FC<ContentGridProps> = ({
  posts: posts,
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
      {posts.map((x) => (
        <DisplayContent
          key={x.id}
          post={x}
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
