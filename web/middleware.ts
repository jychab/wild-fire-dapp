import { NextResponse } from 'next/server';

export function middleware(request: any) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const trustedPaths = ['/token']; // token page uses birdeye trading widget so it needs to be whitelisted

  // Apply COOP and COEP headers only if the pathname isn't in the trusted list
  if (!trustedPaths.includes(pathname)) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  } else {
    console.log(pathname);
  }

  return response;
}

export const config = {
  matcher: ['/(.*)'], // Adjust this matcher as needed
};
