import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import { FC } from 'react';
import logo from '../../public/images/logo.png';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetPostsFromAddress } from '../content/content-data-access';
import { DisplayContent } from '../content/content-ui';
import { AppHero } from '../ui/ui-layout';

export const LandingPage: FC = () => {
  const { data: posts, isLoading } = useGetPostsFromAddress({
    address: new PublicKey('1nc1nerator11111111111111111111111111111111'),
  });
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <AppHero
        title={'Your recommended blinks, all in one feed.'}
        subtitle={
          <div className="flex flex-col gap-4 items-center lg:items-start">
            <span className="text-xl md:text-2xl">
              Discover trending blinks curated by your tokens.
            </span>
            <AuthenticationBtn
              children={
                <div className="btn btn-outline bg-base-100 rounded-none">
                  Get Started
                </div>
              }
            />
          </div>
        }
        children={
          <div className="mockup-phone w-full max-w-xs">
            <div className="camera"></div>
            <div className="display w-full">
              <div className="artboard artboard-demo bg-base-100 h-[600px] overflow-y-scroll scrollbar-none">
                <div className="grid grid-cols-1 h-full w-full ">
                  <NavbarLandingPage isLoading={isLoading} />
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

export const NavbarLandingPage: FC<{ isLoading: boolean }> = ({
  isLoading,
}) => {
  return isLoading ? (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full flex-1">
      <div className="relative w-12 h-12">
        <Image
          src={logo}
          alt={'logo'}
          priority={true}
          className={`object-cover`}
          fill={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <span className="block font-luckiestguy text-lg font-bold leading-[0.5]">
        BlinksFeed
      </span>
      <div className="loading loading-dots" />
    </div>
  ) : (
    <div className={`py-4`}></div>
  );
};
