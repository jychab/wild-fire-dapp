'use client';

import { validatePost } from '@/utils/firebase/functions';
import { PostBlinksDetail, PostContent } from '@/utils/types/post';
import { IconChartLine, IconHeartFilled, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction } from 'react';
import { DisplayContent } from './content-ui';

interface ContentCardFeatureProps {
  post: PostContent | undefined | null;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({ post }) => {
  return (
    <div className="flex flex-col w-full items-center sm:py-4 animate-fade animate-duration-400 sm:animate-none">
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

export const StackedContentGrid: FC<ContentGridProps> = ({
  posts,
  hideComment = false,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
  hideUserPanel = false,
}) => {
  return !!posts ? (
    <div className={`w-full stack`}>
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <div key={post.id} className={`${index == 0 ? '' : 'hidden'}`}>
            <DisplayContent
              blinksDetail={post}
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
        <div className="rounded-box p-4 w-full h-96 items-center justify-center flex flex-col  gap-4">
          <span>You've reached the end of your feed</span>
          <span>Refreshing in 15mins ...</span>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center w-full ">
      <div className="loading loading-dots" />
    </div>
  );
};

export const ValidateContent: FC<{
  posts: PostBlinksDetail[];
  setPosts: Dispatch<SetStateAction<PostBlinksDetail[] | undefined>>;
}> = ({ posts, setPosts }) => {
  const router = useRouter();
  return (
    <div className="flex w-full bg-base-100 justify-evenly p-2 items-center max-w-lg">
      <button
        onClick={() => {
          if (posts[0].memberMint) {
            validatePost(
              posts[0].memberMint,
              posts[0].mint,
              posts[0].id,
              false
            );
            setPosts((prev) => (prev ? prev.slice(1) : undefined));
          }
        }}
        className="btn btn-outline border-base-300 shadow-sm btn-warning rounded-full"
      >
        <IconX />
      </button>
      <button
        onClick={() => router.push(`token?mintId=${posts[0].mint}&tab=trade`)}
        className="btn btn-outline border-base-300 shadow-sm btn-success rounded-box text-base"
      >
        <IconChartLine />
        <span>Buy / Sell</span>
      </button>
      <button
        onClick={() => {
          if (posts[0].memberMint) {
            validatePost(posts[0].memberMint, posts[0].mint, posts[0].id, true);
            setPosts((prev) => (prev ? prev.slice(1) : undefined));
          }
        }}
        className="btn btn-outline border-base-300 shadow-sm btn-error rounded-full"
      >
        <IconHeartFilled />
      </button>
    </div>
  );
};
