import { AuthenticationProvider } from '@/components/authentication/authentication-provider';
import { ActionsRegistryProvider } from '@/components/blinks/provider';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { TelegramProvider } from '@/components/telegram/telegram-provider';
import { UiProvider } from '@/components/ui/ui-provider';
import '@dialectlabs/blinks/index.css';
import './global.css';
import { ReactQueryProvider } from './react-query-provider';
export const metadata = {
  title: 'BlinksFeed',
  description: 'Your recommended blinks, all in one feed.',
  metadataBase: new URL('https://blinksfeed.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://proxify.blinksfeed.com" />
        <link rel="preconnect" href="googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://platform.twitter.com" />
      </head>
      <body>
        <SolanaProvider>
          <ReactQueryProvider>
            <AuthenticationProvider>
              <TelegramProvider>
                <ActionsRegistryProvider>
                  <UiProvider>{children}</UiProvider>
                </ActionsRegistryProvider>
              </TelegramProvider>
            </AuthenticationProvider>
          </ReactQueryProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
