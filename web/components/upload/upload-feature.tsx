'use client';

import { checkIfMetadataIsTemporary } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { PostContent } from '@/utils/types/post';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { FC } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { UploadPost } from './upload-ui';
import { useGetPostCampaign } from './upload.data-access';

interface UploadFeatureProps {
  mintId?: string;
  id?: string;
  post: PostContent | undefined | null;
}

export const UploadFeature: FC<UploadFeatureProps> = ({ mintId, id, post }) => {
  const { publicKey } = useWallet();
  const { data: postCampaign } = useGetPostCampaign({
    address: publicKey,
    postId: id || null,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="flex flex-col gap-8 my-4 items-center w-full p-4 animate-fade-right animate-duration-200 sm:animate-none">
        <span className="text-3xl md:text-4xl lg:text-4xl text-base-content">
          {id ? 'Edit Post' : 'Create a New Post'}
        </span>
        <div className="flex flex-col gap-4 items-center max-w-md w-full">
          <UploadPost
            id={id}
            mint={
              mintId
                ? new PublicKey(mintId)
                : !checkIfMetadataIsTemporary(metadata) && publicKey
                ? getDerivedMint(publicKey)
                : null
            }
            post={post}
            postCampaign={postCampaign}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadFeature;
