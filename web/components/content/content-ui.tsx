import { sendLike } from '@/utils/firebase/functions';
import { formatLargeNumber } from '@/utils/helper/format';
import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { PostBlinksDetail, PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  IconChartLine,
  IconDotsVertical,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconTrash,
} from '@tabler/icons-react';
import { default as Image } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, RefObject, useState } from 'react';
import { Blinks } from '../blinks/blinks-feature';
import { BlinksStaticContent, FormProps } from '../blinks/blinks-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { useIsLiquidityPoolFound } from '../trading/trading-data-access';
import { checkUrlIsValid } from '../upload/upload.data-access';
import { useRemoveContentMutation } from './content-data-access';

interface DisplayContentProps {
  blinksDetail: PostBlinksDetail;
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
  return checkUrlIsValid(blinksDetail.url) ? (
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
  return (
    <div className="flex w-full items-center justify-between p-2">
      <Link
        href={`/profile?mintId=${blinksDetail.mint}`}
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
            {/* {post?.verified && (
              <IconDiscountCheckFilled size={18} className="fill-secondary" />
            )} */}
          </div>
          <div className="text-xs">{metadata?.content?.metadata.name}</div>
        </div>
      </Link>
    </div>
  );
};

export const UserPanel: FC<{
  blinksDetail?: PostBlinksDetail;
  editable: boolean;
}> = ({ blinksDetail, editable }) => {
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: blinksDetail?.mint ? new PublicKey(blinksDetail.mint) : null,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: blinksDetail ? new PublicKey(blinksDetail.mint) : null,
  });
  const [liked, setLiked] = useState(
    (publicKey && blinksDetail?.likesUser?.includes(publicKey?.toBase58())) ||
      false
  );
  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint: blinksDetail?.mint ? new PublicKey(blinksDetail.mint) : null,
  });
  const removeContentMutation = useRemoveContentMutation({
    mint:
      editable && blinksDetail?.mint ? new PublicKey(blinksDetail.mint) : null,
  });
  const closestUser =
    blinksDetail?.likesUser && blinksDetail?.likesUser?.length > 0
      ? blinksDetail.likesUser[0]
      : undefined;

  const { data: closestUserMintMetadata } = useGetTokenDetails({
    mint:
      closestUser && closestUser !== publicKey?.toBase58()
        ? getDerivedMint(new PublicKey(closestUser))
        : null,
  });

  return (
    <div className="flex justify-between pb-2">
      <div className="flex gap-2 text-sm items-start">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (
                blinksDetail?.mint &&
                blinksDetail?.id &&
                !liked &&
                publicKey
              ) {
                try {
                  sendLike(blinksDetail.mint, blinksDetail.id, 10);
                } catch (e) {
                  console.log(e);
                } finally {
                  setLiked(true);
                }
              }
            }}
            className=""
          >
            {liked || (publicKey && closestUser == publicKey?.toBase58()) ? (
              <IconHeartFilled size={18} className="fill-primary" />
            ) : (
              <IconHeart size={18} />
            )}
          </button>

          {(liked ||
            (blinksDetail?.likesCount != undefined &&
              blinksDetail.likesCount > 0)) && (
            <span className="text-xs stat-desc link link-hover">{`Liked by ${
              closestUserMintMetadata?.content?.metadata.name ||
              (closestUser == publicKey?.toBase58() || liked ? 'you' : '')
            }${
              (closestUser == publicKey?.toBase58() ||
                closestUserMintMetadata?.content?.metadata.name) &&
              blinksDetail?.likesCount != undefined &&
              blinksDetail.likesCount > 1
                ? ` and `
                : ''
            }${
              blinksDetail?.likesCount != undefined &&
              blinksDetail.likesCount > 1
                ? formatLargeNumber(
                    blinksDetail.likesCount - (closestUserMintMetadata ? 1 : 0)
                  ) + ' others'
                : ''
            }`}</span>
          )}
        </div>
      </div>

      {(editable || isLiquidityPoolFound) &&
        isAuthorized(tokenStateData, publicKey, metadata) && (
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
              {!editable && isLiquidityPoolFound && blinksDetail && (
                <li>
                  <Link
                    href={`/profile?mintId=${blinksDetail?.mint}&tab=trade`}
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                  >
                    <IconChartLine size={18} />
                    Trade
                  </Link>
                </li>
              )}
              {editable && blinksDetail && (
                <li>
                  <Link
                    className="btn btn-sm btn-outline border-none rounded-none gap-2 items-center justify-start"
                    href={`/post/edit?mintId=${blinksDetail.mint}&id=${blinksDetail.id}`}
                  >
                    <IconEdit size={18} />
                    Edit
                  </Link>
                </li>
              )}
              {editable && blinksDetail && (
                <li>
                  <button
                    disabled={removeContentMutation.isPending}
                    onClick={() =>
                      removeContentMutation.mutateAsync(blinksDetail.id)
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
  post?: PostContent;
  blinksDetail: PostBlinksDetail | undefined;
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
  blinksDetail,
  currentIndex,
  carouselRef,
}) => {
  const router = useRouter();
  return (
    <div className="relative leading-[0]">
      <div
        ref={carouselRef}
        onClick={() =>
          multiGrid &&
          blinksDetail &&
          router.push(`/post?mint=${blinksDetail.mint}&id=${blinksDetail.id}`)
        }
        className={`carousel ${
          multiGrid && blinksDetail ? 'cursor-pointer' : ''
        } w-full aspect-square h-auto bg-base-content`}
      >
        {!post?.carousel || post.carousel.length == 0 ? (
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
              {!multiGrid && post.carousel && (
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
      {post?.carousel && post.carousel.length > 1 && (
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
