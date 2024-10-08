'use client';

import { PublicKey } from '@solana/web3.js';
import { FC, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import { TradingPanel } from '../trading/trading.ui';
import {
  ContentPanel,
  TokenProfile,
  TokenTabs,
  TokenTabsEnum,
} from './token-ui';

export const TokenFeature: FC<{
  mintId: string | null;
  tab: string | null;
}> = ({ mintId, tab }) => {
  const { data: mintTokenDetails } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const [selectedTab, setSelectedTab] = useState(
    tab
      ? Object.entries(TokenTabsEnum).find(
          (x) => x[0].toLowerCase() == tab.toLowerCase()
        )?.[1] || TokenTabsEnum.POSTS
      : TokenTabsEnum.POSTS
  );

  return (
    <div className="flex flex-col w-full flex-1 h-full items-center animate-fade-right animate-duration-200 sm:animate-none">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <TokenProfile mintId={mintId} />
        <div className="flex flex-col flex-1 h-full w-full">
          <TokenTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
          />
          <div className="rounded border-x border-b border-base-300 h-full md:p-4">
            {selectedTab == TokenTabsEnum.POSTS && (
              <ContentPanel mintId={mintId} />
            )}
            {selectedTab == TokenTabsEnum.TRADE &&
              mintId &&
              mintTokenDetails?.memberMint && (
                <TradingPanel
                  collectionMint={mintId}
                  mintId={mintTokenDetails.memberMint}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
