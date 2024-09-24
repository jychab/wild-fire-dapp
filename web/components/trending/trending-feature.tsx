import { formatLargeNumber } from '@/utils/helper/format';
import { getHolders } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import { useGetAssetsBatch, useGetSummary } from '../search/search-data-access';

export const RightColumn: FC = () => {
  return (
    <div className="hidden 2xl:flex flex-col right-0 fixed gap-4 p-4 min-h-full w-full max-w-[350px]">
      <TrendingTable />
    </div>
  );
};

export const TrendingTable: FC = () => {
  const { data } = useGetSummary();
  const { data: metadatas } = useGetAssetsBatch({
    mints: data ? data.all : [],
  });

  const generateTrendingList = async (
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
    const filteredList = data.allTokenPrices
      .sort((a, b) => b.price * b.supply - a.price * a.supply)
      .slice(0, 10);
    const holdersPromises = filteredList.map((x) => getHolders(x.mint));
    const holdersData = await Promise.all(holdersPromises);

    return filteredList.map((x, i) => {
      const metadata = metadatas.find((y) => y.id == x.mint);
      const holders = holdersData[i];
      return {
        mint: x.mint,
        image: metadata?.content?.links?.image,
        name: metadata?.content?.metadata.name,
        price: x.price,
        holders: holders?.currentHoldersCount,
        holders24HrPercent: holders?.holdersChange24hPercent,
      };
    });
  };

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<
    {
      mint: string;
      image?: string;
      name?: string;
      price: number;
      holders?: number;
      holders24HrPercent?: number;
    }[]
  >([]);
  useEffect(() => {
    if (metadatas && data && list.length == 0) {
      setLoading(true);
      generateTrendingList(data, metadatas).then((res) => {
        setList(res);
        setLoading(false);
      });
    }
  }, [data, metadatas]);

  return (
    <div className="border border-base-300 flex flex-col w-full rounded-box p-4">
      <span className="text-base font-semibold">Trending Creators</span>
      {loading ? (
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
              {list?.map((x) => (
                <tr key={x.mint}>
                  <td>
                    <div className="flex items-center gap-2 ">
                      <Link
                        href={`/profile?mintId=${x.mint}`}
                        className="avatar"
                      >
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
      )}
    </div>
  );
};
