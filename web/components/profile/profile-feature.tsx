'use client';

import { PublicKey } from '@solana/web3.js';
import { FC, useState } from 'react';
import { TradingPanel } from '../trading/trading.ui';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from './profile-data-access';
import { ContentPanel, Profile, Tabs, TabsEnum } from './profile-ui';

export const ProfileFeature: FC<{
  mintId: string | null;
  tab: string | null;
}> = ({ mintId, tab }) => {
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const [selectedTab, setSelectedTab] = useState(
    tab
      ? Object.entries(TabsEnum).find(
          (x) => x[0].toLowerCase() == tab.toLowerCase()
        )?.[1] || TabsEnum.POST
      : TabsEnum.POST
  );

  return (
    <div className="flex flex-col w-full items-center pb-32">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8">
        <Profile
          metadata={metaDataQuery}
          mintId={mintId}
          mintSummaryDetails={mintSummaryDetails}
        />
        <div className="flex flex-col flex-1 w-full">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="border-base-200 rounded border-x border-b w-full md:p-4">
            {selectedTab == TabsEnum.POST && (
              <ContentPanel metadata={metaDataQuery} mintId={mintId} />
            )}
            {selectedTab == TabsEnum.TRADE && <TradingPanel mintId={mintId} />}
          </div>
        </div>
      </div>
    </div>
  );
};
