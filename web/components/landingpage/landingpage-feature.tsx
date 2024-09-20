'use client';

import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import logo from '../../public/images/logo.png';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetPostsFromAddress } from '../content/content-data-access';
import { DisplayContent } from '../content/content-ui';
import { AppHero } from '../ui/ui-layout';

export const LandingPage: FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: posts, isLoading } = useGetPostsFromAddress({
    address: new PublicKey('1nc1nerator11111111111111111111111111111111'),
  });

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Logo />
      <AppHero
        title={
          <h1 className="hidden sm:block max-w-2xl text-3xl lg:text-5xl font-bold px-10">
            Discover, Trade, and Own Blinks — All in One Feed.
          </h1>
        }
        subtitle={
          <div className="flex flex-col gap-4 items-center lg:items-start px-10">
            <span className="sm:hidden text-xl md:text-2xl">
              Discover, Trade, and Own Blinks — All in One Feed.
            </span>
            <AuthenticationBtn>
              <div className="btn btn-outline bg-base-100 rounded-none">
                Get Started
              </div>
            </AuthenticationBtn>
          </div>
        }
        children={
          <div className="hidden sm:mockup-phone w-full max-w-xs">
            <div className="camera"></div>
            <div className="display w-full">
              <div className="artboard artboard-demo bg-base-100 h-[600px] overflow-y-scroll scrollbar-none">
                <div className="grid grid-cols-1 h-full w-full ">
                  {posts?.posts?.map((x) => (
                    <DisplayContent
                      key={x.id}
                      blinksDetail={x}
                      hideComment={true}
                      showMintDetails={true}
                      editable={false}
                      multiGrid={false}
                      hideBorder={true}
                      expandAll={true}
                    />
                  ))}
                  <div className=""></div>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export const Logo: FC<{ styles?: string; hideLogo?: boolean }> = ({
  styles = 'w-24 h-24',
  hideLogo = false,
}) => {
  return (
    <Link
      className="flex sm:hidden flex-col items-center justify-center gap-4"
      href={'/'}
    >
      {!hideLogo && (
        <div className={`relative ${styles}`}>
          <Image
            src={logo}
            alt={'logo'}
            className={`object-cover`}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <span className="block font-luckiestguy text-2xl font-bold leading-[0.5]">
        BlinksFeed
      </span>
    </Link>
  );
};
