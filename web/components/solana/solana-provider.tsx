'use client';

import { WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useMemo } from 'react';
import { UnifiedWalletProvider } from 'unified-wallet-adapter-with-telegram';

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
          telegramConfig: {
            botDisplayPic: 'https://buckets.blinksfeed.com/blinksfeed/logo.png',
            botDirectLink: 'https://t.me/blinksfeedbot/blinksfeed',
            rpcEndpoint: 'https://rpc.blinksfeed.com',
            backendEndpoint: 'https://api-733yg2bcpq-uc.a.run.app',
            botUsername: 'blinksfeedbot',
          },
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
          theme: 'jupiter',
          lang: 'en',
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}
