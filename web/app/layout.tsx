import { AuthenticationProvider } from '@/components/authentication/authentication-provider';
import { SolanaProvider } from '@/components/solana/solana-provider';
import { TelegramProvider } from '@/components/telegram/telegram-provider';
import { UiLayout } from '@/components/ui/ui-layout';
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
      <body>
        <SolanaProvider>
          <ReactQueryProvider>
            <AuthenticationProvider>
              <TelegramProvider>
                <UiLayout>{children}</UiLayout>
              </TelegramProvider>
            </AuthenticationProvider>
          </ReactQueryProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
