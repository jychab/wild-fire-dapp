import { NextResponse } from 'next/server';

export function middleware(request: { nextUrl: { pathname: any } }) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply COOP and COEP headers for specific paths
  if (
    pathname.startsWith('/airdrop') ||
    /\/_next\/static\/chunks\/.*(_worker.*|sqlite.*|wasm.*)\.js$/.test(pathname)
  ) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }

  return response;
}

export const config = {
  matcher: ['/airdrop', '/_next/static/chunks/:path*'],
};
