'use client';

import { Duration } from '@/utils/enums/campaign';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { Campaign } from '@/utils/types/campaigns';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dispatch, FC, SetStateAction } from 'react';
import { useGetCampaigns } from './airdrop-data-access';
import { openCampaignModal } from './airship';

// CampaignTable Component
export const CampaignTable: FC<{
  setId: Dispatch<SetStateAction<number | undefined>>;
}> = ({ setId }) => {
  const { publicKey } = useWallet();
  const { data: campaigns, isLoading } = useGetCampaigns({
    address: publicKey,
  });

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="loading loading-dots" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Criteria</th>
            <th>Remaining</th>
            <th>Started At</th>
            <th>Ending At</th>
          </tr>
        </thead>
        <tbody>
          {campaigns
            ?.sort((a, b) => b.startDate - a.startDate)
            .map((x, index) => (
              <tr
                onClick={() => {
                  setId(x.id);
                  openCampaignModal();
                }}
                className="hover:bg-base-200 cursor-pointer"
                key={x.id}
              >
                <th>{index + 1}</th>
                <td>{x.name}</td>
                <td>{x.criteria}</td>
                <td>{`${formatLargeNumber(
                  x.tokensRemaining
                )} / ${formatLargeNumber(x.budget)}`}</td>
                <td>{getDDMMYYYY(new Date(x.startDate * 1000))}</td>
                <td>{getCampaignEndDate(x)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to get the campaign end date status
function getCampaignEndDate(campaign: Campaign): string {
  if (campaign.softDelete) return 'Terminated';
  if (campaign.endDate) {
    return Date.now() / 1000 > campaign.endDate
      ? 'Ended'
      : getDDMMYYYY(new Date(campaign.endDate * 1000));
  }
  return campaign.tokensRemaining > 0
    ? Duration.UNTILL_BUDGET_FINISHES
    : 'Ended';
}
