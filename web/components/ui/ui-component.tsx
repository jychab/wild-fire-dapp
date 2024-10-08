'use client';

import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { useLocalStorage, useWallet } from '@solana/wallet-adapter-react';
import {
  IconBrandGithubFilled,
  IconBrandTelegram,
  IconBrandTwitterFilled,
  IconCoin,
  IconHome,
  IconMoon,
  IconRocket,
  IconSquarePlus,
  IconSun,
  IconUserCircle,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useUnifiedWalletContext } from 'unified-wallet-adapter-with-telegram';
import logo from '../../public/images/logo.png';
import { SignInBtn } from '../authentication/authentication-ui';
import { ClaimButton } from '../claim/claim-feature';
import { SearchBar } from '../search/search-ui';
import { useGetTokenDetails } from '../token/token-data-access';
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
  return (
    <>
      <div className="flex fixed sm:hiddenw-full navbar items-center justify-between gap-4 z-20 bg-base-100 border-b border-base-300 pl-4 pr-6">
        <Link className="flex sm:hidden items-end" href={'/'}>
          <span className="block font-luckiestguy text-2xl leading-[0]]">
            BlinksFeed
          </span>
        </Link>
        <div className="flex gap-1 w-fit items-center">
          {publicKey && <ClaimButton />}
          <SignInBtn />
        </div>
      </div>
      <div className="hidden sm:flex fixed w-full navbar items-center justify-between gap-4 z-20 bg-base-100 border-b border-base-300">
        <Link className="flex sm:px-4 items-end gap-2 w-fit" href="/">
          <div className="relative w-8 h-8">
            <Image
              src={logo}
              alt={'logo'}
              className={`object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <span className="hidden sm:block font-luckiestguy text-3xl leading-[0.75]">
            BlinksFeed
          </span>
        </Link>
        {publicKey && <SearchBar />}
        <div className="flex gap-1 w-fit items-center">
          {publicKey && (
            <div className="hidden sm:flex items-center gap-4 w-55">
              <ClaimButton />
              <UploadBtn />
            </div>
          )}
          <SignInBtn />
        </div>
      </div>
    </>
  );
};

export const BottomNavBar: FC = () => {
  const { setShowModal } = useUnifiedWalletContext();
  const { publicKey } = useWallet();
  const { data: metaDataQuery } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const router = useRouter();
  const path = usePathname();
  return (
    <div className="btm-nav z-20 flex sm:hidden">
      <button
        onClick={() => router.push('/')}
        className={`${path == '/' ? 'active' : ''}`}
      >
        <IconHome />
      </button>
      {!checkIfMetadataIsTemporary(metaDataQuery) && (
        <button
          className={`${path == '/token' ? 'active' : ''}`}
          onClick={() =>
            publicKey
              ? router.push(`/token?mintId=${getDerivedMint(publicKey)}`)
              : setShowModal(true)
          }
        >
          <IconCoin />
        </button>
      )}
      <button
        className={`${path == '/post/create' ? 'active' : ''}`}
        onClick={() => router.push(`/post/create`)}
      >
        <IconSquarePlus />
      </button>
      {!checkIfMetadataIsTemporary(metaDataQuery) && (
        <button
          className={`${path == '/airdrop' ? 'active' : ''}`}
          onClick={() => router.push(`/airdrop`)}
        >
          <IconRocket />
        </button>
      )}
      <button
        className={`${path == '/profile' ? 'active' : ''}`}
        onClick={() =>
          publicKey
            ? router.push(`/profile?address=${publicKey.toBase58()}`)
            : setShowModal(true)
        }
      >
        <IconUserCircle />
      </button>
    </div>
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
