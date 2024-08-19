import { PublicKey } from '@solana/web3.js';

const proxyUrl = process.env.NEXT_PUBLIC_PROXY_ENDPOINT;

export function proxify(url: string, skipCache?: boolean): URL {
  const baseUrl = new URL(url);
  if (baseUrl.hostname === 'localhost' || baseUrl.hostname === '127.0.0.1') {
    return baseUrl;
  }
  const proxifiedUrl = new URL(proxyUrl!);
  proxifiedUrl.searchParams.set('url', url);
  if (skipCache) {
    proxifiedUrl.searchParams.set('skipCache', 'true');
  }
  return proxifiedUrl;
}

export function generateMintApiEndPoint(mint: PublicKey) {
  return `https://api.hashfeed.social/getPosts?mint=${mint.toBase58()}`;
}

export function generateAddressApiEndPoint(address: PublicKey) {
  return `https://api.hashfeed.social/getPosts?address=${address.toBase58()}`;
}

export function generatePostEndPoint(mint: string, id: string) {
  return `https://hashfeed.social/post/?mint=${mint}&id=${id}`;
}

export function generatePostApiEndPoint(mint: string, id: string) {
  return `https://api.hashfeed.social/post/?mint=${mint}&id=${id}`;
}

export function generatePostSubscribeApiEndPoint(mint: string, id: string) {
  return `https://api.hashfeed.social/post/actions/subscribe?mint=${mint}&id=${id}`;
}
