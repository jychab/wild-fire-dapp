'use client';

import { ReactNode, Suspense, useEffect, useRef } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocalStorage, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../images/logo.png';
import { auth } from '../../utils/firebase/firebase';
import {
  createLoginMessage,
  verifyAndGetToken,
} from '../../utils/firebase/functions';
import { SignInBtn } from '../authentication/authentication-ui';
import SearchBar from '../search/search-ui';
import { UploadBtn } from '../upload/upload-ui';

export function UiLayout({ children }: { children: ReactNode }) {
  const [theme, _] = useLocalStorage('theme', 'dark');
  useEffect(() => {
    if (document.querySelector('html')) {
      document.querySelector('html')!.setAttribute('data-theme', theme);
    }
  }, [theme]);
  const pathname = usePathname();
  const { publicKey, signMessage, disconnect } = useWallet();
  const isLoggingInRef = useRef(false);

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
    if (isLoggingInRef.current) return; // Prevent re-entry if already logging in
    isLoggingInRef.current = true;
    try {
      if (
        (auth.currentUser && publicKey.toBase58() !== auth.currentUser.uid) ||
        !auth.currentUser ||
        auth.currentUser.isAnonymous
      ) {
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
      }
    } catch (error) {
      signOut();
    } finally {
      isLoggingInRef.current = false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (
        publicKey &&
        signMessage &&
        ((user && publicKey.toBase58() !== user.uid) ||
          !user ||
          user.isAnonymous)
      ) {
        handleLogin(publicKey, signMessage);
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, [publicKey, signMessage]);

  return (
    <div className="flex flex-col h-screen">
      <div className="drawer drawer-end flex flex-1">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col w-full items-center">
          <div className="w-full navbar fixed flex items-center justify-between gap-4 z-20 shadow-lg text-base-content bg-base-100 border-b border-base-300">
            <Link className="flex items-end gap-1 w-fit" href="/">
              <div className="relative w-8 h-8 justify-center items-center flex">
                <Image
                  src={logo}
                  alt={'logo'}
                  priority={true}
                  className={`object-cover rounded-full`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <span className="hidden md:block text-2xl font-bold">
                BlinksFeed
              </span>
            </Link>
            {publicKey && <SearchBar />}
            <div className="flex gap-1 w-fit items-center">
              <div className="hidden md:flex w-36">
                <UploadBtn />
              </div>
              <SignInBtn />
            </div>
          </div>
          <div className="flex flex-1 w-full mt-16">
            <div className="w-full bg-base-100 text-base-content flex flex-1 justify-center">
              <Suspense
                fallback={
                  <span className="loading loading-spinner loading-lg"></span>
                }
              >
                {children}
              </Suspense>
            </div>
            <Toaster position="bottom-right" />
          </div>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
        </div>
      </div>
      {/* <footer className="hidden md:block p-4">
        <SocialComponent />
      </footer> */}
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
    <div className={`hero pb-[32px]`}>
      <div className="hero-content flex flex-col lg:flex-row gap-4 max-w-5xl items-center justify-center w-full">
        <div className="flex flex-col gap-8 w-full text-center ">
          {typeof title === 'string' ? (
            <h1 className="max-w-2xl text-5xl lg:text-7xl lg:text-left font-bold text-base-content">
              {title}
            </h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6 text-base-content max-w-xl">{subtitle}</p>
          ) : (
            subtitle
          )}
        </div>
        {children}
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
      <div role="alert" className="alert alert-success text-center max-w-sm">
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
        <div className="hidden md:block text-base">Success!</div>
        {signature != 'Success' && (
          <Link
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm md:text-base"
            href={`https://solscan.io/tx/${signature}`}
          >
            View Transaction
          </Link>
        )}
      </div>
    );
  };
}
