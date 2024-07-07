import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import { Blinks } from '../blinks/blinks-ui';
import { ContentType } from '../upload/upload-ui';
import { Content } from '../upload/upload.data-access';

interface ContentGridProps {
  content: ContentWithMetada[];
  showMintDetails?: boolean;
}

export interface ContentWithMetada extends Content {
  name: string;
  symbol: string;
  image: string;
  mint: PublicKey;
}

export const ContentGrid: FC<ContentGridProps> = ({
  content,
  showMintDetails,
}) => {
  return (
    content && (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5">
        {content.map((x) => {
          if (x.type.toLowerCase() == ContentType.BLINKS.toLowerCase()) {
            return (
              <BlinksCard
                key={x.uri}
                content={x}
                showMintDetails={showMintDetails}
              />
            );
          }
        })}
      </div>
    )
  );
};

export const BlinksCard: FC<{
  content: ContentWithMetada;
  showMintDetails?: boolean;
}> = ({ content, showMintDetails = true }) => {
  try {
    const url = new URL(content.uri);
    return (
      <div className="flex flex-col gap-2 bg-base-300 rounded w-full">
        {showMintDetails && (
          <div className="flex gap-2 px-4 pt-2 items-center w-full">
            <Link
              className="relative w-8 h-8 rounded-full"
              href={`/dashboard?mintId=${content.mint.toBase58()}`}
            >
              <Image
                src={content.image}
                priority={true}
                className={`object-cover rounded-full`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={'mint'}
              />
            </Link>
            <div className="flex flex-col">
              <Link
                className="text-sm link link-hover"
                href={`/dashboard?mintId=${content.mint.toBase58()}`}
              >
                {content.name}
              </Link>
              <Link
                className="text-xs link link-hover"
                href={`/dashboard?mintId=${content.mint.toBase58()}`}
              >
                {content.symbol}
              </Link>
            </div>
          </div>
        )}
        <Blinks actionUrl={url} />
      </div>
    );
  } catch (e) {
    console.error(e);
    return;
  }
};

export const ImageCard: FC = () => {
  return <div className="aspect"></div>;
};

export const VideoCard: FC = () => {
  return <div className="aspect"></div>;
};
