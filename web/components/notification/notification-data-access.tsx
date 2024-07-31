import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { getDailyClaim } from '@/utils/firebase/functions';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export function useGetDailyClaimAvailable({
  mint,
}: {
  mint: PublicKey | null;
}) {
  return useQuery({
    queryKey: ['get-claim-availability', { mint }],
    queryFn: async () => {
      if (!mint) return;
      const result = await getDoc(doc(db, `Mint/${mint.toBase58()}`));
      if (result.exists()) {
        const response = result.data() as {
          lastDailyClaimTimeStamp: number;
        };
        return {
          availability:
            Date.now() / 1000 - 24 * 60 * 60 > response.lastDailyClaimTimeStamp,
          lastClaimTimeStamp: response.lastDailyClaimTimeStamp,
        };
      } else {
        return { availability: false, lastClaimTimeStamp: undefined };
      }
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useClaimDailyMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const { publicKey, signTransaction } = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'claim-daily-bonus',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async () => {
      if (!mint || !publicKey || !signTransaction) return null;
      let signature = '';
      try {
        const partialTx = await getDailyClaim(mint.toBase58());
        if (partialTx) {
          const transaction = VersionedTransaction.deserialize(
            Buffer.from(partialTx, 'base64')
          );
          signature = await buildAndSendTransaction({
            connection: connection,
            publicKey: publicKey,
            signTransaction: signTransaction,
            partialSignedTx: transaction,
          });
        }
        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: async (signature) => {
      if (signature) {
        transactionToast(signature);
        return await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-claim-availability', { mint }],
          }),
          client.refetchQueries({
            queryKey: ['get-claim-availability', { mint }],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}
