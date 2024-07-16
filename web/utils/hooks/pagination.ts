import { QueryKey, useInfiniteQuery } from '@tanstack/react-query';

type FetchPageFunction<T> = (pageParam: number) => Promise<T[]>;

const usePaginatedData = <T>(
  queryKey: QueryKey,
  fetchPage: FetchPageFunction<T>,
  pageLength: number,
  enabled = true
) => {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageLength) return undefined;
      return allPages.length;
    },
    enabled,
  });
};

export default usePaginatedData;
