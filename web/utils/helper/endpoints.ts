import { PublicKey } from '@solana/web3.js';

export function generateMintApiEndPoint(mint: PublicKey) {
  return `https://api.blinksfeed.com/getPosts?mint=${mint.toBase58()}`;
}

export function generateAddressApiEndPoint(address: PublicKey) {
  return `https://api.blinksfeed.com/getPosts?address=${address.toBase58()}`;
}

export function generatePostEndPoint(
  mint: string,
  id: string,
  blinksApiUrl?: string
) {
  return `https://blinksfeed.com/post?mint=${mint}&id=${id}${
    blinksApiUrl ? `&action=solana-action:${blinksApiUrl}` : ''
  }`;
}

export function generatePostApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post?mint=${mint}&id=${id}`;
}

export function generatePostDefaultApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post/actions/sentiment?mint=${mint}&id=${id}`;
}

export function generatePostTransferApiEndPoint(mint: string, id: string) {
  return `https://api.blinksfeed.com/post/actions/transfer?mint=${mint}&id=${id}`;
}

export function proxify(targetUrl: string, image = false) {
  // Encode the target URL to ensure it is safely passed as a query parameter
  if (targetUrl.startsWith('blob')) {
    return targetUrl;
  }
  const encodedTargetUrl = encodeURIComponent(targetUrl);

  // Construct the full URL for the proxy
  return `${process.env.NEXT_PUBLIC_PROXY_ENDPOINT}?url=${encodedTargetUrl}${
    image ? '&image=true' : ''
  }`;
}
export function useRelativePathIfPossbile(urlString: string) {
  try {
    const url = new URL(urlString);
    const domain = window.location.hostname;

    // Check if the domain matches
    if (url.hostname === domain) {
      // Return relative path including search parameters
      return `${url.pathname}${url.search}`;
    } else {
      return urlString; // Or handle as needed
    }
  } catch (error) {
    return urlString;
  }
}
