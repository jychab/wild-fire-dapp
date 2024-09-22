'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { useLocalStorage, useWallet } from '@solana/wallet-adapter-react';
import {
  IconBrandGithubFilled,
  IconBrandTelegram,
  IconBrandTwitterFilled,
  IconMoon,
  IconSun,
  IconUserCircle,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FC, ReactNode, useEffect, useState } from 'react';
import logo from '../../public/images/logo.png';
import { SignInBtn } from '../authentication/authentication-ui';
import { Logo } from '../landingpage/landingpage-feature';
import { useGetTokenDetails } from '../profile/profile-data-access';
import SearchBar from '../search/search-ui';
import { UploadBtn } from '../upload/upload-ui';

export const ThemeComponent: FC = ({}) => {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [isMounted, setIsMounted] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setIsMounted(true); // Indicate that the component has mounted
  }, []);

  useEffect(() => {
    if (isMounted && document.querySelector('html')) {
      document.querySelector('html')!.setAttribute('data-theme', theme);
    }
  }, [theme, isMounted]);

  if (!isMounted) {
    return null; // Prevent rendering until after mount to avoid hydration issues
  }

  return (
    <button onClick={toggleTheme} className="w-full flex gap-2 items-center">
      {theme === 'light' ? <IconSun /> : <IconMoon />}
      <span>Dark / Light</span>
    </button>
  );
};

export const SocialComponent: FC = () => {
  return (
    <div className="footer  gap-2 flex flex-col w-full items-center">
      <h6 className="footer-title">Social</h6>
      <nav className="grid md:grid-cols-3 gap-4 ">
        <Link
          rel="noopener noreferrer"
          target="_blank"
          aria-disabled
          href={'/twitter'}
          tabIndex={-1}
          className="pointer-events-none flex flex-col w-full items-center"
        >
          <IconBrandTwitterFilled />
          <span>Twitter</span>
        </Link>
        <Link
          rel="noopener noreferrer"
          target="_blank"
          aria-disabled
          tabIndex={-1}
          href={'/telegram'}
          className="pointer-events-none flex flex-col w-full items-center"
        >
          <IconBrandTelegram />
          <span>Telegram</span>
        </Link>
        <Link
          rel="noopener noreferrer"
          target="_blank"
          aria-disabled
          tabIndex={-1}
          href={'https://github.com/'}
          className="pointer-events-none flex flex-col w-full items-center"
        >
          <IconBrandGithubFilled />
          <span>Github</span>
        </Link>
      </nav>
    </div>
  );
};

export const Navbar: FC = () => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const path = usePathname();
  return (
    <>
      {(publicKey || path !== '/') && (
        <div className="flex sm:hidden justify-between w-full navbar items-center px-4 z-20">
          <Logo styles="w-10 h-10" hideLogo={true} />
          <button
            onClick={() =>
              publicKey &&
              router.push(
                `/profile?mintId=${getDerivedMint(publicKey).toBase58()}`
              )
            }
            className="relative w-10 h-10 mask mask-circle"
          >
            {metaDataQuery && metaDataQuery.content?.links?.image ? (
              <Image
                src={metaDataQuery?.content?.links?.image}
                className={`object-cover`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={'profile pic'}
              />
            ) : (
              <IconUserCircle size={32} />
            )}
          </button>
        </div>
      )}
      <div className="hidden sm:flex fixed w-full navbar items-center justify-between gap-4 z-20 bg-base-100 border-b border-base-300">
        <Link className="flex md:px-4 items-end gap-2 w-fit" href="/">
          <div className="relative w-8 h-8">
            <Image
              src={logo}
              alt={'logo'}
              className={`object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <span className="hidden md:block font-luckiestguy text-3xl leading-[0.75]">
            BlinksFeed
          </span>
        </Link>
        {publicKey && <SearchBar />}
        <div className="flex gap-1 w-fit items-center">
          {publicKey && (
            <div className="hidden md:flex w-36">
              <UploadBtn />
            </div>
          )}
          <SignInBtn />
        </div>
      </div>
    </>
  );
};

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className={`hero pb-[32px]`}>
      <div className="hero-content flex flex-col lg:flex-row gap-4 max-w-5xl items-center justify-center w-full">
        <div className="flex flex-col gap-8 w-full items-center justify-center text-center lg:text-left lg:items-start">
          {typeof title === 'string' ? (
            <h1 className="max-w-2xl text-3xl lg:text-5xl font-bold">
              {title}
            </h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6 max-w-xl">{subtitle}</p>
          ) : (
            subtitle
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
