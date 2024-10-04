'use client';

import { COST_PER_NO_RENT_TRANSFER_IN_SOL } from '@/utils/consts';
import { Criteria, Duration, Eligibility } from '@/utils/enums/campaign';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { Campaign } from '@/utils/types/campaigns';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IconPlus, IconX } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import { useGetCampaigns, useStopCampaign } from './airdrop-data-access';

// Utility function for opening the modal
function openCampaignModal(): void {
  (document.getElementById('campaign_modal') as HTMLDialogElement)?.showModal();
}

// CreateCampaignButton Component
export const CreateCampaignButton: FC<{
  setId: Dispatch<SetStateAction<number | undefined>>;
}> = ({ setId }) => (
  <button
    className="btn btn-sm btn-primary w-fit"
    onClick={() => {
      setId(undefined);
      openCampaignModal();
    }}
  >
    <IconPlus />
    Start a New Campaign
  </button>
);

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
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Criteria</th>
            <th>Eligibility</th>
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
                )} / ${formatLargeNumber(x.budget)}`}</td>
                <td>{formatLargeNumber(x.wallets.length)}</td>
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

// CampaignModal Component
export const CampaignModal: FC<{
  id?: number;
  setId: Dispatch<SetStateAction<number | undefined>>;
}> = ({ id, setId }) => {
  const currentTime = Date.now() / 1000;
  const [name, setName] = useState('');
  const [tokensRemaining, setTokensRemaining] = useState('');
  const [amount, setAmount] = useState('');
  const [criteria, setCriteria] = useState(Criteria.SUBSCRIBERS_ONLY);
  const [eligibility, setEligibility] = useState(Eligibility.REFRESHES_DAILY);
  const [startDate, setStartDate] = useState(currentTime);
  const [endDate, setEndDate] = useState<number | undefined>();
  const [duration, setDuration] = useState(Duration.UNTILL_BUDGET_FINISHES);
  const { publicKey } = useWallet();
  const { data: mintInfo } = useGetMintToken({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });

  // const campaignMutation = useCreateOrEditCampaign({
  //   address: publicKey,
  //   payer: mintInfo ? new PublicKey(mintInfo?.payer) : null,
  // });
  const stopCampaignMutation = useStopCampaign({ address: publicKey });
  const { data: campaigns } = useGetCampaigns({ address: publicKey });
  const { connection } = useConnection();
  // Helper function to close the modal
  function closeModal() {
    setId(undefined);
    (document.getElementById('campaign_modal') as HTMLDialogElement)?.close();
  }

  const campaign = campaigns?.find((x) => x.id === id);

  // Handle form state reset on id or campaign change
  useEffect(() => {
    if (id && campaign) {
      setName(campaign.name);
      setTokensRemaining(campaign.tokensRemaining.toString());
      setAmount(campaign.amount.toString());
      setCriteria(campaign.criteria);
      setEligibility(campaign.eligibility);
      setStartDate(campaign.startDate);
      if (campaign.endDate) {
        setDuration(Duration.CUSTOM_DATE);
        setEndDate(campaign.endDate);
      }
    } else {
      resetForm();
    }
  }, [campaign, id]);

  // Reset form state
  function resetForm() {
    setName('');
    setTokensRemaining('');
    setAmount('');
    setCriteria(Criteria.SUBSCRIBERS_ONLY);
    setEligibility(Eligibility.REFRESHES_DAILY);
    setStartDate(currentTime);
    setEndDate(undefined);
    setDuration(Duration.UNTILL_BUDGET_FINISHES);
  }

  return (
    <dialog id="campaign_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            Airdrop Campaign
          </span>
          <button onClick={closeModal}>
            <IconX />
          </button>
        </div>

        {/* Campaign Name Input */}
        <InputLabel
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Campaign Name"
        />

        {/* Budget Input */}
        <InputLabel
          label="Budget"
          value={tokensRemaining}
          type="number"
          onChange={(e) => setTokensRemaining(e.target.value)}
          placeholder="Total allocated tokens"
          hint={
            campaign?.budget
              ? `/ ${formatLargeNumber(campaign.budget)} left`
              : ''
          }
        />

        {/* Amount Input */}
        <InputLabel
          label="Amount"
          value={amount}
          type="number"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Tokens to airdrop each time"
        />

        {/* Criteria Select */}
        <SelectLabel
          label="Criteria"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value as Criteria)}
          options={Object.entries(Criteria).filter(
            ([_, v]) => v === Criteria.SUBSCRIBERS_ONLY
          )}
        />

        {/* Eligibility Select */}
        <SelectLabel
          label="Eligibility"
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value as Eligibility)}
          options={Object.entries(Eligibility)}
        />

        {/* Duration Select */}
        <SelectLabel
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value as Duration)}
          options={Object.entries(Duration)}
        />

        {/* Start Date Input */}
        <InputLabel
          label="Start Date"
          value={getDDMMYYYY(new Date(startDate * 1000))}
          type="date"
          onChange={(e) => setStartDate(Date.parse(e.target.value) / 1000)}
        />

        {/* Conditional End Date Input */}
        {duration === Duration.CUSTOM_DATE && (
          <InputLabel
            label="End Date"
            value={getDDMMYYYY(new Date((endDate || startDate) * 1000))}
            type="date"
            onChange={(e) => setEndDate(Date.parse(e.target.value) / 1000)}
          />
        )}

        {/* Estimated Cost */}
        {tokensRemaining && amount && publicKey && (
          <label className="flex px-2 justify-between items-center gap-2">
            Estimated Cost
            <span>{`~${
              calculateTopUp(
                parseFloat(tokensRemaining) - (campaign?.tokensRemaining || 0),
                amount
              ) / LAMPORTS_PER_SOL
            } SOL`}</span>
          </label>
        )}

        {/* Modal Actions */}
        {!campaign?.softDelete ? (
          <div className="modal-action flex gap-2">
            {campaign && (
              <button
                disabled={stopCampaignMutation.isPending}
                onClick={() => stopCampaign(campaign.id)}
                className="btn btn-outline"
              >
                {stopCampaignMutation.isPending ? (
                  <div className="loading loading-spinner" />
                ) : (
                  'Stop Campaign'
                )}
              </button>
            )}
            <button
              // disabled={campaignMutation.isPending}
              onClick={handleCampaignMutation}
              className="btn btn-primary"
            >
              {/* {campaignMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : id ? (
                'Edit Campaign'
              ) : (
                'Start Campaign'
              )} */}
            </button>
          </div>
        ) : (
          <button disabled className="btn w-full">
            Campaign Stopped
          </button>
        )}
      </div>
    </dialog>
  );

  // Handle stop campaign
  async function stopCampaign(campaignId: number) {
    if (!campaignId || !campaign) return;
    await stopCampaignMutation.mutateAsync({
      id: campaignId,
      amount: campaign.tokensRemaining,
    });
    closeModal();
  }

  // Handle create or edit campaign
  async function handleCampaignMutation() {
    if (!publicKey || !tokensRemaining || !amount) return;
    const { difference } = await calculateDifference(
      tokensRemaining,
      campaign?.tokensRemaining || 0
    );

    const newBudget = (campaign?.budget || 0) + difference;
    const newTokensRemaining = (campaign?.tokensRemaining || 0) + difference;
    const topUp = calculateTopUp(difference, amount);

    // await campaignMutation.mutateAsync({
    //   topUp,
    //   id,
    //   name,
    //   budget: newBudget,
    //   tokensRemaining: newTokensRemaining,
    //   amount: parseFloat(amount),
    //   criteria,
    //   eligibility,
    //   startDate,
    //   endDate,
    //   difference,
    //   mint: getDerivedMint(publicKey).toBase58(),
    //   mintToSend: getDerivedMint(publicKey).toBase58(),
    //   mintToSendDecimals: DEFAULT_MINT_DECIMALS,
    //   mintToSendTokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    // });
    closeModal();
  }
};

async function calculateDifference(
  tokensRemaining: string,
  currentTokensRemaining: number
) {
  const difference = parseFloat(tokensRemaining) - currentTokensRemaining;

  return { difference };
}

// Calculate top-up value
function calculateTopUp(
  differenceAmountAfterTransferFee: number,
  amount: string
) {
  const currentCost = differenceAmountAfterTransferFee / parseFloat(amount);
  return Math.max(
    Math.round(
      currentCost * COST_PER_NO_RENT_TRANSFER_IN_SOL * LAMPORTS_PER_SOL
    ),
    0
  );
}

// Reusable InputLabel Component
const InputLabel: FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, hint }) => (
  <label className="input input-bordered text-base flex items-center gap-2">
    {label}
    <input
      type={type}
      className="grow text-end"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {hint && <span>{hint}</span>}
  </label>
);

// Reusable SelectLabel Component
const SelectLabel: FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: [string, string][];
}> = ({ label, value, onChange, options }) => (
  <label className="flex px-2 justify-between items-center gap-2">
    {label}
    <select
      value={value}
      onChange={onChange}
      className="select bg-transparent w-fit sm:w-full border-none focus-within:outline-none max-w-xs"
    >
      {options.map(([key, val]) => (
        <option key={key} value={val}>
          {val}
        </option>
      ))}
    </select>
  </label>
);
