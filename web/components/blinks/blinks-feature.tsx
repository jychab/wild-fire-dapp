'use client';

import { validatePost } from '@/utils/firebase/functions';
import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
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
      <div className="flex flex-col items-center justify-center gap-2">
        Url is invalid
        <div className="loading loading-dots" />
      </div>
    );
  }
  if (!action) {
    return null;
  }
  if (multiGrid) {
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
      className={`"flex flex-col w-full animate-fade-up animate-once animate-duration-300 border bg-base-300 border-2 border-primary shadow-md shadow-primary rounded-2xl`}
    >
      {animateHeart && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconHeartFilled
            size={120}
            className="animate-duration-300 animate-jump animate-ease-out fill-primary opacity-85"
          />
        </div>
      )}
      <UserProfile
        trade={trade}
        setTrade={setTrade}
        blinksDetail={blinksDetail}
        editable={editable}
      />
      {!trade ? (
        <div className="animate-flip-up" onDoubleClick={toggleLike}>
          <Blink
            stylePreset={'custom'}
            action={action}
            websiteText={new URL(blinksDetail.url).hostname}
          />
        </div>
      ) : (
        <div className="p-4 animate-flip-down">
          <TradingPanel
            compact={true}
            hideMintInfo={true}
            hideActivities={true}
            collectionMint={blinksDetail.mint}
          />
        </div>
      )}
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
      <CommentsSection blinksDetail={blinksDetail} />
      <div className="flex flex-col items-end gap-2">
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
