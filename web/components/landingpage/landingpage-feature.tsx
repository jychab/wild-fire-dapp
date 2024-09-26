import { fetchPostByCategories } from '@/utils/helper/post';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import logo from '../../public/images/logo.png';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { DisplayContent } from '../content/content-ui';
import { AppHero } from '../ui/ui-component';

export const LandingPage: FC = async () => {
  const posts = await fetchPostByCategories('post', 'memes', 'tags');
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Logo />
      <AppHero
        title={
          <h1 className="hidden sm:block max-w-2xl lg:text-4xl font-bold px-4">
            Discover, Trade, and Own Blinks - All in one feed.
          </h1>
        }
        subtitle={
          <div className="flex flex-col gap-4 items-center lg:items-start px-4">
            <span className="sm:hidden md:text-2xl px-16 sm:px-0">
              Discover, Trade, and Own Blinks - All in one feed.
            </span>
            <AuthenticationBtn>
              <div className="btn btn-outline bg-base-100">Get Started</div>
            </AuthenticationBtn>
          </div>
        }
        children={
          <div className="hidden sm:mockup-phone w-full max-w-xs">
            <div className="camera"></div>
            <div className="display w-full">
              <div className="artboard artboard-demo bg-base-100 h-[600px] overflow-y-scroll scrollbar-none">
                <div className="grid grid-cols-1 h-full w-full ">
                  <div className="py-4" />
                  {posts?.map((x) => (
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

      <span className="block font-luckiestguy text-xl leading-[0.5]">
        BlinksFeed
      </span>
    </Link>
  );
};
