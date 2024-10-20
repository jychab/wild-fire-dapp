'use client';

import { Sentiment } from '@/utils/enums/post';
import { validatePost } from '@/utils/firebase/functions';
import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { getTimeAgo } from '@/utils/helper/format';
import { PostBlinksDetail } from '@/utils/types/post';
import { Blink } from '@dialectlabs/blinks';
import { PublicKey } from '@solana/web3.js';
import { IconEye, IconHeart } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';
import {
  useUnifiedWalletContext,
  useWallet,
} from 'unified-wallet-adapter-with-telegram';
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
  initialTrade?: boolean;
}
export const Blinks: FC<BlinksProps> = ({
  blinksDetail,
  multiGrid = false,
  editable = false,
  initialTrade = false,
}) => {
  const { setShowModal } = useUnifiedWalletContext();
  const { publicKey } = useWallet();
  const { adapter, isRegistryLoaded } = useActionsRegistry();
  const { data: action } = useGetActionFromApiUrlQuery({
    url: blinksDetail?.url,
    adapter,
    isRegistryLoaded,
  });
  const [trade, setTrade] = useState(initialTrade);
  const [liked, setLiked] = useState(blinksDetail?.liked);
  const [animateHeart, setAnimateHeart] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);

  // Double-tap detection logic
  const handleDoubleTap = () => {
    const currentTime = new Date().getTime();
    const tapGap = 300; // Max time allowed between taps (in ms)

    if (lastTap && currentTime - lastTap < tapGap) {
      toggleLike(true); // If the second tap is within 300ms, treat it as a double-tap
    } else {
      setLastTap(currentTime); // Otherwise, set this as the last tap time
    }
  };

  const toggleLike = (like: boolean) => {
    if (!blinksDetail?.memberMint || !publicKey) {
      setShowModal(true);
      return;
    }
    if (like) {
      if (!liked) {
        validatePost(
          blinksDetail.memberMint,
          blinksDetail.mint,
          blinksDetail.id,
          Sentiment.LIKE
        );
      }
      setLiked(true);
    } else {
      if (liked) {
        validatePost(
          blinksDetail.memberMint,
          blinksDetail.mint,
          blinksDetail.id,
          Sentiment.DISLIKE
        );
      }
      setLiked(false);
    }
    triggerHeartAnimation();
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
      <div className="flex flex-col items-center justify-center gap-2">
        Url is invalid
        <div className="loading loading-dots" />
      </div>
    );
  }

  if (multiGrid) {
    return (
      <Link
        href={useRelativePathIfPossbile(blinksDetail.url)}
        className="relative flex items-center aspect-square h-auto justify-center"
      >
        {action ? (
          <Image
            className={`object-cover `}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt=""
            src={action.icon}
          />
        ) : (
          <div className="loading loading-spinner" />
        )}
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-col w-full items-start bg-base-100 justify-between animate-fade-up animate-once animate-duration-300 sm:shadow-md sm:rounded-2xl sm:border sm:border-base-300 `}
    >
      <div className="w-full">
        <UserProfile
          trade={trade}
          setTrade={setTrade}
          blinksDetail={blinksDetail}
          editable={editable}
        />
        {!trade ? (
          <div className="animate-flip-up">
            <div
              onDoubleClick={() => toggleLike(true)}
              onTouchStart={handleDoubleTap}
              className="z-10 absolute w-full aspect-square"
            >
              {animateHeart && liked && (
                <div className="z-10 absolute inset-0 flex gap-2 top-1/2 justify-center">
                  <div className="animate-duration-400 animate-jump animate-ease-out opacity-75">
                    <IconHeart size={120} className=" fill-error text-error" />
                  </div>
                </div>
              )}
            </div>
            {action ? (
              <Blink
                stylePreset={'custom'}
                action={action}
                websiteText={new URL(blinksDetail.url).hostname}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] w-full">
                <div className="loading loading-spinner" />
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 animate-flip-down">
            <TradingPanel
              compact={true}
              hideMintInfo={true}
              hideActivities={true}
              collectionMint={new PublicKey(blinksDetail.mint)}
            />
          </div>
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
  toggleLike: (like: boolean) => void;
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
          <button
            onClick={() => {
              toggleLike(!liked);
            }}
            className="link link-hover flex gap-2"
          >
            <IconHeart
              size={16}
              className={`${liked ? 'fill-primary animate-jump' : ''}`}
            />
            <span className="stat-desc">{`${
              (blinksDetail.likesCount || 0) + (liked ? 1 : 0)
            } likes`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
