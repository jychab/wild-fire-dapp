import { PublicKey } from '@solana/web3.js';
import { GetPostsResponse, PostContent } from '../types/post';
import {
  generateAddressApiEndPoint,
  generatePostApiEndPoint,
  proxify,
} from './endpoints';
import { typeSenseClient } from './typesense';

export async function fetchPost(mint: string | null, postId: string | null) {
  if (!mint || !postId) return null;
  const response = await (
    await fetch(generatePostApiEndPoint(mint, postId), {
      next: { revalidate: 15 * 60, tags: ['post'] },
    })
  ).json();
  let post = response as PostContent | undefined;
  return post;
}

export async function fetchPostByAddress(address: PublicKey) {
  const result = await fetch(proxify(generateAddressApiEndPoint(address)));
  const posts = (await result.json()) as GetPostsResponse | undefined;
  return posts;
}

export async function fetchPostByCategories(
  collections: string,
  search: string,
  query_by: string,
  page?: number,
  per_page?: number
) {
  if (search) {
    const searchResults = await typeSenseClient
      .collections(collections)
      .documents()
      .search(
        {
          q: search,
          query_by: query_by,
          sort_by: '_text_match:desc',
          page: page || 1,
          per_page: per_page || 10,
        },
        { cacheSearchResultsForSeconds: 5 * 60 }
      );
    if (searchResults.hits) {
      return searchResults.hits.map(
        (x) =>
          ({
            ...x.document,
            score: x.text_match,
          } as any)
      );
    }
  }
  return null;
}

export function generateRandomU64Number() {
  // JavaScript's Math.random() only generates numbers with 52 bits of precision,
  // so we need to combine two 32-bit random values to get a full 64-bit integer.

  // Generate two 32-bit random numbers
  const high = Math.floor(Math.random() * 2 ** 21); // Limit high to 21 bits
  const low = Math.floor(Math.random() * 2 ** 32);

  // Combine the high and low 32-bit parts into a 53-bit unsigned integer
  const u53 = (BigInt(high) << 32n) | BigInt(low);

  return Number(u53);
}
