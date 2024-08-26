'use client';

import { Scope } from '@/utils/enums/das';
import { checkIfMetadataExist } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { UploadPost } from './upload-ui';

interface UploadFeatureProps {
  mintId?: string;
  id?: string;
  post: PostContent | undefined | null;
}

export const UploadFeature: FC<UploadFeatureProps> = ({ mintId, id, post }) => {
  const { publicKey } = useWallet();
  const { data: metadataQuery } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  if (
    !publicKey ||
    (publicKey &&
      mintId &&
      getDerivedMint(publicKey).toBase58() != mintId &&
      !(
        publicKey &&
        metadataQuery?.authorities?.find(
          (x) =>
            x.scopes.includes(Scope.METADATA) || x.scopes.includes(Scope.FULL)
        )?.address == publicKey.toBase58()
      ))
  ) {
    return (
      <div className="flex flex-col max-w-2xl h-full items-center justify-center w-full text-center">
        <span>You are not the update authority for this token.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="flex flex-col gap-8 my-4 items-center w-full p-4 pb-32">
        <span className="text-3xl md:text-4xl lg:text-4xl text-base-content">
          {id ? 'Edit Post' : 'Create a New Post'}
        </span>
        <div className="flex flex-col gap-4 items-center max-w-md w-full">
          <UploadPost
            id={id}
            mint={
              !checkIfMetadataExist(metadataQuery)
                ? new PublicKey(metadataQuery!.id)
                : null
            }
            post={post}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadFeature;
