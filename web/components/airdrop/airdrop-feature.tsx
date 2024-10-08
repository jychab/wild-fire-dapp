'use client';

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconExclamationCircle } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { useGetAccountInfo } from '../trading/trading-data-access';
import { useGetPayer, useTopUpWallet } from './airdrop-data-access';
import { CampaignTable } from './airdrop-ui';
import { AirshipModal, CreateCampaignButton } from './airship';

export const AirdropFeature: FC = () => {
  return (
    <div className="flex flex-col w-full h-full items-center">
      <div className="flex flex-col gap-8 items-center w-full max-w-7xl py-4 h-full">
        <div className="flex flex-col gap-4 items-center justify-center h-40 p-4">
          <span className="text-3xl md:text-4xl text-center">
            Share your content through Airdrops
          </span>
          <span className="text-md md:text-base text-center px-4">
            Launch personalized airdrop campaigns to share your content.
          </span>
        </div>
        <div className="flex flex-col flex-1 h-full w-full">
          <InAppWallet />
          <AirdropCampaign />
        </div>
      </div>
    </div>
  );
};

export const InAppWallet: FC = () => {
  const { publicKey } = useWallet();
  const { data: payer } = useGetPayer({
    address: publicKey,
  });
  const address = payer?.publicKey ? new PublicKey(payer.publicKey) : null;
  const { data: walletInfo } = useGetAccountInfo({
    address,
  });
  const topUpMutation = useTopUpWallet({ address });
  return (
    <div className="p-4 overflow-x-hidden">
      <div className="rounded-box flex flex-col border border-base-300 gap-4 p-4">
        <div>
          <div className="items-start flex gap-2 ">
            <span className="text-lg font-bold truncate">
              Associated In-App Wallet
            </span>
          </div>
          <span className="text-sm sm:text-base line-clamp-2">
            This wallet acts as the fee payer for your airdrop transactions.
          </span>
        </div>
        <span className="truncate">{`Wallet: ${payer?.publicKey}`}</span>
        <div className="flex gap-2 items-center">
          <span className="truncate">Balance:</span>
          <span className="truncate">{`${
            (walletInfo?.lamports || 0) / LAMPORTS_PER_SOL
          } Sol`}</span>
          {(walletInfo?.lamports || 0) < LAMPORTS_PER_SOL * 0.001 ? (
            <>
              <div className="text-warning flex gap-1 items-center">
                <IconExclamationCircle size={20} />
                Insufficient balance.
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        {publicKey && (walletInfo?.lamports || 0) < LAMPORTS_PER_SOL * 0.1 && (
          <div className="flex justify-start">
            <button
              disabled={topUpMutation.isPending}
              onClick={() =>
                topUpMutation.mutateAsync({ amount: LAMPORTS_PER_SOL * 0.1 })
              }
              className="btn btn-sm btn-primary w-fit"
            >
              {topUpMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : (
                'Top Up (0.1 Sol)'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AirdropCampaign: FC = () => {
  const [id, setId] = useState<number>();
  return (
    <div className="flex flex-col w-full gap-8 p-4">
      <CreateCampaignButton setId={setId} />
      <CampaignTable setId={setId} />
      <AirshipModal id={id} setId={setId} />
    </div>
  );
};
