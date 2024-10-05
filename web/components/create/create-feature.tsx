'use client';

import { getDerivedMint } from '@/utils/helper/mint';
import { DAS } from '@/utils/types/das';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhotoPlus } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetTokenDetails } from '../token/token-data-access';
import {
  useCreateMint,
  useCreateMintWithExistingToken,
  useGetAssetByAuthority,
  useGetJupiterVerifiedTokens,
} from './create-data-access';

export const CreatePanel: FC = () => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const { data: metadata } = useGetTokenDetails({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const [metaDataLoaded, setMetadataLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (metadata && !metaDataLoaded && metadata.content?.links?.image) {
      setTempImageUrl(metadata.content.links?.image);

      setName(metadata.content?.metadata.name || '');

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

  const handleHandleChange = (e: any) => {
    setSymbol(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const createMutation = useCreateMint({
    address: publicKey,
  });
  const [valid, setValid] = useState(false);
  useEffect(() => {
    setValid(
      (!!picture || !!metadata?.content?.links?.image) && !!name && !!symbol
    );
  }, [picture, publicKey, name, symbol]);

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="flex flex-col gap-4 items-center sm:pt-16 h-full w-full animate-fade-right animate-duration-200 sm:animate-none">
      <span className="text-3xl md:text-4xl text-center">
        Create Your Token
      </span>
      <span className="text-md md:text-base text-center px-4">
        Add a profile picture, name and symbol. You can always edit it later.
      </span>
      <div className="px-4 pb-4 flex flex-col gap-4 items-start w-full md:border md:border-base-content rounded">
        <span className="hidden md:block pt-4">Create Your Token</span>
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
                <div className="flex flex-col gap-2 w-full h-full border rounded-full items-center justify-center bg-base-100">
                  <IconPhotoPlus size={32} />
                  <span className="text-xs lg:text-base">Click to Upload</span>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                accept="image/*"
                className="hidden text-base"
                name="dropzone-file"
                onChange={handlePictureChange}
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <input
              type="text"
              placeholder="Name"
              value={name}
              maxLength={20}
              className="input input-bordered w-full text-base rounded"
              onChange={handleNameChange}
            />
            <input
              type="text"
              placeholder="Symbol"
              maxLength={20}
              className="input input-bordered w-full text-base rounded"
              value={symbol}
              onChange={handleHandleChange}
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="label">
            <span className="label-text">Description</span>
          </div>
          <textarea
            maxLength={200}
            placeholder="Write a short introduction..."
            className="textarea textarea-bordered textarea-base text-base leading-normal h-24 w-full overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>

        <div className="flex flex-col gap-2 items-center w-full justify-center">
          {publicKey ? (
            <button
              disabled={!valid || createMutation.isPending}
              onClick={async () => {
                await createMutation.mutateAsync({
                  name: name,
                  symbol: symbol,
                  picture: picture || metadata?.content?.links?.image,
                  description: description,
                });
              }}
              className="btn btn-primary w-full rounded"
            >
              {valid ? (
                createMutation.isPending ? (
                  <div className="loading loading-spinner loading-sm" />
                ) : (
                  'Create'
                )
              ) : picture || metadata?.content?.links?.image ? (
                'Missing Fields!'
              ) : (
                'Missing Profile Picture!'
              )}
            </button>
          ) : (
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
          <Link
            className="hidden link text-center text-sm"
            href={'/mint/create/existing'}
          >
            Already have an existing token?
          </Link>
        </div>
      </div>
    </div>
  );
};

export const CreateWithExistingPanel: FC = () => {
  const { publicKey } = useWallet();
  const { data: verifiedTokens } = useGetJupiterVerifiedTokens();
  const { data: assets, isLoading } = useGetAssetByAuthority({
    address: publicKey,
    verifiedTokenList: verifiedTokens?.map((x) => x.address),
  });
  const [selected, setSelected] = useState<DAS.GetAssetResponse>();
  const createMutation = useCreateMintWithExistingToken({ address: publicKey });
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-full">
      <span className="text-3xl md:text-4xl text-center">
        Create an account using an existing token
      </span>
      <span className="text-md md:text-base text-center px-4">
        Select a token you have previously created.
      </span>
      {isLoading && <div className="loading loading-dots" />}
      {assets && assets.length == 0 && <div>No Tokens Found</div>}
      {!isLoading && assets && assets?.length > 0 && (
        <>
          <div className="grid gap-2 overflow-scroll border p-4 w-full max-w-sm rounded">
            {assets?.map((x) => {
              return (
                <div
                  key={x.id}
                  onClick={() => setSelected(x)}
                  className={`btn btn-outline flex items-center w-full justify-start ${
                    selected && selected.id == x.id ? 'btn-primary' : ''
                  }`}
                >
                  <Image
                    width={40}
                    height={40}
                    src={x.content?.links?.image || ''}
                    alt={''}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm">{x.content?.metadata.name}</span>
                    <span className="text-xs">
                      {x.content?.metadata.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {publicKey ? (
            <button
              disabled={createMutation.isPending}
              onClick={async () =>
                selected &&
                createMutation.mutateAsync(new PublicKey(selected.id))
              }
              className="btn btn-primary max-w-sm w-full rounded"
            >
              {createMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : (
                'Create'
              )}
            </button>
          ) : (
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
        </>
      )}
    </div>
  );
};
