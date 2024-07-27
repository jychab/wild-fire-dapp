import TradingViewChart from '@/utils/charts';
import { USDC, USDC_DECIMALS } from '@/utils/consts';
import { Scope } from '@/utils/enums/das';
import { formatLargeNumber } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import {
  calculateFee,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TransferFee,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconCurrencyDollar } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useCallback, useMemo, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetLargestAccountFromMint,
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import { AuthorityData } from '../profile/profile-ui';
import {
  getAssociatedTokenStateAccount,
  getQuote,
  getUSDCVault,
  useGetTokenAccountInfo,
  useIsLiquidityPoolFound,
  useSwapMutation,
} from './trading-data-access';

export const TradingPanel: FC<{
  mintId: string;
}> = ({ mintId }) => {
  const { publicKey } = useWallet();
  const [showWarning, setShowWarning] = useState(false);
  const [showError, setShowError] = useState(false);
  const { data: metadata } = useGetTokenDetails({
    mint: new PublicKey(mintId),
  });

  const [buy, setBuy] = useState(true);

  const { data: isLiquidityPoolFound, isLoading } = useIsLiquidityPoolFound({
    mint: new PublicKey(mintId),
  });

  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: new PublicKey(mintId),
  });

  const { data: authorityData } = useGetMintToken({
    mint: new PublicKey(mintId),
  });

  const swapMutation = useSwapMutation({ mint: new PublicKey(mintId) });

  const chartProps = useMemo(
    () => ({
      mint: mintId,
    }),
    [mintId]
  );

  const { data: userUsdcInfo } = useGetTokenAccountInfo({
    address: publicKey
      ? getAssociatedTokenAddressSync(
          new PublicKey(USDC),
          publicKey,
          false,
          new PublicKey(TOKEN_PROGRAM_ID)
        )
      : null,
    tokenProgram: TOKEN_PROGRAM_ID,
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
  });

  const { data: usdcVault } = useGetTokenAccountInfo({
    address:
      metadata && publicKey ? getUSDCVault(new PublicKey(metadata.id)) : null,
    tokenProgram: TOKEN_PROGRAM_ID,
  });

  const liquidity = (Number(usdcVault?.amount) || 0) * 0.99;

  const inputToken = buy
    ? Number(userUsdcInfo?.amount)
    : userMintInfo
    ? Number(userMintInfo.amount)
    : undefined;
  const outputToken = buy
    ? userMintInfo
      ? Number(userMintInfo.amount)
      : undefined
    : Number(userUsdcInfo?.amount);

  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const formattedInputAmount = useMemo(() => {
    return buy
      ? Number(inputAmount) / 10 ** USDC_DECIMALS
      : Number(inputAmount);
  }, [buy, inputAmount]);

  const formattedOutputAmount = useMemo(() => {
    return buy
      ? Number(outputAmount)
      : Number(outputAmount) / 10 ** USDC_DECIMALS;
  }, [buy, outputAmount]);
  const { connection } = useConnection();

  const handleOutputAmountGivenInput = useCallback(
    async (amount: number) => {
      setInputAmount(amount.toString());
      setShowError(false);
      if (liquidity) {
        const quoteResponse = await getQuote(
          connection,
          publicKey!,
          new PublicKey(mintId),
          buy ? USDC.toBase58() : mintId,
          buy ? mintId : USDC.toBase58(),
          amount,
          'ExactIn'
        );
        if (
          !quoteResponse.outAmount ||
          (!buy && quoteResponse.outAmount > liquidity)
        ) {
          setShowError(true);
          return;
        }

        let outAmount = quoteResponse.outAmount;
        if (buy) {
          const currentTransferFeeConfig =
            metadata?.mint_extensions?.transfer_fee_config?.older_transfer_fee;
          if (currentTransferFeeConfig) {
            const transferFee: TransferFee = {
              epoch: BigInt(currentTransferFeeConfig.epoch),
              maximumFee: BigInt(currentTransferFeeConfig.maximum_fee),
              transferFeeBasisPoints: Number(
                currentTransferFeeConfig.transfer_fee_basis_points
              ),
            };
            outAmount = outAmount - calculateFee(transferFee, outAmount);
          }
        }

        setOutputAmount(outAmount.toString());
      } else {
        // show mint not created through this platform
      }
    },
    [mintId, publicKey, liquidity, metadata, connection, buy]
  );

  const USDCButton = (
    <>
      <button className="btn btn-sm rounded-lg gap-1 px-2 flex items-center text-sm ">
        <IconCurrencyDollar />
        USDC
      </button>
      <input
        disabled={!buy}
        type="number"
        className="w-full text-right text-base"
        placeholder="0.00"
        value={buy ? formattedInputAmount : formattedOutputAmount}
        onChange={(e) => {
          let amount = parseFloat(e.target.value) * 10 ** USDC_DECIMALS;
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
          let amount = parseFloat(e.target.value);
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
            <TradingViewChart {...chartProps} />
          </div>
          <div className="flex flex-col gap-4 w-full md:max-w-xs">
            {
              <MintInfo
                metadata={metadata}
                authorityData={authorityData}
                mintSummaryDetails={mintSummaryDetails}
                liquidity={liquidity}
              />
            }
            <div className="flex flex-col gap-2 p-4 rounded">
              <div className="flex items-center w-full">
                <button
                  onClick={() => setBuy(true)}
                  className={`btn ${
                    !buy ? 'btn-outline' : 'btn-success'
                  } w-1/2  btn-sm rounded-r-none `}
                >
                  Buy
                </button>
                <button
                  onClick={() => setBuy(false)}
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
                    <span>{`${(buy
                      ? (inputToken || 0) / 10 ** USDC_DECIMALS
                      : inputToken || 0
                    )?.toPrecision(3)} ${
                      buy ? 'USDC' : metadata?.content?.metadata.symbol
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
                  {buy ? USDCButton : MintButton}
                </div>
              </label>

              <label>
                <div className="label">
                  <span className="label-text text-xs">To Receive</span>
                  <div className="label-text-alt">
                    <span>{`${
                      !buy
                        ? (outputToken || 0) / 10 ** USDC_DECIMALS
                        : outputToken || 0
                    } ${
                      !buy ? 'USDC' : metadata?.content?.metadata.symbol
                    }`}</span>
                  </div>
                </div>
                <div className=" input input-bordered border-base-content flex items-center gap-2 input-md rounded-lg px-2">
                  {buy ? MintButton : USDCButton}
                </div>
              </label>
              {showWarning && (
                <span className="text-right text-xs text-warning">
                  {'Price Impact exceeds 30%'}
                </span>
              )}
              {showError && (
                <span className="text-right text-xs text-error">
                  {'Insufficient liquidity in the pool for this trade'}
                </span>
              )}
              <button
                disabled={!isLiquidityPoolFound || showError}
                onClick={() => {
                  swapMutation.mutateAsync({
                    inputMint: buy ? USDC.toBase58() : mintId,
                    outputMint: buy ? mintId : USDC.toBase58(),
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
                  Create your liquidity pool on Raydium
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <Activities metadata={metadata} authorityData={authorityData} />
    </div>
  );
};

interface ActivitiesProps {
  authorityData: AuthorityData | null | undefined;
  metadata: DAS.GetAssetResponse | null | undefined;
}

export const Activities: FC<ActivitiesProps> = ({
  metadata,
  authorityData,
}) => {
  const { data: largestTokenAccount } = useGetLargestAccountFromMint({
    mint: metadata ? new PublicKey(metadata.id) : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata.token_info.token_program)
      : null,
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
                      href={`https://solscan.io/address/${x.owner.toBase58()}`}
                    >
                      {`${
                        x.owner.toBase58() == authorityData?.admin.toBase58()
                          ? '(Creator)'
                          : ''
                      }${
                        authorityData &&
                        x.owner.toBase58() ==
                          getAssociatedTokenStateAccount(
                            authorityData.mint
                          ).toBase58()
                          ? '(Reserve)'
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
                            10 ** (metadata?.token_info?.decimals || 0))) *
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
  metadata: DAS.GetAssetResponse | null | undefined;
  authorityData: AuthorityData | null | undefined;
  mintSummaryDetails:
    | {
        currentHoldersCount: number;
        holdersChange24hPercent: number;
      }
    | null
    | undefined;
  liquidity: number;
}> = ({ metadata, authorityData, mintSummaryDetails, liquidity }) => {
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
          authorityData
            ? authorityData.admin
            : metadata?.authorities?.find(
                (x) =>
                  x.scopes.includes(Scope.METADATA) ||
                  x.scopes.includes(Scope.FULL)
              )?.address
        }`}
      >
        {authorityData
          ? authorityData.admin.toBase58()
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
            10 ** (metadata?.token_info?.decimals || 0)
        )}
      </span>
      <div className="col-span-1 text-sm">Liquidity:</div>
      <span className="text-right col-span-3">
        {`$${formatLargeNumber(liquidity / 10 ** USDC_DECIMALS)}`}
      </span>

      {mintSummaryDetails && <div className="col-span-1 text-sm">Holders:</div>}
      {mintSummaryDetails && (
        <span className="text-right col-span-3">
          {mintSummaryDetails.currentHoldersCount}
        </span>
      )}
    </div>
  );
};
