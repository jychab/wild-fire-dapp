import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { formatLargeNumber } from '../../utils/helper/format';
import { AuthenticationBtn } from '../authentication/authentication-ui';
import { useCreateMint } from './create-data-access';

interface ProgressBarProps {
  page: number;
  setPage: (number: number) => void;
}

export const CreateAccountBtn: FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/create')}
      className="btn btn-primary rounded btn w-full"
    >
      Create Account
    </button>
  );
};

export const ProgressBar: FC<ProgressBarProps> = ({ page, setPage }) => {
  return (
    <ul className="steps gap-4 w-full">
      <li
        onClick={() => page >= 1 && setPage(1)}
        className={`step hover:cursor-pointer ${
          page >= 1 ? 'step-primary' : 'step-neutral'
        } text-sm`}
      >
        Details
      </li>
      <li
        onClick={() => page >= 2 && setPage(2)}
        className={`step hover:cursor-pointer ${
          page >= 2 ? 'step-primary' : 'step-neutral'
        } text-sm`}
      >
        Settings
      </li>
      <li
        onClick={() => page >= 3 && setPage(3)}
        className={`step hover:cursor-pointer ${
          page >= 3 ? 'step-primary' : 'step-neutral'
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
  const [publicSalePercentage, setPublicSalePercentage] = useState('80');
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
          publicSalePercentage={publicSalePercentage}
          setPublicSalePercentage={setPublicSalePercentage}
        />
      );
    case 3:
      return (
        <ReviewPage
          page={page}
          setPage={setPage}
          fee={fee}
          maxFee={maxFee}
          tempImageUrl={tempImageUrl}
          name={name}
          symbol={symbol}
          description={description}
          picture={picture}
          publicSalePercentage={publicSalePercentage}
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
  tempImageUrl: string | null;
  name: string;
  symbol: string;
  description: string;
  picture: File | null;
  publicSalePercentage: string;
}

const ReviewPage: FC<ReviewPageProps> = ({
  tempImageUrl,
  name,
  page,
  fee,
  maxFee,
  symbol,
  description,
  setPage,
  picture,
  publicSalePercentage,
}) => {
  const { publicKey } = useWallet();
  const createMutation = useCreateMint({
    address: publicKey ? publicKey.toBase58() : null,
  });
  const [valid, setValid] = useState(false);
  useEffect(() => {
    setValid(!(!picture || !name || !symbol || !fee));
  }, [picture, publicKey, name, symbol, fee]);

  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 my-4 items-center">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Thats it! You are now ready to create your account.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Double check all details are accurate.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full bg-base-200 border border-base-content rounded">
        <span>Review</span>
        <div className="flex flex-col lg:flex-row items-center p-4 gap-4 w-full bg-base-100">
          <div className="flex w-32 h-32 lg:w-40 lg:h-40 items-center justify-center">
            {tempImageUrl && (
              <div className="relative h-full w-full">
                <Image
                  priority={true}
                  className={`rounded-full object-cover`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={tempImageUrl}
                  alt={'profile pic'}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-start">
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <span className="text-2xl lg:text-3xl font-bold">{name}</span>
              </div>
              <span className="">{symbol}</span>
            </div>
            <span className="text-sm truncate font-normal">{description}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="card bg-base-100 col-span-2 rounded justify-center">
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
          <div className="card bg-base-100 rounded justify-center">
            <div className="stat ">
              <div className="stat-title text-sm md:text-base truncate">
                Public Allocation
              </div>
              <div className="stat-value text-base truncate font-normal">{`${publicSalePercentage}%`}</div>
            </div>
          </div>
          <div className="card bg-base-100 rounded justify-center">
            <div className="stat ">
              <div className="stat-title text-sm md:text-base truncate">
                Own Allocation
              </div>
              <div className="stat-value text-base truncate font-normal">{`${
                100 - parseFloat(publicSalePercentage)
              }%`}</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          className="btn btn-secondary btn-sm w-full rounded"
        >
          Back
        </button>
        {publicKey ? (
          <button
            disabled={!valid || createMutation.isPending}
            onClick={() => {
              // call to backend to generate distributor
              createMutation
                .mutateAsync({
                  name: name,
                  symbol: symbol,
                  picture: picture!,
                  description: description,
                  transferFee: parseFloat(fee) * 100,
                  maxTransferFee: maxFee != '' ? parseFloat(maxFee) : undefined,
                })
                .then(() => router.push('/dashboard'));
            }}
            className="btn btn-primary btn-sm w-full rounded"
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
          <AuthenticationBtn />
        )}
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
  publicSalePercentage: string;
  setPublicSalePercentage: (value: string) => void;
}
const SettingsAndPermissionPage: FC<SettingsAndPermissionPageProps> = ({
  page,
  setPage,
  maxFee,
  setMaxFee,
  fee,
  setFee,
  publicSalePercentage,
  setPublicSalePercentage,
}) => {
  const [showMaxFee, setShowMaxFee] = useState(maxFee != '');
  return (
    <div className="flex flex-col gap-4 my-4 items-center">
      <span className="text-2xl md:text-3xl lg:text-4xl text-base-content">
        Earn fees whenever your account is shared.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Whenever your account is shared, the fees collected from the recipient
        will be transferred to sharer.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <span>Fee Configuration</span>
        <div className="border-t border-base-content grid grid-cols-10 items-center gap-4 py-4 w-full">
          <span className="col-span-3 md:col-span-2 text-sm ">
            Transfer Fee
          </span>
          <label
            className="tooltip col-span-7 md:col-span-8 flex items-center w-fit text-sm gap-2"
            data-tip="High fees might discourage users from sharing your account"
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
              Recommend
            </button>
          </label>
          <span className="col-span-3 md:col-span-2 text-sm">
            Max Transfer Fee
          </span>

          <div className="col-span-7 md:col-span-8 flex flex-col items-start gap-2">
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
        <span>Token Supply</span>
        <div className="border-t border-base-content grid grid-cols-10 items-center gap-4 py-4 w-full">
          <span className="col-span-3 md:col-span-2 text-sm ">
            Public Allocation
          </span>
          <label
            className="tooltip col-span-7 md:col-span-8 flex items-center w-fit text-sm gap-2"
            data-tip="Amount of tokens that will be available to the public"
          >
            <div className="w-full justify-start input input-bordered flex items-center">
              <input
                value={publicSalePercentage}
                onChange={(e) => {
                  setPublicSalePercentage(e.target.value);
                }}
                type="number"
                className="w-10 text-right px-1"
                placeholder=""
              />
              <span className="stat-desc">%</span>
            </div>
            <button
              onClick={() => setPublicSalePercentage('80')}
              className="badge badge-primary hover:badge-secondary"
            >
              Recommend
            </button>
          </label>
          <span className="col-span-3 md:col-span-2 text-sm ">
            Own Allocation
          </span>
          <label
            className="tooltip col-span-7 md:col-span-8 flex items-center w-fit text-sm gap-2"
            data-tip="Amount of tokens that will be sent to your wallet"
          >
            <div className="w-full justify-start input flex items-center">
              <input
                value={100 - parseFloat(publicSalePercentage)}
                readOnly
                type="number"
                className="w-10 text-right px-1"
                placeholder=""
              />
              <span className="stat-desc">%</span>
            </div>
          </label>
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
        Create your account in 3 steps.
      </span>
      <span className="text-xs md:text-sm lg:text-base w-3/4">
        Add a profile picture, name and symbol. You can always edit it later.
      </span>
      <div className="p-4 flex flex-col gap-4 items-start w-full border border-base-content rounded bg-base-200">
        <span>Create your account</span>
        <div className="flex flex-col md:flex-row w-full gap-4 py-4 items-center border-y border-base-content">
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
                <div className="flex flex-col w-full h-full border border-neutral rounded-full items-center justify-center bg-base-100">
                  <svg
                    className="w-8 h-8 mb-2 text-gray-400"
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
                  <p className="text-xs md:text-sm text-center flex flex-col text-gray-400">
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
