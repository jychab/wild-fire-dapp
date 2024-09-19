'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, ReactNode, Suspense, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../public/images/logo.png';
import { auth } from '../../utils/firebase/firebase';
import {
  createLoginMessage,
  verifyAndGetToken,
} from '../../utils/firebase/functions';
import {
  AuthenticationDropdownMenu,
  SignInBtn,
} from '../authentication/authentication-ui';
import SearchBar from '../search/search-ui';
import { RightColumn } from '../trending/trending-feature';
import { UploadBtn } from '../upload/upload-ui';

export function UiLayout({ children }: { children: ReactNode }) {
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

  const path = usePathname();

  return (
    <div className="flex w-full bg-base-100 min-h-screen flex-1">
      <div className=" flex flex-col w-full flex-1 items-center">
        <Navbar />
        <div className="flex flex-1 w-full mt-16">
          <div className="w-full flex gap-16 flex-1 justify-center">
            <Suspense
              fallback={
                <span className="loading loading-spinner loading-lg"></span>
              }
            >
              {(!!publicKey || path != '/') && (
                <ul className="hidden min-[1800px]:flex flex-col menu menu-primary bg-base-100 fixed z-10 border-base-300 border-r left-0 gap-2 min-h-screen w-full flex-1 max-w-[250px]">
                  <AuthenticationDropdownMenu />
                </ul>
              )}
              {children}
              {!!publicKey &&
                (path != '/' ? (
                  <div className="hidden min-[1800px]:flex w-full fixed max-w-[250px]" />
                ) : (
                  <RightColumn />
                ))}
            </Suspense>
          </div>
          <Toaster position="bottom-right" />
        </div>
      </div>
    </div>
  );
}

export const Navbar: FC = () => {
  const { publicKey } = useWallet();
  return (
    <div className="flex fixed w-full navbar items-center justify-between gap-4 z-20 bg-base-100 border-b border-base-300">
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
        <span className="hidden md:block font-luckiestguy text-3xl font-bold leading-[0.75]">
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
  );
};

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
