'use client';

import { Criteria, Duration, Eligibility } from '@/utils/enums/campaign';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconPlus, IconX } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import {
  useCreateOrEditCampaign,
  useGetCampaigns,
  useStopCampaign,
} from './airdrop-data-access';

export const CreateCampaignButton: FC<{
  setId: Dispatch<SetStateAction<number | null>>;
}> = ({ setId }) => {
  return (
    <button
      className="btn btn-sm btn-primary w-fit"
      onClick={() => {
        setId(null);
        openCampaignModal();
      }}
    >
      <IconPlus />
      Start a New Campaign
    </button>
  );
};
function openCampaignModal(): void {
  return (
    document.getElementById('campaign_modal') as HTMLDialogElement
  ).showModal();
}

export const CampaignTable: FC<{
  setId: Dispatch<SetStateAction<number | null>>;
}> = ({ setId }) => {
  const { publicKey } = useWallet();
  const { data: campaigns, isLoading } = useGetCampaigns({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  return isLoading ? (
    <div className="flex w-full h-full items-center justify-center">
      <div className="loading loading-dots" />
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Criteria</th>
            <th>Elligibility</th>
            <th>Tokens Remaining</th>
            <th>Wallets Airdropped</th>
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
                <td>{x.eligibility}</td>
                <td>{`${formatLargeNumber(
                  x.tokensRemaining
                )} / ${formatLargeNumber(x.allocatedBudget)}`}</td>
                <td>{formatLargeNumber(x.wallets.length)}</td>
                <td>{getDDMMYYYY(new Date(x.startDate * 1000))}</td>
                <td>
                  {x.softDelete
                    ? 'Terminated'
                    : x.endDate
                    ? Date.now() / 1000 > x.endDate
                      ? 'Ended'
                      : getDDMMYYYY(new Date(x.startDate * 1000))
                    : x.tokensRemaining > 0
                    ? Duration.UNTILL_BUDGET_FINISHES
                    : 'Ended'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export const CampaignModal: FC<{ id: number | null }> = ({ id }) => {
  const currentTime = Date.now() / 1000;
  const [name, setName] = useState('');
  const [allocatedBudget, setAllocatedBudget] = useState('');
  const [amount, setAmount] = useState('');
  const [criteria, setCriteria] = useState(Criteria.SUBSCRIBERS_ONLY);
  const [eligibility, setEligibility] = useState(Eligibility.REFRESHES_DAILY);
  const [startDate, setStartDate] = useState(currentTime);
  const [endDate, setEndDate] = useState<number | undefined>();
  const [duration, setDuration] = useState(Duration.UNTILL_BUDGET_FINISHES);
  const { publicKey } = useWallet();
  const campaignMutation = useCreateOrEditCampaign({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const stopCampaignMutation = useStopCampaign({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const { data: campaigns } = useGetCampaigns({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });

  const campaign = campaigns?.find((x) => x.id == id);

  useEffect(() => {
    if (id && campaign) {
      setName(campaign.name);
      setAllocatedBudget(campaign.tokensRemaining.toString());
      setAmount(campaign.amount.toString());
      setCriteria(campaign.criteria);
      setEligibility(campaign.eligibility);
      setStartDate(campaign.startDate);
      if (campaign.endDate) {
        setDuration(Duration.CUSTOM_DATE);
        setEndDate(campaign.endDate);
      }
    } else if (!id) {
      setName('');
      setAllocatedBudget('');
      setAmount('');
      setCriteria(Criteria.SUBSCRIBERS_ONLY);
      setEligibility(Eligibility.REFRESHES_DAILY);
      setStartDate(currentTime);
      setEndDate(undefined);
      setDuration(Duration.UNTILL_BUDGET_FINISHES);
    }
  }, [campaign, id]);

  return (
    <dialog id="campaign_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            Airdrop Campaign
          </span>
          <form method="dialog">
            <button>
              <IconX />
            </button>
          </form>
        </div>
        <label className="input input-bordered text-base flex items-center gap-2">
          Name
          <input
            type="text"
            className="grow text-end"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign Name"
          />
        </label>
        <label className="input input-bordered text-base flex items-center gap-2">
          Budget
          <input
            type="number"
            className="grow text-end"
            value={allocatedBudget}
            onChange={(e) => setAllocatedBudget(e.target.value)}
            placeholder=""
          />
          {`${
            campaign?.allocatedBudget
              ? `/ ${formatLargeNumber(campaign.allocatedBudget)} left`
              : ''
          }`}
        </label>
        <label className="input input-bordered text-base flex items-center gap-2">
          Amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="grow text-end"
            placeholder=""
          />
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Criteria
          <select
            value={criteria}
            onChange={(e) => setCriteria(e.target.value as Criteria)}
            className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
          >
            {Object.entries(Criteria).map((x) => (
              <option key={x[0]}>{x[1]}</option>
            ))}
          </select>
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Elligibility
          <select
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value as Eligibility)}
            className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
          >
            {Object.entries(Eligibility).map((x) => (
              <option key={x[0]}>{x[1]}</option>
            ))}
          </select>
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Duration
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as Duration)}
            className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
          >
            {Object.entries(Duration).map((x) => (
              <option key={x[0]}>{x[1]}</option>
            ))}
          </select>
        </label>
        <label className="flex px-2 justify-between items-center gap-2">
          Start Date
          <input
            type="date"
            id="campaign start date"
            className="cursor-pointer input input-bordered w-fit sm:w-full max-w-xs"
            onChange={(e) => setStartDate(Date.parse(e.target.value) / 1000)}
            value={getDDMMYYYY(new Date(startDate * 1000))}
          />
        </label>
        {duration == Duration.CUSTOM_DATE && (
          <label className="flex px-2 justify-between items-center gap-2">
            End Date
            <input
              type="date"
              id="campaign start date"
              className="cursor-pointer input input-bordered w-fit sm:w-full max-w-xs"
              onChange={(e) => setEndDate(Date.parse(e.target.value) / 1000)}
              value={getDDMMYYYY(new Date((endDate || startDate) * 1000))}
            />
          </label>
        )}
        {!campaign || !campaign.softDelete ? (
          <div className="modal-action flex gap-2">
            {campaign && (
              <button
                disabled={stopCampaignMutation.isPending}
                onClick={() => {
                  if (!id || !campaign) return;
                  stopCampaignMutation.mutateAsync({
                    id,
                    amount: campaign.tokensRemaining,
                  });
                }}
                className="btn btn-warning"
              >
                {stopCampaignMutation.isPending ? (
                  <div className="loading loading-spinner" />
                ) : (
                  'Stop Campaign'
                )}
              </button>
            )}
            <button
              disabled={campaignMutation.isPending}
              onClick={() => {
                const difference =
                  parseInt(allocatedBudget) - (campaign?.tokensRemaining || 0);
                campaignMutation.mutateAsync({
                  id,
                  name: name,
                  allocatedBudget: campaign?.allocatedBudget
                    ? campaign.allocatedBudget + difference
                    : difference,
                  tokensRemaining:
                    (campaign?.tokensRemaining || 0) + difference,
                  amount: parseInt(amount),
                  criteria: criteria,
                  eligibility: eligibility,
                  startDate: startDate,
                  endDate: endDate,
                  difference,
                });
              }}
              className="btn btn-success"
            >
              {campaignMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : id ? (
                'Edit Campaign'
              ) : (
                'Start Campaign'
              )}
            </button>
          </div>
        ) : (
          <button disabled className="btn w-full">
            {'Campaign Stopped'}
          </button>
        )}
      </div>
    </dialog>
  );
};
