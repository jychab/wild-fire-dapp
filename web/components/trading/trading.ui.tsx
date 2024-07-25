import { Scope } from '@/utils/enums/das';
import { formatLargeNumber } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconCurrencySolana } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';
import { useGetMintToken } from '../edit/edit-data-access';
import {
  useGetLargestAccountFromMint,
  useGetMintSummaryDetails,
} from '../profile/profile-data-access';
import { AuthorityData } from '../profile/profile-ui';
import {
  getAssociatedTokenStateAccount,
  getQuote,
  useGetAddressInfo,
  useGetTokenAccountInfo,
  useIsLiquidityPoolFound,
  useSwapMutation,
} from './trading-data-access';

export const TradingPanel: FC<{
  mintId: string;
  metadata: DAS.GetAssetResponse | null | undefined;
}> = ({ metadata, mintId }) => {
  const { publicKey } = useWallet();

  const [buy, setBuy] = useState(true);

  const { data: isLiquidityPoolFound, isLoading } = useIsLiquidityPoolFound({
    mint: new PublicKey(mintId),
  });

  const { data: mintSummaryDetails } = useGetMintSummaryDetails({
    mint: metadata ? new PublicKey(mintId) : null,
  });

  const { data: authorityData } = useGetMintToken({
    mint: metadata ? new PublicKey(metadata.id) : null,
  });

  const swapMutation = useSwapMutation({ mint: new PublicKey(mintId) });

  const { data: walletInfo } = useGetAddressInfo({
    address: isLiquidityPoolFound ? publicKey : null,
  });

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

  const handleOutputAmountGivenInput = async (amount: number) => {
    setInputAmount(amount.toString());
    const quoteResponse = await getQuote(
      buy ? NATIVE_MINT.toBase58() : mintId,
      buy ? mintId : NATIVE_MINT.toBase58(),
      amount,
      'ExactIn'
    );
    console.log(quoteResponse);
    setOutputAmount(quoteResponse.outAmount || '');
  };

  const handleInputAmountGivenOutput = async (amount: number) => {
    setOutputAmount(amount.toString());
    const quoteResponse = await getQuote(
      buy ? NATIVE_MINT.toBase58() : mintId,
      buy ? mintId : NATIVE_MINT.toBase58(),
      amount,
      'ExactOut'
    );
    setInputAmount(quoteResponse.outAmount || '');
  };

  const SolButton = (
    <>
      <button className="btn btn-sm rounded-lg gap-1 px-2 flex items-center text-sm ">
        <IconCurrencySolana />
        SOL
      </button>
      <input
        type="number"
        className="w-full text-right text-base"
        placeholder="0.00"
        value={
          buy
            ? inputAmount != ''
              ? Number(inputAmount) / LAMPORTS_PER_SOL
              : ''
            : outputAmount != ''
            ? Number(outputAmount) / LAMPORTS_PER_SOL
            : ''
        }
        onChange={(e) => {
          let amount = parseFloat(e.target.value) * LAMPORTS_PER_SOL;
          if (Number.isNaN(amount)) {
            setOutputAmount('');
            setInputAmount('');
          } else {
            buy
              ? handleOutputAmountGivenInput(amount)
              : handleInputAmountGivenOutput(amount);
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
              src={metadata?.content?.links?.image}
              alt={''}
            />
          </div>
        )}
        <span className="text-sm truncate w-fit pl-1 text-left">
          {metadata?.content?.metadata.name}
        </span>
      </button>
      <input
        type="number"
        className="w-full text-right text-base"
        placeholder="0.00"
        value={
          buy
            ? inputAmount != ''
              ? Number(outputAmount) /
                10 ** (metadata?.token_info?.decimals || 0)
              : ''
            : outputAmount != ''
            ? Number(inputAmount) / 10 ** (metadata?.token_info?.decimals || 0)
            : ''
        }
        onChange={(e) => {
          let amount = parseFloat(e.target.value);
          if (Number.isNaN(amount)) {
            setOutputAmount('');
            setInputAmount('');
          } else {
            buy
              ? handleInputAmountGivenOutput(amount)
              : handleOutputAmountGivenInput(amount);
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
          <div className="flex flex-col w-full">
            <div
              className={`flex md:bg-base-200 rounded md:mb-4 items-center justify-between px-4 md:py-2`}
            >
              <div className="flex gap-2 items-center">
                <Image
                  width={32}
                  height={32}
                  src={metadata?.content?.links?.image || ''}
                  alt={''}
                  className="rounded"
                />
                <span>{`${metadata?.content?.metadata.symbol}-USD`}</span>
                {/* <div className="hidden md:flex flex-col card py-2 px-4 text-right">
                  <span className="stat-title text-xs">Liquidity</span>
                  <span className="stat-value text-base font-normal">{`$${(
                    (metadata?.token_info?.price_info?.price_per_token || 0) *
                    (metadata?.token_info?.supply || 0)
                  ).toPrecision(3)}`}</span>
                </div>
                <div className="hidden md:flex flex-col card py-2 px-4 text-right">
                  <span className="stat-title text-xs">24Hr Vol</span>
                  <span className="stat-value text-base font-normal">{`$${(
                    (metadata?.token_info?.price_info?.price_per_token || 0) *
                    (metadata?.token_info?.supply || 0)
                  ).toPrecision(3)}`}</span>
                </div>
                <div className="hidden md:flex flex-col card py-2 px-4 text-right">
                  <span className="stat-title text-xs">24Hr Trades</span>
                  <span className="stat-value text-base font-normal">{`$${(
                    (metadata?.token_info?.price_info?.price_per_token || 0) *
                    (metadata?.token_info?.supply || 0)
                  ).toPrecision(3)}`}</span>
                </div> */}
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex flex-col card py-2 px-4 text-right">
                  <span className="stat-value text-lg md:text-xl font-normal">{`$${(
                    metadata?.token_info?.price_info?.price_per_token || 0
                  ).toPrecision(3)}`}</span>
                </div>
              </div>
            </div>
            <iframe
              width="100%"
              height="500"
              src={`https://birdeye.so/tv-widget/${mintId}?chain=solana&viewMode=pair&chartInterval=15&chartType=CANDLE&chartTimezone=Asia%2FSingapore&chartLeftToolbar=hide&theme=dark`}
            ></iframe>
          </div>
          <div className="flex flex-col gap-4 w-full md:max-w-xs">
            {
              <MintInfo
                metadata={metadata}
                authorityData={authorityData}
                mintSummaryDetails={mintSummaryDetails}
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
                      ? (inputToken || 0) / LAMPORTS_PER_SOL
                      : inputToken || 0
                    )?.toPrecision(3)} ${
                      buy ? 'SOL' : metadata?.content?.metadata.symbol
                    }`}</span>
                    <button
                      onClick={() =>
                        inputToken &&
                        handleOutputAmountGivenInput(Math.round(inputToken / 2))
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
                <div className="input input-bordered border-base-content flex items-center gap-2 input-md rounded-lg px-2">
                  {buy ? SolButton : MintButton}
                </div>
              </label>

              <label>
                <div className="label">
                  <span className="label-text text-xs">To Receive</span>
                  <div className="label-text-alt">
                    <span>{`${
                      !buy
                        ? (outputToken || 0) / LAMPORTS_PER_SOL
                        : outputToken || 0
                    } ${
                      !buy ? 'SOL' : metadata?.content?.metadata.symbol
                    }`}</span>
                  </div>
                </div>
                <div className=" input input-bordered border-base-content flex items-center gap-2 input-md rounded-lg px-2">
                  {buy ? MintButton : SolButton}
                </div>
              </label>
              <button
                disabled={!isLiquidityPoolFound}
                onClick={() => {
                  swapMutation.mutateAsync({
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
}> = ({ metadata, authorityData, mintSummaryDetails }) => {
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
      {mintSummaryDetails && <div className="col-span-1 text-sm">Holders:</div>}
      {mintSummaryDetails && (
        <span className="text-right col-span-3">
          {mintSummaryDetails.currentHoldersCount}
        </span>
      )}
    </div>
  );
};
