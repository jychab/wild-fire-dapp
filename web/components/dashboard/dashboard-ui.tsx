'use client';

import { DAS } from '@/utils/types/das';
import { Mint, TransferFeeConfig } from '@solana/spl-token';
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
import { Content } from '../upload/upload.data-access';
import {
  useGetAllTokenAccountsFromMint,
  useGetMintDetails,
  useGetMintMetadata,
  useGetMintTransferFeeConfig,
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
  CONTENT = 'Content',
  DETAILS = 'Details',
  TRADE = 'Buy / Sell',
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

  const [selected, setSelected] = useState<AuthorityData>();
  const [selectedTab, setSelectedTab] = useState(TabsEnum.CONTENT);

  useEffect(() => {
    if (!selected && mintTokenData) {
      setSelected(mintTokenData); // assume each user only has one account for now
    }
  }, [selected, mintTokenData]);

  if (
    !metaDataQuery ||
    !mintTokenData ||
    !transferFeeConfig ||
    !allTokenAccounts ||
    !mintQuery
  ) {
    return <div></div>;
  }

  return (
    selected && (
      <div className="flex flex-col h-full w-full items-center">
        <div className="flex flex-col gap-8 items-start w-full max-w-7xl py-8">
          <Profile
            metaData={metaDataQuery}
            allTokenAccounts={allTokenAccounts}
            authorityData={mintTokenData}
          />
          <div className="flex flex-col w-full">
            <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
            {selectedTab == TabsEnum.CONTENT && (
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
    )
  );
};

interface ContentPanelProps {
  metadata: {
    metaData: TokenMetadata;
    image: string;
    description: string | undefined;
    content: Content[] | undefined;
  };
}

const ContentPanel: FC<ContentPanelProps> = ({ metadata }) => {
  return metadata.content ? (
    <div className="sm:p-4 border-x border-b rounded border-base-200">
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
    </div>
  ) : (
    <div>No Content Found</div>
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
    <div className="border-base-200 rounded border-x border-b">
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
    </div>
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
          selectedTab == TabsEnum.CONTENT ? 'tab-active' : ''
        }`}
        checked={selectedTab == TabsEnum.CONTENT}
        onChange={() => setSelectedTab(TabsEnum.CONTENT)}
        aria-label={TabsEnum.CONTENT}
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
  allTokenAccounts: DAS.TokenAccounts[];
  mintQuery: Mint;
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
  metaData: {
    metaData: TokenMetadata;
    image: any;
    description: any;
  };
  allTokenAccounts: DAS.TokenAccounts[];
  authorityData: AuthorityData;
}

const Profile: FC<ProfileProps> = ({
  metaData,
  allTokenAccounts,
  authorityData,
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  return (
    <div className="flex flex-col lg:flex-row items-center p-4 gap-4 w-full bg-base-100">
      <div className="w-32 h-32 lg:w-40 lg:h-40">
        {metaData.image && (
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
              {metaData.metaData.name}
            </span>
          </div>
          <span className="">{metaData.metaData.symbol}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-success btn-sm w-32">Subscribe</button>
          {authorityData.mutable == 1 &&
            publicKey?.toBase58() == authorityData.admin.toBase58() && (
              <button
                className="btn btn-outline btn-sm items-center"
                onClick={() => {
                  router.push(
                    `/mint/edit?mintId=${metaData.metaData.mint.toBase58()}`
                  );
                }}
              >
                <IconEdit />
                Edit
              </button>
            )}
        </div>

        <span>
          {formatLargeNumber(
            allTokenAccounts?.filter((x) => x.amount && x.amount > 0).length ||
              0
          ) + ' Followers'}
        </span>

        <span className="text-sm truncate font-normal">
          {metaData.description}
        </span>
      </div>
    </div>
  );
};

interface DetailsProps {
  transferFeeConfig: TransferFeeConfig;
  authorityData: AuthorityData;
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
              href={`https://solana.fm/address/${authorityData.mint.toBase58()}`}
            >
              {authorityData.mint.toBase58()}
            </Link>
            <div className="stat-title text-sm md:text-base truncate">
              Authority
            </div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${authorityData.admin.toBase58()}`}
            >
              {authorityData.admin.toBase58()}
            </Link>
          </div>
        </div>
        <div className="card bg-base-200 rounded col-span-4 md:col-span-2 ">
          <div className="stat gap-1">
            <div className="stat-title text-sm md:text-base truncate">
              Transfer Fee
            </div>
            <div className="stat-value text-base md:text-xl truncate font-normal">{`${
              currentEpoch &&
              transferFeeConfig.newerTransferFee.epoch <= currentEpoch
                ? `${
                    transferFeeConfig.newerTransferFee.transferFeeBasisPoints /
                    100
                  }%`
                : `${
                    transferFeeConfig.olderTransferFee.transferFeeBasisPoints /
                    100
                  }% (current) -> ${
                    transferFeeConfig.newerTransferFee.transferFeeBasisPoints /
                    100
                  }% (upcoming)`
            } `}</div>
            {
              <div className="stat-desc text-xs md:text-sm truncate font-normal">
                {`Max Fee: ${
                  currentEpoch &&
                  transferFeeConfig.newerTransferFee.epoch <= currentEpoch
                    ? Number(transferFeeConfig.newerTransferFee.maximumFee) !=
                      Number.MAX_SAFE_INTEGER
                      ? formatLargeNumber(
                          Number(transferFeeConfig.newerTransferFee.maximumFee)
                        )
                      : 'None'
                    : `${
                        Number(transferFeeConfig.olderTransferFee.maximumFee) !=
                        Number.MAX_SAFE_INTEGER
                          ? formatLargeNumber(
                              Number(
                                transferFeeConfig.olderTransferFee.maximumFee
                              )
                            )
                          : 'None'
                      } -> ${
                        Number(transferFeeConfig.newerTransferFee.maximumFee) !=
                        Number.MAX_SAFE_INTEGER
                          ? formatLargeNumber(
                              Number(
                                transferFeeConfig.newerTransferFee.maximumFee
                              )
                            )
                          : 'None'
                      }`
                } `}
              </div>
            }
          </div>
        </div>
        <div className="card bg-base-200 col-span-4 md:col-span-2 rounded">
          <div className="stat gap-2">
            <div className="stat-title text-sm md:text-base">Distributor</div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${authorityData.distributor.toBase58()}`}
            >
              {authorityData.distributor.toBase58()}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MainPanelProps {
  transferFeeConfig: TransferFeeConfig;
  authorityData: AuthorityData;
  allTokenAccounts: DAS.TokenAccounts[];
  mintQuery: Mint;
}

export const MainPanel: FC<MainPanelProps> = ({
  transferFeeConfig,
  authorityData,
  allTokenAccounts,
  mintQuery,
}) => {
  const feesEarned = useMemo(() => {
    if (allTokenAccounts && transferFeeConfig) {
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
    } else {
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
                {`${feesEarned.total}`}
              </span>
              <span className="stat-desc text-xs">{`(Claimable: $${feesEarned.claimable})`}</span>
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
