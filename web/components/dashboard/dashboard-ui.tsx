'use client';

import { DAS } from '@/utils/types/das';
import {
  Mint,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TransferFeeConfig,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  TokenAccountBalancePair,
} from '@solana/web3.js';
import { IconEdit, IconExclamationCircle } from '@tabler/icons-react';
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
  useSwapDetails,
  useSwapMint,
} from '../trading/trading-data-access';
import { TradingPanel } from '../trading/trading.ui';
import { UploadBtn } from '../upload/upload-ui';
import {
  useGetLargestAccountFromMint,
  useGetMintDetails,
  useGetMintTransferFeeConfig,
  useGetTokenDetails,
} from './dashboard-data-access';

export interface AuthorityData {
  mint: PublicKey;
  admin: PublicKey;
  distributor: PublicKey;
  mutable: number;
}

interface DashBoardProps {
  mintId: string;
}

enum TabsEnum {
  POST = 'Posts',
  DETAILS = 'Details',
  TRADE = 'Trade',
}

export const DashBoard: FC<DashBoardProps> = ({ mintId }) => {
  const { data: mintTokenData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });

  const { data: metaDataQuery } = useGetTokenDetails({
    mint: new PublicKey(mintId),
  });

  const { data: mintQuery } = useGetMintDetails({
    mint: new PublicKey(mintId),
    tokenProgram: metaDataQuery?.token_info?.token_program
      ? new PublicKey(metaDataQuery?.token_info?.token_program)
      : undefined,
  });
  const { data: largestFromMint } = useGetLargestAccountFromMint({
    mint: new PublicKey(mintId),
  });

  const { data: transferFeeConfig } = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });

  const [selectedTab, setSelectedTab] = useState(TabsEnum.POST);

  return (
    <div className="flex flex-col h-full w-full min-h-[1000px] items-center">
      <div className="flex flex-col gap-8 items-start w-full h-full max-w-7xl py-8">
        <Profile metaData={metaDataQuery} authorityData={mintTokenData} />
        <div className="flex flex-col flex-1 w-full h-full">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="border-base-200 rounded border-x border-b w-full h-full md:p-4">
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
  return metadata &&
    metadata.additionalInfoData &&
    metadata.additionalInfoData.content &&
    metadata.additionalInfoData.content.length > 0 ? (
    <ContentGrid
      multiGrid={true}
      showMintDetails={false}
      editable={true}
      content={metadata.additionalInfoData?.content?.map((x) => {
        return {
          ...x,
          name: metadata.content!.metadata.name,
          symbol: metadata.content!.metadata.symbol,
          image: metadata.additionalInfoData!.imageUrl,
          mint: new PublicKey(metadata.id),
        };
      })}
    />
  ) : (
    <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
      Create your first post!
      <div className="w-36">
        <UploadBtn mintId={metadata?.id} />
      </div>
    </div>
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
}) => {
  return (
    <>
      <MainPanel
        transferFeeConfig={transferFeeConfig}
        authorityData={authorityData}
        mintQuery={mintQuery}
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
  largestTokenAccount:
    | RpcResponseAndContext<TokenAccountBalancePair[]>
    | undefined;
  mintQuery: Mint | null | undefined;
}

const Activities: FC<ActivitiesProps> = ({
  largestTokenAccount,
  mintQuery,
}) => {
  return (
    <div className="p-4 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Activities</span>
      <div className="rounded bg-base-200 col-span-2 p-4">
        <span className="card-title text-base">Top 20 Holders List</span>
        {largestTokenAccount && mintQuery && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Wallet</th>
                  <th>Quantity</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {largestTokenAccount.value.map((x, index) => (
                  <tr key={x.address.toBase58()}>
                    <th>{index + 1}</th>
                    <td className="max-w-xs truncate hover:text-info">
                      <Link
                        rel="noopener noreferrer"
                        target="_blank"
                        href={`https://solscan.io/address/${x.address.toBase58()}`}
                      >
                        {x.address.toBase58()}
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
  );
};

interface ProfileProps {
  metaData: DAS.GetAssetResponse | null | undefined;
  authorityData: AuthorityData | null | undefined;
}

const Profile: FC<ProfileProps> = ({ metaData, authorityData }) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenDetails } = useGetTokenDetails({
    mint: metaData ? new PublicKey(metaData.id) : null,
  });
  const swapToken = useSwapMint({
    mint: metaData ? new PublicKey(metaData.id) : null,
  });
  const { data: swapDetails } = useSwapDetails({
    mint: metaData ? new PublicKey(metaData.id) : null,
  });
  return (
    <div className="flex flex-col lg:flex-row items-center p-4 gap-4 w-full bg-base-100">
      <div className="w-32 h-32 lg:w-40 lg:h-40">
        {metaData && metaData.additionalInfoData && (
          <div className="relative h-full w-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metaData.additionalInfoData.imageUrl}
              alt={''}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <span className="text-2xl lg:text-3xl font-bold">
              {metaData?.content?.metadata.name}
            </span>
          </div>
          <span className="">{metaData?.content?.metadata.symbol}</span>
        </div>

        <div
          data-tip={`${
            swapDetails
              ? `Purchase 0.001 SOL worth of ${metaData?.content?.metadata.name}`
              : 'Feature will be unlocked once a liquidity pool is initialized.'
          }`}
          className=" tooltip tooltip-secondary flex items-center gap-2"
        >
          <button
            disabled={!swapDetails}
            onClick={() => {
              if (swapDetails) {
                metaData &&
                  swapToken.mutateAsync({
                    type: SwapType.BasedInput,
                    amount_in: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL to subscribe ~$0.1
                    min_amount_out: 0,
                    inputToken: NATIVE_MINT,
                    outputToken: new PublicKey(metaData.id),
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
              <span>Subscribe</span>
            )}
          </button>
          {authorityData &&
            publicKey &&
            authorityData.mutable == 1 &&
            (publicKey.toBase58() == authorityData.admin.toBase58() ||
              metaData?.authorities?.find(
                (x) =>
                  x.scopes.includes(Scope.METADATA) ||
                  x.scopes.includes(Scope.FULL)
              )?.address == publicKey.toBase58()) && (
              <button
                className="btn btn-outline btn-sm items-center"
                onClick={() =>
                  metaData && router.push(`/mint/edit?mintId=${metaData.id}`)
                }
              >
                <IconEdit />
                Edit
              </button>
            )}
        </div>

        <div className="flex items-center gap-2">
          <span>
            {/* {formatLargeNumber(
              largestFromMint?.filter((x) => x.amount && x.amount > 0)
                .length || 0
            ) + ' Followers'} */}
          </span>
          {tokenDetails?.token_info?.price_info?.price_per_token && (
            <>
              ||
              <span>{`${
                tokenDetails?.token_info?.price_info?.price_per_token
                  ? '$' + tokenDetails?.token_info?.price_info?.price_per_token
                  : ''
              }`}</span>
            </>
          )}
        </div>

        <span className="text-sm truncate font-normal">
          {metaData?.additionalInfoData?.description}
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
  const [distributorLamports, setDistributorLamports] = useState<number>();

  useEffect(() => {
    if (!currentEpoch && connection) {
      connection.getEpochInfo().then((x) => setCurrentEpoch(x.epoch));
    }
  }, [connection, currentEpoch]);

  useEffect(() => {
    if (authorityData && connection) {
      connection
        .getAccountInfo(authorityData?.distributor)
        .then((x) => setDistributorLamports(x?.lamports));
    }
  }, [connection, authorityData]);

  return (
    <div className="bg-base-100 px-4 gap-4 w-full">
      <div className="grid grid-cols-4 gap-2 ">
        <div className="card rounded bg-base-200 col-span-4">
          <div className="stat gap-2">
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
        <div className="card bg-base-200 rounded col-span-4 md:col-span-2 ">
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
        <div className="card bg-base-200 col-span-4 md:col-span-2 rounded">
          <div className="stat gap-2">
            <div
              data-tip="A wallet assigned to help your manage tx fees."
              className="tooltip lg:w-fit stat-title text-sm md:text-base flex items-center gap-1"
            >
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
            <div className="stat-desc">{`Amount: ${
              (distributorLamports || 0) / LAMPORTS_PER_SOL
            } Sol`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MainPanelProps {
  transferFeeConfig: TransferFeeConfig | null | undefined;
  authorityData: AuthorityData | null | undefined;
  mintQuery: Mint | null | undefined;
}

export const MainPanel: FC<MainPanelProps> = ({ authorityData, mintQuery }) => {
  return (
    <div className="p-4 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Overview</span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="card rounded gap-4 bg-base-200 p-4">
            <div className="stat gap-2 p-0">
              <div className="stat-title text-xs">Total Fees Collected</div>
              <span className="stat-value font-normal truncate">
                {`${'0'}`}
              </span>
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
                    {/* {allTokenAccounts
                      ? allTokenAccounts.filter((x) => x.amount && x.amount > 0)
                          .length
                      : 0} */}
                  </span>
                  <div className="stat-desc text-xs">total holders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-200 p-4 rounded gap-4">
          <div className="card-title">
            Fee Distribution
            <div
              className="tooltip"
              data-tip="Fees are automatically distributed once every 15min"
            >
              <IconExclamationCircle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
