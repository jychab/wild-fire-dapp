'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconExclamationCircle } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import { useGetAccountInfo } from '../trading/trading-data-access';
import { useTopUpWallet } from './airdrop-data-access';
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
          <InAppWallet />
          <AirdropCampaign />
        </div>
      </div>
    </div>
  );
};

export const InAppWallet: FC = () => {
  const { publicKey } = useWallet();
  const mint = publicKey ? getDerivedMint(publicKey) : null;
  const { data: mintInfo } = useGetMintToken({
    mint,
  });
  const address = mintInfo ? new PublicKey(mintInfo.payer) : null;
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
            This wallet acts as the fee payer for all your in-app transactions,
            including airdrops.
          </span>
        </div>
        <span className="truncate">{`Wallet: ${mintInfo?.payer}`}</span>
        <div className="flex gap-2 items-center">
          <span className="truncate">Balance:</span>
          <span className="truncate">{`${
            (walletInfo?.lamports || 0) / LAMPORTS_PER_SOL
          } Sol`}</span>
          {(walletInfo?.lamports || 0) < LAMPORTS_PER_SOL * 0.1 ? (
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
        {publicKey && (
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
      <CampaignModal id={id} />
    </div>
  );
};
