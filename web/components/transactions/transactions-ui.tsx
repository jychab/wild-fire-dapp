'use client';

import { TransactionType } from '@/utils/enums/transactions';
import { formatLargeNumber, getTimeAgo } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useState } from 'react';
import { useGetTransactions } from './transactions-data-access';

export const TransactionsTable: FC = () => {
  const { publicKey } = useWallet();
  const [startAt, setStartAt] = useState<number | null>(null);
  const [startAfter, setStartAfter] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [currentTop, setCurrentTop] = useState<number[]>([]);
  const { data: transactions, isLoading } = useGetTransactions({
    mint: publicKey ? getDerivedMint(publicKey) : null,
    params:
      startAt || startAfter
        ? { startAfter: startAfter, startAt: startAt, showPendingOnly: false }
        : null,
  });

  return isLoading ? (
    <div className="flex w-full h-full items-center justify-center">
      <div className="loading loading-dots" />
    </div>
  ) : (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Event</th>
              <th>Amount</th>
              <th>Destination</th>
              <th>Pending</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              ?.sort((a, b) => b.updatedAt - a.updatedAt)
              .map((x, index) => (
                <tr className="hover:bg-base-200" key={x.id}>
                  <th>{index + 1}</th>
                  <td>
                    {
                      Object.entries(TransactionType).find(
                        (y) => y[0] == x.event.toString()
                      )?.[1]
                    }
                  </td>
                  <td>{formatLargeNumber(x.amount)}</td>
                  <td>{x.to}</td>
                  <td>{x.pending ? 'Yes' : 'No'}</td>
                  <td>{getTimeAgo(x.updatedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-4">
        <span>{`Page ${page + 1}`}</span>
        <div className="join grid grid-cols-2">
          <button
            onClick={() => {
              if (transactions && currentTop && page > 0) {
                setStartAfter(null);
                setStartAt(currentTop[page - 1]);
                setPage(page - 1);
              }
            }}
            className="join-item btn btn-sm btn-outline"
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (transactions && transactions.length == 20) {
                setStartAt(null);
                setStartAfter(transactions[transactions.length - 1].updatedAt);
                if (page + 1 > currentTop.length) {
                  setCurrentTop((previous) => [
                    ...(previous || []),
                    transactions[0].updatedAt,
                  ]);
                } else {
                  setCurrentTop((previous) => {
                    const updated = [...(previous || [])];
                    updated[page] = transactions[0].updatedAt;
                    return updated;
                  });
                }
                setPage(page + 1);
              }
            }}
            className="join-item btn btn-sm btn-outline"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};
