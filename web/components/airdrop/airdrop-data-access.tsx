'use client';
import { SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import {
  deleteCampaign,
  retrievePayer,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { Campaign } from '@/utils/types/campaigns';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export function useGetCampaigns({ address }: { address: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-campaigns', { address }],
    queryFn: async () => {
      if (!address) return null;
      const docData = await getDocs(
        collection(db, `Admin/${address.toBase58()}/Campaigns`)
      );
      return docData.docs.map((x) => x.data() as Campaign);
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useStopCampaign({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'remove-mint-content',
      {
        endpoint: connection.rpcEndpoint,
        address,
      },
    ],
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      if (!address || !id || !wallet.publicKey || !wallet.signTransaction)
        return;
      let signature: TransactionSignature = '';
      try {
        const { partialTx } = await withdrawFromCampaign(id, amount);
        const partialSignedTx = VersionedTransaction.deserialize(
          Buffer.from(partialTx, 'base64')
        );
        signature = await buildAndSendTransaction({
          connection,
          publicKey: wallet.publicKey,
          partialSignedTx,
          signTransaction: wallet.signTransaction,
        });
        await deleteCampaign(id);
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
            queryKey: ['get-campaigns', { address: wallet.publicKey! }],
          }),
          client.invalidateQueries({
            queryKey: ['get-transactions', { address: wallet.publicKey! }],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export function useTopUpWallet({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'top-up-wallet',
      {
        endpoint: connection.rpcEndpoint,
        address,
      },
    ],
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!address || !wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        let ix = SystemProgram.transfer({
          toPubkey: address,
          fromPubkey: wallet.publicKey,
          lamports: amount,
        });
        signature = await buildAndSendTransaction({
          connection,
          publicKey: wallet.publicKey,
          ixs: [ix],
          signTransaction: wallet.signTransaction,
        });
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
            queryKey: [
              'get-account-info',
              { endpoint: connection.rpcEndpoint, address },
            ],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export function useGetPayer({ address }: { address: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-in-app-payer', { address }],
    queryFn: async () => {
      if (!address) return null;
      try {
        const payer = await retrievePayer();
        const keypair = Keypair.fromSecretKey(Buffer.from(payer, 'base64'));
        return {
          publicKey: keypair.publicKey.toBase58(),
          privatekey: payer,
        };
      } catch (e) {
        return null;
      }
    },
    staleTime: Infinity,
    enabled: !!address,
  });
}
