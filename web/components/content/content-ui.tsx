import { sendLike } from '@/utils/firebase/functions';
import {
  checkIfTruncated,
  convertUTCTimeToDayMonth,
  formatLargeNumber,
} from '@/utils/helper/format';
import { PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconChartLine,
  IconDiscountCheckFilled,
  IconDotsVertical,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, RefObject, useEffect, useRef, useState } from 'react';
import { Blinks, BlinksStaticContent, FormProps } from '../blinks/blinks-ui';
import { CommentsSection } from '../comments/comments-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetToken,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import { useIsLiquidityPoolFound } from '../trading/trading-data-access';
import { checkUrlIsValid } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface ContentGridProps {
  posts: PostContent[] | undefined | null;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
}

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

export const PostCard = ({
  post,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
  expandAll = false,
  hideComment = false,
  hideCaption = false,
  hideCarousel = false,
  hideUserPanel = false,
  hideBorder = false,
}: {
  post: PostContent;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  expandAll?: boolean;
  hideComment?: boolean;
  hideCarousel?: boolean;
  hideCaption?: boolean;
  hideUserPanel?: boolean;
  hideBorder?: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Debounce function to optimize scroll event handling
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const handleScrollEvent = () => {
    if (!post) return;
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const itemWidth = carouselRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  // Debounced version of the scroll event handler
  const handleScrollEventDebounced = debounce(handleScrollEvent, 50);

  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('scroll', handleScrollEventDebounced);

      // Cleanup function
      return () => {
        carouselElement.removeEventListener(
          'scroll',
          handleScrollEventDebounced
        );
      };
    }
  }, [currentIndex]);
  const handleScroll = (index: number) => {
    if (!post) return;
    const element = document.getElementById(`${post.id}/${index}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };
  return (
    <div
      className={`flex border-base-300 flex-col ${
        !hideBorder ? `${multiGrid ? 'border' : 'sm:border'}` : ``
      } bg-base-100 rounded w-full`}
    >
      {showMintDetails && <UserProfile post={post} />}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        {!hideCarousel && (
          <CarouselContent
            post={post}
            multiGrid={multiGrid}
            handleScroll={handleScroll}
            currentIndex={currentIndex}
            carouselRef={carouselRef}
          />
        )}
        <div
          className={`${
            !hideUserPanel || !hideCaption || !hideComment
              ? `${multiGrid ? 'sm:px-4 px-2' : 'px-4'} pb-4 pt-2`
              : ''
          } flex flex-col flex-1 w-full justify-between`}
        >
          <div className="flex flex-col">
            {!hideUserPanel && (
              <UserPanel
                post={post}
                multiGrid={multiGrid}
                editable={editable}
              />
            )}
            <PostCaption
              post={post}
              multiGrid={multiGrid}
              editable={editable}
              expandAll={expandAll}
            />
          </div>
          <div className="flex flex-col">
            {!hideComment && (
              <CommentsSection post={post} multiGrid={multiGrid} />
            )}
            <span className="text-xs stat-desc pt-2">
              {convertUTCTimeToDayMonth(post?.updatedAt || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DisplayContentProps {
  post: PostContent;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  expandAll?: boolean;
  hideComment?: boolean;
}

export const DisplayContent: FC<DisplayContentProps> = ({
  post: post,
  showMintDetails,
  editable,
  multiGrid,
  expandAll,
  hideComment,
}) => {
  const actionUrl = post.carousel.find((x) => x.fileType == 'blinks')?.uri;
  return actionUrl ? (
    checkUrlIsValid(actionUrl) ? (
      <Blinks
        actionUrl={new URL(actionUrl)}
        post={post}
        showMintDetails={showMintDetails}
        editable={editable}
        multiGrid={multiGrid}
        expandAll={expandAll}
        hideComment={hideComment}
      />
    ) : (
      <></>
    )
  ) : (
    <Blinks
      post={post}
      showMintDetails={showMintDetails}
      editable={editable}
      multiGrid={multiGrid}
      expandAll={expandAll}
      hideComment={hideComment}
    />
  );
};

export const UserProfile: FC<{
  post: PostContent;
}> = ({ post }) => {
  const { data: metadata } = useGetTokenDetails({
    mint: new PublicKey(post.mint),
    withContent: false,
  });
  return (
    <div className="flex w-full items-center justify-between px-4 py-2 ">
      <Link
        href={`/profile?mintId=${post.mint}`}
        className="link link-hover flex items-center gap-2 "
      >
        <div className="relative w-8 h-8 rounded-full">
          {metadata?.content?.links?.image && (
            <Image
              src={metadata?.content?.links?.image}
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={'mint'}
            />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-sm flex gap-1 items-center">
            {metadata?.content?.metadata.name}
            {post.verified && (
              <IconDiscountCheckFilled size={18} className="fill-secondary" />
            )}
          </div>
          <div className="text-xs">{metadata?.content?.metadata.name}</div>
        </div>
      </Link>
    </div>
  );
};

export const PostCaption: FC<{
  post: PostContent;
  multiGrid: boolean;
  editable: boolean;
  expandAll: boolean;
}> = ({ post, multiGrid, expandAll }) => {
  const [showMore, setShowMore] = useState(expandAll);
  const captionRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col gap-1 items-start">
        <span
          ref={captionRef}
          className={`text-xs w-full ${
            showMore
              ? 'whitespace-pre-wrap'
              : `${multiGrid ? 'line-clamp-1' : 'line-clamp-3'}`
          }`}
        >
          {post.caption}
        </span>
        {checkIfTruncated(captionRef.current) && (
          <button
            onClick={() => {
              if (!multiGrid) {
                setShowMore(true);
              } else {
                router.push(`/post?mintId=${post.mint}&id=${post.id}`);
              }
            }}
            className="text-xs stat-desc link link-hover w-fit"
          >
            {!showMore && 'Show More'}
          </button>
        )}
      </div>
    </>
  );
};

export const UserPanel: FC<{
  post: PostContent | undefined;
  multiGrid: boolean;
  editable: boolean;
}> = ({ post, editable, multiGrid }) => {
  const { publicKey } = useWallet();
  const { data } = useGetMintToken({
    mint: post ? new PublicKey(post.mint) : null,
  });
  const [liked, setLiked] = useState(
    (publicKey && post?.likesUserTruncated?.includes(publicKey?.toBase58())) ||
      false
  );
  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint: post ? new PublicKey(post.mint) : null,
  });
  const removeContentMutation = useRemoveContentMutation({
    mint: editable && post ? new PublicKey(post?.mint) : null,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: post ? new PublicKey(post.mint) : null,
    withContent: false,
  });
  const closestUser =
    post?.likesUserTruncated && post?.likesUserTruncated?.length > 0
      ? post.likesUserTruncated[0]
      : undefined;
  const { data: closestUserMint } = useGetToken({
    address:
      closestUser && closestUser !== publicKey?.toBase58()
        ? new PublicKey(closestUser)
        : null,
  });
  const { data: closestUserMintMetadata } = useGetTokenDetails({
    mint:
      closestUserMint && closestUser !== publicKey?.toBase58()
        ? new PublicKey(closestUserMint.mint)
        : null,
    withContent: false,
  });

  return (
    <div className="flex justify-between pb-1">
      <div className="flex gap-2 text-sm items-center">
        <Link
          href={`/profile?mintId=${post?.mint}`}
          className="link link-hover font-semibold"
        >
          {metadata?.content?.metadata.name}
        </Link>

        {!multiGrid && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (post && !liked) {
                  try {
                    sendLike(post.mint, post.id, 10);
                  } catch (e) {
                    console.log(e);
                  } finally {
                    setLiked(true);
                  }
                }
              }}
              className=""
            >
              {liked ? (
                <IconHeartFilled size={20} className="fill-primary" />
              ) : (
                <IconHeart size={20} />
              )}
            </button>

            {(liked || post?.likesCount) && (
              <span className="text-xs stat-desc link link-hover">{`Liked by ${
                closestUserMintMetadata?.content?.metadata.name ||
                (closestUser == publicKey?.toBase58() || liked ? 'you' : '')
              }${
                (closestUser == publicKey?.toBase58() ||
                  closestUserMintMetadata?.content?.metadata.name) &&
                post?.likesCount != undefined &&
                post.likesCount > 1
                  ? ` and `
                  : ''
              }${
                post?.likesCount != undefined && post.likesCount > 1
                  ? formatLargeNumber(
                      post.likesCount - (closestUserMintMetadata ? 1 : 0)
                    ) + ' others'
                  : ''
              }`}</span>
            )}
          </div>
        )}
      </div>

      {(editable || isLiquidityPoolFound) &&
        (!multiGrid ||
          (multiGrid &&
            data &&
            publicKey &&
            data.admin == publicKey.toBase58())) && (
          <div className="dropdown dropdown-left">
            <div tabIndex={0} role="button">
              {removeContentMutation.isPending ? (
                <div className="loading loading-spinner loading-sm" />
              ) : (
                <IconDotsVertical size={18} />
              )}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 border border-base-300 rounded z-[1] p-0 text-sm w-28"
            >
              {!editable && isLiquidityPoolFound && post && (
                <li>
                  <Link
                    href={`/profile?mintId=${post.mint}&tab=trade`}
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                  >
                    <IconChartLine size={18} />
                    Trade
                  </Link>
                </li>
              )}
              {editable && post && (
                <li>
                  <Link
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                    href={`/post/edit?mintId=${post.mint}&id=${post.id}`}
                  >
                    <IconEdit size={18} />
                    Edit
                  </Link>
                </li>
              )}
              {editable && post && (
                <li>
                  <button
                    disabled={removeContentMutation.isPending}
                    onClick={() => removeContentMutation.mutateAsync(post.id)}
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                  >
                    {removeContentMutation.isPending ? (
                      <div className="loading loading-spinner loading-sm" />
                    ) : (
                      <IconTrash size={18} />
                    )}
                    Delete
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
    </div>
  );
};

export const CarouselContent: FC<{
  blinkImageUrl?: string;
  form?: FormProps;
  post?: PostContent;
  multiGrid: boolean;
  handleScroll: (index: number) => void;
  currentIndex: number;
  carouselRef?: RefObject<HTMLDivElement>;
}> = ({
  post,
  multiGrid,
  blinkImageUrl,
  form,
  handleScroll,
  currentIndex,
  carouselRef,
}) => {
  return (
    <div className="relative leading-[0]">
      <div
        ref={carouselRef}
        className="carousel w-full aspect-square h-auto bg-base-content"
      >
        {!post ? (
          <BlinksStaticContent form={form} image={blinkImageUrl} />
        ) : (
          post.carousel.map((file, index) => (
            <div
              id={`${post.id}/${index}`}
              key={file.uri}
              className="carousel-item relative aspect-square items-center h-auto flex w-full"
            >
              {file.fileType.startsWith('image/') && (
                <Image
                  className={`object-contain`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={file.uri}
                  alt={''}
                />
              )}
              {file.fileType.startsWith('video/') && (
                <video
                  width="300"
                  height="300"
                  className="w-full h-full rounded"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                >
                  <source src={file.uri} type={file.fileType} />
                  Your browser does not support the video tag.
                </video>
              )}
              {file.fileType == 'blinks' && (
                <BlinksStaticContent form={form} image={blinkImageUrl} />
              )}

              {!multiGrid && (
                <div className="hidden sm:flex absolute left-4 right-4 top-1/2 -translate-y-1/2 transform justify-between">
                  {index !== 0 ? (
                    <button
                      onClick={() => handleScroll(index - 1)}
                      className="btn btn-circle btn-sm"
                    >
                      ❮
                    </button>
                  ) : (
                    <div />
                  )}
                  {index !== post.carousel.length - 1 ? (
                    <button
                      onClick={() => handleScroll(index + 1)}
                      className="btn btn-circle btn-sm"
                    >
                      ❯
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {post && post.carousel.length > 1 && (
        <div className="flex sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 transform gap-2 z-2 rounded">
          {post.carousel.map((y, index) => (
            <div
              key={y.uri}
              className={`w-2 h-2 rounded-full ${
                index == currentIndex ? 'bg-base-300' : 'border border-base-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
