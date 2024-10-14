'use client';

import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { PublicKey } from '@solana/web3.js';
import { IconBookmark, IconChartLine, IconPolaroid } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { TradingPanel } from '../trading/trading.ui';
import {
  useGetPostsFromCreator,
  useGetTokenDetails,
} from './profile-data-access';
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
}

export const ProfileTabs: FC<ProfileProps> = ({
  selectedTab,
  setSelectedTab,
  metadata,
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
    </div>
  );
};

export const ProfileFeature: FC<{ address: string | null }> = ({ address }) => {
  const [selectedTab, setSelectedTab] = useState(ProfileTabsEnum.POSTS);
  const { data: posts } = useGetPostsFromCreator({
    creator: address ? new PublicKey(address) : null,
    selectedTab,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: address ? getDerivedMint(new PublicKey(address)) : null,
  });
  return (
    <div className="flex flex-col w-full flex-1 h-full items-center animate-fade-right animate-duration-200 sm:animate-none">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <Profile address={address} />
        <div className="flex flex-col flex-1 h-full w-full">
          <ProfileTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            metadata={metadata}
          />
          <div className="rounded sm:border-x sm:border-b border-base-300 h-full w-full md:p-4">
            {selectedTab == ProfileTabsEnum.POSTS && (
              <ContentPanel posts={posts} address={address} />
            )}
            {selectedTab == ProfileTabsEnum.TRADE &&
              !checkIfMetadataIsTemporary(metadata) &&
              address && (
                <TradingPanel
                  collectionMint={getDerivedMint(
                    new PublicKey(address)
                  ).toBase58()}
                />
              )}
            {selectedTab == ProfileTabsEnum.FAVOURTIES && (
              <FavouritesContentPanel posts={posts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
