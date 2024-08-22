import { PublicKey } from '@solana/web3.js';

export function generateMintApiEndPoint(mint: PublicKey) {
  return `https://api.hashfeed.social/getPosts?mint=${mint.toBase58()}`;
}

export function generateAddressApiEndPoint(address: PublicKey) {
  return `https://api.hashfeed.social/getPosts?address=${address.toBase58()}`;
}

export function generatePostEndPoint(mint: string, id: string) {
  return `https://hashfeed.social/post?mint=${mint}&id=${id}`;
}

export function generatePostApiEndPoint(mint: string, id: string) {
  return `https://api.hashfeed.social/post?mint=${mint}&id=${id}`;
}

export function generatePostSubscribeApiEndPoint(mint: string, id: string) {
  return `https://api.hashfeed.social/post/actions/subscribe?mint=${mint}&id=${id}`;
}
