'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AuthenticationDropdownMenu } from '../authentication/authentication-ui';
import { RightColumn } from '../trending/trending-feature';
import { BottomNavBar, Navbar } from './ui-component';

export function UiLayout({ children }: { children: ReactNode }) {
  const currentPath = usePathname();

  return (
    <div className="flex w-full bg-base-100 min-h-screen flex-1">
      <div className=" flex flex-col w-full flex-1 items-center">
        <Navbar />
        <div className="flex flex-1 w-full sm:mt-16 mb-16">
          <div className="w-full flex gap-16 flex-1 justify-center">
            <Suspense
              fallback={
                <span className="loading loading-spinner loading-lg"></span>
              }
            >
              <ul className="hidden min-[1800px]:flex flex-col menu menu-primary bg-base-100 fixed z-10 border-base-300 border-r left-0 gap-2 min-h-screen w-full flex-1 max-w-[250px]">
                <AuthenticationDropdownMenu />
              </ul>
              {children}
              {currentPath != '/' ? (
                <div className="hidden min-[1800px]:flex w-full fixed max-w-[250px]" />
              ) : (
                <RightColumn />
              )}
            </Suspense>
          </div>
          <Toaster position="bottom-right" />
        </div>
        <BottomNavBar />
      </div>
    </div>
  );
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
