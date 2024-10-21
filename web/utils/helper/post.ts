import { PublicKey } from '@solana/web3.js';
import { GetPostsResponse, PostBlinksDetail, PostContent } from '../types/post';
import {
  generateAddressApiEndPoint,
  generateMintApiEndPoint,
  generatePostApiEndPoint,
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

export async function fetchPostByAddress(
  address: PublicKey,
  limit: number,
  startAfter?: number
) {
  const result = await fetch(
    generateAddressApiEndPoint(address, limit, startAfter)
  );
  const posts = (await result.json()) as GetPostsResponse | undefined;
  return posts;
}

export async function fetchPostByMint(
  mint: PublicKey,
  limit: number,
  startAfter?: number
) {
  const result = await fetch(generateMintApiEndPoint(mint, limit, startAfter));
  const posts = (await result.json()) as GetPostsResponse | undefined;
  return posts;
}

export async function fetchPostByCreator(
  address: PublicKey,
  limit: number = 10,
  startAfter?: number
) {
  const searchResults = await typeSenseClient
    .collections('post')
    .documents()
    .search(
      {
        q: address.toBase58(),
        query_by: 'likes',
        sort_by: '_text_match:desc, createdAt:desc',
        filter_by: `likes: [${address.toBase58()}]${
          startAfter ? `, createdAt:>${startAfter}` : ''
        }`,
        limit,
      },
      { cacheSearchResultsForSeconds: 5 * 60 }
    );
  if (searchResults.hits) {
    return searchResults.hits.map((x) => x.document as PostBlinksDetail);
  }
}

export async function fetchPostByCategories(
  collections: string,
  search: string,
  query_by: string,
  limit: number = 10,
  startAfter?: number
) {
  if (search) {
    let payload;
    payload = {
      q: search,
      query_by: query_by,
      sort_by: '_text_match:desc, createdAt:desc',
      limit,
    };
    if (startAfter) {
      payload = {
        ...payload,
        filter_by: `createdAt:>${Math.round(startAfter)}`,
      };
    }
    const searchResults = await typeSenseClient
      .collections(collections)
      .documents()
      .search(payload, { cacheSearchResultsForSeconds: 5 * 60 });
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
