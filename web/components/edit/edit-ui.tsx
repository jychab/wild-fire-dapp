'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconPhotoPlus } from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useGetTokenDetails } from '../profile/profile-data-access';
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
  // const [fee, setFee] = useState('');
  // const [maxFee, setMaxFee] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const { publicKey } = useWallet();
  // const [admin, setAdmin] = useState('');

  // const [showMaxFee, setShowMaxFee] = useState(false);
  const { data: mintTokenData, isLoading } = useGetMintToken({
    mint: new PublicKey(mintId),
  });
  const editMutation = useEditData({
    mint: mintTokenData ? new PublicKey(mintTokenData.mint) : null,
  });
  const closeMutation = useCloseAccount({
    mint: mintTokenData ? new PublicKey(mintTokenData.mint) : null,
  });
  const { data: metaData } = useGetTokenDetails({
    mint: mintTokenData ? new PublicKey(mintTokenData.mint) : null,
    withContent: false,
  });

  // const [mintTokenDataLoaded, setMintTokenDataLoaded] = useState(false);
  // useEffect(() => {
  //   if (mintTokenData && !mintTokenDataLoaded) {
  //     // setAdmin(mintTokenData.admin.toString());
  //     setMintTokenDataLoaded(true);
  //   }
  // }, [mintTokenData, mintTokenDataLoaded]);
  // const { data: transferFeeConfig } = useGetMintTransferFeeConfig({
  //   mint: mintQuery,
  // });

  const [metaDataLoaded, setMetadataLoaded] = useState(false);
  useEffect(() => {
    if (metaData && !metaDataLoaded && metaData.content?.links?.image) {
      setTempImageUrl(metaData.content.links?.image);

      setName(metaData.content?.metadata.name || '');

      setSymbol(metaData.content?.metadata.symbol || '');
      if (description == '' && metaData.content.metadata?.description) {
        setDescription(metaData.content.metadata?.description);
      }
      setMetadataLoaded(true);
    }
  }, [metaData, metaDataLoaded, tempImageUrl, name, symbol, description]);

  // const [transferFeeConfigLoaded, setTransferFeeConfigLoaded] = useState(false);
  // useEffect(() => {
  //   if (transferFeeConfig && !transferFeeConfigLoaded) {
  //     if (fee == '') {
  //       setFee(
  //         (
  //           transferFeeConfig.newerTransferFee.transferFeeBasisPoints / 100
  //         ).toString()
  //       );
  //     }
  //     if (
  //       maxFee == '' &&
  //       Number(transferFeeConfig.newerTransferFee.maximumFee) !=
  //         Number.MAX_SAFE_INTEGER
  //     ) {
  //       setMaxFee(
  //         Number(transferFeeConfig.newerTransferFee.maximumFee).toString()
  //       );
  //       // setShowMaxFee(true);
  //     }
  //     setTransferFeeConfigLoaded(true);
  //   }
  // }, [transferFeeConfig, transferFeeConfigLoaded, fee, maxFee]);

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

  return !mintTokenData && !isLoading ? (
    <span>
      This mint is not created on this platform so editing is not allowed for
      now.
    </span>
  ) : (
    <div className="flex flex-col gap-4 my-4 items-center max-w-2xl w-full sm:p-4 pb-32">
      <span className="text-3xl lg:text-4xl text-base-content">
        Edit Profile Settings
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full sm:border border-base-content rounded bg-base-100">
        <div className="flex w-full justify-between items-center">
          <span className="hidden sm:block">Profile</span>
          {metaData?.token_info?.supply == 0 && (
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
            <input
              type="text"
              placeholder="Username"
              className="input input-bordered w-full text-base rounded"
              value={symbol}
              onChange={handleSymbolChange}
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="label">
            <span className="label-text">Bio (optional)</span>
          </div>
          <textarea
            maxLength={200}
            placeholder="Write a short introduction..."
            className="textarea textarea-bordered textarea-base text-base w-full h-24 leading-normal overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>
        {/* <div tabIndex={0} className="collapse collapse-plus">
          <input type="checkbox" className="peer" />
          <div className="collapse-title border-b border-base-content">
            Show Advanced Settings
          </div>
          <div className="collapse-content flex flex-col gap-4 py-4">
            <div className="grid grid-cols-4 w-full gap-4 items-center ">
              <span className="text-sm">Change Authority</span>
              <input
                disabled={mintTokenData?.mutable == 0}
                type="text"
                placeholder="authority"
                className="col-span-3 input input-bordered w-full text-base rounded"
                value={admin}
                onChange={(e) => setAdmin(e.target.value)}
              /> */}
        {/* <span className="text-sm">Edit Transfer Fee</span>
              <label className="col-span-3 input input-bordered flex items-center w-fit text-sm gap-2">
                <input
                  min={0.1}
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
              </label> */}
        {/* <span className="text-sm">Set Max Transfer Fee</span>
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
               </div> */}
        {/* </div>
          </div>
        </div> */}
        <button
          disabled={!publicKey || editMutation.isPending}
          onClick={async () => {
            if (!metaData || !mintTokenData) {
              toast.error('Unable to fetch current mint metadata.');
              return;
            }
            // if (parseFloat(fee) < 0.1) {
            //   toast.error('Transfer Fee needs to be at least 0.1%.');
            //   return;
            // }
            await editMutation.mutateAsync({
              name: name,
              symbol: symbol,
              description: description,
              picture: picture,
              previous: {
                ...metaData,
                ...mintTokenData,
                distributor: mintTokenData.distributor!,
              },
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
