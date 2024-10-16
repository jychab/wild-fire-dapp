'use client';

import { validatePost } from '@/utils/firebase/functions';
import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { getTimeAgo } from '@/utils/helper/format';
import { PostBlinksDetail } from '@/utils/types/post';
import { Blink } from '@dialectlabs/blinks';
import { IconEye, IconHeart, IconHeartFilled } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { CommentsSection } from '../comments/comments-ui';
import { useGetActionFromApiUrlQuery } from '../content/content-data-access';
import { UserProfile } from '../content/content-ui';
import { ShareContent } from '../share/share-content';
import { TradingPanel } from '../trading/trading.ui';
import { checkUrlIsValid } from '../upload/upload.data-access';
import { useActionsRegistry } from './provider';

interface BlinksProps {
  blinksDetail: PostBlinksDetail | undefined | null;
  multiGrid?: boolean;
  editable?: boolean;
}
export const Blinks: FC<BlinksProps> = ({
  blinksDetail,
  multiGrid = false,
  editable = false,
}) => {
  const { publicKey } = useWallet();
  const { adapter } = useActionsRegistry();
  const { data: action } = useGetActionFromApiUrlQuery({
    url: blinksDetail?.url,
    adapter,
  });
  const [trade, setTrade] = useState(false);
  const [liked, setLiked] = useState(blinksDetail?.liked);
  const [animateHeart, setAnimateHeart] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);

  // Double-tap detection logic
  const handleDoubleTap = () => {
    const currentTime = new Date().getTime();
    const tapGap = 300; // Max time allowed between taps (in ms)

    if (lastTap && currentTime - lastTap < tapGap) {
      toggleLike(); // If the second tap is within 300ms, treat it as a double-tap
    } else {
      setLastTap(currentTime); // Otherwise, set this as the last tap time
    }
  };

  const toggleLike = () => {
    if (!blinksDetail?.memberMint || !publicKey) return;
    if (liked) {
      validatePost(
        blinksDetail.memberMint,
        blinksDetail.mint,
        blinksDetail.id,
        'Dislikes'
      );
      setLiked(false);
    } else {
      validatePost(
        blinksDetail.memberMint,
        blinksDetail.mint,
        blinksDetail.id,
        'Likes'
      );
      setLiked(true);
      triggerHeartAnimation();
    }
  };
  // Trigger the heart animation
  const triggerHeartAnimation = () => {
    setAnimateHeart(true);
    setTimeout(() => {
      setAnimateHeart(false);
    }, 500); // Show animation for 600ms
  };

  if (!(blinksDetail && checkUrlIsValid(blinksDetail.url))) {
    return (
      <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] justify-center gap-2">
        Url is invalid
        <div className="loading loading-dots" />
      </div>
    );
  }

  if (multiGrid && action) {
    return (
      <Link
        href={useRelativePathIfPossbile(blinksDetail.url)}
        className="relative flex items-center aspect-square h-auto justify-center"
      >
        <Image
          className={`object-cover `}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
          src={action.icon}
        />
      </Link>
    );
  }
  return (
    <div
      className={`min-h-[calc(100vh-4rem)] sm:my-4 flex flex-col w-full items-start justify-between animate-fade-up animate-once animate-duration-300 shadow-md sm:rounded-2xl sm:border sm:border-base-300 `}
    >
      {animateHeart && (
        <div className="z-10 absolute inset-0 flex top-[200px] justify-center">
          <IconHeartFilled
            size={120}
            className="animate-duration-200 animate-jump animate-ease-out fill-error opacity-50"
          />
        </div>
      )}
      <div className="w-full">
        <UserProfile
          trade={trade}
          setTrade={setTrade}
          blinksDetail={blinksDetail}
          editable={editable}
        />
        {action ? (
          !trade ? (
            <div
              className="animate-flip-up"
              onDoubleClick={toggleLike}
              onTouchStart={handleDoubleTap}
            >
              <Blink
                stylePreset={'custom'}
                action={action}
                websiteText={new URL(blinksDetail.url).hostname}
              />
            </div>
          ) : (
            <div className="px-4 animate-flip-down">
              <TradingPanel
                compact={true}
                hideMintInfo={true}
                hideActivities={true}
                collectionMint={blinksDetail.mint}
              />
            </div>
          )
        ) : (
          <div className="flex-grow" />
        )}
      </div>
      <BlinksFooter
        blinksDetail={blinksDetail}
        toggleLike={toggleLike}
        liked={liked}
      />
    </div>
  );
};
export const BlinksFooter: FC<{
  blinksDetail: PostBlinksDetail;
  toggleLike: () => void;
  liked: boolean | undefined;
}> = ({ blinksDetail, toggleLike, liked }) => {
  return (
    <div className="flex justify-between items-end w-full px-6 pb-5">
      <div className="flex flex-col gap-1 items-start">
        <CommentsSection blinksDetail={blinksDetail} />
        <span className="stat-desc">{getTimeAgo(blinksDetail.createdAt)}</span>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <ShareContent blinksDetail={blinksDetail} />
        <div className="flex items-end gap-2">
          <IconEye size={16} />
          <span className="stat-desc">{`${
            blinksDetail.viewsCount || 0
          } views`}</span>
          <button onClick={toggleLike} className="link link-hover flex gap-2">
            <IconHeart
              size={16}
              className={`${liked ? 'fill-primary animate-jump' : ''}`}
            />
            <span className="stat-desc">{`${
              blinksDetail.likesCount || 0
            } likes`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
