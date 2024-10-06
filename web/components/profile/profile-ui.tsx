'use client';

import { proxify } from '@/utils/helper/endpoints';
import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import { DAS } from '@/utils/types/das';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconMoneybag, IconSend, IconWallet } from '@tabler/icons-react';
import { InitDataParsed, retrieveLaunchParams } from '@telegram-apps/sdk';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { TelegramWalletButton } from 'unified-wallet-adapter-with-telegram';
import { ContentGrid } from '../content/content-feature';
import { CreateAccountBtn } from '../create/create-ui';
import { useGetMintToken } from '../edit/edit-data-access';
import { useGetTokenDetails } from '../token/token-data-access';
import { UploadBtn } from '../upload/upload-ui';
import { useGetPostsFromCreator } from './profile-data-access';

interface ContentPanelProps {
  address: string | null;
}

export const ContentPanel: FC<ContentPanelProps> = ({ address }) => {
  const { publicKey } = useWallet();
  const { data: posts } = useGetPostsFromCreator({
    creator: address ? new PublicKey(address) : null,
  });
  return posts?.posts && posts?.posts.length == 0 ? (
    address == publicKey?.toBase58() && address ? (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
        <div className="w-36">
          <UploadBtn
            mintId={getDerivedMint(new PublicKey(address)).toBase58()}
          />
        </div>
      </div>
    ) : (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-full w-full text-center text-lg">
        No post found!
      </div>
    )
  ) : (
    <ContentGrid
      hideComment={true}
      multiGrid={true}
      hideUserPanel={true}
      showMintDetails={false}
      editable={true}
      posts={posts}
    />
  );
};

interface ProfileProps {
  mintId: string | null;
}

export const Profile: FC<ProfileProps> = ({ mintId }) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: metadata, isLoading } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const [initData, setInitData] = useState<InitDataParsed>();
  useEffect(() => {
    try {
      const { initData } = retrieveLaunchParams();
      if (initData) {
        setInitData(initData);
      }
    } catch (e) {}
  }, []);
  const isOwner =
    publicKey &&
    (isAuthorized(tokenStateData, publicKey, metadata) ||
      getDerivedMint(publicKey).toBase58() == mintId);
  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
      <button
        onClick={() => isOwner && router.push(`/mint/edit?mintId=${mintId}`)}
        className={`w-40 h-40 items-center justify-center group flex ${
          isOwner ? 'avatar indicator' : ''
        }`}
      >
        {isOwner && (
          <span className="hidden group-hover:flex indicator-item badge badge-secondary absolute top-4 right-4">
            Edit
          </span>
        )}
        {!isLoading && (
          <div
            className={`relative h-full w-full rounded-full ${
              isOwner
                ? 'ring-secondary ring-offset-base-100 hover:ring ring-offset-2'
                : ''
            } cursor-pointer`}
          >
            <Image
              className={`object-cover rounded-full`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={proxify(
                metadata?.content?.links?.image ||
                  initData?.user?.photoUrl ||
                  placeholderImage,
                true
              )}
              alt={''}
            />
          </div>
        )}
      </button>
      <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
        <div className="flex flex-col">
          {!isLoading && (
            <span className="text-xl lg:text-3xl font-bold truncate max-w-sm">
              {metadata?.content?.metadata.name ||
                initData?.user?.username ||
                publicKey?.toBase58()}
            </span>
          )}
        </div>

        {publicKey && mintId == getDerivedMint(publicKey).toBase58() && (
          <TelegramWalletButton
            overrideContent={
              <div className="btn btn-sm btn-primary btn-outline flex items-center gap-2 justify-start ">
                <IconWallet />
                <span className="truncate w-24">{publicKey?.toBase58()}</span>
              </div>
            }
          />
        )}

        <span className="text-base truncate font-normal">
          {metadata?.content?.metadata.description}
        </span>
      </div>
    </div>
  );
};
export const LockedContent: FC<{
  metadata: DAS.GetAssetResponse | null;
}> = ({ metadata }) => {
  return (
    metadata == null && (
      <div className="flex flex-col flex-1 justify-center items-center bg-opacity-80 p-4 h-full w-full">
        <div className="flex flex-col gap-4 rounded-box bg-base-100 border w-full max-w-sm p-4">
          <div className="flex flex-col gap-4 items-center">
            <h1 className="font-bold text-xl">Unlock This Feature</h1>
            <span className="text-center text-sm">
              Launch your own token to unlock the following features
            </span>
          </div>
          <div className="flex flex-col">
            <div className="divider mt-0"></div>
            <div className="flex gap-4 px-4 items-center">
              <IconMoneybag />
              <div className="flex flex-col">
                <h2 className="font-bold">Monetize your Content</h2>
                <span className="text-sm">Earn trading fees</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="flex gap-4 px-4 items-center">
              <IconSend />
              <div className="flex flex-col">
                <h2 className="font-bold">Airdrop to Share</h2>
                <span className="text-sm">
                  Distribute your content to 200k users for just 1 SOL.
                </span>
              </div>
            </div>
            <div className="divider mb-0"></div>
          </div>
          <CreateAccountBtn />
        </div>
      </div>
    )
  );
};
