'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconChevronDown, IconEdit, IconPlus } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useMemo, useState } from 'react';
import { formatLargeNumber } from '../program/utils/helper';
import { AppHero } from '../ui/ui-layout';
import {
  useClaim,
  useGetAllTokenAccounts,
  useGetMintDetails,
  useGetMintMetadata,
  useGetMintTransferFeeConfig,
  useGetToken,
} from './dashboard-data-access';

export const CreateBtn: FC = () => {
  return (
    <Link className="btn btn btn-outline my-6" href={'/create'}>
      <IconPlus />
      <span>Get Started</span>
    </Link>
  );
};

export interface AuthorityData {
  mint: PublicKey;
  admin: PublicKey;
  feeCollector: PublicKey;
  feesCollected: number;
  mutable: number;
}

export const DashBoard: FC = () => {
  const { publicKey } = useWallet();
  const { data } = useGetToken({ address: publicKey });
  const [selected, setSelected] = useState<AuthorityData>();

  useEffect(() => {
    if (!selected && data && data.length > 0) {
      setSelected(data[0]);
    }
  }, [selected, data]);

  return !selected ? (
    <DashBoardLandingPage />
  ) : (
    <div className="flex flex-col py-[64px] h-full w-full items-center">
      <div className="flex flex-col gap-4 items-start w-full max-w-5xl p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4 items-center">
            <span className="lg:text-3xl">Dashboard</span>
            {/* <button>
              <IconRefresh />
            </button> */}
          </div>
          <div className="dropdown dropdown-start">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-outline max-w-[150px] md:max-w-[300px] btn-sm "
            >
              <span className="truncate w-4/5 max-w-xs">
                {selected.mint.toBase58()}
              </span>
              <IconChevronDown size={14} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full"
            >
              {data &&
                data.map((x) => (
                  <li key={x.mint.toBase58()}>
                    <button onClick={() => setSelected(x)}>
                      <span className="max-w-xs truncate">
                        {x.mint.toBase58()}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <MainPanel data={selected} />
        <Details data={selected} />
      </div>
    </div>
  );
};

const DashBoardLandingPage: FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full w-full">
      <AppHero
        title="Manage your tokens with our custom tools"
        children={<CreateBtn />}
        subtitle={
          <div className="overflow-x-auto py-6 flex flex-col items-center w-full">
            <table className="table w-fit text-center">
              <thead>
                <tr>
                  <th>Features Include</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Detailed Insight into Token Activities</td>
                </tr>
                <tr>
                  <td>User-Friendly Token Configuration</td>
                </tr>
                <tr>
                  <td>Automated Fee Collection</td>
                </tr>
                <tr>
                  <td>Effortless Airdrop Distribution</td>
                </tr>
              </tbody>
            </table>
          </div>
        }
      />
    </div>
  );
};

interface PanelProps {
  data: AuthorityData;
}
const Details: FC<PanelProps> = ({ data }) => {
  const { connection } = useConnection();
  const [currentEpoch, setCurrentEpoch] = useState<number>();
  const router = useRouter();
  const metaDataQuery = useGetMintMetadata({
    mint: data.mint,
  });
  const { data: mintQuery } = useGetMintDetails({
    mint: data.mint,
  });
  const transferFeeConfigQuery = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });
  useEffect(() => {
    if (!currentEpoch && connection) {
      connection.getEpochInfo().then((x) => setCurrentEpoch(x.epoch));
    }
  }, [connection, currentEpoch]);
  if (
    !metaDataQuery.data ||
    !transferFeeConfigQuery ||
    !transferFeeConfigQuery.data
  ) {
    return <div></div>;
  }
  const { image, metaData, description } = metaDataQuery.data;
  const { transferFeeConfigAuthority, newerTransferFee, olderTransferFee } =
    transferFeeConfigQuery.data;
  return (
    <div className="p-4 bg-base-200 gap-4 card w-full">
      <span className="card-title">
        Details
        {data.mutable == 1 ? (
          <button
            onClick={() => {
              router.push(`/edit?mintId=${data.mint.toBase58()}`);
            }}
          >
            <IconEdit />
          </button>
        ) : (
          <span>[Immutable]</span>
        )}
      </span>
      <div className="flex items-start p-4 gap-4 w-full bg-base-100 rounded">
        <div className="w-32 h-32 lg:w-40 lg:h-40">
          {image && (
            <div className="relative h-full w-full">
              <Image
                priority={true}
                className={`rounded object-cover`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={image}
                alt={''}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 items-start w-1/2 text-start ">
          <div className="grid grid-cols-2 gap-2 items-center justify-center w-full">
            <span className="text-xs text-secondary">Name</span>
            <span className="text-xs text-secondary">Symbol</span>
            <span className="text-sm">{metaData.name}</span>
            <span className="text-sm">{metaData.symbol}</span>
          </div>

          {description && (
            <span className="text-xs text-secondary">Details</span>
          )}
          {description && (
            <span className="truncate w-full text-sm">{description}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 ">
        <div className="card bg-base-100 col-span-4 rounded">
          <div className="stat gap-2">
            <div className="stat-title text-sm md:text-base">Mint</div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${metaData.mint.toBase58()}`}
            >
              {metaData.mint.toBase58()}
            </Link>
            <div className="stat-title text-sm md:text-base truncate">
              Update Authority
            </div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${metaData.updateAuthority?.toBase58()}`}
            >
              {metaData.updateAuthority?.toBase58()}
            </Link>
          </div>
        </div>
        <div className="card bg-base-100 rounded col-span-4 md:col-span-2">
          <div className="flex flex-col h-full p-4">
            <div className="stat-title text-sm md:text-base truncate">
              Transfer Fee
            </div>
            <div className="stat-title text-sm md:text-base truncate">{`Current Epoch: ${currentEpoch}`}</div>
            <div className="stat-value text-base md:text-xl truncate font-normal">{`${
              currentEpoch && newerTransferFee.epoch <= currentEpoch
                ? `${newerTransferFee.transferFeeBasisPoints / 100}%`
                : `${
                    olderTransferFee.transferFeeBasisPoints / 100
                  }% (current) -> ${
                    newerTransferFee.transferFeeBasisPoints / 100
                  }% (upcoming)`
            } `}</div>
            {
              <div className="stat-desc text-xs md:text-sm truncate font-normal">
                {`Max Fee: ${
                  currentEpoch && newerTransferFee.epoch <= currentEpoch
                    ? Number(newerTransferFee.maximumFee) !=
                      Number.MAX_SAFE_INTEGER
                      ? formatLargeNumber(Number(newerTransferFee.maximumFee))
                      : 'None'
                    : `${
                        Number(olderTransferFee.maximumFee) !=
                        Number.MAX_SAFE_INTEGER
                          ? formatLargeNumber(
                              Number(olderTransferFee.maximumFee)
                            )
                          : 'None'
                      } -> ${
                        Number(newerTransferFee.maximumFee) !=
                        Number.MAX_SAFE_INTEGER
                          ? formatLargeNumber(
                              Number(newerTransferFee.maximumFee)
                            )
                          : 'None'
                      }`
                } `}
              </div>
            }
          </div>
        </div>
        <div className="card bg-base-100 col-span-4 md:col-span-2 rounded">
          <div className="stat gap-2">
            <div className="stat-title text-sm md:text-base">Fee Collector</div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${data.feeCollector.toBase58()}`}
            >
              {data.feeCollector.toBase58()}
            </Link>
            <div className="stat-title text-sm md:text-base truncate">
              Fee Config Authority
            </div>
            <Link
              className="stat-value text-xs md:text-sm truncate font-normal hover:text-info"
              href={`https://solana.fm/address/${transferFeeConfigAuthority.toBase58()}`}
            >
              {transferFeeConfigAuthority.toBase58()}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MainPanel: FC<PanelProps> = ({ data }) => {
  const router = useRouter();

  const { data: mintQuery } = useGetMintDetails({
    mint: data.mint,
  });
  const { data: transferFeeConfigData } = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });
  const { data: allTokenAccounts } = useGetAllTokenAccounts({
    mint: data.mint,
  });

  const feesEarned = useMemo(() => {
    if (allTokenAccounts && transferFeeConfigData) {
      const mintWithheldFees = Number(transferFeeConfigData.withheldAmount);
      const tokenAccountWithheldFees = allTokenAccounts.reduce(
        (sum, x) =>
          sum + x.token_extensions.transfer_fee_amount.withheld_amount,
        0
      );
      return {
        total:
          (mintWithheldFees +
            tokenAccountWithheldFees +
            Number(data.feesCollected)) /
          10 ** 6,
        claimable: (mintWithheldFees + tokenAccountWithheldFees) / 10 ** 6,
      };
    } else {
      return {
        total: data.feesCollected ? Number(data.feesCollected) / 10 ** 6 : 0,
        claimable: 0,
      };
    }
  }, [allTokenAccounts, data, transferFeeConfigData]);

  const claimMutation = useClaim({
    mint: data.mint,
    feeCollector: data.feeCollector,
  });

  return (
    <div className="p-4 bg-base-200 gap-4 card w-full">
      <span className="card-title">Overview</span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="card gap-4 bg-base-100 rounded p-4">
            <div className="stat gap-2 p-0">
              <div className="stat-title text-xs">Total Fees</div>
              <span className="stat-value font-normal truncate">
                {`$${feesEarned.total}`}
              </span>
              <span className="stat-desc text-xs">{`(Claimable: $${feesEarned.claimable})`}</span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                disabled={claimMutation.isPending}
                onClick={() =>
                  claimMutation.mutateAsync(
                    allTokenAccounts
                      ?.filter(
                        (x) =>
                          x.token_extensions.transfer_fee_amount
                            .withheld_amount > 0
                      )
                      .map((x) => new PublicKey(x.address))
                  )
                }
                className="btn btn-outline btn-sm rounded"
              >
                Claim
              </button>
              <button
                onClick={() => {
                  router.push(`/mint?mintId=${data.mint}`);
                }}
                className="btn btn-outline btn-sm rounded"
              >
                Mint
              </button>
              {/* <label className="cursor-pointer label gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-success"
                  checked
                  readOnly
                />
                <span className="label-text">Auto Claim Enabled</span>
              </label> */}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="card bg-base-100 col-span-2 rounded">
              <div className="shadow text-right w-full">
                <div className="stat gap-2">
                  <Link
                    className="stat-value font-normal truncate hover:text-info"
                    href={`https://solana.fm/address/${mintQuery?.address}`}
                  >
                    {mintQuery
                      ? formatLargeNumber(Number(mintQuery.supply) / 10 ** 6)
                      : 0}
                  </Link>
                  <div className="stat-desc text-xs">in circulation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 p-4 rounded">
          <span className="card-title text-base">Top Holders List</span>
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
                    .filter((x) => x.amount > 0)
                    .sort((a, b) => b.amount - a.amount)
                    .map((x, index) => (
                      <tr key={x.address}>
                        <th>{index + 1}</th>
                        <td className="max-w-xs truncate hover:text-info">
                          <Link href={`https://solana.fm/address/${x.owner}`}>
                            {x.owner}
                          </Link>
                        </td>
                        <td className="text-center">
                          {formatLargeNumber(x.amount / 10 ** 6)}
                        </td>
                        <td className="text-center">
                          {`${(Number(mintQuery.supply) != 0
                            ? (x.amount / Number(mintQuery.supply)) * 100
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
