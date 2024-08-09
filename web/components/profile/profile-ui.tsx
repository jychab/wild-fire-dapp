'use client';

import { Scope } from '@/utils/enums/das';
import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconEdit } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-feature';
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
      <ContentGrid
        hideComment={true}
        multiGrid={true}
        showMintDetails={false}
        editable={true}
        posts={posts}
      />
      {posts?.posts.length == 0 &&
        mintId &&
        ((tokenStateData &&
          publicKey &&
          publicKey.toBase58() == tokenStateData.admin) ||
        (publicKey &&
          metadata?.authorities?.find(
            (x) =>
              x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
          )?.address == publicKey.toBase58()) ? (
          <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
            Create your first post!
            <div className="w-36">
              <UploadBtn mintId={mintId} />
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
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
      metadata && publicKey
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info!.token_program!)
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
        {metadata && metadata.content?.links?.image && (
          <div className="relative h-full w-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata?.content?.links?.image!}
              alt={''}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <span className="text-2xl lg:text-3xl font-bold">
              {metadata?.content?.metadata.name}
            </span>
          </div>
          <span>{metadata?.content?.metadata.symbol}</span>
        </div>
        <div className="flex items-center gap-2 ">
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
                  <span className="hidden group-hover:block">Unsubscribe</span>
                  <span className="block group-hover:hidden">Subscribed</span>
                </>
              ) : (
                <span>Subscribe</span>
              ))}
          </button>
          {tokenStateData && publicKey && tokenStateData.mutable == 1 && (
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
                ) + ' Holders'}
              </span>
              <span
                className={`${
                  mintSummaryDetails.holdersChange24hPercent < 0
                    ? 'text-error'
                    : 'text-success'
                }`}
              >
                {mintSummaryDetails.holdersChange24hPercent < 0
                  ? `-${mintSummaryDetails.holdersChange24hPercent}%`
                  : `+${mintSummaryDetails.holdersChange24hPercent}%`}
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
