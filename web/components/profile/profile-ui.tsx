'use client';

import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconEdit } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-feature';
import { CreateAccountBtn } from '../create/create-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetTokenAccountInfo,
  useSubscriptionMutation,
} from '../trading/trading-data-access';
import { UploadBtn } from '../upload/upload-ui';
import { useGetPostsFromMint, useGetTokenDetails } from './profile-data-access';

export enum TabsEnum {
  POST = 'Posts',
  TRADE = 'Trade',
}

interface ContentPanelProps {
  mintId: string | null;
  metadata: DAS.GetAssetResponse | null | undefined;
}

export const ContentPanel: FC<ContentPanelProps> = ({ mintId, metadata }) => {
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: posts } = useGetPostsFromMint({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  return (
    <>
      {metadata && (
        <ContentGrid
          hideComment={true}
          multiGrid={true}
          hideUserPanel={true}
          showMintDetails={false}
          editable={true}
          posts={posts}
        />
      )}
      {posts?.posts.length == 0 &&
        ((isAuthorized(tokenStateData, publicKey, metadata) || !metadata) &&
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
        className={`tab font-semibold ${
          selectedTab == TabsEnum.POST ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.POST}
        onChange={() => setSelectedTab(TabsEnum.POST)}
        aria-label={TabsEnum.POST}
      />
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold ${
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
  mintSummaryDetails:
    | {
        currentHoldersCount: number;
        holdersChange24hPercent: number;
      }
    | null
    | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
  mintId: string | null;
}

export const Profile: FC<ProfileProps> = ({
  metadata,
  mintId,
  mintSummaryDetails,
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: tokenDetails } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

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
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });

  const subscribeMutation = useSubscriptionMutation({
    mint: mintId ? new PublicKey(mintId) : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });

  // const { data: price } = useGetPrice({ mint: new PublicKey(mintId) });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-base-100">
      <div className="w-40 h-40">
        <div className="relative h-full w-full">
          <Image
            priority={true}
            className={`object-cover rounded-full`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={metadata?.content?.links?.image || placeholderImage}
            alt={''}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <span className="text-2xl lg:text-3xl font-bold truncate max-w-sm">
              {metadata?.content?.metadata.name || mintId}
            </span>
          </div>
          <span className="truncate max-w-xs">
            {metadata?.content?.metadata.symbol || publicKey?.toBase58()}
          </span>
        </div>
        <div className="flex items-center gap-2 ">
          {metadata?.token_info && (
            <button
              disabled={subscribeMutation.isPending}
              onClick={() => {
                subscribeMutation.mutateAsync();
              }}
              className={`btn relative group ${
                tokenInfo ? 'btn-success hover:btn-warning' : 'btn-primary'
              } btn-sm w-32 `}
            >
              {subscribeMutation.isPending && (
                <div className="loading loading-spinner" />
              )}
              {!subscribeMutation.isPending &&
                (tokenInfo ? (
                  <>
                    <span className="hidden group-hover:block">
                      Unsubscribe
                    </span>
                    <span className="block group-hover:hidden">Subscribed</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                ))}
            </button>
          )}
          {(isAuthorized(tokenStateData, publicKey, metadata) ||
            (publicKey && mintId == getDerivedMint(publicKey).toBase58())) && (
            <button
              className="btn btn-outline btn-sm items-center"
              onClick={() => router.push(`/mint/edit?mintId=${mintId}`)}
            >
              <IconEdit />
              Edit
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mintSummaryDetails && (
            <>
              <span>
                {formatLargeNumber(
                  mintSummaryDetails?.currentHoldersCount || 0
                ) + ' Followers'}
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
          )}
          {mintSummaryDetails &&
            tokenDetails?.token_info?.price_info?.price_per_token &&
            '||'}
          {tokenDetails?.token_info?.price_info?.price_per_token && (
            <>
              <span>{`$${(
                tokenDetails?.token_info?.price_info?.price_per_token || 0
              ).toPrecision(6)}
              `}</span>
            </>
          )}
        </div>
        <span className="text-base truncate font-normal">
          {metadata?.content?.metadata.description}
        </span>
      </div>
    </div>
  );
};
export const LockedContent: FC<{
  metaDataQuery: DAS.GetAssetResponse | null | undefined;
  isLoading: boolean;
}> = ({ metaDataQuery, isLoading }) => {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (metaDataQuery?.content?.json_uri == undefined && !isLoading) {
      setLocked(true);
    }
  }, [metaDataQuery, isLoading]);
  return (
    locked && (
      <div className="flex flex-col flex-1 justify-center items-center bg-base-100 bg-opacity-80 p-4 h-full w-full">
        <div className="flex flex-col gap-4 rounded-box bg-base-300 w-full max-w-sm p-4">
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
                <h2 className="font-bold">Tokenize your Content</h2>
                <span className="text-sm">Earn trading fees</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="flex gap-8 items-center">
              <i className="text-xl text-secondary"></i>
              <div className="flex flex-col">
                <h2 className="font-bold">Airdrop to Share</h2>
                <span className="text-sm">
                  Utilize our tools to identify users to distribute your tokens
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
