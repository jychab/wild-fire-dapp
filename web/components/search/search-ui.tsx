import { DAS } from '@/utils/types/das';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useGetAssetsBatch, useGetSummary } from './search-data-access';
function SearchBar() {
  const [search, setSearch] = useState('');
  const { data } = useGetSummary();
  const { data: metadatas } = useGetAssetsBatch({
    mints: data ? data.all : [],
  });
  const [list, setList] = useState<DAS.GetAssetResponse[]>([]);
  useEffect(() => {
    if (metadatas) {
      setList(
        metadatas
          .filter(
            (x) =>
              search == '' ||
              x.content?.metadata.name
                .toLowerCase()
                .includes(search.toLowerCase()) ||
              x.content?.metadata.symbol
                .toLowerCase()
                .includes(search.toLowerCase())
          )
          .sort(
            (a, b) =>
              (b.token_info?.price_info?.price_per_token || 0) *
                (b.token_info?.supply || 0) -
              (a.token_info?.price_info?.price_per_token || 0) *
                (a.token_info?.supply || 0)
          )
      );
    }
  }, [search, metadatas]);

  return (
    <div className="dropdown w-full max-w-lg">
      <div tabIndex={0} role="button">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered focus-within:border-none input-sm md:input-md text-base w-full rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu border mt-2 border-base-300 bg-base-100 max-h-80 w-full overflow-y-scroll scrollbar-none rounded-box z-[1] gap-2 p-2 shadow"
      >
        {list.map((x) => (
          <li key={x.id} className="w-full">
            <Link
              className="flex w-full items-center"
              href={`/profile?mintId=${x.id}`}
            >
              <div className="w-8 h-8 relative rounded-full">
                <Image
                  priority={true}
                  className={`object-cover rounded-full`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt=""
                  src={
                    x?.content?.links?.image ||
                    'https://buckets.hashfeed.social/placeholder.png'
                  }
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">
                  {x?.content?.metadata.name}
                </span>
                <span>{x?.content?.metadata.symbol}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchBar;
