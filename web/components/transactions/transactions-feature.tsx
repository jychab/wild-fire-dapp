'use client';

import { FC } from 'react';
import { TransactionsTable } from './transactions-ui';

export const TransactionsFeature: FC = () => {
  return (
    <div className="flex flex-col w-full h-full items-center">
      <div className="flex flex-col gap-8 items-center w-full max-w-7xl py-8 h-full">
        <div className="flex flex-col gap-4 items-center justify-center h-40">
          <span className="text-3xl md:text-4xl text-center">
            Transactions History
          </span>
          <span className="text-md md:text-base text-center px-4">
            Review and verify your recent transactions
          </span>
        </div>
        <div className="flex flex-col flex-1 h-full w-full">
          <div className="border-base-200 rounded border h-full">
            <Transactions />
          </div>
        </div>
      </div>
    </div>
  );
};
export const Transactions: FC = () => {
  return (
    <div className="flex flex-col w-full gap-4 p-4">
      <TransactionsTable />
    </div>
  );
};
