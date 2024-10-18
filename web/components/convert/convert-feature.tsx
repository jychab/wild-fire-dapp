import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import { DAS } from '@/utils/types/das';
import { NATIVE_MINT } from '@solana/spl-token';
import { IconWallet } from '@tabler/icons-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { useGetTokenPrice } from '../trading/trading-data-access';
import { useGetSummary } from '../trending/trending-data-access';
import {
  useGetOwnTokenBalance,
  useMultipleSellMutation,
} from './convert-data-access';

export const ConvertToSolButton: FC = () => {
  const { publicKey } = useWallet();
  const [filteredTokenBalances, setFilteredTokenBalances] = useState<
    DAS.GetAssetResponse[]
  >([]);
  const { data: solPrice } = useGetTokenPrice({ mint: NATIVE_MINT });
  const { data: summary } = useGetSummary();
  const { data: tokenBalances } = useGetOwnTokenBalance({
    address: publicKey,
    summary: summary || null,
    solPrice,
  });
  const router = useRouter();
  const sellMutation = useMultipleSellMutation();
  const handleConvert = async () => {
    if (!publicKey) return;
    const sellIxs = await Promise.all(
      filteredTokenBalances
        .filter((x) => !!x.token_info?.balance)
        .map((x) => ({
          mint: x.id,
          amount: Math.round(x.token_info?.balance || 0),
          compressed: x.compressedToken,
        }))
    );
    await sellMutation.mutateAsync({ mints: sellIxs, summary, solPrice });
  };
  return (
    <div className="indicator group mr-2">
      {tokenBalances && tokenBalances.length > 0 && (
        <span className="indicator-item badge badge-xs badge-primary group-hover:badge-success ">
          $
        </span>
      )}
      <button
        onClick={() => {
          if (publicKey) {
            (
              document.getElementById('convert')! as HTMLDialogElement
            ).showModal();
          }
        }}
        className="group-hover:text-success"
      >
        <IconWallet />
      </button>
      <dialog id="convert" className="modal modal-middle">
        <div
          onClick={() =>
            (document.getElementById('convert')! as HTMLDialogElement).close()
          }
          className="modal-backdrop"
        />
        <div className="modal-box border flex flex-col gap-4 animate-fade-up animate-once animate-duration-500 animate-ease-out border-base-300 max-h-96">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Convert Your Airdrops to SOL</h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
          </div>
          {tokenBalances && tokenBalances.length == 0 && (
            <div>No airdrops to convert...</div>
          )}
          <div className="overflow-x-scroll scrollbar-none">
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th>
                    <label>
                      <input
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilteredTokenBalances(tokenBalances || []);
                          } else {
                            setFilteredTokenBalances([]);
                          }
                        }}
                        type="checkbox"
                        className="checkbox"
                      />
                    </label>
                  </th>
                  <th>Token</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {tokenBalances
                  ?.filter((x) => !!x.content?.links?.image)
                  .map((x) => (
                    <tr
                      key={`${x.id}${x.compressedToken ? '-compressed' : ''}`}
                    >
                      <th>
                        <label>
                          <input
                            checked={
                              filteredTokenBalances.findIndex(
                                (y) =>
                                  y.id == x.id &&
                                  y.compressedToken == x.compressedToken
                              ) !== -1
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilteredTokenBalances((prev) => [
                                  ...prev,
                                  x,
                                ]);
                              } else {
                                setFilteredTokenBalances(
                                  filteredTokenBalances.filter(
                                    (y) =>
                                      !(
                                        y.id === x.id &&
                                        y.compressedToken === x.compressedToken
                                      )
                                  )
                                );
                              }
                            }}
                            type="checkbox"
                            className="checkbox"
                          />
                        </label>
                      </th>
                      <td>
                        <div className="flex items-center gap-2">
                          <Image
                            className={`rounded-full object-cover`}
                            width={32}
                            height={32}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            src={proxify(x.content?.links?.image!, true)}
                            alt={''}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-start">
                              {`${x.content?.metadata.name} ${
                                x.compressedToken ? '(Compressed)' : ''
                              }`}
                            </span>
                            <span className="stat-desc text-start">
                              {x.content?.metadata.symbol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm">{`${formatLargeNumber(
                            (x.token_info?.balance || 0) /
                              10 ** (x.token_info?.decimals || 0)
                          )}`}</span>
                          <span className="stat-desc">
                            {`$${formatLargeNumber(
                              ((x.token_info?.balance || 0) /
                                10 ** (x.token_info?.decimals || 0)) *
                                (x.token_info?.price_info?.price_per_token || 0)
                            )}`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <form method="dialog">
              <button className="btn btn-sm btn-outline">Cancel</button>
            </form>
            <button
              disabled={sellMutation.isPending}
              onClick={handleConvert}
              className="btn btn-sm btn-success"
            >
              {sellMutation.isPending ? (
                <div className="loading loading-spinner" />
              ) : (
                'Convert'
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};
