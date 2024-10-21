import { DEFAULT_MINT_DECIMALS, NATIVE_MINT_DECIMALS } from '@/utils/consts';
import { GlobalTransactionType } from '@/utils/enums/transactions';
import { db } from '@/utils/firebase/firebase';
import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber, getTimeAgo } from '@/utils/helper/format';
import { fetchTokenDetails, getDerivedMint } from '@/utils/helper/mint';
import { PublicKey } from '@solana/web3.js';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import { useGenerateTrendingList, useGetSummary } from './trending-data-access';

export const RightColumn: FC = () => {
  return (
    <div className="hidden 2xl:flex flex-col right-0 fixed gap-4 p-4 min-h-full w-full max-w-[400px]">
      <ActivitiesTable />
      <TrendingTable />
    </div>
  );
};

interface Activity {
  event: GlobalTransactionType;
  tx: string;
  mint: string;
  collectionMint: string;
  mintName: string;
  mintImage: string;
  from: string;
  name: string;
  image: string;
  amount: number;
  timestamp: number;
}

export const ActivitiesTable: FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, `Summary/Events/All`),
        orderBy('timestamp', 'desc'),
        limit(5)
      ),
      async (snapshot) => {
        const data = await Promise.all(
          snapshot.docs.map(async (x) => {
            const data = x.data() as Activity;
            const mintMetadata = await fetchTokenDetails(
              undefined,
              new PublicKey(data.mint)
            );
            const payerMetadata = await fetchTokenDetails(
              getDerivedMint(new PublicKey(data.from))
            );
            return {
              ...data,
              mintName: mintMetadata?.content?.metadata.name || '',
              mintImage: mintMetadata?.content?.links?.image || '',
              collectionMint: mintMetadata?.collectionMint || '',
              name: payerMetadata?.content?.metadata.name || '',
              image: payerMetadata?.content?.links?.image || '',
            };
          })
        );
        setActivities(data);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="border border-base-300 flex flex-col w-full rounded-box p-4">
      <span className="text-base font-semibold">Activities</span>
      <div className="overflow-x-scroll scrollbar-none">
        <table className="table table-sm ">
          <tbody>
            {activities.map((x) => (
              <tr key={x.tx}>
                <td className="px-0">
                  <div className="flex items-center gap-1 animate-fade-right">
                    <span className="whitespace-nowrap">
                      {`${getTimeAgo(x.timestamp)}: `}
                    </span>
                    <Link
                      href={`/profile?address=${x.from}`}
                      className="avatar"
                    >
                      <div className="mask mask-circle h-4 w-4">
                        <img src={proxify(x.image!, true)} alt="" />
                      </div>
                    </Link>
                    <Link
                      className="link link-hover"
                      href={`/profile?mint=${x.from}`}
                    >
                      {x.name}
                    </Link>
                    <span className="whitespace-nowrap">{`${
                      x.event == GlobalTransactionType.Buy ? 'bought' : 'sold'
                    } ${
                      x.event == GlobalTransactionType.Buy
                        ? `${x.amount / 10 ** NATIVE_MINT_DECIMALS} Sol`
                        : formatLargeNumber(
                            x.amount / 10 ** DEFAULT_MINT_DECIMALS
                          )
                    } worth of`}</span>
                    <Link
                      href={`/profile?mint=${x.collectionMint}`}
                      className="avatar"
                    >
                      <div className="mask mask-circle h-4 w-4">
                        <img src={proxify(x.mintImage!, true)} alt="" />
                      </div>
                    </Link>
                    <Link
                      className="link link-hover"
                      href={`/profile?mint=${x.collectionMint}`}
                    >
                      {x.mintName}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TrendingTable: FC = () => {
  const { data: summary } = useGetSummary();
  const { data: list, isLoading } = useGenerateTrendingList({
    summary: summary || null,
  });

  return (
    <div className="border border-base-300 flex flex-col w-full rounded-box p-4">
      <span className="text-base font-semibold">Trending</span>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="loading loading-dots" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Token</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {list
                ?.filter((x) => !!x.image)
                .map((x) => (
                  <tr key={x.collectionMint}>
                    <td>
                      <div className="flex items-center gap-2 ">
                        <Link
                          href={`/profile?mint=${x.collectionMint}`}
                          className="avatar"
                        >
                          <div className="mask mask-circle h-8 w-8">
                            <img src={proxify(x.image!, true)} alt="" />
                          </div>
                        </Link>
                        <div className="flex flex-col text-xs">
                          <Link
                            className="link link-hover text-sm"
                            href={`/profile?mint=${x.collectionMint}`}
                          >
                            {x.name}
                          </Link>

                          <div className="flex items-center gap-2">
                            <span className="stat-desc">
                              {formatLargeNumber(x.holders || 0) + ' Subs'}
                            </span>
                            {x.holders24HrPercent != undefined && (
                              <span
                                className={`text-xs ${
                                  x.holders24HrPercent < 0
                                    ? 'text-error'
                                    : 'text-success'
                                }`}
                              >
                                {x.holders24HrPercent.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col items-center gap-2">
                        {x.price24HrPercent != undefined && (
                          <span
                            className={`text-xs ${
                              x.price24HrPercent < 0
                                ? 'text-error'
                                : 'text-success'
                            }`}
                          >
                            {x.price24HrPercent?.toFixed(2)}%
                          </span>
                        )}
                        <span className="text-xs">
                          ${formatLargeNumber(x.price || 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
