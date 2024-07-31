'use client';

import { useGetPostsFromAddress } from '@/components/content/content-data-access';
import { ContentGrid } from '@/components/content/content-feature';
import { LandingPage } from '@/components/landingpage/landingpage-feature';
import { useWallet } from '@solana/wallet-adapter-react';

// Register the plugins
export default function Page() {
  const { publicKey } = useWallet();
  const { data: posts } = useGetPostsFromAddress({
    address: publicKey,
  });

  return publicKey ? (
    <div className="flex w-full items-center justify-center">
      <div className="max-w-lg w-full h-full sm:p-4">
        <ContentGrid posts={posts} />
      </div>
    </div>
  ) : (
    <LandingPage />
  );
}
