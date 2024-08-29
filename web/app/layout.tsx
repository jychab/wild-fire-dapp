import { SolanaProvider } from '@/components/solana/solana-provider';
import { UiLayout } from '@/components/ui/ui-layout';
import './global.css';
import { ReactQueryProvider } from './react-query-provider';
export const metadata = {
  title: 'BlinksFeed - Every blinks in a feed',
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
        <ReactQueryProvider>
          <SolanaProvider>
            <UiLayout>{children}</UiLayout>
          </SolanaProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
