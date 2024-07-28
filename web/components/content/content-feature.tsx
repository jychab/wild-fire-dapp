'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { getPostsFromAddress as useGetPostsFromAddress } from './content-data-access';
import { ContentGrid, DisplayContent } from './content-ui';

export const ContentGridFeature: FC = () => {
  const { publicKey } = useWallet();

  const { data: posts } = useGetPostsFromAddress({
    address: publicKey,
  });

  return <ContentGrid posts={posts} />;
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

  const post = metadataQuery?.additionalInfoData?.posts?.find((x) => x.id == id)
    ? {
        ...metadataQuery.additionalInfoData.posts.find((x) => x.id == id)!,
        metadata: { ...metadataQuery },
      }
    : undefined;
  return post ? (
    <div className="flex flex-col w-full items-center sm:py-4">
      <div className="max-w-lg w-full">
        <DisplayContent expandAll={true} post={post} showMintDetails={true} />
      </div>
    </div>
  ) : (
    <div>No Content Found</div>
  );
};
