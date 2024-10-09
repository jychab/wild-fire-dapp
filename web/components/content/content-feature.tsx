'use client';

import { PostBlinksDetail, PostContent } from '@/utils/types/post';
import { FC, useEffect, useState } from 'react';
import { DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  post: PostContent | undefined | null;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({ post }) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640); // Tailwind's `sm` breakpoint is 640px
    };

    checkScreenSize(); // Check initially
    window.addEventListener('resize', checkScreenSize); // Update on resize

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="flex flex-col w-full items-center sm:py-4 animate-fade animate-duration-400 sm:animate-none">
      <div className="max-w-lg w-full">
        <DisplayContent
          expandAll={true}
          hideBorder={isSmallScreen}
          blinksDetail={post}
          showMintDetails={true}
          editable={true}
        />
      </div>
    </div>
  );
};

interface ContentGridProps {
  posts: PostBlinksDetail[] | undefined | null;
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
      {posts?.map((x) => (
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

export const ScrollContentGrid: FC<ContentGridProps> = ({
  posts,
  hideComment = false,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
  hideUserPanel = false,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640); // Tailwind's `sm` breakpoint is 640px
    };

    checkScreenSize(); // Check initially
    window.addEventListener('resize', checkScreenSize); // Update on resize

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return !!posts ? (
    <div className="carousel carousel-vertical p-0 w-full">
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div key={post.id} className={`carousel-item`}>
            <DisplayContent
              blinksDetail={post}
              hideBorder={isSmallScreen}
              hideUserPanel={hideUserPanel}
              hideComment={hideComment}
              showMintDetails={showMintDetails}
              editable={editable}
              multiGrid={multiGrid}
              expandAll={!multiGrid}
            />
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
