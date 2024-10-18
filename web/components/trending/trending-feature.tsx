import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import Link from 'next/link';
import { FC } from 'react';
import { useGenerateTrendingList, useGetSummary } from './trending-data-access';

export const RightColumn: FC = () => {
  return (
    <div className="hidden 2xl:flex flex-col right-0 fixed gap-4 p-4 min-h-full w-full max-w-[350px]">
      <TrendingTable />
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
          <table className="table">
            {/* head */}
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
                            <span className="text-xs">
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
