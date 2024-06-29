import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatLargeNumber } from '../program/utils/helper';
import { useCreateMint } from './create-data-access';

interface ProgressBarProps {
  page: number;
  setPage: (number: number) => void;
}

export const ProgressBar: FC<ProgressBarProps> = ({ page, setPage }) => {
  return (
    <ul className="steps gap-4 w-full">
      <li
        onClick={() => page >= 1 && setPage(1)}
        className={`step hover:cursor-pointer ${
          page >= 1 ? 'step-primary step-info' : 'step-error'
        } text-sm`}
      >
        Details
      </li>
      <li
        onClick={() => page >= 2 && setPage(2)}
        className={`step hover:cursor-pointer ${
          page >= 2 ? 'step-primary step-info' : 'step-neutral'
        } text-sm`}
      >
        Settings & Permission
      </li>
      <li
        onClick={() => page >= 3 && setPage(3)}
        className={`step hover:cursor-pointer ${
          page >= 3 ? 'step-primary step-info' : 'step-neutral'
        } text-sm`}
      >
        Review
      </li>
    </ul>
  );
};

interface CreatePanelProps {
  page: number;
  setPage: (number: number) => void;
}
export const CreatePanel: FC<CreatePanelProps> = ({ page, setPage }) => {
  const [picture, setPicture] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('0');
  const [maxFee, setMaxFee] = useState('');
  const [authority, setAuthority] = useState('');
  const [totalSupply, setTotalSupply] = useState('1000000000');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const { publicKey } = useWallet();
  useEffect(() => {
    if (publicKey) {
      setAuthority(publicKey.toBase58());
    }
  }, [publicKey]);

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

  switch (page) {
    case 1:
      return (
        <CreateTokenPage
          tempImageUrl={tempImageUrl}
          handlePictureChange={handlePictureChange}
          name={name}
          handleNameChange={handleNameChange}
          symbol={symbol}
          handleSymbolChange={handleSymbolChange}
          description={description}
          handleDescriptionChange={handleDescriptionChange}
          page={page}
          setPage={setPage}
        />
      );
    case 2:
      return (
        <SettingsAndPermissionPage
          maxFee={maxFee}
          setMaxFee={setMaxFee}
          page={page}
          setPage={setPage}
          fee={fee}
          setFee={setFee}
          authority={authority}
          setAuthority={setAuthority}
          totalSupply={totalSupply}
          setTotalSupply={setTotalSupply}
        />
      );
    case 3:
      return (
        <ReviewPage
          page={page}
          setPage={setPage}
          fee={fee}
          maxFee={maxFee}
          authority={authority}
          tempImageUrl={tempImageUrl}
          name={name}
          symbol={symbol}
          description={description}
          picture={picture}
          totalSupply={totalSupply}
        />
      );
    default:
      return;
  }
};

interface ReviewPageProps {
  page: number;
  setPage: (number: number) => void;
  fee: string;
  maxFee: string;
  authority: string;
  tempImageUrl: string | null;
  name: string;
  symbol: string;
  description: string;
  picture: File | null;
  totalSupply: string;
}

