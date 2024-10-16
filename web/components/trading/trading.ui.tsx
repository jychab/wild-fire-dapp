import { DEFAULT_MINT_DECIMALS, NATIVE_MINT_DECIMALS } from '@/utils/consts';
import { Scope } from '@/utils/enums/das';
import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import {
  getAssociatedEscrowAccount,
  getAssociatedPoolAccount,
} from '@/utils/helper/mint';
import {
  calculateAmountLamports,
  calculateAmountOut,
} from '@/utils/helper/trading';
import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { IconCurrencySolana } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useCallback, useMemo, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetMintSummaryDetails,
  useGetTokenDetails,
} from '../profile/profile-data-access';
import TradingViewChart from './charts';
import {
  getQuote,
  useGetAccountInfo,
  useGetLargestAccountFromMint,
  useGetLiquidityPool,
  useGetTokenAccountInfo,
  useIsLiquidityPoolFound,
  useSwapMutation,
} from './trading-data-access';

export const TradingPanel: FC<{
  collectionMint: PublicKey | null;
  hideMintInfo?: boolean;
  hideActivities?: boolean;
  compact?: boolean;
}> = ({
  collectionMint,
  hideMintInfo = false,
  hideActivities = false,
  compact = false,
}) => {
  const { data: mintTokenDetails } = useGetMintToken({
    mint: collectionMint ? new PublicKey(collectionMint) : null,
  });
  const mint = mintTokenDetails?.memberMint
    ? new PublicKey(mintTokenDetails.memberMint)
    : null;
  const { data: metadata } = useGetTokenDetails({
    mint: collectionMint,
  });
  const { publicKey } = useWallet();
  const [showWarning, setShowWarning] = useState('');
  const [showError, setShowError] = useState('');
  const [buy, setBuy] = useState(true);

  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint,
  });

  const swapMutation = useSwapMutation({
    mint,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });
  const { data: liquidityPoolData } = useGetLiquidityPool({
    mint,
  });

  const { data: userAccountInfo } = useGetAccountInfo({
    address: publicKey,
  });
  const { data: userMintInfo } = useGetTokenAccountInfo({
    address:
      metadata && publicKey && metadata.token_info
        ? getAssociatedTokenAddressSync(
            new PublicKey(metadata.id),
            publicKey,
            false,
            new PublicKey(metadata.token_info?.token_program!)
          )
        : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata?.token_info?.token_program)
      : undefined,
  });

  const inputToken = buy
    ? Number(userAccountInfo?.lamports)
    : Number(userMintInfo?.amount);

  const outputToken = buy
    ? Number(userMintInfo?.amount)
    : Number(userAccountInfo?.lamports);

  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');

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
      if (!mint) return;
      if (!inputToken || amount > inputToken) {
        setShowWarning('Input Amount Exceeds Balance');
      } else {
        setShowWarning('');
      }
      setShowError('');
      try {
        let inputAmount = BigInt(amount);
        let outAmount = isLiquidityPoolFound
          ? await getQuote(
              buy ? NATIVE_MINT.toBase58() : mint.toBase58(),
              buy ? mint.toBase58() : NATIVE_MINT.toBase58(),
              inputAmount,
              'ExactIn'
            )
          : buy
          ? calculateAmountOut(
              inputAmount,
              BigInt(100),
              BigInt(liquidityPoolData?.reserveTokenSold || 0)
            )
          : calculateAmountLamports(
              inputAmount,
              BigInt(100),
              BigInt(liquidityPoolData?.reserveTokenSold || 0)
            );
        setOutputAmount(outAmount.toString());
      } catch (e: any) {
        setShowError(e.message);
      }
    },
    [
      mint,
      publicKey,
      metadata,
      connection,
      buy,
      isLiquidityPoolFound,
      liquidityPoolData,
    ]
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
        value={buy ? inputAmount : formattedOutputAmount}
        onChange={(e) => {
          let amount = parseFloat(e.target.value) * 10 ** NATIVE_MINT_DECIMALS;

          if (Number.isNaN(amount)) {
            setInputAmount('');
            setOutputAmount('');
          } else {
            setInputAmount(e.target.value);
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
              src={proxify(metadata?.content?.links?.image!, true)}
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
        value={buy ? formattedOutputAmount : inputAmount}
        onChange={(e) => {
          let amount =
            parseFloat(e.target.value) *
            10 ** (metadata?.token_info?.decimals || DEFAULT_MINT_DECIMALS);
          if (Number.isNaN(amount)) {
            setOutputAmount('');
            setInputAmount('');
          } else {
            setInputAmount(e.target.value);
            handleOutputAmountGivenInput(amount);
          }
        }}
      />
    </>
  );

  return (
    <div className="flex flex-col md:gap-4 w-full h-full justify-center items-center">
      <div
        className={`flex flex-col gap-4 ${
          compact ? 'flex-row' : 'md:flex-row '
        } items-start w-full my-4`}
      >
        <TradingChart collectionMint={collectionMint} />
        <div
          className={`flex flex-col gap-4 w-full ${
            compact ? '' : 'p-4 md:max-w-xs'
          }`}
        >
          {!hideMintInfo && (
            <MintInfo
              collectionMint={collectionMint}
              metadata={metadata}
              liquidity={NaN}
            />
          )}
          <div className="flex flex-col gap-2 rounded">
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
                <div className="label-text-alt flex items-end gap-2 max-w-[200px] truncate">
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
                    onClick={() => {
                      setInputAmount(
                        (
                          inputToken /
                          (2 *
                            10 **
                              (buy
                                ? NATIVE_MINT_DECIMALS
                                : DEFAULT_MINT_DECIMALS))
                        ).toString()
                      );
                      handleOutputAmountGivenInput(
                        Math.round((inputToken || 0) / 2)
                      );
                    }}
                    className="badge badge-xs badge-outline badge-secondary p-2 "
                  >
                    Half
                  </button>
                  <button
                    onClick={() => {
                      setInputAmount(
                        (
                          inputToken /
                          10 **
                            (buy ? NATIVE_MINT_DECIMALS : DEFAULT_MINT_DECIMALS)
                        ).toString()
                      );
                      handleOutputAmountGivenInput(inputToken || 0);
                    }}
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
                <div className="label-text-alt max-w-[100px] truncate">
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
              <span className="text-right text-xs text-error">{showError}</span>
            )}
            <button
              disabled={showError != ''}
              onClick={() => {
                if (!mint) return;
                swapMutation.mutateAsync({
                  poolState: liquidityPoolData,
                  inputMint: buy ? NATIVE_MINT.toBase58() : mint?.toBase58(),
                  outputMint: buy ? mint?.toBase58() : NATIVE_MINT.toBase58(),
                  amount:
                    parseFloat(inputAmount) *
                    10 ** (buy ? NATIVE_MINT_DECIMALS : DEFAULT_MINT_DECIMALS),
                  swapMode: 'ExactIn',
                });
              }}
              className={`mt-4 btn btn-sm ${
                buy ? 'btn-success' : 'btn-error'
              } w-full`}
            >
              {swapMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : (
                <span>
                  {buy
                    ? `Buy ${metadata?.content?.metadata.symbol}`
                    : `Sell ${metadata?.content?.metadata.symbol}`}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {!hideActivities && <Activities metadata={metadata} />}
    </div>
  );
};

interface ActivitiesProps {
  metadata: DAS.GetAssetResponse | null | undefined;
}

export const Activities: FC<ActivitiesProps> = ({ metadata }) => {
  const { data: largestTokenAccount } = useGetLargestAccountFromMint({
    mint: metadata ? new PublicKey(metadata.id) : null,
    tokenProgram: metadata?.token_info?.token_program
      ? new PublicKey(metadata.token_info.token_program)
      : null,
  });
  const { data: tokenStateData } = useGetMintToken({
    mint: metadata?.grouping?.find((x) => x.group_key == 'collection')
      ?.group_value
      ? new PublicKey(
          metadata?.grouping?.find(
            (x) => x.group_key == 'collection'
          )!.group_value
        )
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
                      href={`https://solscan.io/address/${x.owner}`}
                    >
                      {`${
                        x.owner.toBase58() == tokenStateData?.admin
                          ? '(Creator)'
                          : ''
                      }${
                        tokenStateData &&
                        x.owner.toBase58() ==
                          getAssociatedEscrowAccount(
                            new PublicKey(tokenStateData.admin)
                          ).toBase58()
                          ? '(Airdrop Wallet)'
                          : ''
                      }${
                        metadata &&
                        x.owner.toBase58() ==
                          getAssociatedPoolAccount(
                            new PublicKey(metadata.id)
                          ).toBase58()
                          ? '(Bonding Curve)'
                          : ''
                      } ${x.owner.toBase58()}`}
                    </Link>
                  </td>
                  <td className="w-auto text-xs">
                    {formatLargeNumber(
                      Number(x.amount) /
                        10 **
                          (metadata?.token_info?.decimals ||
                            DEFAULT_MINT_DECIMALS)
                    )}
                  </td>
                  <td className="w-auto text-xs">
                    {`${(metadata.token_info?.supply
                      ? (Number(x.amount) / metadata?.token_info?.supply) * 100
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
  collectionMint: PublicKey | null;
  metadata: DAS.GetAssetResponse | null | undefined;
  liquidity: number;
}> = ({ collectionMint, metadata, liquidity }) => {
  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: collectionMint,
  });
  const { data: tokenStateData } = useGetMintToken({
    mint: collectionMint,
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

const TradingChart: FC<{
  collectionMint: PublicKey | null;
}> = ({ collectionMint }) => {
  const { data: metadata } = useGetTokenDetails({
    mint: collectionMint,
  });
  const { data: mintTokenDetails } = useGetMintToken({
    mint: collectionMint,
  });
  const { data: isLiquidityPoolFound } = useIsLiquidityPoolFound({
    mint: mintTokenDetails ? new PublicKey(mintTokenDetails?.memberMint) : null,
  });
  return (
    <div className="flex flex-col h-[500px] w-full">
      {isLiquidityPoolFound ? (
        <iframe
          width="100%"
          height="500"
          src={`https://birdeye.so/tv-widget/${mintTokenDetails?.memberMint}?chain=solana&viewMode=pair&chartInterval=15&chartType=CANDLE&chartTimezone=Asia%2FSingapore&chartLeftToolbar=hide&theme=dark`}
          allow="fullscreen"
          title="TradingView Chart"
          className="flex-grow"
        />
      ) : (
        <TradingViewChart collectionMint={collectionMint} metadata={metadata} />
      )}
    </div>
  );
};
