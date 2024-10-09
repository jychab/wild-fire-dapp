'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { PublicKey } from '@solana/web3.js';
import { FC, useState } from 'react';
import { useGetPostsFromCreator } from './profile-data-access';
import { ContentPanel, Profile } from './profile-ui';

export enum ProfileTabsEnum {
  Created = 'Created By You',
  Liked = 'Liked By You',
}
interface ProfileProps {
  selectedTab: ProfileTabsEnum;
  setSelectedTab: (value: ProfileTabsEnum) => void;
}

export const ProfileTabs: FC<ProfileProps> = ({
  selectedTab,
  setSelectedTab,
}) => {
  return (
    <div
      role="tablist"
      className="tabs tabs-lifted tabs-md md:tabs-lg w-full rounded"
    >
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold [--tab-bg:transparent] ${
          selectedTab == ProfileTabsEnum.Created ? 'tab-active' : ''
        }`}
        checked={selectedTab == ProfileTabsEnum.Created}
        onChange={() => setSelectedTab(ProfileTabsEnum.Created)}
        aria-label={ProfileTabsEnum.Created}
      />
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold [--tab-bg:transparent] ${
          selectedTab == ProfileTabsEnum.Liked ? 'tab-active' : ''
        }`}
        checked={selectedTab == ProfileTabsEnum.Liked}
        onChange={() => setSelectedTab(ProfileTabsEnum.Liked)}
        aria-label={`${ProfileTabsEnum.Liked}`}
      />
    </div>
  );
};

export const ProfileFeature: FC<{ address: string | null }> = ({ address }) => {
  const [selectedTab, setSelectedTab] = useState(ProfileTabsEnum.Created);
  const { data: posts } = useGetPostsFromCreator({
    creator: address ? new PublicKey(address) : null,
    selectedTab,
  });

  return (
    <div className="flex flex-col w-full flex-1 h-full items-center animate-fade-right animate-duration-200 sm:animate-none">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <Profile
          mintId={
            address ? getDerivedMint(new PublicKey(address)).toBase58() : null
          }
        />
        <div className="flex flex-col flex-1 h-full w-full">
          <ProfileTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
          />
          <div className="rounded border-x border-b border-base-300 h-full md:p-4">
            <ContentPanel posts={posts} address={address} />
          </div>
        </div>
      </div>
    </div>
  );
};
