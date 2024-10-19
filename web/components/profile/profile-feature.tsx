'use client';

import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { PublicKey } from '@solana/web3.js';
import { IconBookmark, IconChartLine, IconPolaroid } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { TradingPanel } from '../trading/trading.ui';
import { useGetPostsFromMint, useGetTokenDetails } from './profile-data-access';
import { ContentPanel, FavouritesContentPanel, Profile } from './profile-ui';

export enum ProfileTabsEnum {
  POSTS = 'Posts',
  TRADE = 'Trade',
  FAVOURTIES = 'Favourites',
}
interface ProfileProps {
  selectedTab: ProfileTabsEnum;
  setSelectedTab: (value: ProfileTabsEnum) => void;
  metadata: DAS.GetAssetResponse | null | undefined;
  isOwner: boolean;
}

export const ProfileTabs: FC<ProfileProps> = ({
  selectedTab,
  setSelectedTab,
  metadata,
  isOwner,
}) => {
  return (
    <div
      role="tablist"
      className="tabs tabs-lifted tabs-md md:tabs-lg w-full rounded"
    >
      <label
        className={`tab font-semibold [--tab-bg:transparent] ${
          selectedTab == ProfileTabsEnum.POSTS ? 'tab-active' : ''
        }`}
      >
        <input
          type="radio"
          role="tab"
          className="hidden"
          checked={selectedTab == ProfileTabsEnum.POSTS}
          onChange={() => setSelectedTab(ProfileTabsEnum.POSTS)}
        />
        <IconPolaroid />
      </label>
      {!checkIfMetadataIsTemporary(metadata) && (
        <label
          className={`tab font-semibold [--tab-bg:transparent] ${
            selectedTab == ProfileTabsEnum.TRADE ? 'tab-active' : ''
          }`}
        >
          <input
            type="radio"
            role="tab"
            className="hidden"
            checked={selectedTab == ProfileTabsEnum.TRADE}
            onChange={() => setSelectedTab(ProfileTabsEnum.TRADE)}
          />
          <IconChartLine />
        </label>
      )}
      {isOwner && (
        <label
          className={`tab font-semibold [--tab-bg:transparent] ${
            selectedTab == ProfileTabsEnum.FAVOURTIES ? 'tab-active' : ''
          }`}
        >
          <input
            type="radio"
            role="tab"
            className="hidden"
            checked={selectedTab == ProfileTabsEnum.FAVOURTIES}
            onChange={() => setSelectedTab(ProfileTabsEnum.FAVOURTIES)}
          />
          <IconBookmark />
        </label>
      )}
    </div>
  );
};

export const ProfileFeature: FC<{
  address: string | null;
  mint: string | null;
}> = ({ address, mint }) => {
  const [selectedTab, setSelectedTab] = useState(ProfileTabsEnum.POSTS);
  const { publicKey } = useWallet();
  const collectionMint = mint
    ? new PublicKey(mint)
    : address
    ? getDerivedMint(new PublicKey(address))
    : null;
  const isOwner =
    address != null && publicKey != null && address == publicKey.toBase58();

  const { data, isFetching, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useGetPostsFromMint({ collectionMint, selectedTab, publicKey });
  const posts = data ? data.pages.flatMap((d) => d.rows) : [];
  const { data: metadata } = useGetTokenDetails({
    mint: collectionMint,
  });

  return (
    <div className="flex flex-col w-full flex-1 h-full items-center animate-fade-right animate-duration-200 sm:animate-none">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <Profile
          collectionMint={collectionMint}
          isOwner={isOwner}
          address={address}
        />
        <div className="flex flex-col flex-1 h-full w-full">
          <ProfileTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            metadata={metadata}
            isOwner={isOwner}
          />
          <div className="rounded sm:border-x sm:border-b border-base-300 h-full w-full md:p-4">
            {selectedTab == ProfileTabsEnum.POSTS && (
              <ContentPanel
                isOwner={isOwner}
                posts={posts}
                fetchNextPage={fetchNextPage}
                isFetching={isFetching}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
              />
            )}
            {selectedTab == ProfileTabsEnum.TRADE &&
              !checkIfMetadataIsTemporary(metadata) && (
                <TradingPanel collectionMint={collectionMint} />
              )}
            {selectedTab == ProfileTabsEnum.FAVOURTIES && isOwner && (
              <FavouritesContentPanel
                posts={posts}
                fetchNextPage={fetchNextPage}
                isFetching={isFetching}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
