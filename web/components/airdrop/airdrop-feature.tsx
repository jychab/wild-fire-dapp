'use client';

import { FC, useState } from 'react';
import {
  CampaignModal,
  CampaignTable,
  CreateCampaignButton,
} from './airdrop-ui';

export const AirdropFeature: FC = () => {
  return (
    <div className="flex flex-col w-full h-full items-center">
      <div className="flex flex-col gap-8 items-center w-full max-w-7xl py-8 h-full">
        <div className="flex flex-col gap-4 items-center justify-center h-40">
          <span className="text-3xl md:text-4xl text-center">
            Share your content through Airdrops
          </span>
          <span className="text-md md:text-base text-center px-4">
            Launch personalized airdrop campaigns to share your content.
          </span>
        </div>
        <div className="flex flex-col flex-1 h-full w-full">
          <div className="border-base-200 rounded border border h-full">
            <AirdropCampaign />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AirdropCampaign: FC = () => {
  const [id, setId] = useState<string | null>(null);
  return (
    <div className="flex flex-col w-full gap-8 p-4">
      <CreateCampaignButton setId={setId} />
      <CampaignTable setId={setId} />
      <CampaignModal id={id} />
    </div>
  );
};
