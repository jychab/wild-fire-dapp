'use client';

import { TransactionType } from '@/utils/enums/transactions';
import { formatLargeNumber, getDDMMYYYY } from '@/utils/helper/format';
import { getDerivedMint } from '@/utils/helper/mint';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import { useGetTransactions } from './transactions-data-access';

export const TransactionsTable: FC = () => {
  const { publicKey } = useWallet();
  const { data: transactions, isLoading } = useGetTransactions({
    mint: publicKey ? getDerivedMint(publicKey) : null,
  });
  return isLoading ? (
    <div className="flex w-full h-full items-center justify-center">
      <div className="loading loading-dots" />
    </div>
  ) : (
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
                <td>{getDDMMYYYY(new Date(x.updatedAt * 1000))}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
