'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { ContentPanel, Profile } from './profile-ui';

export const ProfileFeature: FC<{ address: string | null }> = ({ address }) => {
  return (
    <div className="flex flex-col w-full flex-1 h-full items-center animate-fade-right animate-duration-200 sm:animate-none">
      <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8 h-full">
        <Profile
          mintId={
            address ? getDerivedMint(new PublicKey(address)).toBase58() : null
          }
        />
        <div className="flex flex-col flex-1 h-full w-full">
          <div
            role="tablist"
            className="tabs tabs-lifted tabs-lg w-full rounded"
          >
            <input
              type="radio"
              role="tab"
              className={`tab font-semibold [--tab-bg:transparent] tab-active`}
              aria-label={'Your Posts'}
            />
          </div>
          <div className="rounded border-x border-b border-base-300 h-full md:p-4">
            <ContentPanel address={address} />
          </div>
        </div>
      </div>
    </div>
  );
};
