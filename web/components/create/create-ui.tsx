import { formatLargeNumber } from '@/utils/helper/format';
import { NATIVE_MINT } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  IconCurrencySolana,
  IconPhotoPlus,
  IconPlus,
  IconWallet,
} from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useGetTokenDetails } from '../dashboard/dashboard-data-access';
import { useCreateMint } from './create-data-access';

export const CreateAccountBtn: FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/mint/create')}
      className="btn btn-primary rounded btn w-full"
    >
      Create Account
    </button>
  );
};

export const CreatePanel: FC = () => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [enableTrading, setEnableTrading] = useState(false);
  const [mintAmount, setMintAmount] = useState(LAMPORTS_PER_SOL * 0.5);
  const [solAmount, setSolAmount] = useState(LAMPORTS_PER_SOL);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

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
    setHandle(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const { publicKey } = useWallet();
  const createMutation = useCreateMint({
    address: publicKey ? publicKey.toBase58() : null,
  });
  const [valid, setValid] = useState(false);
  useEffect(() => {
    setValid(!(!picture || !name || !handle));
  }, [picture, publicKey, name, handle]);

  const router = useRouter();
  return (
    <div className="flex flex-col gap-8 my-4 items-center justify-center p-4">
      <span className="text-2xl md:text-3xl lg:text-4xl text-center">
        Create your account
      </span>
      <span className="text-sm lg:text-base text-center">
        Add a profile picture, name and handle. You can always edit it later.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <span>Create your account</span>
        <div className="flex flex-col md:flex-row w-full gap-4 py-4 items-center border-t border-base-content">
          <div className="w-32 h-32 lg:w-40 lg:h-40">
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
                <div className="flex flex-col gap-2 w-full h-full border rounded-full items-center justify-center bg-base-100">
                  <IconPhotoPlus size={32} />
                  <span className="text-xs lg:text-base">Click to Upload</span>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                accept="image/*"
                className="hidden"
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
              className="input input-bordered w-full max-w-xs text-sm rounded"
              onChange={handleNameChange}
            />
            <input
              type="text"
              placeholder="@handle"
              className="input input-bordered w-full max-w-xs text-sm rounded"
              value={handle}
              onChange={handleHandleChange}
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
            className="textarea textarea-bordered textarea-sm leading-normal h-24 w-full overflow-hidden"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>

        <div tabIndex={0} className="collapse collapse-plus ">
          <input type="checkbox" className="peer" />
          <div className="collapse-title border-b border-base-content">
            Advanced Configuration
          </div>
          <div className="collapse-content">
            <div className="flex flex-col gap-4 py-4 items-start w-full">
              <div className="flex items-center gap-4">
                <span>Enable Monetization?</span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={enableTrading}
                  onChange={(e) => setEnableTrading(e.target.checked)}
                />
              </div>
              {!enableTrading && (
                <div className="card text-sm text-center w-full p-4">
                  Enabling this feature will list your token on a decentralized
                  exchange for public trading. Once activated, you can begin
                  earning trading fees.
                </div>
              )}
              {enableTrading && (
                <div className="card w-full">
                  <LiquidityPoolPanel
                    mintAmount={mintAmount}
                    setMintAmount={setMintAmount}
                    solAmount={solAmount}
                    setSolAmount={setSolAmount}
                    name={name}
                    handle={handle}
                    tempImageUrl={tempImageUrl}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {publicKey ? (
          <button
            disabled={!valid || createMutation.isPending}
            onClick={async () => {
              try {
                await createMutation.mutateAsync({
                  name: name,
                  symbol: handle,
                  picture: picture!,
                  description: description,
                  transferFee: 10,
                  liquidityPoolSettings: enableTrading
                    ? {
                        solAmount: solAmount,
                        mintAmount: mintAmount,
                      }
                    : undefined,
                });
                router.push('/dashboard');
              } catch (e) {
                console.log(e);
              }
            }}
            className="btn btn-primary w-full rounded"
          >
            {valid ? (
              createMutation.isPending ? (
                <div className="loading loading-spinner loading-sm" />
              ) : (
                'Create'
              )
            ) : picture ? (
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
      </div>
    </div>
  );
};

const LiquidityPoolPanel: FC<{
  mintAmount: number;
  solAmount: number;
  setMintAmount: (value: number) => void;

  setSolAmount: (value: number) => void;
  tempImageUrl: string | null;
  name: string;
  handle: string;
}> = ({
  tempImageUrl,
  name,
  handle,
  mintAmount,
  solAmount,
  setMintAmount,
  setSolAmount,
}) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [currentAmountOfSol, setCurrentAmountOfSol] = useState<
    number | undefined
  >();
  useEffect(() => {
    if (publicKey) {
      connection
        .getAccountInfo(publicKey)
        .then((result) => setCurrentAmountOfSol(result?.lamports));
    }
  }, [publicKey]);

  const { data: solDetails } = useGetTokenDetails({ mint: NATIVE_MINT });

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        data-tip="To launch your token on a decentralized exchange, you need to create a
        liquidity pool. This allows for anyone to buy or sell your token freely,
        while you earn trading fees on each transaction."
        className="tooltip card bg-warning text-warning-content p-4 text-xs text-center"
      >
        Choose the amount of SOL and tokens to create your liquidity pool.
      </div>
      <label>
        <div className="label">
          <span className="label-text">Base Token</span>
          <div className="label-text-alt flex items-end gap-2">
            <IconWallet size={14} />
            <span>{`${((currentAmountOfSol || 0) / LAMPORTS_PER_SOL).toFixed(
              3
            )} SOL`}</span>
            <button
              onClick={() =>
                currentAmountOfSol && setSolAmount(currentAmountOfSol / 2)
              }
              className="badge badge-xs badge-outline badge-secondary p-2 "
            >
              Half
            </button>
            <button
              onClick={() =>
                currentAmountOfSol && setSolAmount(currentAmountOfSol)
              }
              className="badge badge-xs badge-outline badge-secondary p-2 "
            >
              Max
            </button>
          </div>
        </div>
        <div className="input input-bordered border-base-content flex items-center gap-2 input-lg rounded-lg">
          <button className="btn btn-secondary rounded-lg gap-1 px-2 flex items-center">
            <IconCurrencySolana />
            SOL
          </button>
          <input
            type="number"
            className="w-full text-right"
            placeholder="0.00"
            value={solAmount / LAMPORTS_PER_SOL}
            onChange={(e) =>
              setSolAmount(parseFloat(e.target.value) * LAMPORTS_PER_SOL)
            }
          />
        </div>
      </label>
      <div className="flex items-center">
        <div className="divider w-1/2"></div>
        <button className="btn btn-square rounded-full px-2 btn-primary btn-sm">
          <IconPlus />
        </button>
        <div className="divider w-1/2"></div>
      </div>
      <label>
        <div className="label">
          <span className="label-text">Quote Token</span>
          <div className="label-text-alt flex items-center gap-2">
            <IconWallet size={14} />
            <span>{`${formatLargeNumber(LAMPORTS_PER_SOL)} ${handle}`}</span>
            <button
              onClick={() => setMintAmount(LAMPORTS_PER_SOL / 2)}
              className="badge badge-xs badge-outline badge-secondary p-2 "
            >
              Half
            </button>
            <button
              onClick={() => setMintAmount(LAMPORTS_PER_SOL)}
              className="badge badge-xs badge-outline badge-secondary p-2 "
            >
              Max
            </button>
          </div>
        </div>
        <div className="input input-bordered border-base-content flex items-center gap-2 input-lg rounded-lg">
          <button className="btn btn-secondary rounded-lg gap-1 px-2 items-center w-fit">
            {tempImageUrl && (
              <div className="w-8 h-8 relative">
                <Image
                  className={`rounded-full object-cover`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={''}
                />
              </div>
            )}
            <span className="text-base truncate w-fit pl-1 text-left">
              {name}
            </span>
          </button>
          <input
            type="number"
            className="w-full text-right"
            placeholder="0.00"
            value={mintAmount}
            onChange={(e) => setMintAmount(parseFloat(e.target.value))}
          />
        </div>
      </label>
      <div className="flex flex-col gap-2 items-end justify-center pt-4">
        <span className="text-xs">{`Starting Token Price: $${(
          (solAmount / mintAmount / LAMPORTS_PER_SOL) *
          (solDetails?.token_info?.price_info?.price_per_token || 1)
        ).toPrecision(6)} `}</span>
        <span className="text-xs">{`Starting Token MarketCap: $${(
          (solAmount / LAMPORTS_PER_SOL) *
          (solDetails?.token_info?.price_info?.price_per_token || 1)
        ).toFixed(2)} `}</span>
      </div>
    </div>
  );
};
