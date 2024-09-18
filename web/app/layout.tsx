import { SolanaProvider } from '@/components/solana/solana-provider';
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
            <UiLayout>{children}</UiLayout>
          </ReactQueryProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}
