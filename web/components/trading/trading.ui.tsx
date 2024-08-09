import { DEFAULT_MINT_DECIMALS, NATIVE_MINT_DECIMALS } from '@/utils/consts';
import { Scope } from '@/utils/enums/das';
import { formatLargeNumber } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import {
  calculateFee,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TransferFee,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconCurrencySolana } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useCallback, useMemo, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetLargestAccountFromMint,
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import {
  getAssociatedTokenStateAccount,
  getQuote,
  useGetAccountInfo,
  useGetTokenAccountInfo,
  useIsLiquidityPoolFound,
  useSwapMutation,
} from './trading-data-access';

export const TradingPanel: FC<{
  mintId: string | null;
}> = ({ mintId }) => {
  const { publicKey } = useWallet();
  const [showWarning, setShowWarning] = useState('');
  const [showError, setShowError] = useState('');
  const { data: metadata } = useGetTokenDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const [buy, setBuy] = useState(true);

  const { data: isLiquidityPoolFound, isLoading } = useIsLiquidityPoolFound({
    mint: mintId ? new PublicKey(mintId) : null,
  });

  const swapMutation = useSwapMutation({
    mint: mintId ? new PublicKey(mintId) : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });

  const { data: userAccountInfo } = useGetAccountInfo({
    address: publicKey,
  });
  const { data: userMintInfo } = useGetTokenAccountInfo({
    address:
      metadata && publicKey
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata!.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info!.token_program!)
          )
        : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });

  // const { data: usdcVault } = useGetTokenAccountInfo({
  //   address: getUSDCVault(new PublicKey(mintId)),
  //   tokenProgram: TOKEN_PROGRAM_ID,
  // });
  // const { data: mintVault } = useGetTokenAccountInfo({
  //   address: getMintVault(new PublicKey(mintId)),
  // });
  // const { data: poolState } = useGetPoolState({ mint: new PublicKey(mintId) });

  // const liquidity =
  //   Number(usdcVault?.amount) -
  //   poolState?.creatorFeesTokenUsdc -
  //   poolState?.protocolFeesTokenUsdc;

  const inputToken = buy
    ? Number(userAccountInfo?.lamports)
    : Number(userMintInfo?.amount);

  const outputToken = buy
    ? Number(userMintInfo?.amount)
    : Number(userAccountInfo?.lamports);

  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const formattedInputAmount = useMemo(() => {
    return inputAmount != ''
      ? (
          Number(inputAmount) /
          10 **
            (buy
              ? NATIVE_MINT_DECIMALS
              : metadata?.token_info?.decimals || DEFAULT_MINT_DECIMALS)
        ).toString()
      : '';
  }, [buy, inputAmount]);

  const formattedOutputAmount = useMemo(() => {
    return outputAmount != ''
      ? (
          Number(outputAmount) /
          10 **
            (buy
              ? metadata?.token_info?.decimals || DEFAULT_MINT_DECIMALS
              : NATIVE_MINT_DECIMALS)
        ).toString()
      : '';
  }, [buy, outputAmount]);
  const { connection } = useConnection();

  const handleOutputAmountGivenInput = useCallback(
    async (amount: number) => {
      if (!mintId) return;
      setInputAmount(amount.toString());
      if (!inputToken || amount > inputToken) {
        setShowWarning('Input Amount Exceeds Balance');
      } else {
        setShowWarning('');
      }
      setShowError('');
      try {
        let transferFee: TransferFee | undefined;
        const currentTransferFeeConfig =
          metadata?.mint_extensions?.transfer_fee_config?.older_transfer_fee;
        if (currentTransferFeeConfig) {
          transferFee = {
            epoch: BigInt(currentTransferFeeConfig.epoch),
            maximumFee: BigInt(currentTransferFeeConfig.maximum_fee),
            transferFeeBasisPoints: Number(
              currentTransferFeeConfig.transfer_fee_basis_points
            ),
          };
        }
        let inputAmountWithoutFee = BigInt(amount);
        if (!buy) {
          inputAmountWithoutFee =
            inputAmountWithoutFee -
            (transferFee
              ? calculateFee(transferFee, inputAmountWithoutFee)
              : BigInt(0));
        }
        let outAmountWithoutFee = await getQuote(
          // mintVault,
          // usdcVault,
          // poolState,
          buy ? NATIVE_MINT.toBase58() : mintId,
          buy ? mintId : NATIVE_MINT.toBase58(),
          inputAmountWithoutFee,
          'ExactIn'
        );

        if (buy) {
          outAmountWithoutFee =
            outAmountWithoutFee -
            (transferFee
              ? calculateFee(transferFee, outAmountWithoutFee)
              : BigInt(0));
        }
        setOutputAmount(outAmountWithoutFee.toString());
      } catch (e: any) {
        setShowError(e.message);
      }
    },
    [mintId, publicKey, metadata, connection, buy]
  );

  const SOLButton = (
    <>
      <button className="btn btn-sm rounded-lg gap-1 px-2 flex items-center text-sm ">
        <IconCurrencySolana />
        SOL
      </button>
      <input
        disabled={!buy}
        type="number"
        className="w-full text-right text-base"
        placeholder="0.00"
        value={buy ? formattedInputAmount : formattedOutputAmount}
        onChange={(e) => {
          let amount = parseFloat(e.target.value) * 10 ** NATIVE_MINT_DECIMALS;
          if (Number.isNaN(amount)) {
            setInputAmount('');
            setOutputAmount('');
          } else {
            handleOutputAmountGivenInput(amount);
          }
        }}
      />
    </>
  );

  const MintButton = (
    <>
      <button className="btn btn-sm rounded-lg gap-1 px-2 items-center w-fit">
        {metadata?.content?.links?.image && (
          <div className="w-6 h-6 relative">
            <Image
              className={`rounded-full object-cover`}
              fill={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={metadata?.content?.links?.image!}
              alt={''}
            />
          </div>
        )}
        <span className="text-sm truncate w-fit pl-1 text-left">
          {metadata?.content?.metadata.name}
        </span>
      </button>
      <input
        disabled={buy}
        type="number"
        className="w-full text-right text-base"
        placeholder="0.00"
        value={buy ? formattedOutputAmount : formattedInputAmount}
        onChange={(e) => {
          let amount =
            parseFloat(e.target.value) *
            10 ** (metadata?.token_info?.decimals || DEFAULT_MINT_DECIMALS);
          if (Number.isNaN(amount)) {
            setOutputAmount('');
            setInputAmount('');
          } else {
            handleOutputAmountGivenInput(amount);
          }
        }}
      />
    </>
  );

  return (
    <div className="flex flex-col md:gap-4 w-full h-full justify-center items-center">
      {isLoading ? (
        <div className="loading loading-dots loading-lg" />
      ) : (
        <div className="flex flex-col md:flex-row items-start w-full md:gap-4 my-4">
          <div className="flex flex-col h-[500px] w-full">
            {/* {poolState ? (
              <TradingViewChart {...chartProps} />
            ) : ( */}
            <iframe
              width="100%"
              height="500"
              src={`https://birdeye.so/tv-widget/${mintId}?chain=solana&viewMode=pair&chartInterval=15&chartType=CANDLE&chartTimezone=Asia%2FSingapore&chartLeftToolbar=show&theme=dark`}
            ></iframe>
            {/* )} */}
          </div>
          <div className="flex flex-col gap-4 w-full md:max-w-xs">
            {<MintInfo mintId={mintId} metadata={metadata} liquidity={NaN} />}
            <div className="flex flex-col gap-2 p-4 rounded">
              <div className="flex items-center w-full">
                <button
                  onClick={() => {
                    setBuy(true);
                    setInputAmount('');
                    setOutputAmount('');
                  }}
                  className={`btn ${
                    !buy ? 'btn-outline' : 'btn-success'
                  } w-1/2  btn-sm rounded-r-none `}
                >
                  Buy
                </button>
                <button
                  onClick={() => {
                    setBuy(false);
                    setInputAmount('');
                    setOutputAmount('');
                  }}
                  className={`btn w-1/2  ${
                    buy ? 'btn-outline ' : 'btn-error'
                  } btn-sm rounded-l-none `}
                >
                  Sell
                </button>
              </div>
              <label>
                <div className="label">
                  <span className="label-text text-xs">You're Paying</span>
                  <div className="label-text-alt flex items-end gap-2">
                    <span>{`${formatLargeNumber(
                      buy
                        ? (inputToken || 0) / 10 ** NATIVE_MINT_DECIMALS
                        : (inputToken || 0) /
                            10 **
                              (metadata?.token_info?.decimals ||
                                DEFAULT_MINT_DECIMALS)
                    )} ${
                      buy ? 'SOL' : metadata?.content?.metadata.symbol
                    }`}</span>
                    <button
                      onClick={() =>
                        handleOutputAmountGivenInput(
                          Math.round((inputToken || 0) / 2)
                        )
                      }
                      className="badge badge-xs badge-outline badge-secondary p-2 "
                    >
                      Half
                    </button>
                    <button
                      onClick={() =>
                        handleOutputAmountGivenInput(inputToken || 0)
                      }
                      className="badge badge-xs badge-outline badge-secondary p-2 "
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="input input-bordered border-base-content flex items-center gap-2 input-md rounded-lg px-2">
                  {buy ? SOLButton : MintButton}
                </div>
              </label>

              <label>
                <div className="label">
                  <span className="label-text text-xs">To Receive</span>
                  <div className="label-text-alt">
                    <span>{`${formatLargeNumber(
                      !buy
                        ? (outputToken || 0) / 10 ** NATIVE_MINT_DECIMALS
                        : (outputToken || 0) /
                            10 **
                              (metadata?.token_info?.decimals ||
                                DEFAULT_MINT_DECIMALS)
                    )} ${
                      !buy ? 'SOL' : metadata?.content?.metadata.symbol
                    }`}</span>
                  </div>
                </div>
                <div className=" input input-bordered border-base-content flex items-center gap-2 input-md rounded-lg px-2">
                  {buy ? MintButton : SOLButton}
                </div>
              </label>
              {showWarning != '' && (
                <span className="text-right text-xs text-warning">
                  {showWarning}
                </span>
              )}
              {showError != '' && (
                <span className="text-right text-xs text-error">
                  {showError}
                </span>
              )}
              <button
                disabled={!isLiquidityPoolFound || showError != ''}
                onClick={() => {
                  if (!mintId) return;
                  swapMutation.mutateAsync({
                    // poolState,
                    inputMint: buy ? NATIVE_MINT.toBase58() : mintId,
                    outputMint: buy ? mintId : NATIVE_MINT.toBase58(),
                    amount: parseFloat(inputAmount),
                    swapMode: 'ExactIn',
                  });
                }}
                className={`mt-4 btn btn-sm ${
                  buy ? 'btn-success' : 'btn-error'
                } w-full`}
              >
                {swapMutation.isPending ? (
                  <div className="loading loading-spinner" />
                ) : isLiquidityPoolFound ? (
                  <span>
                    {buy
                      ? `Buy ${metadata?.content?.metadata.symbol}`
                      : `Sell ${metadata?.content?.metadata.symbol}`}
                  </span>
                ) : (
                  <span>No Liquidity Pool Found</span>
                )}
              </button>

              {!isLiquidityPoolFound && (
                <Link
                  rel="noopener noreferrer"
                  target="_blank"
                  className="btn btn-primary w-full text-center"
                  href={'https://raydium.io/liquidity/create-pool/'}
                >
                  Create a liquidity pool on Raydium
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <Activities metadata={metadata} mintId={mintId} />
    </div>
  );
};

interface ActivitiesProps {
  mintId: string | null;
  metadata: DAS.GetAssetResponse | null | undefined;
}

export const Activities: FC<ActivitiesProps> = ({ metadata, mintId }) => {
  const { data: largestTokenAccount } = useGetLargestAccountFromMint({
    mint: mintId ? new PublicKey(mintId) : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata.token_info.token_program)
      : null,
  });
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  return (
    <div className={`md:bg-base-200 flex flex-col w-full gap-2 rounded p-4`}>
      <span className="card-title text-base">Top 20 Holders</span>
      {largestTokenAccount && metadata && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Owner</th>
                <th>Quantity</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {largestTokenAccount.map((x, index) => (
                <tr key={x.address.toBase58()}>
                  <td className="text-xs">{index + 1}</td>

                  <td className="max-w-[140px] md:w-full truncate text-xs">
                    <Link
                      className="link link-hover"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={`https://solscan.io/address/${x.owner}`}
                    >
                      {`${
                        x.owner.toBase58() == tokenStateData?.admin
                          ? '(Creator)'
                          : ''
                      }${
                        tokenStateData &&
                        x.owner.toBase58() ==
                          getAssociatedTokenStateAccount(
                            new PublicKey(tokenStateData.mint)
                          ).toBase58()
                          ? '(Transfer Fee Wallet)'
                          : ''
                      } ${x.owner.toBase58()}`}
                    </Link>
                  </td>
                  <td className="w-auto text-xs">
                    {formatLargeNumber(x.uiAmount!)}
                  </td>
                  <td className="w-auto text-xs">
                    {`${(metadata.token_info?.supply
                      ? (x.uiAmount! /
                          (metadata?.token_info?.supply /
                            10 **
                              (metadata?.token_info?.decimals ||
                                DEFAULT_MINT_DECIMALS))) *
                        100
                      : 0
                    ).toFixed(2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const MintInfo: FC<{
  mintId: string | null;
  metadata: DAS.GetAssetResponse | null | undefined;
  liquidity: number;
}> = ({ mintId, metadata, liquidity }) => {
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  const { data: tokenStateData } = useGetMintToken({
    mint: mintId ? new PublicKey(mintId) : null,
  });
  return (
    <div className="hidden md:grid card rounded bg-base-200 grid-cols-4 gap-2 p-4 items-center">
      <div className="col-span-1 text-sm">Mint:</div>
      <Link
        rel="noopener noreferrer"
        target="_blank"
        className="col-span-3 stat-value text-xs md:text-sm truncate font-normal link link-hover"
        href={`https://solscan.io/address/${metadata?.id}`}
      >
        {metadata?.id}
      </Link>
      <div className="col-span-1 text-sm">Creator:</div>
      <Link
        rel="noopener noreferrer"
        target="_blank"
        className="col-span-3 stat-value text-xs md:text-sm truncate font-normal link link-hover"
        href={`https://solscan.io/address/${
          tokenStateData
            ? new PublicKey(tokenStateData.admin).toBase58()
            : metadata?.authorities?.find(
                (x) =>
                  x.scopes.includes(Scope.METADATA) ||
                  x.scopes.includes(Scope.FULL)
              )?.address
        }`}
      >
        {tokenStateData
          ? new PublicKey(tokenStateData.admin).toBase58()
          : metadata?.authorities?.find(
              (x) =>
                x.scopes.includes(Scope.METADATA) ||
                x.scopes.includes(Scope.FULL)
            )?.address}
      </Link>
      <div className="col-span-1 text-sm">Supply:</div>
      <span className="text-right col-span-3">
        {formatLargeNumber(
          (metadata?.token_info?.supply || 0) /
            10 ** (metadata?.token_info?.decimals || DEFAULT_MINT_DECIMALS)
        )}
      </span>
      {!Number.isNaN(liquidity) && (
        <div className="col-span-1 text-sm">Liquidity:</div>
      )}
      {!Number.isNaN(liquidity) && (
        <span className="text-right col-span-3">
          {`$${formatLargeNumber(liquidity / 10 ** NATIVE_MINT_DECIMALS)}`}
        </span>
      )}

      {mintSummaryDetails && <div className="col-span-1 text-sm">Holders:</div>}
      {mintSummaryDetails && (
        <span className="text-right col-span-3">
          {mintSummaryDetails.currentHoldersCount}
        </span>
      )}
    </div>
  );
};
