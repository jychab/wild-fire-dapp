'use client';

import { getDerivedMint, isAuthorized } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhotoPlus } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { useGetTokenDetails } from '../profile/profile-data-access';
import {
  useCloseAccount,
  useEditData,
  useGetMintToken,
} from './edit-data-access';

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
  const closeMutation = useCloseAccount({
    mint: mintId ? new PublicKey(mintId) : null,
  });

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

  return (
    <div className="flex flex-col gap-4 my-4 items-center max-w-2xl h-full w-full sm:p-4">
      <span className="text-3xl lg:text-4xl text-base-content">
        Edit Profile Settings
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full sm:border border-base-content rounded bg-base-100">
        <div className="flex w-full justify-between items-center">
          <span className="hidden sm:block">Profile</span>
          {metadata?.token_info?.supply == 0 && (
            <button
              onClick={() => closeMutation.mutateAsync()}
              className="btn btn-error btn-sm"
            >
              {closeMutation.isPending ? (
                <div className="loading loading-spinner loading-sm" />
              ) : (
                'Close Account'
              )}
            </button>
          )}
        </div>
        <div className="flex flex-col md:flex-row w-full gap-4 items-center sm:border-t sm:border-base-content pt-4">
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
              placeholder="Display Name"
              value={name}
              className="input input-bordered w-full text-base rounded"
              onChange={handleNameChange}
            />
            {isAuthorized(tokenStateData, publicKey, metadata) && (
              <input
                type="text"
                placeholder="Username"
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

        <button
          disabled={
            !publicKey ||
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
          className="btn btn-primary btn-sm w-full rounded"
        >
          {!publicKey && 'Connect Wallet'}
          {publicKey &&
            (editMutation.isPending ? (
              <div className="loading loading-spinner loading-sm" />
            ) : isAuthorized(tokenStateData, publicKey, metadata) ||
              (publicKey && mintId == getDerivedMint(publicKey).toBase58()) ? (
              'Confirm'
            ) : (
              'Unauthorized'
            ))}
        </button>
      </div>
    </div>
  );
};
