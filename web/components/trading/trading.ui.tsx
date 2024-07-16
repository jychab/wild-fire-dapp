import { OFF_SET } from '@/utils/consts';
import { DAS } from '@/utils/types/das';
import {
  calculateFee,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TransferFee,
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  IconArrowsUpDown,
  IconCurrencySolana,
  IconWallet,
} from '@tabler/icons-react';
import Image from 'next/image';
import { FC, useState } from 'react';
import {
  SwapType,
  useFetchSwapVaultAmount,
  useGetAddressInfo,
  useGetTokenAccountInfo,
  useSwapDetails,
  useSwapMint,
  useSwapOracle,
} from './trading-data-access';

export const TradingPanel: FC<{
  metadata: DAS.GetAssetResponse | null | undefined;
}> = ({ metadata }) => {
  const { publicKey } = useWallet();

  const [buy, setBuy] = useState(true);

  const { data: swapDetails, isLoading } = useSwapDetails({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const { data: swapOracle } = useSwapOracle({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const accumulatedMintFee =
    BigInt(swapDetails?.creatorFeesTokenMint || 0) +
    BigInt(swapDetails?.protocolFeesTokenMint || 0);

  const accumulatedWsolFee =
    BigInt(swapDetails?.creatorFeesTokenWsol || 0) +
    BigInt(swapDetails?.protocolFeesTokenWsol || 0);

  const { data: swapPrice } = useFetchSwapVaultAmount({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const swapMutation = useSwapMint({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const { data: walletInfo } = useGetAddressInfo({ address: publicKey });

  const { data: tokenInfo } = useGetTokenAccountInfo({
    address:
      metadata && publicKey
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info!.token_program!)
          )
        : null,
  });

  const inputToken = buy
    ? walletInfo?.lamports
    : tokenInfo
    ? Number(tokenInfo.amount)
    : undefined;
  const outputToken = buy
    ? tokenInfo
      ? Number(tokenInfo.amount)
      : undefined
    : walletInfo?.lamports;

  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');

  const handleOutputAmountGivenInput = (amount: number) => {
    setInputAmount(amount.toString());
    const currentTransferFeeConfig =
      metadata?.mint_extensions?.transfer_fee_config?.older_transfer_fee;
    if (swapPrice && currentTransferFeeConfig) {
      const mintAmount = swapPrice.mintAmount - accumulatedMintFee;
      const solAmount =
        swapPrice.solAmount + BigInt(OFF_SET) - accumulatedWsolFee;

      const transferFee: TransferFee = {
        epoch: BigInt(currentTransferFeeConfig.epoch),
        maximumFee: BigInt(currentTransferFeeConfig.maximum_fee),
        transferFeeBasisPoints: Number(
          currentTransferFeeConfig.transfer_fee_basis_points
        ),
      };
      const amountAfterTradingFees = BigInt(Math.round(amount * 0.98));
      const amountAfterFees = buy
        ? amountAfterTradingFees
        : amountAfterTradingFees -
          calculateFee(transferFee, BigInt(amountAfterTradingFees));

      const outputAmount = buy
        ? (amountAfterFees * mintAmount) / (solAmount + amountAfterFees)
        : (amountAfterFees * solAmount) / (mintAmount + amountAfterFees);

      const outputAmountAfterFee = buy
        ? outputAmount - calculateFee(transferFee, outputAmount)
        : outputAmount;

      setOutputAmount(outputAmountAfterFee.toString());
    }
  };
  const ceilN = (n: bigint, d: bigint) =>
    n / d + (n % d ? BigInt(1) : BigInt(0));

  const handleInputAmountGivenOutput = (amount: number) => {
    setOutputAmount(amount.toString());
    const currentTransferFeeConfig =
      metadata?.mint_extensions?.transfer_fee_config?.older_transfer_fee;
    if (swapPrice && currentTransferFeeConfig) {
      const mintAmount = swapPrice.mintAmount - accumulatedMintFee;
      const solAmount =
        swapPrice.solAmount + BigInt(OFF_SET) - accumulatedWsolFee;
      const transferFee: TransferFee = {
        epoch: BigInt(currentTransferFeeConfig.epoch),
        maximumFee: BigInt(currentTransferFeeConfig.maximum_fee),
        transferFeeBasisPoints: Number(
          currentTransferFeeConfig.transfer_fee_basis_points
        ),
      };
      const amountAfterTradingFees = BigInt(Math.round(amount * 0.98));
      const amountAfterFees = buy
        ? amountAfterTradingFees -
          calculateFee(transferFee, amountAfterTradingFees)
        : amountAfterTradingFees;

      const outputAmount = buy
        ? ceilN(amountAfterFees * solAmount, mintAmount - amountAfterFees)
        : ceilN(amountAfterFees * mintAmount, solAmount - amountAfterFees);
      const outputAmountAfterFee = buy
        ? outputAmount
        : outputAmount - calculateFee(transferFee, BigInt(outputAmount));

      setInputAmount(outputAmountAfterFee.toString());
    }
  };

  const SolButton = (
    <>
      <button className="btn btn-secondary rounded-lg gap-1 px-2 flex items-center">
        <IconCurrencySolana />
        SOL
      </button>
      <input
        type="number"
        className="w-full text-right"
        placeholder="0.00"
        value={
          (buy ? Number(inputAmount) : Number(outputAmount)) / LAMPORTS_PER_SOL
        }
        onChange={(e) => {
          let amount = parseFloat(e.target.value) * LAMPORTS_PER_SOL;
          handleOutputAmountGivenInput(Number.isNaN(amount) ? 0 : amount);
        }}
      />
    </>
  );

  const MintButton = (
    <>
      <button className="btn btn-secondary rounded-lg gap-1 px-2 items-center w-fit">
        {metadata?.additionalInfoData?.imageUrl && (
          <div className="w-8 h-8 relative">
            <Image
              className={`rounded-full object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata?.additionalInfoData?.imageUrl}
              alt={''}
            />
          </div>
        )}
        <span className="text-base truncate w-fit pl-1 text-left">
          {metadata?.content?.metadata.name}
        </span>
      </button>
      <input
        type="number"
        className="w-full text-right"
        placeholder="0.00"
        value={buy ? outputAmount : inputAmount}
        onChange={(e) => {
          let amount = parseFloat(e.target.value);
          handleInputAmountGivenOutput(Number.isNaN(amount) ? 0 : amount);
        }}
      />
    </>
  );
  return (
    <div className="flex flex-col gap-4 w-full h-full justify-center items-center p-4">
      {isLoading ? (
        <div className="loading loading-dots loading-lg" />
      ) : swapDetails ? (
        <>
          <div className="hero-content flex flex-col text-center max-w-lg">
            <span className="text-3xl lg:text-4xl ">Buy / Sell</span>
          </div>
          <div className="max-w-lg w-full flex flex-col gap-4 border border-base-content p-4 rounded">
            <label>
              <div className="label">
                <span className="label-text">You're Paying</span>
                <div className="label-text-alt flex items-end gap-2">
                  <IconWallet size={14} />
                  <span>{`${(buy
                    ? (inputToken || 0) / LAMPORTS_PER_SOL
                    : inputToken
                  )?.toPrecision(3)} ${
                    buy ? 'SOL' : metadata?.content?.metadata.symbol
                  }`}</span>
                  <button
                    onClick={() =>
                      inputToken && handleOutputAmountGivenInput(inputToken / 2)
                    }
                    className="badge badge-xs badge-outline badge-secondary p-2 "
                  >
                    Half
                  </button>
                  <button
                    onClick={() =>
                      inputToken && handleOutputAmountGivenInput(inputToken)
                    }
                    className="badge badge-xs badge-outline badge-secondary p-2 "
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="input input-bordered border-base-content flex items-center gap-2 input-lg rounded-lg">
                {buy ? SolButton : MintButton}
              </div>
            </label>
            <div className="flex items-center">
              <div className="divider w-1/2"></div>
              <button
                onClick={() => setBuy(!buy)}
                className="btn btn-square rounded-full px-2 btn-primary btn-sm"
              >
                <IconArrowsUpDown />
              </button>
              <div className="divider w-1/2"></div>
            </div>
            <label>
              <div className="label">
                <span className="label-text">To Receive</span>
                <div className="label-text-alt flex items-center gap-2">
                  <IconWallet size={14} />
                  <span>{`${
                    !buy ? (outputToken || 0) / LAMPORTS_PER_SOL : outputToken
                  } ${
                    !buy ? 'SOL' : metadata?.content?.metadata.symbol
                  }`}</span>
                </div>
              </div>
              <div className=" input input-bordered border-base-content flex items-center gap-2 input-lg rounded-lg">
                {buy ? MintButton : SolButton}
              </div>
            </label>
            <button
              disabled={
                inputAmount == '' ||
                outputAmount == '' ||
                swapMutation.isPending
              }
              onClick={() =>
                metadata &&
                swapMutation.mutateAsync({
                  type: SwapType.BasedInput,
                  amount_in: parseInt(inputAmount),
                  min_amount_out: 0,
                  inputToken: buy ? NATIVE_MINT : new PublicKey(metadata.id),
                  inputTokenProgram: buy
                    ? TOKEN_PROGRAM_ID
                    : TOKEN_2022_PROGRAM_ID,
                  outputToken: buy ? new PublicKey(metadata.id) : NATIVE_MINT,
                  outputTokenProgram: buy
                    ? TOKEN_2022_PROGRAM_ID
                    : TOKEN_PROGRAM_ID,
                })
              }
              className={`btn ${
                buy ? 'btn-success' : 'btn-error'
              } w-full rounded`}
            >
              {swapMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : (
                <span>{buy ? 'Buy' : 'Sell'}</span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div>No Pool Address Found.</div>
      )}
    </div>
  );
};
