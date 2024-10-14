import { CreatePanel } from '@/components/create/create-feature';
import { proxify } from '@/utils/helper/endpoints';
import { Metadata } from 'next';

export async function generateMetadata({}): Promise<Metadata> {
  return {
    openGraph: {
      title: 'Create your token',
      description:
        'Create blinks code-free and share them by airdropping tokens with our custom tool. Earn fees on every transfer.',
      url: 'https://blinksfeed.com/mint/create',
      images: [
        {
          url: proxify(
            'https://buckets.blinksfeed.com/blinksfeed/main.gif',
            true
          ),
          alt: '',
        },
      ],
      type: 'website',
    },
  };
}

export default function page() {
  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="w-full max-w-2xl h-full">
        <CreatePanel />
      </div>
    </div>
  );
}
