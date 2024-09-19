'use client';

import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhotoPlus } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetTokenDetails } from '../profile/profile-data-access';
import { useEditData, useGetMintToken } from './edit-data-access';

interface EditFeatureProps {
  mintId: string | null;
}
export const EditFeature: FC<EditFeatureProps> = ({ mintId }) => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: metadata } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const editMutation = useEditData({
    mint: mintId ? new PublicKey(mintId) : null,
    metadata: metadata,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [metaDataLoaded, setMetadataLoaded] = useState(false);
  useEffect(() => {
    if (metadata && !metaDataLoaded && metadata.content?.links?.image) {
      setTempImageUrl(metadata.content.links?.image);

      setName(metadata.content?.metadata.name || '');

      setSymbol(metadata.content?.metadata.symbol || '');
      if (description == '' && metadata.content.metadata?.description) {
        setDescription(metadata.content.metadata?.description);
      }
      setMetadataLoaded(true);
    }
  }, [metadata, metaDataLoaded, tempImageUrl, name, symbol, description]);

  const handlePictureChange = (e: any) => {
    const selectedFile = e.target.files[0];
    if (selectedFile !== undefined) {
      setPicture(selectedFile);
      setTempImageUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };

  const handleSymbolChange = (e: any) => {
    setSymbol(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 items-center sm:pt-16 h-full w-full">
      <span className="text-3xl md:text-4xl text-center">
        Edit Token Settings
      </span>
      <div className="px-4 pb-4 flex flex-col gap-4 items-start w-full md:border md:border-base-content rounded">
        <span className="hidden sm:block pt-4">Settings</span>
        <div className="flex flex-col md:flex-row w-full gap-4 items-center md:border-t md:border-base-content md:pt-4">
          <div className="flex w-40 h-40 items-center justify-center">
            <label
              htmlFor="dropzone-file"
              className={`cursor-pointer relative flex flex-col w-40 h-40 justify-center items-center`}
            >
              {tempImageUrl ? (
                <Image
                  className={`rounded-full object-cover cursor-pointer`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={''}
                />
              ) : (
                <div className="flex flex-col gap-2 rounded-full w-full h-full border border-base-content items-center justify-center">
                  <IconPhotoPlus size={32} />
                  <p className="text-sm text-center flex flex-col text-gray-400">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                className="hidden text-base"
                name="dropzone-file"
                accept="image/*"
                onChange={handlePictureChange}
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <input
              type="text"
              placeholder="Name"
              value={name}
              className="input input-bordered w-full text-base rounded"
              onChange={handleNameChange}
            />
            {isAuthorized(tokenStateData, publicKey, metadata) && (
              <input
                type="text"
                placeholder="Symbol"
                className="input input-bordered w-full text-base rounded"
                value={symbol}
                onChange={handleSymbolChange}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="label">
            <span className="label-text">Description</span>
          </div>
          <textarea
            maxLength={200}
            placeholder="Write a short introduction..."
            className="textarea textarea-bordered textarea-base text-base w-full h-24 leading-normal overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>

        {publicKey && (
          <button
            disabled={
              editMutation.isPending ||
              !(
                isAuthorized(tokenStateData, publicKey, metadata) ||
                (publicKey && mintId == getDerivedMint(publicKey).toBase58())
              )
            }
            onClick={async () => {
              await editMutation.mutateAsync({
                name: name,
                symbol: symbol,
                description: description,
                picture: picture,
              });
            }}
            className="btn btn-primary btn w-full rounded"
          >
            {editMutation.isPending ? (
              <div className="loading loading-spinner loading-sm" />
            ) : isAuthorized(tokenStateData, publicKey, metadata) ||
              mintId == getDerivedMint(publicKey).toBase58() ? (
              'Confirm'
            ) : (
              'Unauthorized'
            )}
          </button>
        )}
        {!publicKey && (
          <div className="w-full">
            <AuthenticationBtn
              children={
                <div className="w-full rounded btn-primary btn">
                  Connect Wallet
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
