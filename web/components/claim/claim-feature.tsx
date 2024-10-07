import { db } from '@/utils/firebase/firebase';
import { formatLargeNumber } from '@/utils/helper/format';
import { program } from '@/utils/program/instructions';
import { DAS } from '@/utils/types/das';
import { IconBellDollar } from '@tabler/icons-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
  collectionMints: string[],
  tokenBalances: DAS.GetAssetResponseList
) {
  const filteredTokenBalances = tokenBalances.items.filter(
    (x) =>
      x.interface == 'FungibleToken' &&
      x.token_info?.balance &&
      x.token_info?.balance > 0 &&
      collectionMints.includes(
        x.grouping?.find((x) => x.group_key == 'collection')?.group_value || ''
      )
  );

  return { filteredTokenBalances };
}

export const ClaimButton: FC = () => {
  const { publicKey } = useWallet();
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [filteredTokenBalances, setFilteredTokenBalances] = useState<
    DAS.GetAssetResponse[]
  >([]);
  const { data: tokenBalances } = useGetAssetByOwner({
    address: publicKey,
  });
  useEffect(() => {
    if (publicKey && tokenBalances) {
      filterTokenBalances(dislikes, tokenBalances).then((result) =>
        setFilteredTokenBalances(result.filteredTokenBalances)
      );
    }
  }, [dislikes, publicKey, tokenBalances]);
  useEffect(() => {
    if (publicKey) {
      try {
        const q = query(
          collection(db, `Admin/${publicKey.toBase58()}/Dislikes`),
          where('timestamp', '>=', Date.now() / 1000 - 24 * 60 * 60)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          setDislikes(snapshot.docs.map((x) => x.data().mint));
        });
        return () => unsubscribe();
      } catch (e) {
        console.log(e);
      }
    }
  }, [publicKey]);

  const sellMutation = useMultipleSellMutation();
  const handleConvert = async () => {
    if (!publicKey) return;
    const sellIxs = await Promise.all(
      filteredTokenBalances
        .filter((x) => !!x.token_info?.balance)
        .map((x) => ({
          mint: x.id,
          amount: x.token_info?.balance || 0,
        }))
    );
    await sellMutation.mutateAsync(sellIxs);
  };
  return (
    <div className="indicator group">
      {filteredTokenBalances.length > 0 && (
        <span className="indicator-item badge badge-xs badge-primary group-hover:badge-success">
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
        className="btn btn-xs group-hover:text-success"
      >
        <IconBellDollar />
      </button>
      <dialog id="claim" className="modal modal-middle">
        <div
          onClick={() =>
            (document.getElementById('claim')! as HTMLDialogElement).close()
          }
          className="modal-backdrop"
        />
        <div className="modal-box border flex flex-col gap-4 animate-fade-up animate-once animate-duration-500 animate-ease-out">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Convert Airdrops to SOL</h3>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
          </div>
          {filteredTokenBalances.length == 0 && (
            <div>No airdrops to convert...</div>
          )}
          <div className="overflow-y-scroll scrollbar-none">
            {filteredTokenBalances.map((x) => (
              <div
                key={x.id}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-1">
                  <Image
                    className={`rounded-full object-cover`}
                    width={32}
                    height={32}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    src={x.content?.links?.image || ''}
                    alt={''}
                  />
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-error">
                      {x.content?.metadata.name}
                    </span>
                  </div>
                </div>
                <span className="text-error">{`- ${formatLargeNumber(
                  (x.token_info?.balance || 0) /
                    10 ** (x.token_info?.decimals || 0)
                )}`}</span>
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
