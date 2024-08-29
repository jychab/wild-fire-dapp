import { PublicKey } from '@solana/web3.js';

export function generateMintApiEndPoint(mint: PublicKey) {
  return `https://api.blinksfeed.com/getPosts?mint=${mint.toBase58()}`;
}

export function generateAddressApiEndPoint(address: PublicKey) {
  return `https://api.blinksfeed.com/getPosts?address=${address.toBase58()}`;
}

export function generatePostEndPoint(mint: string, id: string) {
  return `https://blinksfeed.com/post?mint=${mint}&id=${id}`;
}

export function generatePostApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post?mint=${mint}&id=${id}`;
}

export function generatePostSubscribeApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post/actions/subscribe?mint=${mint}&id=${id}`;
}

export function generatePostTransferApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post/actions/transfer?mint=${mint}&id=${id}`;
}

export function proxify(targetUrl: string, image = false) {
  // Encode the target URL to ensure it is safely passed as a query parameter
  const encodedTargetUrl = encodeURIComponent(targetUrl);

  // Construct the full URL for the proxy
  return `${process.env.NEXT_PUBLIC_PROXY_ENDPOINT}?url=${encodedTargetUrl}${
    image ? '&image=true' : ''
  }`;
}
