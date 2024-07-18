'use client';

import { DAS } from '@/utils/types/das';
import {
  getAssociatedTokenAddressSync,
  Mint,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TransferFeeConfig,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconDiscountCheck, IconEdit } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { Scope } from '../../utils/enums/das';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  SwapType,
  useGetAddressInfo,
  useGetTokenAccountInfo,
  useSwapDetails,
  useSwapMint,
} from '../trading/trading-data-access';
import { TradingPanel } from '../trading/trading.ui';
import { UploadBtn } from '../upload/upload-ui';
import {
  useGetLargestAccountFromMint,
  useGetMintDetails,
  useGetMintSummaryDetails,
  useGetMintTransferFeeConfig,
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
  DETAILS = 'Details',
  TRADE = 'Trade',
}

export const ProfilePage: FC<{
  mintId: string;
  tab: string | null;
}> = ({ mintId, tab }) => {
  const { data: mintTokenData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });

  const { data: metaDataQuery } = useGetTokenDetails({
    mint: new PublicKey(mintId),
  });

  const { data: largestFromMint } = useGetLargestAccountFromMint({
    mint: new PublicKey(mintId),
  });

  const { data: mintQuery } = useGetMintDetails({
    mint: new PublicKey(mintId),
    tokenProgram: metaDataQuery?.token_info?.token_program
      ? new PublicKey(metaDataQuery?.token_info?.token_program)
      : undefined,
  });

  const { data: transferFeeConfig } = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });

  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: new PublicKey(mintId),
  });

  const [selectedTab, setSelectedTab] = useState(
    tab
      ? Object.entries(TabsEnum).find(
          (x) => x[0].toLowerCase() == tab.toLowerCase()
        )?.[1] || TabsEnum.POST
      : TabsEnum.POST
  );

  return (
    <div className="flex flex-col h-full w-full min-h-[1000px] items-center">
      <div className="flex flex-col gap-8 items-start w-full h-full max-w-7xl py-8">
        <Profile
          metadata={metaDataQuery}
          authorityData={mintTokenData}
          mintSummaryDetails={mintSummaryDetails}
        />
        <div className="flex flex-col flex-1 w-full h-full">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="border-base-200 rounded border-x border-b w-full sm:h-full md:p-4">
            {selectedTab == TabsEnum.POST && (
              <ContentPanel metadata={metaDataQuery} />
            )}
            {selectedTab == TabsEnum.TRADE && (
              <TradingPanel metadata={metaDataQuery} />
            )}
            {selectedTab == TabsEnum.DETAILS && (
              <DetailsPanel
                transferFeeConfig={transferFeeConfig}
                authorityData={mintTokenData}
                largestTokenAccount={largestFromMint}
                mintQuery={mintQuery}
                metadata={metaDataQuery}
                mintSummaryDetails={mintSummaryDetails}
              />
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

interface DetailsPanelProps
  extends MainPanelProps,
    DetailsProps,
    ActivitiesProps {}

const DetailsPanel: FC<DetailsPanelProps> = ({
  transferFeeConfig,
  mintQuery,
  authorityData,
  metadata,
  largestTokenAccount,
  mintSummaryDetails,
}) => {
  return (
    <>
      <MainPanel
        metadata={metadata}
        authorityData={authorityData}
        mintQuery={mintQuery}
        mintSummaryDetails={mintSummaryDetails}
      />
      <Details
        transferFeeConfig={transferFeeConfig}
        authorityData={authorityData}
        metadata={metadata}
      />
      <Activities
        largestTokenAccount={largestTokenAccount}
        mintQuery={mintQuery}
      />
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
        aria-label={TabsEnum.TRADE}
      />
      <input
        type="radio"
        role="tab"
        className={`tab font-semibold ${
          selectedTab == TabsEnum.DETAILS ? 'tab-active' : ''
        }`}
        aria-label={TabsEnum.DETAILS}
        onChange={() => setSelectedTab(TabsEnum.DETAILS)}
        checked={selectedTab == TabsEnum.DETAILS}
      />
    </div>
  );
};

interface ActivitiesProps {
  largestTokenAccount: any[] | undefined;
  mintQuery: Mint | null | undefined;
}

const Activities: FC<ActivitiesProps> = ({
  largestTokenAccount,
  mintQuery,
}) => {
  return (
    <div className="p-4 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Activities</span>
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded bg-base-200 col-span-4 p-4">
          <span className="card-title text-base">Top 20 Holders List</span>
          {largestTokenAccount && mintQuery && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Owner</th>
                    <th>Quantity</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {largestTokenAccount.map((x, index) => (
                    <tr key={x.address.toBase58()}>
                      <th>{index + 1}</th>
                      <td className="max-w-xs truncate hover:text-info">
                        <Link
                          rel="noopener noreferrer"
                          target="_blank"
                          href={`https://solscan.io/address/${x.owner.toBase58()}`}
                        >
                          {x.owner.toBase58()}
                        </Link>
                      </td>
                      <td className="">{formatLargeNumber(x.uiAmount!)}</td>
                      <td className="">
                        {`${(Number(mintQuery.supply) != 0
                          ? (x.uiAmount! / Number(mintQuery.supply)) * 100
                          : 0
                        ).toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfileProps {
  mintSummaryDetails:
    | {
        currentPrice: number;
        currentHoldersCount: number;
        holdersChange24hPercent: number;
        priceChange24hPercent: number;
      }
    | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
  authorityData: AuthorityData | null | undefined;
}

const Profile: FC<ProfileProps> = ({
  metadata,
  authorityData,
  mintSummaryDetails,
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenDetails } = useGetTokenDetails({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });
  const swapToken = useSwapMint({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });
  const { data: swapDetails } = useSwapDetails({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const { data: solDetails } = useGetTokenDetails({ mint: NATIVE_MINT });

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
  return (
    <div className="flex flex-col lg:flex-row items-center p-4 gap-4 w-full bg-base-100">
      <div className="w-32 h-32 lg:w-40 lg:h-40">
        {metadata && metadata.content?.links?.image && (
          <div className="relative h-full w-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata.content.links.image}
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

        <div className="flex items-center gap-2">
          <button
            disabled={!swapDetails || (!!tokenInfo && tokenInfo.amount > 0)}
            onClick={() => {
              if (swapDetails) {
                metadata &&
                  swapToken.mutateAsync({
                    type: SwapType.BasedOutput,
                    max_amount_in: 0.01 * LAMPORTS_PER_SOL, // 0.01 SOL to subscribe ~$1
                    amount_out: 1,
                    inputToken: NATIVE_MINT,
                    outputToken: new PublicKey(metadata.id),
                    inputTokenProgram: TOKEN_PROGRAM_ID,
                    outputTokenProgram: TOKEN_2022_PROGRAM_ID,
                  });
              }
            }}
            className="btn btn-success btn-sm w-32"
          >
            {swapToken.isPending ? (
              <div className="loading loading-spinner" />
            ) : (
              <div
                data-tip={
                  'Feature will be unlocked once a liquidity pool is initialized.'
                }
                className={`${!swapDetails ? 'tooltip tooltip-secondary' : ''}`}
              >
                {tokenInfo && tokenInfo.amount > 0 ? 'Subscribed' : 'Subscribe'}
              </div>
            )}
          </button>
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
                onClick={() =>
                  metadata && router.push(`/mint/edit?mintId=${metadata.id}`)
                }
              >
                <IconEdit />
                Edit
              </button>
            )}
        </div>

        <div className="flex items-center gap-2">
          <span>
            {formatLargeNumber(mintSummaryDetails?.currentHoldersCount || 0) +
              ' Holders'}
          </span>

          {(tokenDetails?.token_info?.price_info?.price_per_token ||
            mintSummaryDetails) && (
            <>
              ||
              <span>{`$${
                tokenDetails?.token_info?.price_info?.price_per_token
                  ? tokenDetails?.token_info?.price_info?.price_per_token
                  : (
                      ((mintSummaryDetails?.currentPrice || 0) *
                        (solDetails?.token_info?.price_info?.price_per_token ||
                          0)) /
                      LAMPORTS_PER_SOL
                    ).toPrecision(3)
              }`}</span>
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

interface DetailsProps {
  transferFeeConfig: TransferFeeConfig | null | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
  authorityData: AuthorityData | null | undefined;
}

const Details: FC<DetailsProps> = ({
  transferFeeConfig,
  metadata,
  authorityData,
}) => {
  const { connection } = useConnection();
  const [currentEpoch, setCurrentEpoch] = useState<number>();

  useEffect(() => {
    if (!currentEpoch && connection) {
      connection.getEpochInfo().then((x) => setCurrentEpoch(x.epoch));
    }
  }, [connection, currentEpoch]);

  return (
    <div className="bg-base-100 px-4 gap-4 w-full">
      <div className="grid grid-cols-4 gap-2 ">
        <div className="card rounded bg-base-200 col-span-4 md:col-span-2">
          <div className="stat gap-2 w-fit">
            <div className="stat-title text-sm md:text-base">Mint</div>
            <Link
              rel="noopener noreferrer"
              target="_blank"
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solscan.io/address/${metadata?.id}`}
            >
              {metadata?.id}
            </Link>
            <div className="stat-title text-sm md:text-base truncate">
              Authority
            </div>
            <Link
              rel="noopener noreferrer"
              target="_blank"
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solscan.io/address/${
                authorityData
                  ? authorityData.admin
                  : metadata?.authorities?.find(
                      (x) =>
                        x.scopes.includes(Scope.METADATA) ||
                        x.scopes.includes(Scope.FULL)
                    )?.address
              }`}
            >
              {authorityData
                ? authorityData.admin.toBase58()
                : metadata?.authorities?.find(
                    (x) =>
                      x.scopes.includes(Scope.METADATA) ||
                      x.scopes.includes(Scope.FULL)
                  )?.address}
            </Link>
          </div>
        </div>
        <div className="flex bg-base-200 items-center rounded col-span-4 md:col-span-2 ">
          <div className="stat gap-1">
            <div className="stat-title text-sm md:text-base truncate">
              Transfer Fee
            </div>
            {transferFeeConfig ? (
              <>
                <div className="stat-value text-base md:text-xl truncate font-normal">{`${
                  currentEpoch &&
                  transferFeeConfig.newerTransferFee.epoch <= currentEpoch
                    ? `${
                        transferFeeConfig.newerTransferFee
                          .transferFeeBasisPoints / 100
                      }%`
                    : `${
                        transferFeeConfig.olderTransferFee
                          .transferFeeBasisPoints / 100
                      }% (current) -> ${
                        transferFeeConfig.newerTransferFee
                          .transferFeeBasisPoints / 100
                      }% (upcoming)`
                } `}</div>
                {
                  <div className="stat-desc text-xs md:text-sm truncate font-normal">
                    {`Max Fee: ${
                      currentEpoch &&
                      transferFeeConfig.newerTransferFee.epoch <= currentEpoch
                        ? Number(
                            transferFeeConfig.newerTransferFee.maximumFee
                          ) != Number.MAX_SAFE_INTEGER
                          ? formatLargeNumber(
                              Number(
                                transferFeeConfig.newerTransferFee.maximumFee
                              )
                            )
                          : 'None'
                        : `${
                            Number(
                              transferFeeConfig.olderTransferFee.maximumFee
                            ) != Number.MAX_SAFE_INTEGER
                              ? formatLargeNumber(
                                  Number(
                                    transferFeeConfig.olderTransferFee
                                      .maximumFee
                                  )
                                )
                              : 'None'
                          } -> ${
                            Number(
                              transferFeeConfig.newerTransferFee.maximumFee
                            ) != Number.MAX_SAFE_INTEGER
                              ? formatLargeNumber(
                                  Number(
                                    transferFeeConfig.newerTransferFee
                                      .maximumFee
                                  )
                                )
                              : 'None'
                          }`
                    } `}
                  </div>
                }
              </>
            ) : (
              <div>None</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MainPanelProps {
  mintSummaryDetails:
    | {
        currentPrice: number;
        currentHoldersCount: number;
        holdersChange24hPercent: number;
        priceChange24hPercent: number;
      }
    | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
  authorityData: AuthorityData | null | undefined;
  mintQuery: Mint | null | undefined;
}

export const MainPanel: FC<MainPanelProps> = ({
  mintSummaryDetails,
  metadata,
  authorityData,
  mintQuery,
}) => {
  const { data } = useSwapDetails({ mint: authorityData?.mint || null });
  const { data: walletInfo } = useGetAddressInfo({
    address: authorityData?.distributor || null,
  });
  const { data: tokenInfo } = useGetTokenAccountInfo({
    address:
      metadata && authorityData
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            authorityData.distributor,
            false,
            new PublicKey(metadata.token_info!.token_program!)
          )
        : null,
  });

  return (
    <div className="px-4 pt-4 pb-2 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Overview</span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <div className="card rounded bg-base-200 p-4">
            <div className="flex flex-col w-fit gap-2">
              <div className="stat-title text-xs">Claimable Trading Fees</div>
              <span className="stat-value font-normal text-lg truncate">
                {`${Number(data?.creatorFeesTokenMint || 0)} ${
                  metadata?.content?.metadata.symbol
                } and ${
                  Number(data?.creatorFeesTokenWsol || 0) / LAMPORTS_PER_SOL
                } Sol`}
              </span>
              <div className="flex gap-4 items-center text-sm">
                <button className="btn btn-outline btn-sm">Claim</button>
                <div
                  data-tip="When fees are above 0.01 SOL, it will be claimed automatically."
                  className="badge badge-success py-3 rounded tooltip tooltip-bottom tooltip-info flex"
                >
                  <IconDiscountCheck size={20} />
                  <span>Auto Claim Enabled</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="card bg-base-200 rounded">
              <div className="shadow text-right w-full">
                <div className="stat gap-2">
                  <Link
                    rel="noopener noreferrer"
                    target="_blank"
                    className="stat-value font-normal truncate hover:text-info"
                    href={`https://solscan.io/address/${mintQuery?.address}`}
                  >
                    {mintQuery
                      ? formatLargeNumber(
                          Number(mintQuery.supply) / 10 ** mintQuery.decimals
                        )
                      : 0}
                  </Link>
                  <div className="stat-desc text-xs">in circulation</div>
                </div>
              </div>
            </div>
            <div className="card bg-base-200 rounded">
              <div className="shadow text-right w-full">
                <div className="stat gap-2">
                  <span className="stat-value font-normal truncate hover:text-info">
                    {mintSummaryDetails
                      ? mintSummaryDetails.currentHoldersCount
                      : 0}
                  </span>
                  <div className="stat-desc text-xs">holders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-200 rounded">
          <div className="stat gap-2 w-fit">
            <div className="lg:w-fit stat-title text-sm md:text-base flex items-center gap-1">
              Distributor
            </div>
            {authorityData ? (
              <Link
                rel="noopener noreferrer"
                target="_blank"
                className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
                href={`https://solscan.io/address/${authorityData?.distributor.toBase58()}`}
              >
                {authorityData?.distributor.toBase58()}
              </Link>
            ) : (
              <div>None</div>
            )}
            <div className="stat-desc">{`Sol: ${
              (walletInfo?.lamports || 0) / LAMPORTS_PER_SOL
            }, Mint: ${tokenInfo?.amount || 0}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
