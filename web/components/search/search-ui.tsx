'use client';

import { placeholderImage } from '@/utils/helper/placeholder';
import { typeSenseClient } from '@/utils/helper/typesense';
import { DAS } from '@/utils/types/das';
import { PostContent } from '@/utils/types/post';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function SearchBar() {
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<PostContent[]>([]);
  const [creators, setCreators] = useState<
    { name: string; symbol: string; mint: string; das: string }[]
  >([]);
  useEffect(() => {
    typeSenseClient
      .collections('post')
      .documents()
      .search(
        {
          q: search,
          query_by: 'title,tags,description',
        },
        { cacheSearchResultsForSeconds: 5 * 60 }
      )
      .then(function (searchResults) {
        if (searchResults.hits) {
          setPosts(searchResults.hits.map((x) => x.document as PostContent));
        }
      });
    typeSenseClient
      .collections('creators')
      .documents()
      .search(
        {
          q: search,
          query_by: 'name,symbol,mint',
        },
        { cacheSearchResultsForSeconds: 5 * 60 }
      )
      .then(function (searchResults) {
        if (searchResults.hits) {
          setCreators(searchResults.hits.map((x) => x.document as any));
        }
      });
  }, [search]);

  return (
    <div className="dropdown w-full max-w-lg">
      <div tabIndex={0} role="button">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered focus-within:border-none input-sm md:input-md text-base w-full rounded-box"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu border mt-2 border-base-300 bg-base-100 max-h-80 w-full overflow-y-scroll scrollbar-none rounded-box z-[1] gap-2 p-2 shadow"
      >
        {posts.length > 0 && (
          <span className="px-4 py-1 bg-base-300 rounded">Blinks</span>
        )}
        {posts.map((x) => (
          <li key={x.id} className="w-full">
            <Link
              className="flex w-full items-center"
              href={`/profile?mintId=${x.mint}`}
            >
              <div className="w-8 h-8 relative mask mask-circle">
                <Image
                  className={`object-cover`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt=""
                  src={x?.icon || placeholderImage}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{x?.title}</span>
              </div>
            </Link>
          </li>
        ))}
        {creators.length > 0 && (
          <span className="px-4 py-1 bg-base-300 rounded">Creators</span>
        )}
        {creators.map((x) => (
          <li key={x.mint} className="w-full">
            <Link
              className="flex w-full items-center"
              href={`/profile?mintId=${x.mint}`}
            >
              <div className="w-8 h-8 relative mask mask-circle">
                <Image
                  className={`object-cover`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt=""
                  src={
                    (JSON.parse(x?.das) as DAS.GetAssetResponse).content?.links
                      ?.image || placeholderImage
                  }
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{x?.name}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchBar;
