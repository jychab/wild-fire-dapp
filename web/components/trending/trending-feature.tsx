import { formatLargeNumber } from '@/utils/helper/format';
import { getHolders } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import Link from 'next/link';
import { FC, useCallback, useEffect, useState } from 'react';
import { useGetAssetsBatch, useGetSummary } from '../search/search-data-access';

export const RightColumn: FC = () => {
  return (
    <div className="hidden 2xl:flex flex-col right-0 absolute gap-4 p-4 min-h-full w-full max-w-[350px]">
      <TrendingTable />
    </div>
  );
};

export const TrendingTable: FC = () => {
  const { data } = useGetSummary();
  const { data: metadatas } = useGetAssetsBatch({
    mints: data ? data.all : [],
  });
  const [list, setList] = useState<
    {
      mint: string;
      image: string;
      name: string;
      holders: number;
      holders24HrPercent: number;
      price: number;
    }[]
  >([]);

  const generateTrendingList = useCallback(
    async (
      data: {
        all: string[];
        allTokenPrices: {
          mint: string;
          price: number;
          supply: number;
        }[];
      },
      metadatas: DAS.GetAssetResponse[]
    ) => {
      return await Promise.all(
        data.allTokenPrices
          .sort((a, b) => b.price * b.supply - a.price * a.supply)
          .map(async (x) => {
            const metadata = metadatas.find((y) => y.id == x.mint);
            const holders = await getHolders(x.mint);
            if (!metadata || !holders) {
              return null;
            }
            return {
              mint: x.mint,
              image: metadata.content?.links?.image || '',
              name: metadata.content?.metadata.name || '',
              price: x.price,
              holders: holders.currentHoldersCount,
              holders24HrPercent: holders.holdersChange24hPercent,
            };
          })
          .filter((x) => !!x)
          .slice(0, 10)
      );
    },
    [data, metadatas]
  );
  useEffect(() => {
    if (metadatas && data && list.length == 0) {
      generateTrendingList(data, metadatas).then((res) =>
        setList(res.filter((x) => !!x))
      );
    }
  }, [data, metadatas, list]);
  return (
    <div className="border border-base-300 rounded-box p-4">
      <span className="text-base font-semibold">Trending Tokens</span>
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
            {list?.map((x) => (
              <tr key={x.mint}>
                <td>
                  <div className="flex items-center gap-2 ">
                    <Link href={`/profile?mintId=${x.mint}`} className="avatar">
                      <div className="mask mask-circle h-8 w-8">
                        <img src={x.image} alt="" />
                      </div>
                    </Link>
                    <div className="flex flex-col text-xs">
                      <Link
                        className="link link-hover text-sm"
                        href={`/profile?mintId=${x.mint}`}
                      >
                        {x.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span>{formatLargeNumber(x.holders) + ' Subs'}</span>
                        <span
                          className={`${
                            x.holders24HrPercent < 0
                              ? 'text-error'
                              : 'text-success'
                          }`}
                        >
                          {x.holders24HrPercent < 0
                            ? `${x.holders24HrPercent.toFixed(2)}%`
                            : `${x.holders24HrPercent.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <Link
                    className="link link-hover link-primary"
                    href={`/profile?mintId=${x.mint}&tab=trade`}
                  >
                    {`$${formatLargeNumber(x.price)}`}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
