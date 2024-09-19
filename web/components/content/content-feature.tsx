'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { GetPostsResponse, PostContent } from '@/utils/types/post';
import { FC, useEffect, useRef } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { Profile } from '../profile/profile-ui';
import { DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  post: PostContent | undefined | null;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({ post }) => {
  const { publicKey } = useWallet();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post && contentRef.current) {
      const scrollToContent = () => {
        window.scrollTo({
          top: contentRef.current!.offsetTop,
          behavior: 'smooth',
        });
      };
    }
  }, [post]); // Add post as a dependency to wait for the data

  return (
    <div className="flex flex-col w-full items-center sm:py-4">
      {publicKey && (
        <div className="block sm:hidden">
          <Profile mintId={getDerivedMint(publicKey).toBase58()} />
        </div>
      )}
      <div ref={contentRef} className="max-w-lg w-full">
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
      {posts.posts?.map((x) => (
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
