'use client';

import { Scope } from '@/utils/enums/das';
import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconEdit } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetPoolState,
  useGetPrice,
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
    <div className="flex flex-col w-full items-center pb-32">
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
              <ContentPanel metadata={metaDataQuery} mintId={mintId} />
            )}
            {selectedTab == TabsEnum.TRADE && <TradingPanel mintId={mintId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContentPanelProps {
  mintId: string;
  metadata: DAS.GetAssetResponse | null | undefined;
}

const ContentPanel: FC<ContentPanelProps> = ({ mintId, metadata }) => {
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });
  return (
    <>
      <ContentGrid
        hideComment={true}
        multiGrid={true}
        showMintDetails={false}
        editable={true}
        posts={
          metadata?.additionalInfoData?.posts
            ? metadata.additionalInfoData.posts.map((x) => {
                return {
                  ...x,
                  metadata,
                };
              })
            : undefined
        }
      />
      {metadata?.additionalInfoData?.posts?.length == 0 &&
        ((tokenStateData &&
          publicKey &&
          publicKey.toBase58() == tokenStateData.admin) ||
        (publicKey &&
          metadata?.authorities?.find(
            (x) =>
              x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
          )?.address == publicKey.toBase58()) ? (
          <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
            Create your first post!
            <div className="w-36">
              <UploadBtn mintId={metadata?.id} />
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
            No post found!
          </div>
        ))}
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
    | null
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
  const { data: tokenStateData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });
  const { data: tokenDetails } = useGetTokenDetails({
    mint: new PublicKey(mintId),
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
    mint: new PublicKey(mintId),
  });

  const swapMutation = useSwapMutation({
    mint: new PublicKey(mintId),
  });

  const { data: poolState } = useGetPoolState({ mint: new PublicKey(mintId) });

  const { data: price } = useGetPrice({ mint: new PublicKey(mintId) });

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
              src={metadata?.content?.links?.image!}
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
          <span>{metadata?.content?.metadata.symbol}</span>
        </div>

        <div className="flex items-center gap-2 ">
          <button
            disabled={
              !isLiquidityPoolFound || (!!tokenInfo && tokenInfo.amount > 0)
            }
            onClick={async () => {
              swapMutation.mutateAsync({
                poolState,
                amount: 1,
                inputMint: NATIVE_MINT.toBase58(),
                outputMint: mintId,
                swapMode: 'ExactOut',
              });
            }}
            className="btn btn-success btn-sm w-32 "
          >
            {tokenInfo && tokenInfo.amount > 0 ? (
              'Subscribed'
            ) : swapMutation.isPending ? (
              <div className="loading loading-spinner" />
            ) : (
              'Subscribe'
            )}
          </button>

          {tokenStateData && publicKey && tokenStateData.mutable == 1 && (
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
          {mintSummaryDetails &&
            (tokenDetails?.token_info?.price_info?.price_per_token || price) &&
            '||'}
          {(tokenDetails?.token_info?.price_info?.price_per_token || price) && (
            <>
              <span>{`$${(
                tokenDetails?.token_info?.price_info?.price_per_token ||
                price ||
                0
              ).toPrecision(6)}
              `}</span>
            </>
          )}
        </div>
        <span className="text-base truncate font-normal">
          {metadata?.content?.metadata.description}
        </span>
      </div>
    </div>
  );
};
