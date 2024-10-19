'use client';

import { proxify } from '@/utils/helper/endpoints';
import {
  checkIfMetadataIsTemporary,
  formatLargeNumber,
} from '@/utils/helper/format';
import { placeholderImage } from '@/utils/helper/placeholder';
import { DAS } from '@/utils/types/das';
import { PostBlinksDetail } from '@/utils/types/post';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconMoneybag, IconSend } from '@tabler/icons-react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { ContentGrid } from '../content/content-feature';
import { CreateAccountBtn } from '../create/create-ui';
import {
  useGetTokenAccountInfo,
  useSubscriptionMutation,
} from '../trading/trading-data-access';
import { UploadBtn } from '../upload/upload-ui';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from './profile-data-access';

export const ContentPanel: FC<{
  isOwner: boolean;
  posts: PostBlinksDetail[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
}> = ({
  isOwner,
  posts,
  fetchNextPage,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
}) => {
  return posts.length == 0 ? (
    isOwner ? (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
        <div className="w-36">
          <UploadBtn />
        </div>
      </div>
    ) : (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
        No post found!
      </div>
    )
  ) : (
    <ContentGrid
      posts={posts}
      fetchNextPage={fetchNextPage}
      isFetching={isFetching}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
    />
  );
};

export const FavouritesContentPanel: FC<{
  posts: PostBlinksDetail[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isFetching?: boolean;
}> = ({
  posts,
  fetchNextPage,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
}) => {
  return posts.length == 0 ? (
    <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
      {`No liked post :(`}
    </div>
  ) : (
    <ContentGrid
      posts={posts}
      fetchNextPage={fetchNextPage}
      isFetching={isFetching}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
    />
  );
};

interface ProfileProps {
  collectionMint: PublicKey | null;
  isOwner: boolean;
  address?: string | null;
}

export const Profile: FC<ProfileProps> = ({
  isOwner,
  collectionMint,
  address,
}) => {
  const router = useRouter();
  const { data: metadata, isLoading } = useGetTokenDetails({
    mint: collectionMint,
  });
  const [initData, setInitData] = useState<any>();
  useEffect(() => {
    try {
      const { initData } = retrieveLaunchParams();
      if (initData) {
        setInitData(initData);
      }
    } catch (e) {}
  }, []);
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: collectionMint,
  });
  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
      <button
        onClick={() =>
          isOwner && router.push(`/mint/edit?mintId=${collectionMint}`)
        }
        className={`w-40 h-40 items-center justify-center group flex ${
          isOwner ? 'avatar indicator' : ''
        }`}
      >
        {isOwner && (
          <span className="hidden group-hover:flex indicator-item badge badge-secondary absolute top-4 right-4">
            Edit
          </span>
        )}
        {!isLoading && (
          <div
            className={`relative h-full w-full rounded-full ${
              isOwner
                ? 'ring-secondary ring-offset-base-100 hover:ring ring-offset-2'
                : ''
            } cursor-pointer`}
          >
            <Image
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={proxify(
                metadata?.content?.links?.image ||
                  initData?.user?.photoUrl ||
                  placeholderImage,
                true
              )}
              alt={''}
            />
          </div>
        )}
      </button>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start px-4">
        <div className="flex flex-col">
          {!isLoading && (
            <span className="text-xl lg:text-3xl font-bold truncate max-w-sm">
              {metadata?.content?.metadata.name ||
                initData?.user?.username ||
                address}
            </span>
          )}
          {!isLoading &&
            !checkIfMetadataIsTemporary(metadata) &&
            metadata?.content?.metadata.symbol && (
              <span className="text-base stat-desc lg:text-xl truncate max-w-sm">
                {metadata?.content?.metadata.symbol}
              </span>
            )}
        </div>
        {collectionMint && <SubscribeBtn mintId={collectionMint.toBase58()} />}
        {mintSummaryDetails && (
          <div className="flex items-center gap-2">
            <>
              <span>
                {formatLargeNumber(
                  mintSummaryDetails.currentHoldersCount || 0
                ) + ' Subscribers'}
              </span>
              <span
                className={`${
                  mintSummaryDetails.holdersChange24hPercent &&
                  mintSummaryDetails.holdersChange24hPercent < 0
                    ? 'text-error'
                    : 'text-success'
                }`}
              >
                {mintSummaryDetails.holdersChange24hPercent != undefined &&
                  `${mintSummaryDetails.holdersChange24hPercent.toFixed(2)}%
                `}
              </span>
            </>
          </div>
        )}
        <span className="text-base line-clamp-4 max-w-lg sm:max-w-3xl lg:max-w-5xl font-normal">
          {metadata?.content?.metadata.description}
        </span>
      </div>
    </div>
  );
};
export const LockedContent: FC<{
  metadata: DAS.GetAssetResponse | null;
}> = ({ metadata }) => {
  return (
    metadata == null && (
      <div className="flex flex-col flex-1 justify-center items-center bg-opacity-80 p-4 h-full w-full">
        <div className="flex flex-col gap-4 rounded-box bg-base-100 border w-full max-w-sm p-4">
          <div className="flex flex-col gap-4 items-center">
            <h1 className="font-bold text-xl">Unlock This Feature</h1>
            <span className="text-center text-sm">
              Launch your own token to unlock the following features
            </span>
          </div>
          <div className="flex flex-col">
            <div className="divider mt-0"></div>
            <div className="flex gap-4 px-4 items-center">
              <IconMoneybag />
              <div className="flex flex-col">
                <h2 className="font-bold">Monetize your Content</h2>
                <span className="text-sm">Earn trading fees</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="flex gap-4 px-4 items-center">
              <IconSend />
              <div className="flex flex-col">
                <h2 className="font-bold">Airdrop to Share</h2>
                <span className="text-sm">
                  Distribute your content to 200k users for just 1 SOL.
                </span>
              </div>
            </div>
            <div className="divider mb-0"></div>
          </div>
          <CreateAccountBtn />
        </div>
      </div>
    )
  );
};
export const SubscribeBtn: FC<{
  mintId: string | null;
}> = ({ mintId }) => {
  const { data: metadata } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const tokenProgram = metadata?.token_info?.token_program
    ? new PublicKey(metadata?.token_info?.token_program)
    : undefined;
  const { publicKey } = useWallet();
  const { data: tokenInfo } = useGetTokenAccountInfo({
    address:
      metadata && publicKey && metadata.token_info
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info?.token_program!)
          )
        : null,
    tokenProgram: tokenProgram,
  });

  const subscribeMutation = useSubscriptionMutation({
    mint: metadata ? new PublicKey(metadata.id) : null,
    tokenProgram: tokenProgram,
  });
  return (
    !checkIfMetadataIsTemporary(metadata) && (
      <button
        disabled={subscribeMutation.isPending}
        onClick={() => {
          subscribeMutation.mutateAsync();
        }}
        className={`btn relative group ${
          tokenInfo ? 'btn-neutral hover:btn-warning' : 'btn-success'
        } btn-sm`}
      >
        {subscribeMutation.isPending && (
          <div className="loading loading-spinner" />
        )}
        {!subscribeMutation.isPending &&
          (tokenInfo ? (
            <>
              <span className="hidden group-hover:block">Unsubscribe</span>
              <span className="block group-hover:hidden">Subscribed</span>
            </>
          ) : (
            <span>Subscribe</span>
          ))}
      </button>
    )
  );
};
