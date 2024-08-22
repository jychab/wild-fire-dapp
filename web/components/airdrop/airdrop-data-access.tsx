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
  createTransferCheckedInstruction,
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
  amount: number;
  criteria: Criteria;
  eligibility: Eligibility;
  startDate: number;
  duration?: number;
  tokensRemaining?: number;
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
        !input.amount
      )
        return;
      let signature: TransactionSignature = 'Success';
      try {
        if (
          !input.tokensRemaining ||
          input.tokensRemaining < input.allocatedBudget
        ) {
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
          const ix = createTransferCheckedInstruction(
            source,
            mint,
            destination,
            wallet.publicKey,
            input.allocatedBudget - (input.tokensRemaining || 0),
            0,
            undefined,
            tokenProgram
          );
          signature = await buildAndSendTransaction({
            connection,
            ixs: [ix],
            signTransaction: wallet.signTransaction,
            publicKey: wallet.publicKey,
          });
        } else if (input.id && input.tokensRemaining > input.allocatedBudget) {
          const difference = input.tokensRemaining - input.allocatedBudget;
          const { partialTx } = await withdrawFromCampaign(
            input.id,
            difference
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
          input.amount,
          input.criteria,
          input.eligibility,
          input.startDate,
          input.duration
        );
        return { signature, mint };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        transactionToast(result.signature);
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
      let signature: TransactionSignature = 'Success';
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
