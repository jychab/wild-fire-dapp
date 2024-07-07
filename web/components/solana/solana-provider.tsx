'use client';

import dynamic from 'next/dynamic';

import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import { WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useMemo } from 'react';

require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletButton = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_ENDPOINT!,
    ['mainnet']
  );
  const onError = useCallback((error: WalletError) => {
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: 'mainnet-beta',
          metadata: {
            name: 'UnifiedWallet',
            description: 'UnifiedWallet',
            url: 'https://jup.ag',
            iconUrls: ['https://jup.ag/favicon.ico'],
          },
          notificationCallback: undefined,
          walletlistExplanation: {
            href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
          },
          theme: 'dark',
          lang: 'en',
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}
