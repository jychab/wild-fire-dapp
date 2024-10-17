import { db } from '@/utils/firebase/firebase';
import { proxify } from '@/utils/helper/endpoints';
import { formatLargeNumber } from '@/utils/helper/format';
import { program } from '@/utils/program/instructions';
import { DAS } from '@/utils/types/das';
import { IconBellFilled } from '@tabler/icons-react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import {
  useGetAssetByOwner,
  useMultipleSellMutation,
} from './claim-data-access';

export async function getOwnerTokenBalance(address: string) {
  const response = await fetch(program.provider.connection.rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getAssetsByOwner',
      id: '',
      params: {
        page: 1,
        limit: 1000,
        displayOptions: {
          showZeroBalance: true,
          showUnverifiedCollections: true,
          showFungible: true,
        },
        ownerAddress: address,
      },
    }),
  });
  const data = (await response.json()).result as DAS.GetAssetResponseList;

  return data;
}

async function filterTokenBalances(
  mints: string[],
  tokenBalances: DAS.GetAssetResponseList
) {
  const filteredTokenBalances = tokenBalances.items.filter(
    (x) =>
      x.interface == 'FungibleToken' &&
      x.token_info?.balance &&
      x.token_info?.balance > 0 &&
      mints.includes(x.id)
  );

  return { filteredTokenBalances };
}

export const ClaimButton: FC = () => {
  const { publicKey } = useWallet();
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allMints, setAllMints] = useState<
    {
      collectionMint: string;
      memberMint: string;
      price: number;
      supply: number;
    }[]
  >([]);
  const [filteredTokenBalances, setFilteredTokenBalances] = useState<
    DAS.GetAssetResponse[]
  >([]);
  const { data: tokenBalances } = useGetAssetByOwner({
    address: publicKey,
  });
  useEffect(() => {
    if (publicKey && tokenBalances && dislikes) {
      filterTokenBalances(dislikes, tokenBalances).then((result) =>
        setFilteredTokenBalances(result.filteredTokenBalances)
      );
    }
  }, [dislikes, publicKey, tokenBalances]);

  useEffect(() => {
    getDoc(doc(db, `Summary/mints`)).then((result) => {
      const data = result.data() as {
        allTokenPrices: {
          collectionMint: string;
          memberMint: string;
          price: number;
          supply: number;
        }[];
      };
      setAllMints(data.allTokenPrices);
    });
  }, []);
  useEffect(() => {
    if (publicKey && allMints) {
      try {
        const q = query(
          collection(db, `Admin/${publicKey.toBase58()}/Dislikes`),
          where('timestamp', '>=', Date.now() / 1000 - 24 * 60 * 60)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const result = snapshot.docs.map(
            (x) =>
              allMints.find((y) => y.collectionMint == x.data().mint)
                ?.memberMint || ''
          );
          setDislikes(Array.from(new Set(result.filter((x) => !!x))));
        });
        return () => unsubscribe();
      } catch (e) {
        console.log(e);
      }
    }
  }, [publicKey, allMints]);

  const sellMutation = useMultipleSellMutation();
  const handleConvert = async () => {
    if (!publicKey) return;
    const sellIxs = await Promise.all(
      filteredTokenBalances
        .filter((x) => !!x.token_info?.balance)
        .map((x) => ({
          mint: x.id,
          amount: Math.round(x.token_info?.balance || 0) * 0.1, //sell 10%
        }))
    );
    await sellMutation.mutateAsync(sellIxs);
  };
  return (
    <div className="indicator group">
      {filteredTokenBalances.length > 0 && (
        <span className="indicator-item badge badge-xs badge-primary group-hover:badge-success group-hover:bg-transparent">
          $$
        </span>
      )}
      <button
        onClick={() => {
          if (publicKey) {
            (
              document.getElementById('claim')! as HTMLDialogElement
            ).showModal();
          }
        }}
        className="btn btn-xs btn-outline border-none group-hover:text-success group-hover:bg-transparent"
      >
        <IconBellFilled />
      </button>
      <dialog id="claim" className="modal modal-middle">
        <div
          onClick={() =>
            (document.getElementById('claim')! as HTMLDialogElement).close()
          }
          className="modal-backdrop"
        />
        <div className="modal-box border flex flex-col gap-4 animate-fade-up animate-once animate-duration-500 animate-ease-out border-base-300">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Convert Airdrops to SOL</h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
          </div>
          {filteredTokenBalances.length == 0 && (
            <div>No airdrops to convert...</div>
          )}
          <div className="overflow-y-scroll gap-2 flex flex-col scrollbar-none">
            {filteredTokenBalances.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Image
                    className={`rounded-full object-cover`}
                    width={32}
                    height={32}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    src={proxify(x.content?.links?.image || '', true)}
                    alt={''}
                  />

                  <span className="text-sm text-error">
                    {x.content?.metadata.name}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-error">{`- ${formatLargeNumber(
                    (x.token_info?.balance || 0) /
                      (10 * 10 ** (x.token_info?.decimals || 0))
                  )}`}</span>
                  <span className="stat-desc">
                    {`~ $${formatLargeNumber(
                      ((x.token_info?.balance || 0) /
                        (10 * 10 ** (x.token_info?.decimals || 0))) *
                        (allMints.find((y) => y.memberMint == x.id)?.price || 0)
                    )}`}
                  </span>
                </div>
              </div>
            ))}
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
