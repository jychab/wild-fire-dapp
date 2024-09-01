'use client';

import { useLocalStorage } from '@solana/wallet-adapter-react';
import {
  IconBrandGithubFilled,
  IconBrandTelegram,
  IconBrandTwitterFilled,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';

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
