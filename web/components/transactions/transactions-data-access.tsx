import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { Transaction } from '@/utils/types/transactions';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
} from 'firebase/firestore';

export function useGetTransactions({
  address,
  params,
}: {
  address: PublicKey | null;
  params: {
    startAfter: number | null;
    startAt: number | null;
    showPendingOnly: boolean;
  } | null;
}) {
  return useQuery({
    queryKey: [
      'get-transactions',
      {
        address,
        params,
      },
    ],
    queryFn: async () => {
      if (!address) return null;
      const constraints = [];
      if (params?.showPendingOnly) {
        constraints.push(where('pending', '>', 0));
      }
      constraints.push(orderBy('updatedAt', 'desc'));
      if (params?.startAfter) {
        constraints.push(startAfter(params.startAfter));
      }
      if (params?.startAt) {
        constraints.push(startAt(params.startAt));
      }
      constraints.push(limit(20));
      const queries = query(
        collection(db, `Admin/${address.toBase58()}/Transactions`),
        ...constraints
      );
      const docData = await getDocs(queries);
      return docData.docs.map((x) => x.data() as Transaction);
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
}
