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
