'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetMintDetails,
  useGetMintMetadata,
  useGetMintTransferFeeConfig,
} from '../dashboard/dashboard-data-access';
import {
  useCloseAccount,
  useEditData,
  useGetMintToken,
} from './edit-data-access';

interface EditTokenProps {
  mintId: string;
}
export const EditToken: FC<EditTokenProps> = ({ mintId }) => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const [admin, setAdmin] = useState('');

  const editMutation = useEditData({ mint: new PublicKey(mintId) });
  const closeMutation = useCloseAccount({ mint: new PublicKey(mintId) });

  const [showMaxFee, setShowMaxFee] = useState(false);
  const { data: mintTokenData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });
  const { data: metaData } = useGetMintMetadata({
    mint: new PublicKey(mintId),
  });

  const [mintTokenDataLoaded, setMintTokenDataLoaded] = useState(false);
  useEffect(() => {
    if (mintTokenData && !mintTokenDataLoaded) {
      setAdmin(mintTokenData.admin.toString());
      setMintTokenDataLoaded(true);
    }
  }, [mintTokenData, mintTokenDataLoaded]);
  const { data: mintQuery } = useGetMintDetails({
    mint: new PublicKey(mintId),
  });
  const { data: transferFeeConfig } = useGetMintTransferFeeConfig({
    mint: mintQuery,
  });

  const [metaDataLoaded, setMetadataLoaded] = useState(false);
  useEffect(() => {
    if (metaData && !metaDataLoaded) {
      setTempImageUrl(metaData.image);

      setName(metaData.metaData.name);

      setSymbol(metaData.metaData.symbol);

      if (
        description == '' &&
        metaData.description &&
        metaData.description != ''
      ) {
        setDescription(metaData.description);
      }
      setMetadataLoaded(true);
    }
  }, [metaData, metaDataLoaded, tempImageUrl, name, symbol, description]);

  const [transferFeeConfigLoaded, setTransferFeeConfigLoaded] = useState(false);
  useEffect(() => {
    if (transferFeeConfig && !transferFeeConfigLoaded) {
      if (fee == '') {
        setFee(
          (
            transferFeeConfig.newerTransferFee.transferFeeBasisPoints / 100
          ).toString()
        );
      }
      if (
        maxFee == '' &&
        Number(transferFeeConfig.newerTransferFee.maximumFee) !=
          Number.MAX_SAFE_INTEGER
      ) {
        setMaxFee(
          Number(transferFeeConfig.newerTransferFee.maximumFee).toString()
        );
        setShowMaxFee(true);
      }
      setTransferFeeConfigLoaded(true);
    }
  }, [transferFeeConfig, transferFeeConfigLoaded, fee, maxFee]);

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

  const router = useRouter();
  return (
    <div className="flex flex-col gap-8 my-4 items-center max-w-2xl w-full p-4">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Edit Settings
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <div className="flex w-full justify-between items-center">
          <span>Details</span>
          {mintQuery && Number(mintQuery.supply) == 0 && (
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
        <div className="flex flex-col md:flex-row w-full gap-4 py-4 items-center border-t border-base-content">
          <div className="flex w-32 h-32 lg:w-40 lg:h-40 items-center justify-center">
            <label
              htmlFor="dropzone-file"
              className={`cursor-pointer relative flex flex-col w-32 h-32 lg:w-40 lg:h-40 justify-center items-center`}
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
                <div className="flex flex-col w-full h-full border border-base-content items-center justify-center">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="text-sm text-center flex flex-col text-gray-400">
                    <span className="font-semibold">Click to upload</span>
                    <span>or drag and drop</span>
                  </p>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                name="dropzone-file"
                onChange={handlePictureChange}
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <input
              type="text"
              placeholder="name"
              value={name}
              className="input input-bordered w-full text-sm rounded"
              onChange={handleNameChange}
            />
            <input
              type="text"
              placeholder="symbol"
              className="input input-bordered w-full text-sm rounded"
              value={symbol}
              onChange={handleSymbolChange}
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="label">
            <span className="label-text">Description (optional)</span>
          </div>
          <textarea
            maxLength={200}
            placeholder="Write your description..."
            className="textarea textarea-bordered textarea-sm w-full h-24 leading-normal overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>
        <div className="grid grid-cols-4 w-full gap-4 items-center ">
          <span className="text-sm">Authority</span>
          <input
            disabled={mintTokenData?.mutable == 0}
            type="text"
            placeholder="authority"
            className="col-span-3 input input-bordered w-full text-sm rounded"
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 w-full items-center gap-4">
          <span className="text-sm ">Transfer Fee</span>
          <label
            className="col-span-3 input input-bordered flex items-center w-fit text-sm gap-2"
            data-tip="High fees might discourage users from using your token"
          >
            <input
              disabled={mintTokenData?.mutable == 0}
              value={fee}
              onChange={(e) => {
                setFee(e.target.value);
              }}
              type="number"
              className="w-6 text-right"
              placeholder=""
            />
            %
          </label>
          <span className="text-sm">Max Transfer Fee</span>
          <div className="col-span-3 flex flex-col items-start gap-2">
            <div className="flex items-center text-sm gap-4 w-full">
              {showMaxFee && (
                <label
                  className="tooltip input input-bordered flex items-center w-full"
                  data-tip="Users will not be charged beyond this amount"
                >
                  <input
                    disabled={mintTokenData?.mutable == 0}
                    value={maxFee}
                    onChange={(e) => {
                      setMaxFee(e.target.value);
                    }}
                    type="number"
                    min={0}
                    className="w-full"
                    placeholder=""
                  />
                  <span className="stat-desc">token</span>
                </label>
              )}
              <input
                disabled={mintTokenData?.mutable == 0}
                type="checkbox"
                className="toggle toggle-primary"
                onChange={() => {
                  if (showMaxFee) {
                    setMaxFee('');
                  }
                  setShowMaxFee(!showMaxFee);
                }}
                checked={showMaxFee}
              />
            </div>
          </div>
        </div>

        <button
          disabled={!publicKey || editMutation.isPending}
          onClick={async () => {
            if (
              metaData == null ||
              metaData == undefined ||
              mintTokenData == null ||
              mintTokenData == undefined ||
              !transferFeeConfig
            ) {
              toast.error('Unable to fetch current mint metadata.');
              return;
            }
            await editMutation.mutateAsync({
              admin: new PublicKey(admin),
              name: name,
              symbol: symbol,
              description: description,
              picture: picture,
              previous: {
                ...metaData,
                ...mintTokenData,
                ...transferFeeConfig.newerTransferFee,
              },
              fee: parseFloat(fee) * 100,
              maxFee: maxFee != '' ? parseInt(maxFee) : undefined,
            });
          }}
          className="btn btn-primary btn-sm w-full rounded"
        >
          {publicKey ? (
            editMutation.isPending ? (
              <div className="loading loading-spinner loading-sm" />
            ) : (
              'Confirm'
            )
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>
    </div>
  );
};
