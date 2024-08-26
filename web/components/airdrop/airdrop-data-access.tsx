'use client';
import { LONG_STALE_TIME } from '@/utils/consts';
import { Criteria, Eligibility } from '@/utils/enums/campaign';
import { db } from '@/utils/firebase/firebase';
import {
  createOrEditCampaign,
  deleteCampaign,
  withdrawFromCampaign,
} from '@/utils/firebase/functions';
import { getAssociatedTokenStateAccount } from '@/utils/helper/mint';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { Campaign } from '@/utils/types/campaigns';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

interface CreateOrEditCampaignArgs {
  id: number | null;
  name: string;
  allocatedBudget: number;
  tokensRemaining: number;
  amount: number;
  criteria: Criteria;
  eligibility: Eligibility;
  startDate: number;
  endDate?: number;
  difference?: number;
}

export function useCreateOrEditCampaign({
  mint,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  mint: PublicKey | null;
  tokenProgram?: PublicKey;
}) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [
      'create-campaign',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: CreateOrEditCampaignArgs) => {
      if (
        !mint ||
        !tokenProgram ||
        !wallet.publicKey ||
        !wallet.signTransaction ||
        !input.allocatedBudget ||
        !input.amount ||
        !input.id
      )
        return;
      let signature: TransactionSignature = '';
      try {
        console.log(input);
        if (input.difference && input.difference > 0) {
          const source = getAssociatedTokenAddressSync(
            mint,
            wallet.publicKey,
            false,
            tokenProgram
          );
          const destination = getAssociatedTokenAddressSync(
            mint,
            getAssociatedTokenStateAccount(mint),
            true,
            tokenProgram
          );
          const ixs = [];
          try {
            await getAccount(
              connection,
              destination,
              undefined,
              TOKEN_2022_PROGRAM_ID
            );
          } catch (e) {
            ixs.push(
              createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey,
                destination,
                getAssociatedTokenStateAccount(mint),
                mint,
                TOKEN_2022_PROGRAM_ID
              )
            );
          }
          ixs.push(
            createTransferCheckedInstruction(
              source,
              mint,
              destination,
              wallet.publicKey,
              input.difference,
              0,
              undefined,
              TOKEN_2022_PROGRAM_ID
            )
          );
          signature = await buildAndSendTransaction({
            connection,
            ixs,
            signTransaction: wallet.signTransaction,
            publicKey: wallet.publicKey,
          });
        } else if (input.difference && input.difference < 0) {
          const { partialTx } = await withdrawFromCampaign(
            input.id,
            input.difference
          );
          const partialSignedTx = VersionedTransaction.deserialize(
            Buffer.from(partialTx, 'base64')
          );
          signature = await buildAndSendTransaction({
            connection,
            publicKey: wallet.publicKey,
            partialSignedTx,
            signTransaction: wallet.signTransaction,
          });
        }
        await createOrEditCampaign(
          input.id ? input.id : Math.floor(Math.random() * 65536),
          input.name,
          input.allocatedBudget,
          input.tokensRemaining,
          input.amount,
          input.criteria,
          input.eligibility,
          input.startDate,
          input.endDate
        );
        return { signature, mint };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        transactionToast(result.signature || 'Success');
        (
          document.getElementById('campaign_modal') as HTMLDialogElement
        ).close();
        return await Promise.all([
          client.invalidateQueries({ queryKey: ['get-campaigns', { mint }] }),
          client.invalidateQueries({
            queryKey: ['get-transactions', { mint }],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}

export function useGetCampaigns({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-campaigns', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const docData = await getDocs(
        collection(db, `Mint/${mint.toBase58()}/Campaigns`)
      );
      return docData.docs.map((x) => x.data() as Campaign);
    },
    enabled: !!mint,
    staleTime: LONG_STALE_TIME,
  });
}

export function useStopCampaign({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'remove-mint-content',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      if (!mint || !id || !wallet.publicKey || !wallet.signTransaction) return;
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
        (
          document.getElementById('campaign_modal') as HTMLDialogElement
        ).close();
        return await Promise.all([
          client.invalidateQueries({ queryKey: ['get-campaigns', { mint }] }),
          client.invalidateQueries({
            queryKey: ['get-transactions', { mint }],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}
