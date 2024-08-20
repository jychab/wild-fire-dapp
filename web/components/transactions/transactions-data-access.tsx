'use client';
import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { Transaction } from '@/utils/types/transactions';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';

export function useGetTransactions({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-transactions', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const docData = await getDocs(
        collection(db, `Mint/${mint.toBase58()}/Transactions`)
      );
      return docData.docs.map((x) => x.data() as Transaction);
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}
