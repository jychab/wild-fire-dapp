'use client';

import usePaginatedData from '@/utils/hooks/pagination';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC, useCallback, useEffect } from 'react';
import { HASHFEED_MINT } from '../../utils/consts';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { fetchContentPage } from './content-data-access';
import { ContentGrid, ContentWithMetada, DisplayContent } from './content-ui';

export const ContentGridFeature: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { data: whitelistedMint } = useGetTokenDetails({ mint: HASHFEED_MINT });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePaginatedData(
      ['content', publicKey],
      (pageParam) =>
        fetchContentPage(
          pageParam,
          50,
          publicKey!,
          whitelistedMint,
          connection
        ),
      50,
      !!publicKey
    );
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop ===
      document.documentElement.offsetHeight
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return <ContentGrid content={data?.pages.flat() || []} />;
};

interface ContentCardFeatureProps {
  mintId: string;
  id: string;
}

export const ContentCardFeature: FC<ContentCardFeatureProps> = ({
  mintId,
  id,
}) => {
  const { data: metadataQuery } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const content =
    metadataQuery &&
    metadataQuery.additionalInfoData &&
    metadataQuery.additionalInfoData.content
      ? {
          ...(metadataQuery.additionalInfoData.content.find(
            (x) => x.id == id
          ) || []),
          name: metadataQuery.content?.metadata.name,
          symbol: metadataQuery.content?.metadata.symbol,
          image: metadataQuery.additionalInfoData.imageUrl,
          mint: new PublicKey(metadataQuery.id),
        }
      : undefined;
  return content ? (
    <div className="flex flex-col py-[32px] w-full items-center">
      <div className="max-w-lg w-full">
        <DisplayContent content={content as ContentWithMetada} />
      </div>
    </div>
  ) : (
    <div>No Content Found</div>
  );
};
