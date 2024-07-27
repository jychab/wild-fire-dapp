import { sendLike } from '@/utils/firebase/functions';
import {
  checkIfTruncated,
  convertUTCTimeToDayMonth,
  formatLargeNumber,
} from '@/utils/helper/format';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconDiscountCheckFilled,
  IconDotsVertical,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconMoneybag,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, RefObject, useEffect, useRef, useState } from 'react';
import { Blinks, BlinksStaticContent, FormProps } from '../blinks/blinks-ui';
import { CommentsSection } from '../comments/comments-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import { useIsLiquidityPoolFound } from '../trading/trading-data-access';
import { checkUrlIsValid, PostContent } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface ContentGridProps {
  content: ContentWithMetadata[] | undefined;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
}
export interface AdditionalMetadata {
  id: string;
  name: string;
  symbol: string;
  image: string;
  mint: string;
  likesCount?: number;
  likesUser?: string[];
  commentsCount?: number;
  updatedAt?: number;
  price?: number;
  quantity?: number;
  verified?: boolean;
}

export type ContentWithMetadata = PostContentWithMetadata;

interface PostContentWithMetadata extends AdditionalMetadata, PostContent {}

export const ContentGrid: FC<ContentGridProps> = ({
  content,
  hideComment = false,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
}) => {
  return content ? (
    <div
      className={`grid grid-cols-1 sm:gap-2 ${
        multiGrid ? 'grid-cols-2 lg:grid-cols-5' : 'pb-32'
      }`}
    >
      {content.map((x) => (
        <DisplayContent
          key={x.id}
          content={x}
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
  content,
  showMintDetails = true,
  editable = false,
  multiGrid = false,
  expandAll = false,
  hideComment = false,
  hideCaption = false,
  hideCarousel = false,
  hideUserPanel = false,
}: {
  content: PostContentWithMetadata;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  expandAll?: boolean;
  hideComment?: boolean;
  hideCarousel?: boolean;
  hideCaption?: boolean;
  hideUserPanel?: boolean;
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
    if (!content) return;
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
    if (!content) return;
    const element = document.getElementById(`${content.id}/${index}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };
  return (
    <div className="flex flex-col sm:border bg-base-100 rounded w-full">
      {showMintDetails && <UserProfile content={content} />}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        {!hideCarousel && (
          <CarouselContent
            content={content}
            multiGrid={multiGrid}
            handleScroll={handleScroll}
            currentIndex={currentIndex}
            carouselRef={carouselRef}
          />
        )}
        <div
          className={`${
            !hideUserPanel || !hideCaption || !hideComment
              ? 'px-4 pb-4 pt-2'
              : ''
          } flex flex-col flex-1 w-full justify-between`}
        >
          <div className="flex flex-col">
            {!hideUserPanel && (
              <UserPanel
                additionalMetadata={content}
                multiGrid={multiGrid}
                editable={editable}
              />
            )}
            <PostCaption
              content={content}
              multiGrid={multiGrid}
              editable={editable}
              expandAll={expandAll}
            />
          </div>
          <div className="flex flex-col">
            {!hideComment && (
              <CommentsSection
                additionalMetadata={content}
                multiGrid={multiGrid}
              />
            )}
            <span className="text-xs stat-desc pt-2">
              {convertUTCTimeToDayMonth(content?.updatedAt || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DisplayContentProps {
  content: PostContentWithMetadata;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  expandAll?: boolean;
  hideComment?: boolean;
}

export const DisplayContent: FC<DisplayContentProps> = ({
  content,
  showMintDetails,
  editable,
  multiGrid,
  expandAll,
  hideComment,
}) => {
  const actionUrl = content.carousel.find((x) => x.fileType == 'blinks')?.uri;
  return actionUrl ? (
    checkUrlIsValid(actionUrl) ? (
      <Blinks
        actionUrl={new URL(actionUrl)}
        content={content}
        additionalMetadata={content}
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
      content={content}
      additionalMetadata={content}
      showMintDetails={showMintDetails}
      editable={editable}
      multiGrid={multiGrid}
      expandAll={expandAll}
      hideComment={hideComment}
    />
  );
};

export const UserProfile: FC<{
  content: AdditionalMetadata;
}> = ({ content }) => {
  return (
    <div className="flex w-full items-center justify-between px-4 py-2 ">
      <Link
        href={`/profile?mintId=${content.mint}`}
        className="link link-hover flex items-center gap-2 "
      >
        <div className="relative w-8 h-8 rounded-full">
          <Image
            src={content.image}
            priority={true}
            className={`object-cover rounded-full`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={'mint'}
          />
        </div>
        <div className="flex flex-col">
          <div className="text-sm flex gap-1 items-center">
            {content.name}
            {content.verified && (
              <IconDiscountCheckFilled size={18} className="fill-secondary" />
            )}
          </div>
          <div className="text-xs">{content.symbol}</div>
        </div>
      </Link>
      {content.price && (
        <Link
          className="flex flex-col gap-1 items-end"
          href={`/profile?mintId=${content.mint}&tab=trade`}
        >
          <span className="text-sm">${content.price.toPrecision(3)}</span>
        </Link>
      )}
    </div>
  );
};

export const PostCaption: FC<{
  content: PostContent;
  multiGrid: boolean;
  editable: boolean;
  expandAll: boolean;
}> = ({ content, multiGrid, expandAll }) => {
  const [showMore, setShowMore] = useState(expandAll);
  const captionRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  return (
    <>
      <div className="flex flex-col gap-1 items-start">
        <span
          ref={captionRef}
          className={`text-xs w-full break-all ${
            showMore
              ? 'whitespace-pre-wrap'
              : `${multiGrid ? 'line-clamp-1' : 'line-clamp-3'}`
          }`}
        >
          {content.caption}
        </span>
        {checkIfTruncated(captionRef.current) && (
          <button
            onClick={() => {
              if (!multiGrid) {
                setShowMore(true);
              } else {
                router.push(`/content?mintId=${content.mint}&id=${content.id}`);
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
  additionalMetadata: AdditionalMetadata | undefined;
  multiGrid: boolean;
  editable: boolean;
}> = ({ additionalMetadata, editable, multiGrid }) => {
  const { publicKey } = useWallet();
  const { data } = useGetMintToken({
    mint: additionalMetadata ? new PublicKey(additionalMetadata.mint) : null,
  });
  const [liked, setLiked] = useState(
    (publicKey &&
      additionalMetadata?.likesUser?.includes(publicKey?.toBase58())) ||
      false
  );
  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint: additionalMetadata ? new PublicKey(additionalMetadata.mint) : null,
  });
  const removeContentMutation = useRemoveContentMutation({
    mint:
      editable && additionalMetadata
        ? new PublicKey(additionalMetadata?.mint)
        : null,
  });
  return (
    <div className="flex justify-between pb-1">
      <div className="flex gap-2 text-sm items-center">
        <Link
          href={`/profile?mintId=${additionalMetadata?.mint}`}
          className="link link-hover font-semibold"
        >
          {additionalMetadata?.name}
        </Link>

        {!multiGrid && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (additionalMetadata && !liked) {
                  try {
                    sendLike(
                      additionalMetadata.mint,
                      additionalMetadata.id,
                      10
                    );
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

            {(liked || additionalMetadata?.likesUser) && (
              <span className="text-xs stat-desc link link-hover">{`Liked by ${
                liked
                  ? `you${
                      additionalMetadata?.likesUser &&
                      additionalMetadata.likesUser.length > 1
                        ? ' and ' +
                          formatLargeNumber(
                            additionalMetadata.likesUser.length
                          ) +
                          '  others'
                        : ''
                    }`
                  : additionalMetadata?.likesUser &&
                    additionalMetadata.likesUser.length > 0
                  ? formatLargeNumber(additionalMetadata?.likesUser?.length) +
                    ' others'
                  : ''
              } `}</span>
            )}
          </div>
        )}
      </div>

      {(editable || isLiquidityPoolFound) &&
        (!multiGrid ||
          (multiGrid &&
            data &&
            publicKey &&
            data.admin.toBase58() == publicKey.toBase58())) && (
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
              className="dropdown-content menu bg-base-100 border border-base-300 rounded z-[1] p-0 text-sm w-36"
            >
              {!editable && isLiquidityPoolFound && additionalMetadata && (
                <li>
                  <Link
                    href={`/profile?mintId=${additionalMetadata.mint}&tab=trade`}
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                  >
                    <IconMoneybag size={18} />
                    Trade
                  </Link>
                </li>
              )}
              {editable && additionalMetadata && (
                <li>
                  <Link
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                    href={`/content/edit?mintId=${additionalMetadata.mint}&id=${additionalMetadata.id}`}
                  >
                    <IconEdit size={18} />
                    Edit Post
                  </Link>
                </li>
              )}
              {editable && additionalMetadata && (
                <li>
                  <button
                    disabled={removeContentMutation.isPending}
                    onClick={() =>
                      removeContentMutation.mutateAsync(additionalMetadata.id)
                    }
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                  >
                    {removeContentMutation.isPending ? (
                      <div className="loading loading-spinner loading-sm" />
                    ) : (
                      <IconTrash size={18} />
                    )}
                    Delete Post
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
  content?: PostContent;
  multiGrid: boolean;
  handleScroll: (index: number) => void;
  currentIndex: number;
  carouselRef?: RefObject<HTMLDivElement>;
}> = ({
  content,
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
        {!content ? (
          <BlinksStaticContent form={form} image={blinkImageUrl} />
        ) : (
          content.carousel.map((file, index) => (
            <div
              id={`${content.id}/${index}`}
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
                  {index !== content.carousel.length - 1 ? (
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
      {content && content.carousel.length > 1 && (
        <div className="flex sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 transform gap-2 z-2 rounded">
          {content.carousel.map((y, index) => (
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
