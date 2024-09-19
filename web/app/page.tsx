'use client';

import { useGetPostsFromAddress } from '@/components/content/content-data-access';
import { ContentGrid } from '@/components/content/content-feature';
import { LandingPage } from '@/components/landingpage/landingpage-feature';
import { Profile } from '@/components/profile/profile-ui';
import { useRelativePathIfPossbile } from '@/utils/helper/endpoints';
import { getDerivedMint } from '@/utils/helper/mint';
import { fetchPost } from '@/utils/helper/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useRef, useState } from 'react';

export default function Page() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [path, setPath] = useState<string>();
  useEffect(() => {
    try {
      const { startParam } = retrieveLaunchParams();
      const param = startParam?.split('_');
      if (param && param.length == 2) {
        fetchPost(param[0], param[1]).then((x) => {
          if (x) {
            setPath(useRelativePathIfPossbile(x.url));
          }
        });
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  // Ensure that the page content is only rendered if `publicKey` is available
  if (path) {
    router.push(path);
  } else if (publicKey) {
    return <MainPage publicKey={publicKey} />;
  }
  return <LandingPage />;
}

const MainPage: FC<{ publicKey: PublicKey }> = ({ publicKey }) => {
  const { data: posts } = useGetPostsFromAddress({
    address: publicKey,
  });
  const contentGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!posts) return;
    const scrollTimeout = setTimeout(() => {
      if (contentGridRef.current) {
        window.scrollTo({
          top: contentGridRef.current.offsetTop, // Adjust offset if needed
          behavior: 'smooth',
        });
      }
    }, 100); // Adjust the delay as needed

    return () => clearTimeout(scrollTimeout);
  }, [posts]);
  return (
    <div className="flex flex-col w-full absolute items-center justify-center">
      <div className="block sm:hidden">
        <Profile mintId={getDerivedMint(publicKey).toBase58()} />
      </div>
      <div ref={contentGridRef} className="max-w-lg w-full h-full sm:p-4">
        <ContentGrid posts={posts} />
      </div>
    </div>
  );
};
