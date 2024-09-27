'use client';

import { proxify, useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { placeholderImage } from '@/utils/helper/placeholder';
import { fetchPostByCategories } from '@/utils/helper/post';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SearchResult {
  id: string;
  image: string;
  name: string;
  url: string;
  type: 'Blinks' | 'Creator';
  score: number;
}

const handleSearch = async (search: string) => {
  let result: any[] = [];
  const posts = await fetchPostByCategories(
    'post',
    search,
    'tags,title,description'
  );
  if (posts) {
    result.push(
      ...posts?.map(
        (x): SearchResult => ({
          id: x.id,
          image: x.icon,
          name: x.title,
          url: x.url,
          type: 'Blinks',
          score: x.score,
        })
      )
    );
  }

  const creators = await fetchPostByCategories(
    'creators',
    search,
    'name,symbol,mint'
  );

  if (creators) {
    result.push(
      ...creators?.map(
        (x): SearchResult => ({
          id: x.mint,
          image: x.image,
          name: x.name,
          url: `/profile?mintId=${x.mint}`,
          type: 'Creator',
          score: x.score,
        })
      )
    );
  }

  return result;
};

function SearchBar() {
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<SearchResult[]>([]);
  useEffect(() => {
    handleSearch(search).then((res) => setPosts(res));
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
        {posts
          .sort((a, b) => b.score - a.score)
          .map((x) => (
            <li key={x.id} className="w-full">
              <Link
                className="flex w-full items-center"
                href={useRelativePathIfPossbile(x.url)}
              >
                <div className="w-8 h-8 relative mask mask-circle">
                  <Image
                    className={`object-cover`}
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    alt=""
                    src={proxify(x?.image, true) || placeholderImage}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{x?.name}</span>
                  {x.type == 'Creator' && (
                    <span className="text-xs stat-desc">{'Creator'}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default SearchBar;
