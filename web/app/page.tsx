'use client';

import { useGetPostsFromAddress } from '@/components/content/content-data-access';
import { ContentGrid } from '@/components/content/content-feature';
import { LandingPage } from '@/components/landingpage/landingpage-feature';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  if (publicKey) {
    return <MainPage publicKey={publicKey} />;
  }
  return <LandingPage />;
}

const MainPage: FC<{ publicKey: PublicKey }> = ({ publicKey }) => {
  const { data: posts } = useGetPostsFromAddress({
    address: publicKey,
  });

  return (
    <div className="flex flex-col w-full absolute items-center justify-center">
      <div className="max-w-lg w-full h-full sm:p-4">
        <ContentGrid posts={posts} />
      </div>
    </div>
  );
};
