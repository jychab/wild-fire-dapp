'use client';

import { proxify, useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { fetchPostByCategories } from '@/utils/helper/post';
import { IconCategory, IconSearch } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { Category, useCategory } from '../ui/ui-provider';

export interface SearchResult {
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
      ...creators?.map((x) => {
        return {
          id: x.mint,
          image: x.image,
          name: x.name,
          url: `/profile?mint=${x.mint}`,
          type: 'Creator',
          score: x.score,
        };
      })
    );
  }

  return result;
};

export const SearchBar: FC = ({}) => {
  const { category, setCategory } = useCategory();
  const [showCategory, setShowCateogory] = useState(false);
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<SearchResult[]>([]);
  useEffect(() => {
    handleSearch(search).then((res) => setPosts(res));
  }, [search]);
  const router = useRouter();

  return (
    <div className="hidden lg:block dropdown w-full max-w-lg">
      <div tabIndex={0} role="button">
        <label className="input input-bordered input-sm focus-within:border-none flex w-full rounded-box items-center gap-2 py-5">
          <IconSearch size={20} />
          <input
            autoFocus={false}
            type="text"
            placeholder={'Search'}
            className="text-base w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setShowCateogory(!showCategory)}>
            <IconCategory />
          </button>
        </label>
      </div>
      {showCategory ? (
        <ul
          tabIndex={0}
          className="absolute bg-base-200 w-full mt-2 border border-base-300 rounded-box justify-evenly menu gap-4 menu-horizontal"
        >
          {Object.values(Category).map((x) => (
            <li key={x} onClick={() => setCategory(x)}>
              <a className={`${category == x ? 'active' : ''} rounded-full`}>
                {x}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <ul
          tabIndex={0}
          className="dropdown-content menu border mt-2 border-base-300 bg-base-100 max-h-80 w-full overflow-y-scroll scrollbar-none rounded-box z-[1] gap-2 p-2 shadow"
        >
          {posts
            .sort((a, b) => b.score - a.score)
            .map((x) => (
              <li key={x.id} className="w-full">
                <button
                  className="flex w-full items-center"
                  onClick={() => router.push(useRelativePathIfPossbile(x.url))}
                >
                  <div className="w-8 h-8 relative mask mask-circle">
                    <Image
                      className={`object-cover`}
                      fill={true}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      alt=""
                      src={proxify(x.image, true)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{x?.name}</span>
                    {x.type == 'Creator' && (
                      <span className="text-xs stat-desc">
                        {'Fungible Token'}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};
