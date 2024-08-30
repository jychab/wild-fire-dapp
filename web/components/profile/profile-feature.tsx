'use client';

import { FC, useState } from 'react';
import { TradingPanel } from '../trading/trading.ui';
import { ContentPanel, Profile, Tabs, TabsEnum } from './profile-ui';

export const ProfileFeature: FC<{
  mintId: string | null;
  tab: string | null;
}> = ({ mintId, tab }) => {
  const [selectedTab, setSelectedTab] = useState(
    tab
      ? Object.entries(TabsEnum).find(
          (x) => x[0].toLowerCase() == tab.toLowerCase()
        )?.[1] || TabsEnum.POST
      : TabsEnum.POST
  );

  return (
    <div className="flex flex-col w-full flex-1 h-full items-center">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <Profile mintId={mintId} />
        <div className="flex flex-col flex-1 h-full w-full">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="rounded border-x border-b border-base-300 h-full md:p-4">
            {selectedTab == TabsEnum.POST && <ContentPanel mintId={mintId} />}
            {selectedTab == TabsEnum.TRADE && <TradingPanel mintId={mintId} />}
          </div>
        </div>
      </div>
    </div>
  );
};
