'use client';

import { useGetMintToken } from '@/components/edit/edit-data-access';
import { DEFAULT_MINT_DECIMALS } from '@/utils/consts';
import { sendTokensToPayer } from '@/utils/firebase/functions';
import {
  getAllTokenAccountsForMint,
  getAsset,
  getDerivedMint,
} from '@/utils/helper/mint';
import { placeholderImage } from '@/utils/helper/placeholder';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { DAS } from '@/utils/types/das';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import {
  IconDiscountCheck,
  IconExclamationCircle,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { wrap } from 'comlink';
import * as airdropsender from 'helius-airship-core';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { configureDatabase, sqlDb } from '../../workers/db';
import { useGetAssetByOwner } from '../claim/claim-data-access';
import { useGetJupiterVerifiedTokens } from '../create/create-data-access';
import { useGetCampaigns, useGetPayer } from './airdrop-data-access';
import { InputLabel } from './airship-ui';

let sendWorker: Worker | undefined = undefined;
let pollWorker: Worker | undefined = undefined;
let monitorInterval: NodeJS.Timeout | undefined = undefined;

// Utility function for opening the modal
export function openCampaignModal(): void {
  (document.getElementById('campaign_modal') as HTMLDialogElement)?.showModal();
}

// CreateCampaignButton Component
export const CreateCampaignButton: FC<{
  setId: Dispatch<SetStateAction<number | undefined>>;
}> = ({ setId }) => (
  <button
    className="btn btn-sm btn-primary w-fit"
    onClick={() => {
      setId(undefined);
      openCampaignModal();
    }}
  >
    <IconPlus />
    Start a New Campaign
  </button>
);
// CampaignModal Component
export const AirshipModal: FC<{
  id?: number;
  setId: Dispatch<SetStateAction<number | undefined>>;
}> = ({ id, setId }) => {
  const workerRef = useRef<any>(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [criteria, setCriteria] = useState('');
  const [sendProgress, setSendProgress] = useState(0);
  const [finalizeProgress, setFinalizeProgress] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [sentTransactions, setSentTransactions] = useState(0);
  const [finalizedTransactions, setFinalizedTransactions] = useState(0);
  const [isAirdropInProgress, setIsAirdropInProgress] = useState(false);
  const [isAirdropComplete, setIsAirdropComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAirdropCanceled, setIsAirdropCanceled] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [existingAirdrop, setExistingAirdrop] = useState<boolean | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const [target, setTarget] = useState<DAS.GetAssetResponse>();
  const { data: mintInfo } = useGetMintToken({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  const { data: assets } = useGetAssetByOwner({
    address: publicKey,
  });
  const { data: payer } = useGetPayer({
    address: publicKey,
  });
  const { data: campaigns } = useGetCampaigns({ address: publicKey });
  const { connection } = useConnection();
  // Helper function to close the modal
  function closeModal() {
    (document.getElementById('campaign_modal') as HTMLDialogElement)?.close();
    resetForm();
    setId(undefined);
  }

  const campaign = campaigns?.find((x) => x.id === id);

  useEffect(() => {
    async function initApp() {
      try {
        await configureDatabase();

        // Initialize the airdrop sender
        await airdropsender.init({ db: sqlDb });

        // Check if an airdrop already exists
        const exists = await airdropsender.exist({ db: sqlDb });
        setExistingAirdrop(exists);
      } catch (error) {
        console.error('Error checking for existing airdrop:', error);
        setExistingAirdrop(false);
      }
    }
    void initApp();
  }, []);

  useEffect(() => {
    try {
      if (criteria && new PublicKey(criteria)) {
        getAsset(new PublicKey(criteria)).then((res) => setTarget(res));
      } else {
        setTarget(undefined);
      }
    } catch (e) {
      console.log('Invalid Pubkey');
    }
  }, [criteria]);

  useEffect(() => {
    async function loadAirdropStatus() {
      const status = await airdropsender.status({ db: sqlDb });
      if (status.total > status.finalized) {
        setIsAirdropCanceled(true);
        setSendProgress((status.sent / status.total) * 100);
        setFinalizeProgress((status.finalized / status.total) * 100);
        setTotalTransactions(status.total);
        setSentTransactions(status.sent);
        setFinalizedTransactions(status.finalized);
        setStep(4);
      } else {
        setExistingAirdrop(false);
      }
    }
    if (existingAirdrop && sqlDb) {
      void loadAirdropStatus();
    } else {
      setStep(1);
    }
  }, [existingAirdrop, sqlDb]);

  // Handle form state reset on id or campaign change
  useEffect(() => {
    if (id && campaign) {
      setName(campaign.name);
      setAmount(campaign.amount.toString());
      setCriteria(campaign.criteria);
    } else {
      resetForm();
    }
  }, [campaign, id]);

  // Reset form state
  function resetForm() {
    handleCancel();
    setRecipients([]);
    setStep(1);
    setName('');
    setAmount('');
    setCriteria('');
  }

  const handleCancel = () => {
    // Clear the monitorInterval
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = undefined;
    }

    setIsAirdropInProgress(false);
    setIsAirdropComplete(false);
    setSendProgress(0);
    setFinalizeProgress(0);
    setSentTransactions(0);
    setFinalizedTransactions(0);
    setTotalTransactions(0);
    setError(null);
    setIsAirdropCanceled(true);

    // Terminate both workers
    sendWorker?.terminate();
    sendWorker = undefined;
    pollWorker?.terminate();
    pollWorker = undefined;
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsAirdropInProgress(false);
    // Stop both workers
    sendWorker?.terminate();
    sendWorker = undefined;
    pollWorker?.terminate();
    pollWorker = undefined;
    // Clear the monitorInterval
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = undefined;
    }
  };

  // Handle create or edit campaign
  const handleSendAirdrop = async () => {
    if (!payer?.publicKey || !mintInfo?.memberMint) return false;
    if (!isAirdropCanceled) {
      workerRef.current = wrap(
        new Worker(new URL('../../workers/create.worker.ts', import.meta.url), {
          type: 'module',
        })
      );
      await workerRef.current.create(
        payer?.publicKey,
        recipients,
        BigInt(amount),
        mintInfo.memberMint
      );
    }
    setIsAirdropCanceled(false);
    setIsAirdropInProgress(true);

    if (typeof sendWorker === 'undefined') {
      sendWorker = new Worker(
        new URL('../../workers/send.worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
    }

    sendWorker.onmessage = (event) => {
      if (event.data.error) {
        handleError(`Error sending transactions: ${event.data.error}`);
      }
    };
    sendWorker.postMessage({
      privateKey: payer?.privatekey,
      rpcUrl: connection.rpcEndpoint,
    });

    if (typeof pollWorker === 'undefined') {
      pollWorker = new Worker(
        new URL('../../workers/poll.worker.ts', import.meta.url),
        {
          type: 'module',
        }
      );
    }

    pollWorker.onmessage = (event) => {
      if (event.data.error) {
        handleError(`Error polling transactions: ${event.data.error}`);
      }
    };
    pollWorker.postMessage({ rpcUrl: connection.rpcEndpoint });

    monitorInterval = setInterval(async () => {
      try {
        const currentStatus = await airdropsender.status({ db: sqlDb });
        setSendProgress((currentStatus.sent / currentStatus.total) * 100);
        setFinalizeProgress(
          (currentStatus.finalized / currentStatus.total) * 100
        );
        setTotalTransactions(currentStatus.total);
        setSentTransactions(currentStatus.sent);
        setFinalizedTransactions(currentStatus.finalized);

        if (currentStatus.finalized === currentStatus.total) {
          if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = undefined;
          }
          setIsAirdropInProgress(false);
          setIsAirdropComplete(true);
          setExistingAirdrop(false);
        }
      } catch (error) {
        if (monitorInterval) {
          clearInterval(monitorInterval);
          monitorInterval = undefined;
        }
        handleError(`Error monitoring airdrop status: ${error}`);
      }
    }, 1000);
    return true;
  };

  const [loading, setLoading] = useState(false);

  const handleForward = async () => {
    switch (step) {
      case 1:
        if (!name || !amount || !publicKey || !criteria || !target) {
          handleError('Error: Please ensure that all fields are filled!');
          return;
        } else {
          setError(null);
        }
        setStep(2);
        setLoading(true);
        getAllTokenAccountsForMint(new PublicKey(target.id)).then((result) => {
          setRecipients(result.map((x) => x.owner));
          setLoading(false);
        });
        break;
      case 2:
        setStep(3);
        break;
      case 3:
        if (!signTransaction || !publicKey) return;
        const partialTx = await sendTokensToPayer(
          parseInt(amount) * 10 ** DEFAULT_MINT_DECIMALS * recipients.length
        );
        await buildAndSendTransaction({
          connection,
          signTransaction,
          partialSignedTx: VersionedTransaction.deserialize(
            Buffer.from(partialTx, 'base64')
          ),
          publicKey: publicKey,
        });
        handleSendAirdrop().then((result) => {
          if (result) {
            setStep(4);
          }
        });
        break;
      case 4:
        isAirdropInProgress
          ? handleCancel()
          : isAirdropCanceled
          ? handleSendAirdrop()
          : closeModal();
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 1:
        closeModal();
        break;
      case 2:
        setStep(1);
        break;
      case 3:
        setStep(2);
        break;
      case 4:
        setExistingAirdrop(false);
        setStep(1);
        break;
      default:
        break;
    }
  };

  return (
    <dialog id="campaign_modal" className="modal">
      <div className="modal-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-center">
            {isAirdropInProgress || isAirdropComplete
              ? 'Sending Airdrop'
              : 'Airdrop Campaign'}
          </span>
          <button onClick={closeModal}>
            <IconX />
          </button>
        </div>
        {existingAirdrop && (
          <span>{`An existing airdrop exist. Do you want to resume?`}</span>
        )}
        {step == 1 && (
          <Step1
            target={target}
            name={name}
            setName={setName}
            amount={amount}
            setAmount={setAmount}
            criteria={criteria}
            setCriteria={setCriteria}
          />
        )}
        {step == 2 && (
          <Step2
            loading={loading}
            recipients={recipients}
            criteria={criteria}
          />
        )}
        {step == 3 && (
          <Step3
            tokens={
              assets?.items.map(
                (x) =>
                  ({
                    pubkey: publicKey,
                    name: x.content?.metadata.name,
                    symbol: x.content?.metadata.symbol,
                    logoURI: x.content?.links?.image,
                    amount: x.token_info?.balance,
                    decimals: x.token_info?.decimals,
                    mintAddress: new PublicKey(x.id),
                  } as airdropsender.Token)
              ) || []
            }
            recipientList={recipients}
            amountValue={BigInt(amount)}
          />
        )}
        {step == 4 && (
          <Step4
            isAirdropComplete={isAirdropComplete}
            sendProgress={sendProgress}
            finalizeProgress={finalizeProgress}
            sentTransactions={sentTransactions}
            finalizedTransactions={finalizedTransactions}
            totalTransactions={totalTransactions}
          />
        )}
        {error && (
          <div className="flex items-center w-full justify-center">
            <span className="text-error">{error}</span>
          </div>
        )}
        {/* Modal Actions */}
        <div className="modal-action flex gap-2">
          {(step < 4 || (step == 4 && isAirdropCanceled)) && (
            <button onClick={handleBack} className="btn btn-outline">
              {step == 1
                ? 'Cancel'
                : step == 4 && isAirdropCanceled
                ? 'Restart'
                : 'Back'}
            </button>
          )}

          <button onClick={handleForward} className="btn btn-primary">
            {step == 3
              ? 'Proceed'
              : step == 4
              ? isAirdropCanceled
                ? 'Resume'
                : isAirdropInProgress
                ? 'Cancel'
                : 'Close'
              : 'Next'}
          </button>
        </div>
      </div>
    </dialog>
  );
};

interface Step4Props {
  isAirdropComplete: boolean;
  sendProgress: number;
  finalizeProgress: number;
  sentTransactions: number;
  finalizedTransactions: number;
  totalTransactions: number;
}

export default function Step4({
  isAirdropComplete,
  sendProgress,
  finalizeProgress,
  sentTransactions,
  finalizedTransactions,
  totalTransactions,
}: Step4Props) {
  return (
    <>
      {!isAirdropComplete && (
        <div className="my-6 space-y-8">
          <div>
            <p className="mb-2">
              Transactions sent: {Math.round(sendProgress)}% ({sentTransactions}
              /{totalTransactions})
            </p>
            <progress
              className="progress"
              value={sendProgress}
              max="100"
            ></progress>
          </div>
          <div>
            <p className="mb-2">
              Transactions confirmed: {Math.round(finalizeProgress)}% (
              {finalizedTransactions}/{totalTransactions})
            </p>
            <progress
              className="progress"
              value={finalizeProgress}
              max="100"
            ></progress>
          </div>
        </div>
      )}

      {isAirdropComplete && (
        <div className="my-8 text-center">
          <h3 className="text-3xl font-bold text-primary mb-2">
            🎉 Airdrop Complete! 🎉
          </h3>
          <p className="text-xl">
            Congratulations! Your tokens have been successfully airdropped.
          </p>
        </div>
      )}
    </>
  );
}

interface AirdropOverviewInterface {
  keypairAddress: string;
  token: string;
  totalAddresses: number;
  amountPerAddress: string;
  totalAmount: string;
  numberOfTransactions: number;
  approximateTransactionFee: string;
  approximateCompressionFee: string;
  rpcUrl: string;
}

interface Step3Props {
  tokens: airdropsender.Token[];
  recipientList: string[];
  amountValue: bigint;
}

export const Step3: FC<Step3Props> = ({
  tokens,
  recipientList,
  amountValue,
}) => {
  const [airdropOverview, setAirdropOverview] =
    useState<AirdropOverviewInterface | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const { publicKey } = useWallet();
  const { data } = useGetPayer({ address: publicKey });
  const { connection } = useConnection();
  useEffect(() => {
    const calculateAirdropOverview = async () => {
      if (!data || !publicKey) return;
      setIsCalculating(true);
      setError(null);

      try {
        const selectedTokenInfo = tokens.find(
          (t) =>
            t.mintAddress.toString() === getDerivedMint(publicKey).toBase58()
        );

        if (!selectedTokenInfo) {
          throw new Error('Selected token not found');
        }

        const numberOfTransactions = BigInt(
          Math.ceil(
            recipientList.length /
              Number(airdropsender.maxAddressesPerTransaction)
          )
        );
        const transactionFee =
          BigInt(airdropsender.baseFee) +
          (BigInt(airdropsender.computeUnitLimit) *
            BigInt(airdropsender.computeUnitPrice)) /
            BigInt(airdropsender.MICRO_LAMPORTS_PER_LAMPORT);

        const totalAmount = amountValue * BigInt(recipientList.length);

        const overview = {
          keypairAddress: data.publicKey,
          token:
            selectedTokenInfo.name || selectedTokenInfo.mintAddress.toString(),
          totalAddresses: recipientList.length,
          amountPerAddress: airdropsender
            .normalizeTokenAmount(
              amountValue.toString(),
              selectedTokenInfo.decimals
            )
            .toLocaleString('en-US', {
              maximumFractionDigits: selectedTokenInfo.decimals,
            }),
          totalAmount: airdropsender
            .normalizeTokenAmount(
              totalAmount.toString(),
              selectedTokenInfo.decimals
            )
            .toLocaleString('en-US', {
              maximumFractionDigits: selectedTokenInfo.decimals,
            }),
          numberOfTransactions: Number(numberOfTransactions),
          approximateTransactionFee: `${(
            Number(numberOfTransactions * transactionFee) / 1e9
          ).toFixed(9)} SOL`,
          approximateCompressionFee: `${(
            Number(
              numberOfTransactions * BigInt(airdropsender.compressionFee)
            ) / 1e9
          ).toFixed(9)} SOL`,
          rpcUrl: connection.rpcEndpoint,
        };

        setAirdropOverview(overview);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Failed to calculate airdrop overview:', error);
          setError(`Failed to calculate airdrop overview: ${error.message}`);
        }
        setAirdropOverview(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateAirdropOverview();
  }, [amountValue, connection, recipientList, publicKey, data, tokens]);

  if (isCalculating) {
    return (
      <div className="flex flex-col w-full h-64 items-center justify-center p-4 text-center gap-8">
        <div className="loading loading-dots" />
        <span>Calculating the estimated fees...</span>
      </div>
    );
  }

  if (error) {
    return <span>{error}</span>;
  }

  return (
    <>
      {airdropOverview && (
        <table className="table">
          <tbody>
            <tr>
              <td className="font-medium ">PublicKey</td>
              <td>{airdropOverview.keypairAddress.slice(0, 16) + '...'}</td>
            </tr>
            <tr>
              <td className="font-medium">Token</td>
              <td>{airdropOverview.token}</td>
            </tr>
            <tr>
              <td className="font-medium">Total addresses</td>
              <td>{airdropOverview.totalAddresses}</td>
            </tr>
            <tr>
              <td className="font-medium">Amount per address</td>
              <td>{airdropOverview.amountPerAddress}</td>
            </tr>
            <tr>
              <td className="font-medium">Total amount</td>
              <td>{airdropOverview.totalAmount}</td>
            </tr>
            <tr>
              <td className="font-medium">No of transactions</td>
              <td>{airdropOverview.numberOfTransactions}</td>
            </tr>
            <tr>
              <td className="font-medium">Approximate transaction fee</td>
              <td>{airdropOverview.approximateTransactionFee}</td>
            </tr>
            <tr>
              <td className="font-medium">Approximate compression fee</td>
              <td>{airdropOverview.approximateCompressionFee}</td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
};

export const Step2: FC<{
  loading: boolean;
  recipients: string[];
  criteria: string;
}> = ({ loading, recipients, criteria }) => {
  return (
    <div className="flex flex-col w-full h-64 items-center justify-center p-4 text-center gap-8">
      {loading && <div className="loading loading-dots" />}
      {loading ? (
        <span>Finding wallets that matches your description...</span>
      ) : recipients.length == 0 ? (
        <span>No wallets found</span>
      ) : (
        <div />
      )}
      {recipients.length > 0 && !loading && (
        <>
          <div className="flex flex-col gap-1">
            <span>Searched Query:</span>
            <span>{criteria}</span>
          </div>
          <span>{`We found ${recipients.length} wallets that matches your description. `}</span>
        </>
      )}
    </div>
  );
};

export const Step1: FC<{
  target: DAS.GetAssetResponse | undefined;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  criteria: string;
  setCriteria: Dispatch<SetStateAction<string>>;
}> = ({ target, name, setName, amount, setAmount, criteria, setCriteria }) => {
  const { data: verifiedTokens } = useGetJupiterVerifiedTokens();
  return (
    <>
      {/* Campaign Name Input */}
      <InputLabel
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Campaign Name"
      />

      {/* Amount Input */}
      <InputLabel
        label="Amount"
        value={amount}
        type="number"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Token amount per address"
      />

      {/* Criteria Select */}
      <div className="flex flex-col w-full gap-4">
        <div className="label">
          <span className="label-text text-base">
            Who do you want to airdrop to?
          </span>
        </div>
        {target && (
          <div className="flex w-full gap-2 items-center">
            <div className="w-10 h-10 relative mask mask-circle">
              <Image
                className={`object-cover`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt=""
                src={target?.content?.links?.image || placeholderImage}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex gap-1 items-center">
                <Link
                  rel="noopener noreferrer"
                  target="_blank"
                  href={`https://solscan.io/address/${target?.id}`}
                  className="link link-hover text-sm font-bold"
                >
                  {`Name: ${target?.content?.metadata.name}`}
                </Link>
                {verifiedTokens?.map((x) => x.address).includes(target?.id) ? (
                  <IconDiscountCheck className="fill-secondary text-black" />
                ) : (
                  <div
                    className="tooltip tooltip-primary"
                    data-tip="Token not on Jupiter verified list"
                  >
                    <IconExclamationCircle size={18} className="text-warning" />
                  </div>
                )}
              </div>
              <span className="text-sm">
                {`Symbol: ${target?.content?.metadata.symbol}`}
              </span>
            </div>
          </div>
        )}
        <textarea
          maxLength={80}
          placeholder="Enter a spl token address"
          className="textarea textarea-bordered textarea-base text-base leading-normal w-full overflow-hidden"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        ></textarea>
      </div>
    </>
  );
};
