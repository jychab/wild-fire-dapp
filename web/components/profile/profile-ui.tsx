'use client';

import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { TelegramWalletButton } from 'unified-wallet-adapter-with-telegram';
import {
  checkIfMetadataExist,
  formatLargeNumber,
} from '../../utils/helper/format';
import { ContentGrid } from '../content/content-feature';
import { CreateAccountBtn } from '../create/create-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetTokenAccountInfo,
  useSubscriptionMutation,
} from '../trading/trading-data-access';
import { UploadBtn } from '../upload/upload-ui';
import {
  useGetMintSummaryDetails,
  useGetPostsFromMint,
  useGetTokenDetails,
} from './profile-data-access';

export enum TabsEnum {
  POST = 'Posts',
  TRADE = 'Trade',
}

interface ContentPanelProps {
  mintId: string | null;
}

export const ContentPanel: FC<ContentPanelProps> = ({ mintId }) => {
  const { publicKey } = useWallet();
  const { data: metadata } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: posts } = useGetPostsFromMint({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  return (
    <>
      {!checkIfMetadataExist(metadata) && (
        <ContentGrid
          hideComment={true}
          multiGrid={true}
          hideUserPanel={true}
          showMintDetails={false}
          editable={true}
          posts={posts}
        />
      )}
      {posts?.posts &&
        posts?.posts.length == 0 &&
        ((isAuthorized(tokenStateData, publicKey, metadata) ||
          checkIfMetadataExist(metadata)) &&
        mintId ? (
          <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
            <div className="w-36">
              <UploadBtn mintId={mintId} />
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
            No post found!
          </div>
        ))}
    </>
  );
};

interface TabsProps {
  selectedTab: TabsEnum;
  setSelectedTab: (value: TabsEnum) => void;
}

export const Tabs: FC<TabsProps> = ({ selectedTab, setSelectedTab }) => {
  return (
    <div
      role="tablist"
      className="tabs tabs-lifted tabs-md md:tabs-lg w-full rounded"
    >
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold [--tab-bg:transparent] ${
          selectedTab == TabsEnum.POST ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.POST}
        onChange={() => setSelectedTab(TabsEnum.POST)}
        aria-label={TabsEnum.POST}
      />
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold [--tab-bg:transparent] ${
          selectedTab == TabsEnum.TRADE ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.TRADE}
        onChange={() => setSelectedTab(TabsEnum.TRADE)}
        aria-label={`${TabsEnum.TRADE}`}
      />
    </div>
  );
};

interface ProfileProps {
  mintId: string | null;
}

export const Profile: FC<ProfileProps> = ({ mintId }) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: metadata, isLoading } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
      <button
        onClick={() => router.push(`/mint/edit?mintId=${mintId}`)}
        className="w-40 h-40 items-center justify-center group flex avatar indicator"
      >
        {publicKey &&
          (isAuthorized(tokenStateData, publicKey, metadata) ||
            getDerivedMint(publicKey).toBase58() == mintId) && (
            <span className="hidden group-hover:flex indicator-item badge badge-secondary absolute top-4 right-4">
              Edit
            </span>
          )}
        {!isLoading && (
          <div className="relative h-full w-full ring-secondary ring-offset-base-100 rounded-full hover:ring ring-offset-2 cursor-pointer">
            <Image
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata?.content?.links?.image || placeholderImage}
              alt={''}
            />
          </div>
        )}
      </button>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          {!isLoading && (
            <span className="text-xl lg:text-3xl font-bold truncate max-w-sm">
              {metadata?.content?.metadata.name || publicKey?.toBase58()}
            </span>
          )}
        </div>
        {publicKey && mintId !== getDerivedMint(publicKey).toBase58() ? (
          <div className="flex items-center gap-2 ">
            <SubscribeBtn mintId={mintId} />
          </div>
        ) : (
          <TelegramWalletButton />
        )}
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
                  mintSummaryDetails.holdersChange24hPercent < 0
                    ? 'text-error'
                    : 'text-success'
                }`}
              >
                {mintSummaryDetails.holdersChange24hPercent < 0
                  ? `${mintSummaryDetails.holdersChange24hPercent.toFixed(2)}%`
                  : `${mintSummaryDetails.holdersChange24hPercent.toFixed(2)}%`}
              </span>
            </>
            {metadata?.token_info?.price_info?.price_per_token && '||'}
            {metadata?.token_info?.price_info?.price_per_token && (
              <>
                <span>{`$${(
                  metadata?.token_info?.price_info?.price_per_token || 0
                ).toPrecision(6)}
              `}</span>
              </>
            )}
          </div>
        )}
        <span className="text-base truncate font-normal">
          {metadata?.content?.metadata.description}
        </span>
      </div>
    </div>
  );
};
export const LockedContent: FC<{
  mintId: string | null;
}> = ({ mintId }) => {
  const { data: metadata, isLoading } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const locked = !isLoading && checkIfMetadataExist(metadata);

  return (
    locked && (
      <div className="flex flex-col flex-1 justify-center items-center bg-opacity-80 p-4 h-full w-full">
        <div className="flex flex-col gap-4 rounded-box bg-base-100 border w-full max-w-sm p-4">
          <div className="flex flex-col gap-4 items-center">
            <h1 className="font-bold text-xl">Unlock This Feature</h1>
            <span className="text-center text-sm">
              Become a Creator to unlock the following features
            </span>
          </div>
          <div className="flex flex-col">
            <div className="divider mt-0"></div>

            <div className="flex gap-8 items-center">
              <i className="fa-solid fa-screwdriver-wrench fa-fw text-xl text-secondary"></i>

              <div className="flex flex-col">
                <h2 className="font-bold">Create Post</h2>
                <span className="text-sm">Upload your custom blinks</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="flex gap-8 items-center">
              <i className="text-xl text-secondary"></i>
              <div className="flex flex-col">
                <h2 className="font-bold">Monetize your Content</h2>
                <span className="text-sm">Earn trading fees</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="flex gap-8 items-center">
              <i className="text-xl text-secondary"></i>
              <div className="flex flex-col">
                <h2 className="font-bold">Airdrop to Share</h2>
                <span className="text-sm">
                  Utilize our tools to identify users to airdrop your tokens
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
  subscribeOnly?: boolean;
}> = ({ mintId, subscribeOnly = false }) => {
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
    !checkIfMetadataExist(metadata) && (
      <button
        disabled={subscribeMutation.isPending}
        onClick={() => {
          subscribeMutation.mutateAsync(subscribeOnly);
        }}
        className={`btn relative group ${
          tokenInfo && !subscribeOnly
            ? 'btn-success hover:btn-warning'
            : 'btn-primary'
        } btn-sm`}
      >
        {subscribeMutation.isPending && (
          <div className="loading loading-spinner" />
        )}
        {!subscribeMutation.isPending &&
          (tokenInfo && !subscribeOnly ? (
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
