'use client';
import { SHORT_STALE_TIME } from '@/utils/consts';
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
  SystemProgram,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';
import { TempCampaign } from './airdrop-ui';

export function useCreateOrEditCampaign({
  address,
  payer,
}: {
  address: PublicKey | null;
  payer: PublicKey | null;
}) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [
      'create-campaign',
      {
        address,
        payer,
      },
    ],
    mutationFn: async (input: Partial<TempCampaign>) => {
      if (
        !wallet.publicKey ||
        !wallet.signTransaction ||
        !input.budget ||
        !input.amount ||
        !address ||
        !payer
      )
        return;
      let signature: TransactionSignature = '';

      const ixs = [];
      try {
        if (input.topUp && input.topUp > 0) {
          ixs.push(
            SystemProgram.transfer({
              toPubkey: payer,
              fromPubkey: wallet.publicKey,
              lamports: input.topUp,
            })
          );
        }
        if (input.mintToSend && input.difference && input.difference > 0) {
          // check if payer has enough sol
          // calculate amount of sol needed to airdrop subscribers

          const source = getAssociatedTokenAddressSync(
            new PublicKey(input.mintToSend),
            wallet.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          const destination = getAssociatedTokenAddressSync(
            new PublicKey(input.mintToSend),
            getAssociatedTokenStateAccount(new PublicKey(input.mintToSend)),
            true,
            TOKEN_2022_PROGRAM_ID
          );
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
                getAssociatedTokenStateAccount(new PublicKey(input.mintToSend)),
                new PublicKey(input.mintToSend),
                TOKEN_2022_PROGRAM_ID
              )
            );
          }
          ixs.push(
            createTransferCheckedInstruction(
              source,
              new PublicKey(input.mintToSend),
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
        } else if (input.id && input.difference && input.difference < 0) {
          const { partialTx } = await withdrawFromCampaign(
            input.id,
            input.difference * -1
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
        if (input.difference != undefined) {
          delete input.difference;
        }
        await createOrEditCampaign(input);
        return { signature };
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
          client.invalidateQueries({
            queryKey: ['get-campaigns', { address: wallet.publicKey! }],
          }),
          client.invalidateQueries({
            queryKey: ['get-transactions', { address: wallet.publicKey! }],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-account-info',
              { endpoint: connection.rpcEndpoint, address: payer },
            ],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}

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
        (
          document.getElementById('campaign_modal') as HTMLDialogElement
        ).close();
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
