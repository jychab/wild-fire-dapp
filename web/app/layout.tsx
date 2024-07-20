import { SolanaProvider } from '@/components/solana/solana-provider';
import { UiLayout } from '@/components/ui/ui-layout';
import './global.css';
import { ReactQueryProvider } from './react-query-provider';
export const metadata = {
  title: 'HashFeed - Aidrop To Share',
  description:
    'Create your content and airdrop it directly to your audience wallets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://terminal.jup.ag/main-v3.js" data-preload />
      </head>
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
