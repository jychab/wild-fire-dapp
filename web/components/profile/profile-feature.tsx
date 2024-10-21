'use client';

import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { PublicKey } from '@solana/web3.js';
import { IconBookmark, IconChartLine, IconPolaroid } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FC } from 'react';
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
  metadata: DAS.GetAssetResponse | null | undefined;
  isOwner: boolean;
}

export const ProfileTabs: FC<ProfileProps> = ({
  selectedTab,
  metadata,
  isOwner,
}) => {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  function updateTabParameter(url: string, newTabValue: ProfileTabsEnum) {
    const urlObject = new URL('https://blinksfeed.com' + url);
    urlObject.searchParams.delete('tab');
    urlObject.searchParams.set('tab', newTabValue);
    return useRelativePathIfPossbile(urlObject.toString());
  }
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
          onChange={() =>
            router.push(
              updateTabParameter(
                `${pathName}?${searchParams}`,
                ProfileTabsEnum.POSTS
              )
            )
          }
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
            onChange={() =>
              router.push(
                updateTabParameter(
                  `${pathName}?${searchParams}`,
                  ProfileTabsEnum.TRADE
                )
              )
            }
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
            onChange={() =>
              router.push(
                updateTabParameter(
                  `${pathName}?${searchParams}`,
                  ProfileTabsEnum.FAVOURTIES
                )
              )
            }
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
  selectedTab?: ProfileTabsEnum;
}> = ({ address, mint, selectedTab = ProfileTabsEnum.POSTS }) => {
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
