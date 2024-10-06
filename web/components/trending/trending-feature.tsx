import { formatLargeNumber } from '@/utils/helper/format';
import Link from 'next/link';
import { FC } from 'react';
import { useGenerateTrendingList } from './trending-data-access';

export const RightColumn: FC = () => {
  return (
    <div className="hidden 2xl:flex flex-col right-0 fixed gap-4 p-4 min-h-full w-full max-w-[350px]">
      <TrendingTable />
    </div>
  );
};

export const TrendingTable: FC = () => {
  const { data: list, isLoading } = useGenerateTrendingList();

  return (
    <div className="border border-base-300 flex flex-col w-full rounded-box p-4">
      <span className="text-base font-semibold">Trending Creators</span>
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
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {list?.map((x) => (
                <tr key={x.mint}>
                  <td>
                    <div className="flex items-center gap-2 ">
                      <Link href={`/token?mintId=${x.mint}`} className="avatar">
                        <div className="mask mask-circle h-8 w-8">
                          <img src={x.image} alt="" />
                        </div>
                      </Link>
                      <div className="flex flex-col text-xs">
                        <Link
                          className="link link-hover text-sm"
                          href={`/token?mintId=${x.mint}`}
                        >
                          {x.name}
                        </Link>

                        <div className="flex items-center gap-2">
                          <span>
                            {formatLargeNumber(x.holders || 0) + ' Subs'}
                          </span>
                          {x.holders24HrPercent != undefined && (
                            <span
                              className={`${
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
                    <Link
                      className="link link-hover link-primary"
                      href={`/token?mintId=${x.mint}&tab=trade`}
                    >
                      {`$${formatLargeNumber(x.price * x.supply)}`}
                    </Link>
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
