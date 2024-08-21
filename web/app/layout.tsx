import { SolanaProvider } from '@/components/solana/solana-provider';
import { UiLayout } from '@/components/ui/ui-layout';
import './global.css';
import { ReactQueryProvider } from './react-query-provider';
export const metadata = {
  title: 'HashFeed - Aidrop To Share',
  description:
    'Create a post and airdrop it directly to your audience wallets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>HashFeed</title>
        <meta property="og:title" content="Airdrop to share content" />
        <meta property="og:type" content="blinks" />
        <meta property="og:url" content="https://hashfeed.social" />
        <meta
          property="og:image"
          content="https://buckets.hashfeed.social/CtiPMWDvrYm8SaWwuVJWWbq9qHCsGZjxVi4RShrgtyCY/media/9d441cd6-a8d0-499c-847d-5c399ef7c0ff"
        />
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
