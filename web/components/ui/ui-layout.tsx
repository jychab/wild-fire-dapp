'use client';

import { ReactNode, Suspense, useEffect, useRef } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocalStorage, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../images/logo.png';
import { auth } from '../firebase/firebase';
import { createLoginMessage, verifyAndGetToken } from '../firebase/functions';
import { SocialComponent, ThemeComponent } from './ui-component';

export function UiLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage('theme', 'cupcake');
  const toggleTheme = () => {
    setTheme(theme === 'night' ? 'cupcake' : 'night');
  };

  useEffect(() => {
    if (document.querySelector('html')) {
      document.querySelector('html')!.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const links: { label: string; path: string }[] = [
    // { label: 'Dashboard', path: '/dashboard' },
    // { label: 'Create', path: '/create' },
  ];
  const pathname = usePathname();

  const { publicKey, signMessage, disconnect } = useWallet();
  const signOut = async () => {
    if (auth.currentUser) {
      await auth.signOut();
    }
    if (publicKey) {
      await disconnect();
    }
  };
  const handleLogin = async (
    publicKey: PublicKey,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ) => {
    if (
      (auth.currentUser && publicKey.toBase58() !== auth.currentUser.uid) ||
      !auth.currentUser ||
      auth.currentUser.isAnonymous
    ) {
      try {
        let currentUser = auth.currentUser;
        if (!currentUser) {
          currentUser = (await signInAnonymously(auth)).user;
        }
        const sessionKey = await currentUser.getIdToken();
        const message = createLoginMessage(sessionKey);
        const output = await signMessage(new TextEncoder().encode(message));
        const token = await verifyAndGetToken(publicKey, output);
        // Sign in with Firebase Authentication using a custom token.
        await signInWithCustomToken(auth, token);
      } catch (error) {
        signOut();
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (auth.currentUser == null && publicKey && signMessage) {
      handleLogin(publicKey, signMessage);
    } else if (auth.currentUser && !publicKey) {
      signOut();
    }
  }, [auth.currentUser, publicKey]);

  return (
    <div className="flex flex-col h-screen">
      <div className="drawer flex flex-1">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col w-full">
          <div className="w-full navbar ">
            <div className="flex-none md:hidden">
              <label
                htmlFor="my-drawer-3"
                aria-label="open sidebar"
                className="btn btn-square btn-ghost"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-6 h-6 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </label>
            </div>
            <Link
              className="hidden md:flex px-4 items-center gap-2 w-[480px]"
              href="/"
            >
              <span className="text-2xl font-bold uppercase">HashFeed</span>
              <Image src={logo} alt={'logo'} width={30} height={30} />
            </Link>
            <div className="hidden md:flex w-full">
              <ul className="menu menu-horizontal gap-2">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={pathname.startsWith(path) ? 'active' : ''}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="navbar-end w-full gap-4">
              <div className="hidden">
                <ThemeComponent toggleTheme={toggleTheme} theme={theme} />
              </div>
              {/* <WalletButton /> */}
            </div>
          </div>
          <div className="flex-grow mx-4 w-full mx-auto">
            <Suspense
              fallback={
                <div className="text-center my-32">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              }
            >
              {children}
            </Suspense>
            <Toaster position="bottom-right" />
          </div>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <div className=" p-4 w-44 min-h-full bg-base-200 gap-4 flex flex-col justify-between">
            <div>
              <div className="flex gap-1 items-center">
                <span className="text-xl font-bold uppercase">HashFeed</span>
                <Image src={logo} alt={'logo'} width={25} height={25} />
              </div>
              <ul className="menu gap-2">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={pathname.startsWith(path) ? 'active' : ''}
                      href={path}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="block md:hidden">
              <SocialComponent />
            </div>
          </div>
        </div>
      </div>
      <footer className="hidden md:block p-4">
        <SocialComponent />
      </footer>
    </div>
  );
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (show) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [show, dialogRef]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                onClick={submit}
                disabled={submitDisabled}
              >
                {submitLabel || 'Save'}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

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
    <div className={`hero py-[32px]`}>
      <div className="hero-content text-center w-full">
        <div className={`w-full items-center flex flex-col`}>
          {typeof title === 'string' ? (
            <h1 className="max-w-3xl text-3xl lg:text-5xl font-bold text-base-content">
              {title}
            </h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6 text-base-content">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.custom(
      <div role="alert" className="alert alert-success max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="hidden md:block text-base">Transaction Sent!</div>
        <Link className="text-sm md:text-base" href={`tx/${signature}`}>
          View Transaction
        </Link>
      </div>
    );
  };
}
