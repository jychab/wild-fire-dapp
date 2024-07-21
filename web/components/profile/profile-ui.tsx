'use client';

import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconEdit } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { Scope } from '../../utils/enums/das';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetTokenAccountInfo,
  useIsLiquidityPoolFound,
  useSwapMutation,
} from '../trading/trading-data-access';
import { TradingPanel } from '../trading/trading.ui';
import { UploadBtn } from '../upload/upload-ui';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from './profile-data-access';

export interface AuthorityData {
  mint: PublicKey;
  admin: PublicKey;
  distributor: PublicKey;
  mutable: number;
}

enum TabsEnum {
  POST = 'Posts',
  TRADE = 'Trade',
}

export const ProfilePage: FC<{
  mintId: string;
  tab: string | null;
}> = ({ mintId, tab }) => {
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: new PublicKey(mintId),
  });

  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: metaDataQuery ? new PublicKey(mintId) : null,
  });

  const [selectedTab, setSelectedTab] = useState(
    tab
      ? Object.entries(TabsEnum).find(
          (x) => x[0].toLowerCase() == tab.toLowerCase()
        )?.[1] || TabsEnum.POST
      : TabsEnum.POST
  );

  return (
    <div className="flex flex-col w-full items-center">
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
              <ContentPanel metadata={metaDataQuery} />
            )}
            {selectedTab == TabsEnum.TRADE && (
              <TradingPanel mintId={mintId} metadata={metaDataQuery} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContentPanelProps {
  metadata: DAS.GetAssetResponse | null | undefined;
}

const ContentPanel: FC<ContentPanelProps> = ({ metadata }) => {
  return (
    <>
      <ContentGrid
        hideComment={true}
        multiGrid={true}
        showMintDetails={false}
        editable={true}
        content={
          metadata?.additionalInfoData?.content
            ? metadata.additionalInfoData.content.map((x) => {
                return {
                  ...x,
                  name: metadata.content!.metadata.name,
                  symbol: metadata.content!.metadata.symbol,
                  image: metadata.content!.links!.image!,
                  mint: metadata.id,
                };
              })
            : undefined
        }
      />
      {metadata?.additionalInfoData?.content?.length == 0 && (
        <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
          Create your first post!
          <div className="w-36">
            <UploadBtn mintId={metadata?.id} />
          </div>
        </div>
      )}
    </>
  );
};

interface TabsProps {
  selectedTab: TabsEnum;
  setSelectedTab: (value: TabsEnum) => void;
}

const Tabs: FC<TabsProps> = ({ selectedTab, setSelectedTab }) => {
  return (
    <div
      role="tablist"
      className="tabs tabs-lifted tabs-md md:tabs-lg w-full rounded"
    >
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold ${
          selectedTab == TabsEnum.POST ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.POST}
        onChange={() => setSelectedTab(TabsEnum.POST)}
        aria-label={TabsEnum.POST}
      />
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold ${
          selectedTab == TabsEnum.TRADE ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.TRADE}
        onChange={() => setSelectedTab(TabsEnum.TRADE)}
        aria-label={`${TabsEnum.TRADE}`}
      />
    </div>
  );
};

interface ProfileProps {
  mintSummaryDetails:
    | {
        currentHoldersCount: number;
        holdersChange24hPercent: number;
      }
    | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
  mintId: string;
}

const Profile: FC<ProfileProps> = ({
  metadata,
  mintId,
  mintSummaryDetails,
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: authorityData } = useGetMintToken({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });
  const { data: tokenDetails } = useGetTokenDetails({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const { data: tokenInfo } = useGetTokenAccountInfo({
    address:
      metadata && publicKey
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info!.token_program!)
          )
        : null,
  });

  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const swapMutation = useSwapMutation({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });
  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-base-100">
      <div className="w-40 h-40">
        {metadata && metadata.content?.links?.image && (
          <div className="relative h-full w-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata?.content?.links?.image}
              alt={''}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <span className="text-2xl lg:text-3xl font-bold">
              {metadata?.content?.metadata.name}
            </span>
          </div>
          <span className="">{metadata?.content?.metadata.symbol}</span>
        </div>

        <div className="flex items-center gap-2 ">
          <div
            data-tip={`${
              isLiquidityPoolFound
                ? ''
                : 'Create a liquidity pool to unlock this feature'
            }`}
            className="tooltip "
          >
            <button
              disabled={
                !isLiquidityPoolFound || (!!tokenInfo && tokenInfo.amount > 0)
              }
              onClick={async () => {
                swapMutation.mutateAsync({
                  amount: 1,
                  inputMint: NATIVE_MINT.toBase58(),
                  outputMint: mintId,
                  swapMode: 'ExactOut',
                });
              }}
              className="btn btn-success btn-sm w-32 "
            >
              {tokenInfo && tokenInfo.amount > 0 ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {authorityData &&
            publicKey &&
            authorityData.mutable == 1 &&
            (publicKey.toBase58() == authorityData.admin.toBase58() ||
              metadata?.authorities?.find(
                (x) =>
                  x.scopes.includes(Scope.METADATA) ||
                  x.scopes.includes(Scope.FULL)
              )?.address == publicKey.toBase58()) && (
              <button
                className="btn btn-outline btn-sm items-center"
                onClick={() => router.push(`/mint/edit?mintId=${mintId}`)}
              >
                <IconEdit />
                Edit
              </button>
            )}
        </div>

        <div className="flex items-center gap-2">
          {mintSummaryDetails && (
            <>
              <span>
                {formatLargeNumber(
                  mintSummaryDetails?.currentHoldersCount || 0
                ) + ' Holders'}
              </span>
              <span
                className={`${
                  mintSummaryDetails.holdersChange24hPercent < 0
                    ? 'text-error'
                    : 'text-success'
                }`}
              >
                {mintSummaryDetails.holdersChange24hPercent < 0
                  ? `-${mintSummaryDetails.holdersChange24hPercent}%`
                  : `+${mintSummaryDetails.holdersChange24hPercent}%`}
              </span>
            </>
          )}

          {tokenDetails?.token_info?.price_info?.price_per_token && (
            <>
              ||
              <span>{`$${
                tokenDetails?.token_info?.price_info?.price_per_token || 0
              }
              `}</span>
            </>
          )}
        </div>

        <span className="text-sm truncate font-normal">
          {metadata?.content?.metadata?.description}
        </span>
      </div>
    </div>
  );
};
