'use client';

import { DAS } from '@/utils/types/das';
import {
  Mint,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TransferFeeConfig,
} from '@solana/spl-token';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconEdit, IconExclamationCircle } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useMemo, useState } from 'react';
import { formatLargeNumber } from '../../utils/helper/format';
import { ContentGrid } from '../content/content-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import { UploadBtn } from '../upload/upload-ui';
import { Content } from '../upload/upload.data-access';
import {
  SwapType,
  useGetAllTokenAccountsFromMint,
  useGetMintDetails,
  useGetMintMetadata,
  useGetMintTransferFeeConfig,
  useGetTokenDetails,
  useSwapDetails,
  useSwapMint,
} from './dashboard-data-access';

export interface AuthorityData {
  mint: PublicKey;
  admin: PublicKey;
  distributor: PublicKey;
  feesCollected: number;
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

  const { data: mintQuery } = useGetMintDetails({
    mint: new PublicKey(mintId),
  });
  const { data: allTokenAccounts } = useGetAllTokenAccountsFromMint({
    mint: new PublicKey(mintId),
  });

  const { data: metaDataQuery } = useGetMintMetadata({
    mint: new PublicKey(mintId),
  });

  const { data: transferFeeConfig } = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });

  const [selectedTab, setSelectedTab] = useState(TabsEnum.POST);

  return (
    <div className="flex flex-col h-full w-full min-h-[600px] items-center">
      <div className="flex flex-col gap-8 items-start w-full h-full max-w-7xl py-8">
        <Profile
          metaData={metaDataQuery}
          allTokenAccounts={allTokenAccounts}
          authorityData={mintTokenData}
        />
        <div className="flex flex-col flex-1 w-full h-full">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="border-base-200 rounded border-x border-b w-full h-full md:p-4">
            {selectedTab == TabsEnum.POST && (
              <ContentPanel metadata={metaDataQuery} />
            )}
            {selectedTab == TabsEnum.DETAILS && (
              <DetailsPanel
                transferFeeConfig={transferFeeConfig}
                authorityData={mintTokenData}
                allTokenAccounts={allTokenAccounts}
                mintQuery={mintQuery}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContentPanelProps {
  metadata:
    | {
        metaData: TokenMetadata;
        image: string;
        description: string | undefined;
        content: Content[] | undefined;
      }
    | null
    | undefined;
}

const ContentPanel: FC<ContentPanelProps> = ({ metadata }) => {
  return metadata && metadata.content ? (
    <ContentGrid
      multiGrid={true}
      showMintDetails={false}
      editable={true}
      content={metadata.content.map((x) => {
        return {
          ...x,
          name: metadata.metaData.name,
          symbol: metadata.metaData.symbol,
          image: metadata.image,
          mint: metadata.metaData.mint,
        };
      })}
    />
  ) : (
    <div className="p-4 flex flex-col gap-4 items-center w-full h-full justify-center text-center text-lg">
      Create your first post!
      <div className="w-36">
        <UploadBtn />
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
  allTokenAccounts,
}) => {
  return (
    <>
      <MainPanel
        transferFeeConfig={transferFeeConfig}
        authorityData={authorityData}
        allTokenAccounts={allTokenAccounts}
        mintQuery={mintQuery}
      />
      <Details
        transferFeeConfig={transferFeeConfig}
        authorityData={authorityData}
      />
      <Activities allTokenAccounts={allTokenAccounts} mintQuery={mintQuery} />
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
  allTokenAccounts: DAS.TokenAccounts[] | null | undefined;
  mintQuery: Mint | null | undefined;
}

const Activities: FC<ActivitiesProps> = ({ allTokenAccounts, mintQuery }) => {
  return (
    <div className="p-4 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Activities</span>
      <div className="rounded bg-base-200 col-span-2 p-4">
        <span className="card-title text-base">Top 20 Holders List</span>
        {allTokenAccounts && mintQuery && (
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
                {allTokenAccounts
                  .filter((x) => x.amount && x.amount > 0)
                  .sort((a, b) => b.amount! - a.amount!)
                  .filter((_, index) => index < 20)
                  .map((x, index) => (
                    <tr key={x.address}>
                      <th>{index + 1}</th>
                      <td className="max-w-xs truncate hover:text-info">
                        <Link href={`https://solana.fm/address/${x.owner}`}>
                          {x.owner}
                        </Link>
                      </td>
                      <td className="">{formatLargeNumber(x.amount!)}</td>
                      <td className="">
                        {`${(Number(mintQuery.supply) != 0
                          ? (x.amount! / Number(mintQuery.supply)) * 100
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
  metaData:
    | {
        metaData: TokenMetadata;
        image: any;
        description: any;
      }
    | null
    | undefined;
  allTokenAccounts: DAS.TokenAccounts[] | null | undefined;
  authorityData: AuthorityData | null | undefined;
}

const Profile: FC<ProfileProps> = ({
  metaData,
  allTokenAccounts,
  authorityData,
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenDetails } = useGetTokenDetails({
    mint: metaData?.metaData.mint || null,
  });
  const swapToken = useSwapMint({
    mint: metaData ? metaData.metaData.mint : null,
  });
  const { data: swapDetails } = useSwapDetails({
    mint: metaData ? metaData.metaData.mint : null,
  });
  return (
    <div className="flex flex-col lg:flex-row items-center p-4 gap-4 w-full bg-base-100">
      <div className="w-32 h-32 lg:w-40 lg:h-40">
        {metaData && metaData.image && (
          <div className="relative h-full w-full">
            <Image
              priority={true}
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metaData.image}
              alt={''}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          <div className="flex gap-2 items-center">
            <span className="text-2xl lg:text-3xl font-bold">
              {metaData?.metaData.name}
            </span>
          </div>
          <span className="">{metaData?.metaData.symbol}</span>
        </div>

        <div
          data-tip={`${
            swapDetails
              ? `Purchase 0.001 SOL worth of ${metaData?.metaData.name}`
              : 'The creator has not enabled this feature yet'
          }`}
          className=" tooltip tooltip-secondary flex items-center gap-2"
        >
          <button
            disabled={!swapDetails}
            onClick={() =>
              metaData &&
              swapToken.mutateAsync({
                type: SwapType.BasedInput,
                amount: 0.001, // 0.001 SOL to subscribe ~$0.1
                inputToken: NATIVE_MINT,
                outputToken: metaData.metaData.mint,
                inputTokenProgram: TOKEN_PROGRAM_ID,
                inputTokenDecimal: 9,
                outputTokenProgram: TOKEN_2022_PROGRAM_ID,
                outputTokenDecimal: 0,
              })
            }
            className="btn btn-success btn-sm w-32"
          >
            Subscribe
          </button>
          {authorityData &&
            authorityData.mutable == 1 &&
            publicKey?.toBase58() == authorityData.admin.toBase58() && (
              <button
                className="btn btn-outline btn-sm items-center"
                onClick={() =>
                  metaData &&
                  router.push(
                    `/mint/edit?mintId=${metaData.metaData.mint.toBase58()}`
                  )
                }
              >
                <IconEdit />
                Edit
              </button>
            )}
        </div>

        <div className="flex items-center gap-2">
          <span>
            {formatLargeNumber(
              allTokenAccounts?.filter((x) => x.amount && x.amount > 0)
                .length || 0
            ) + ' Followers'}
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
          {metaData?.description}
        </span>
      </div>
    </div>
  );
};

interface DetailsProps {
  transferFeeConfig: TransferFeeConfig | null | undefined;
  authorityData: AuthorityData | null | undefined;
}

const Details: FC<DetailsProps> = ({ transferFeeConfig, authorityData }) => {
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
        <div className="card rounded bg-base-200 col-span-4">
          <div className="stat gap-2">
            <div className="stat-title text-sm md:text-base">Mint</div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${authorityData?.mint.toBase58()}`}
            >
              {authorityData?.mint.toBase58()}
            </Link>
            <div className="stat-title text-sm md:text-base truncate">
              Authority
            </div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${authorityData?.admin.toBase58()}`}
            >
              {authorityData?.admin.toBase58()}
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
              <div className="loading loading-dots"></div>
            )}
          </div>
        </div>
        <div className="card bg-base-200 col-span-4 md:col-span-2 rounded">
          <div className="stat gap-2">
            <div className="stat-title text-sm md:text-base">Distributor</div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${authorityData?.distributor.toBase58()}`}
            >
              {authorityData?.distributor.toBase58()}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MainPanelProps {
  transferFeeConfig: TransferFeeConfig | null | undefined;
  authorityData: AuthorityData | null | undefined;
  allTokenAccounts: DAS.TokenAccounts[] | null | undefined;
  mintQuery: Mint | null | undefined;
}

export const MainPanel: FC<MainPanelProps> = ({
  transferFeeConfig,
  authorityData,
  allTokenAccounts,
  mintQuery,
}) => {
  const feesEarned = useMemo(() => {
    if (allTokenAccounts && transferFeeConfig && authorityData) {
      const mintWithheldFees = Number(transferFeeConfig.withheldAmount);
      const tokenAccountWithheldFees = allTokenAccounts.reduce(
        (sum, x) =>
          sum + x.token_extensions!.transfer_fee_amount.withheld_amount,
        0
      );
      return {
        total:
          mintWithheldFees +
          tokenAccountWithheldFees +
          Number(authorityData.feesCollected),
        claimable: mintWithheldFees + tokenAccountWithheldFees,
      };
    } else if (authorityData) {
      return {
        total: authorityData.feesCollected
          ? Number(authorityData.feesCollected)
          : 0,
        claimable: 0,
      };
    }
  }, [allTokenAccounts, authorityData, transferFeeConfig]);

  return (
    <div className="p-4 bg-base-100 gap-4 card rounded w-full">
      <span className="card-title">Overview</span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="card rounded gap-4 bg-base-200 p-4">
            <div className="stat gap-2 p-0">
              <div className="stat-title text-xs">Total Fees Generated</div>
              <span className="stat-value font-normal truncate">
                {`${feesEarned?.total}`}
              </span>
              <span className="stat-desc text-xs">{`(Claimable: $${feesEarned?.claimable})`}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="card bg-base-200 rounded">
              <div className="shadow text-right w-full">
                <div className="stat gap-2">
                  <Link
                    className="stat-value font-normal truncate hover:text-info"
                    href={`https://solana.fm/address/${mintQuery?.address}`}
                  >
                    {mintQuery
                      ? formatLargeNumber(Number(mintQuery.supply))
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
                    {allTokenAccounts
                      ? allTokenAccounts.filter((x) => x.amount && x.amount > 0)
                          .length
                      : 0}
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
              data-tip="Fees are automatically distributed once every 5min"
            >
              <IconExclamationCircle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
