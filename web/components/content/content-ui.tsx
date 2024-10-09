'use client';

import { ActionSupportability } from '@/utils/actions/actions-supportability';
import { DisclaimerType } from '@/utils/enums/blinks';
import { validatePost } from '@/utils/firebase/functions';
import { proxify, useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import { isAuthorized } from '@/utils/helper/mint';
import { Disclaimer } from '@/utils/types/blinks';
import { Carousel, PostBlinksDetail, PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconAlertTriangleFilled,
  IconChartLine,
  IconDotsVertical,
  IconEdit,
  IconExclamationCircle,
  IconEye,
  IconHeart,
  IconShieldCheckFilled,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { BaseInputProps } from '../../utils/types/input';
import { Blinks } from '../blinks/blinks-feature';
import {
  ActionContent,
  DisclaimerBlock,
  FormProps,
  NotSupportedBlock,
} from '../blinks/blinks-layout';
import { BaseButtonProps } from '../blinks/ui/action-button';
import { useGetMintToken } from '../edit/edit-data-access';
import { ShareContent } from '../share/share-content';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../token/token-data-access';
import {
  checkUrlIsValid,
  useGetPostCampaign,
} from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface DisplayContentProps {
  blinksDetail: PostBlinksDetail | null | undefined;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  expandAll?: boolean;
  hideComment?: boolean;
  hideBorder?: boolean;
  hideCaption?: boolean;
  hideCarousel?: boolean;
  hideUserPanel?: boolean;
}

export const DisplayContent: FC<DisplayContentProps> = ({
  blinksDetail,
  showMintDetails,
  editable,
  multiGrid,
  expandAll,
  hideComment,
  hideBorder,
  hideCaption,
  hideCarousel,
  hideUserPanel,
}) => {
  return blinksDetail && checkUrlIsValid(blinksDetail.url) ? (
    <Blinks
      actionUrl={new URL(blinksDetail.url)}
      blinksDetail={blinksDetail}
      showMintDetails={showMintDetails}
      editable={editable}
      multiGrid={multiGrid}
      expandAll={expandAll}
      hideComment={hideComment}
      hideBorder={hideBorder}
      hideCaption={hideCaption}
      hideCarousel={hideCarousel}
      hideUserPanel={hideUserPanel}
    />
  ) : (
    <></>
  );
};

export const UserProfile: FC<{
  blinksDetail: PostBlinksDetail;
}> = ({ blinksDetail }) => {
  const { data: metadata } = useGetTokenDetails({
    mint: new PublicKey(blinksDetail.mint),
  });
  const { data: summaryDetails } = useGetMintSummaryDetails({
    mint: new PublicKey(blinksDetail.mint),
  });
  const router = useRouter();
  return (
    <div className="flex w-full items-center justify-between p-2">
      <Link
        href={`/token?mintId=${blinksDetail.mint}`}
        className="link link-hover flex items-center gap-2 "
      >
        <div className="relative w-8 h-8 mask mask-circle">
          {metadata?.content?.links?.image && (
            <Image
              src={proxify(metadata?.content?.links?.image, true)}
              className={`object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={'mint'}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm">{metadata?.content?.metadata.name}</span>
          {summaryDetails?.priceChange24hPercent !== undefined &&
            summaryDetails?.priceChange24hPercent !== 0 && (
              <span
                className={`text-xs ${
                  summaryDetails?.priceChange24hPercent > 0
                    ? 'text-success'
                    : 'text-error'
                }`}
              >{`${formatLargeNumber(
                summaryDetails?.priceChange24hPercent
              )}%`}</span>
            )}
        </div>
      </Link>
      <button
        onClick={() =>
          router.push(`/token?mintId=${blinksDetail.mint}&tab=trade`)
        }
        className="flex btn btn-sm btn-success items-center gap-2"
      >
        <IconChartLine />
        Buy / Sell
      </button>
    </div>
  );
};

export const UserPanel: FC<{
  blinksDetail?: PostBlinksDetail;
  editable: boolean;
  websiteUrl: string | null | undefined;
  websiteText: string | null | undefined;
  type: string;
}> = ({ blinksDetail, editable, websiteText, websiteUrl, type }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {websiteUrl && (
          <Link
            href={useRelativePathIfPossbile(websiteUrl)}
            className="link link-hover max-w-xs stat-desc text-sm truncate"
          >
            {websiteText ?? websiteUrl}
          </Link>
        )}
        <Link
          href="https://docs.dialect.to/documentation/actions/security"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
        >
          {type === 'malicious' && <IconAlertTriangleFilled size={20} />}
          {type === 'trusted' && <IconShieldCheckFilled size={20} />}
          {type === 'unknown' && <IconExclamationCircle size={20} />}
        </Link>
      </div>

      {blinksDetail && <Menu blinksDetail={blinksDetail} editable={editable} />}
    </div>
  );
};

const Menu: FC<{ blinksDetail: PostBlinksDetail; editable: boolean }> = ({
  blinksDetail,
  editable,
}) => {
  const { publicKey } = useWallet();
  const { data: tokenState } = useGetMintToken({
    mint: blinksDetail ? new PublicKey(blinksDetail.mint) : null,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: blinksDetail ? new PublicKey(blinksDetail.mint) : null,
  });
  const { data: postCampaign } = useGetPostCampaign({
    address: publicKey,
    postId: blinksDetail?.id || null,
  });
  const removeContentMutation = useRemoveContentMutation({
    mint:
      editable && blinksDetail?.mint ? new PublicKey(blinksDetail.mint) : null,
    postId: blinksDetail?.id || null,
  });

  const [liked, setLiked] = useState(blinksDetail.liked);
  const viewCount = blinksDetail.viewsCount || undefined;
  const likeCount = blinksDetail.likesCount || undefined;
  const shareCount = blinksDetail.sharesCount || undefined;
  return (
    <div className="flex items-start gap-4">
      {viewCount && (
        <div className="flex flex-col items-center">
          <IconEye />
          <span className="text-xs">{formatLargeNumber(viewCount)}</span>
        </div>
      )}
      <button
        className="flex flex-col items-center"
        onClick={() => {
          if (liked) {
            setLiked(false);
            blinksDetail.memberMint &&
              validatePost(
                blinksDetail.memberMint,
                blinksDetail.mint,
                blinksDetail.id,
                'Dislikes'
              );
          } else {
            setLiked(true);
            blinksDetail.memberMint &&
              validatePost(
                blinksDetail.memberMint,
                blinksDetail.mint,
                blinksDetail.id,
                'Likes'
              );
          }
        }}
      >
        <IconHeart
          className={`${liked ? 'animate-jump fill-primary' : 'fill-none'}`}
        />
        <span className="text-xs">
          {(!!likeCount || liked) && (
            <span className="text-xs">{formatLargeNumber(likeCount || 1)}</span>
          )}
        </span>
      </button>
      <div
        className="flex flex-col items-center"
        onClick={() => {
          blinksDetail.memberMint &&
            validatePost(
              blinksDetail.memberMint,
              blinksDetail.mint,
              blinksDetail.id,
              'Shares'
            );
        }}
      >
        <ShareContent mint={blinksDetail.mint} id={blinksDetail.id} />
        {shareCount && (
          <span className="text-xs">{formatLargeNumber(shareCount)}</span>
        )}
      </div>
      {!(
        !editable ||
        !publicKey ||
        !(
          blinksDetail.creator == publicKey?.toBase58() ||
          isAuthorized(tokenState, publicKey, metadata)
        )
      ) && (
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
            className="dropdown-content menu bg-base-100 border border-base-300 rounded z-10 p-0 text-sm w-28"
          >
            {editable &&
              publicKey &&
              blinksDetail.creator == publicKey?.toBase58() && (
                <li>
                  <Link
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                    href={`/post/edit?mint=${blinksDetail.mint}&id=${blinksDetail.id}`}
                  >
                    <IconEdit size={18} />
                    Edit
                  </Link>
                </li>
              )}
            {editable &&
              publicKey &&
              (blinksDetail.creator == publicKey?.toBase58() ||
                isAuthorized(tokenState, publicKey, metadata)) && (
                <li>
                  <button
                    disabled={removeContentMutation.isPending}
                    onClick={() =>
                      removeContentMutation.mutateAsync(postCampaign)
                    }
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
  post?: Partial<PostContent>;
  blinksDetail: PostBlinksDetail | undefined;
  multiGrid: boolean;
}> = ({ post, multiGrid, blinkImageUrl, form, blinksDetail }) => {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const handleClick = useCallback(() => {
    if (multiGrid && blinksDetail) {
      const url = new URL(blinksDetail.url);
      router.push(url.pathname + url.search);
    }
  }, [multiGrid, blinksDetail, router]);

  // Debounce function to optimize scroll event handling
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const handleScrollEvent = () => {
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

  if (
    !post?.carousel ||
    post.carousel.length === 0 ||
    (multiGrid &&
      post.carousel.length == 1 &&
      post.carousel[0].fileType.startsWith('video/'))
  ) {
    return (
      <div
        onClick={handleClick}
        className={`carousel ${
          multiGrid && blinksDetail ? 'cursor-pointer' : ''
        } w-full aspect-square h-auto bg-black`}
      >
        <BlinksStaticContent form={form} image={blinkImageUrl || post?.icon} />
      </div>
    );
  }

  return (
    <div className="relative leading-[0]">
      <div
        ref={carouselRef}
        onClick={handleClick}
        className={`carousel ${
          multiGrid && blinksDetail ? 'cursor-pointer' : ''
        } w-full aspect-square h-auto bg-black`}
      >
        {post.carousel.map((file, index) => (
          <CarouselItem
            key={file.uri}
            file={file}
            index={index}
            postId={post.id!}
            handleScroll={handleScroll}
            showControls={
              !multiGrid && !!post.carousel && post.carousel.length > 1
            }
            postLength={post.carousel?.length || 0}
          />
        ))}
      </div>
      {post.carousel.length > 1 && (
        <CarouselIndicators items={post.carousel} currentIndex={currentIndex} />
      )}
    </div>
  );
};

const CarouselItem: FC<{
  file: Carousel;
  index: number;
  postId: string;
  handleScroll: (index: number) => void;
  showControls: boolean;
  postLength: number;
}> = ({ file, index, postId, handleScroll, showControls, postLength }) => (
  <div
    id={`${postId}/${index}`}
    className="carousel-item relative aspect-square items-center h-auto flex w-full"
  >
    {file.fileType.startsWith('image/') && (
      <Image
        className="object-contain"
        fill={true}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        src={file.uri}
        alt=""
      />
    )}
    {file.fileType.startsWith('video/') && (
      <video
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
    {showControls && (
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
        {index !== postLength - 1 ? (
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
);

const CarouselIndicators: FC<{
  items: Carousel[];
  currentIndex: number;
}> = ({ items, currentIndex }) => (
  <div className="flex sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 transform gap-2 z-2 rounded">
    {items.map((_, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full ${
          index === currentIndex ? 'bg-base-300' : 'border border-base-300'
        }`}
      />
    ))}
  </div>
);

export const ContentCaption: FC<{
  title: string | undefined;
  description: string | undefined;
  disclaimer: Disclaimer | undefined;
  form: FormProps | undefined;
  buttons: BaseButtonProps[] | undefined;
  inputs: BaseInputProps[] | undefined;
  success: string | null | undefined;
  error: string | null | undefined;
  multiGrid: boolean;
  expandAll: boolean;
  blinksDetail: PostBlinksDetail | undefined;
  supportability: ActionSupportability;
}> = ({
  expandAll,
  error,
  success,
  title,
  description,
  form,
  inputs,
  buttons,
  multiGrid,
  disclaimer,
  blinksDetail,
  supportability,
}) => {
  const [showMore, setShowMore] = useState(expandAll);
  const router = useRouter();
  return (
    <div>
      {showMore ? (
        <div className="flex flex-col">
          <p className="text-md font-semibold whitespace-pre-wrap pt-2 ">
            {title}
          </p>
          <p className="text-sm whitespace-pre-wrap pb-2 ">{description}</p>
          {!supportability.isSupported ? (
            <NotSupportedBlock message={supportability.message} />
          ) : (
            <>
              {disclaimer && title && (
                <DisclaimerBlock
                  className="mb-4"
                  type={disclaimer.type}
                  ignorable={disclaimer.ignorable}
                  hidden={
                    disclaimer.type === DisclaimerType.BLOCKED
                      ? disclaimer.hidden
                      : false
                  }
                  onSkip={
                    disclaimer.type === DisclaimerType.BLOCKED
                      ? disclaimer.onSkip
                      : undefined
                  }
                />
              )}
              <ActionContent form={form} inputs={inputs} buttons={buttons} />
              {success && (
                <span className="mt-2 flex justify-center text-sm text-success">
                  {success}
                </span>
              )}
              {error && !success && (
                <span className="mt-2 flex justify-center text-sm text-error">
                  {error}
                </span>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-1">
          {multiGrid && (
            <p className="text-sm font-semibold whitespace-pre-wrap">{title}</p>
          )}
          {description && (
            <p
              className={`w-full ${
                multiGrid ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-sm'
              }`}
            >
              {description}
            </p>
          )}
          <button
            onClick={() => {
              if (!multiGrid) {
                setShowMore(true);
              } else if (blinksDetail) {
                const url = new URL(blinksDetail.url);
                router.push(url.pathname + url.search);
              }
            }}
            className="text-xs stat-desc link link-hover w-fit"
          >
            {!showMore && description != undefined && 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
};
const BlinksStaticContent: FC<{
  form: FormProps | undefined;
  image: string | undefined;
}> = ({ form, image }) => {
  return (
    <div
      className={`flex relative justify-center items-center h-auto w-full ${
        form ? 'aspect-[2/1] rounded-xl' : 'aspect-square'
      }`}
    >
      {image ? (
        <Image
          className={`object-cover`}
          src={image}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt="action-image"
        />
      ) : (
        <div className="loading loading-spinner text-neutral loading-lg" />
      )}
    </div>
  );
};