const ReviewPage: FC<ReviewPageProps> = ({
  tempImageUrl,
  name,
  page,
  fee,
  maxFee,
  authority,
  symbol,
  description,
  setPage,
  picture,
  totalSupply,
}) => {
  const { publicKey } = useWallet();
  const createMutation = useCreateMint({
    address: publicKey ? publicKey.toBase58() : null,
  });
  const [valid, setValid] = useState(false);
  useEffect(() => {
    setValid(!(!picture || !name || !symbol || !authority || !fee));
  }, [picture, publicKey, name, symbol, authority, fee]);

  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 my-4 items-center">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Thats it! You are now ready to create your own token.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Double check all details are accurate.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full bg-base-200 border border-base-content rounded">
        <span>Review</span>
        <div className="flex flex-row w-full gap-4 py-4 items-start border-y border-base-content">
          <div className="flex w-32 h-32 lg:w-40 lg:h-40 items-center justify-center">
            {tempImageUrl && (
              <div className="relative h-full w-full">
                <Image
                  priority={true}
                  className={`rounded object-cover`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={''}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 items-start w-3/5 text-start ">
            <div className="flex justify-evenly w-full items-center">
              {name && (
                <div className="stat px-0 gap-2">
                  <div className="stat-title text-xs ">Name</div>
                  <span className="stat-value text-sm truncate font-normal">
                    {name}
                  </span>
                </div>
              )}
              {symbol && (
                <div className="stat px-0 gap-2">
                  <span className="stat-title text-xs">Symbol</span>
                  <span className="stat-value text-sm truncate font-normal">
                    {symbol}
                  </span>
                </div>
              )}
            </div>
            {description && (
              <div className="stat px-0 gap-2">
                <span className="stat-title text-xs">Details</span>
                <span className="stat-value text-sm truncate font-normal">
                  {description}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 w-full">
          <div className="card bg-base-100 col-span-4 rounded">
            <div className="stat gap-2">
              <div className="stat-title text-sm md:text-base truncate">
                Authority
              </div>
              <span className="stat-value text-xs md:text-sm truncate font-normal">
                {authority}
              </span>
            </div>
          </div>
          <div className="card bg-base-100 rounded justify-center col-span-2">
            <div className="stat ">
              <div className="stat-title text-sm md:text-base truncate">
                Total Supply
              </div>
              <div className="stat-value text-base truncate font-normal">{`${formatLargeNumber(
                totalSupply
              )}`}</div>
            </div>
          </div>
          <div className="card bg-base-100 rounded justify-center col-span-2">
            <div className="stat ">
              <div className="stat-title text-sm md:text-base truncate">
                Transfer Fee
              </div>
              <div className="stat-value text-base truncate font-normal">{`${fee}%`}</div>
              {maxFee && (
                <div className="stat-desc text-xs md:text-sm truncate font-normal">{`Max Fee: ${formatLargeNumber(
                  maxFee
                )}`}</div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          className="btn btn-secondary btn-sm w-full rounded"
        >
          Back
        </button>
        <button
          disabled={!valid || !publicKey || createMutation.isPending}
          onClick={() => {
            if (!picture || !publicKey) {
              toast.error('Missing Picture!');
              return;
            }
            // call to backend to generate distributor
            createMutation
              .mutateAsync({
                name: name,
                symbol: symbol,
                picture: picture,
                description: description,
                transferFee: parseFloat(fee) * 100,
                maxTransferFee: maxFee != '' ? parseFloat(maxFee) : undefined,
                distributor: new PublicKey(''),
                authority: new PublicKey(authority),
                totalSupply: parseFloat(totalSupply),
              })
              .then(() => router.push('/dashboard'));
          }}
          className="btn btn-primary btn-sm w-full rounded"
        >
          {valid ? (
            publicKey ? (
              createMutation.isPending ? (
                <div className="loading loading-spinner loading-sm" />
              ) : (
                'Create'
              )
            ) : (
              'Connect Wallet'
            )
          ) : (
            'Missing Fields!'
          )}
        </button>
      </div>
    </div>
  );
};
interface SettingsAndPermissionPageProps {
  page: number;
  setPage: (number: number) => void;
  maxFee: string;
  setMaxFee: (value: string) => void;
  fee: string;
  setFee: (value: string) => void;
  authority: string;
  setAuthority: (value: string) => void;
  totalSupply: string;
  setTotalSupply: (value: string) => void;
}
const SettingsAndPermissionPage: FC<SettingsAndPermissionPageProps> = ({
  page,
  setPage,
  maxFee,
  setMaxFee,
  fee,
  setFee,
  authority,
  setAuthority,
  totalSupply,
  setTotalSupply,
}) => {
  const [showMaxFee, setShowMaxFee] = useState(maxFee != '');
  return (
    <div className="flex flex-col gap-4 my-4 items-center">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Collect fees whenever your token is used.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Set your desired fees and designate a wallet to collect fees.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <span>Configure your token settings</span>
        <div className="border-t border-base-content grid grid-cols-10 md:grid-cols-8 items-center gap-4 py-4 w-full">
          <span className="col-span-3 md:col-span-1 text-sm">Authority</span>
          <label
            className="tooltip col-span-7 input input-bordered flex items-center w-full text-sm gap-2"
            data-tip="This authority have the permission to change your token settings."
          >
            <input
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              type="text"
              className="w-full"
              placeholder=""
            />
          </label>
          <span className="col-span-3 md:col-span-1 text-sm ">
            Total Supply
          </span>
          <label
            className="tooltip col-span-7 flex items-center input input-bordered w-full text-sm gap-2"
            data-tip="Max amount of tokens"
          >
            <div className="w-full justify-start flex items-center">
              <input
                value={totalSupply}
                onChange={(e) => {
                  setTotalSupply(e.target.value);
                }}
                type="number"
                className="w-full"
                placeholder=""
              />
            </div>
            <span className="stat-desc">token</span>
          </label>
        </div>

        <span>Transfer Fees</span>
        <div className="border-t border-base-content grid grid-cols-10 md:grid-cols-8 items-center gap-4 py-4 w-full">
          <span className="col-span-3 md:col-span-1 text-sm ">
            Transfer Fee
          </span>
          <label
            className="tooltip col-span-7 flex items-center w-fit text-sm gap-2"
            data-tip="High fees might discourage users from using your token"
          >
            <div className="w-full justify-start input input-bordered flex items-center">
              <input
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value);
                }}
                type="number"
                className="w-10 text-right px-1"
                placeholder=""
              />
              <span className="stat-desc">%</span>
            </div>

            <button
              onClick={() => setFee('0.1')}
              className="badge badge-primary hover:badge-secondary"
            >
              Recommended
            </button>
          </label>
          <span className="col-span-3 md:col-span-1 text-sm">
            Max Transfer Fee
          </span>

          <div className="col-span-7 flex flex-col items-start gap-2">
            <div className="flex items-center text-sm gap-4 w-full">
              {showMaxFee && (
                <label
                  className="tooltip input input-bordered flex items-center w-full"
                  data-tip="Users will not be charged beyond this amount"
                >
                  <input
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
          onClick={() => setPage(Math.max(1, page - 1))}
          className="btn btn-secondary btn-sm w-full rounded"
        >
          Back
        </button>
        <button
          onClick={() => setPage(page + 1)}
          className="btn btn-primary btn-sm w-full rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};

interface CreateTokenPageProps {
  tempImageUrl: string | null;
  handlePictureChange: (e: any) => void;
  name: string;
  handleNameChange: (e: any) => void;
  symbol: string;
  handleSymbolChange: (e: any) => void;
  description: string;
  handleDescriptionChange: (e: any) => void;
  page: number;
  setPage: (number: number) => void;
}
const CreateTokenPage: FC<CreateTokenPageProps> = ({
  tempImageUrl,
  handlePictureChange,
  name,
  handleNameChange,
  symbol,
  handleSymbolChange,
  description,
  handleDescriptionChange,
  page,
  setPage,
}) => {
  return (
    <div className="flex flex-col gap-4 my-4 items-center">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Create your token in 3 steps.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Give your token an image, name and symbol. You can always edit the
        description later.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <span>Create your token</span>
        <div className="flex flex-col md:flex-row w-full gap-4 py-4 items-center border-y border-base-content">
          <div className="w-32 h-32 lg:w-40 lg:h-40">
            <label
              htmlFor="dropzone-file"
              className={`cursor-pointer relative flex flex-col w-32 h-32 lg:w-40 lg:h-40 justify-center items-center`}
            >
              {tempImageUrl ? (
                <Image
                  className={`rounded object-cover cursor-pointer`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={''}
                />
              ) : (
                <div className="flex flex-col w-full h-full border border-neutral items-center justify-center bg-base-100">
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
              className="input input-bordered w-full max-w-xs text-sm rounded"
              onChange={handleNameChange}
            />
            <input
              type="text"
              placeholder="symbol"
              className="input input-bordered w-full max-w-xs text-sm rounded"
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
            placeholder="Write your description..."
            className="textarea textarea-bordered textarea-sm w-full"
            value={description}
            onChange={handleDescriptionChange}
          ></textarea>
        </div>

        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          className="btn btn-secondary btn-sm w-full rounded"
        >
          Back
        </button>
        <button
          onClick={() => setPage(page + 1)}
          className="btn btn-primary btn-sm w-full rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};
