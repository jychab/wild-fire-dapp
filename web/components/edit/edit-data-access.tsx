'use client';

import { proxify } from '@/utils/helper/proxy';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { uploadMedia, uploadMetadata } from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  changeAdmin,
  changeTransferFee,
  closeAuthorityAccount,
  getAdditionalRentForUpdatedMetadata,
  program,
  updateMetadata,
} from '../../utils/helper/transcationInstructions';
import { AuthorityData } from '../dashboard/dashboard-ui';
import { useTransactionToast } from '../ui/ui-layout';

interface EditMintArgs {
  name: string;
  symbol: string;
  picture: File | null;
  description: string;
  fee: number;
  maxFee: number | undefined;
  admin: PublicKey;
  previous: {
    maximumFee: bigint;
    transferFeeBasisPoints: number;
    admin: PublicKey;
  };
}

export function useCloseAccount({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'close-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async () => {
      let signature: TransactionSignature = '';
      try {
        if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
        const ix = await closeAuthorityAccount(
          connection,
          wallet.publicKey,
          mint
        );

        signature = await buildAndSendTransaction({
          connection,
          ixs: [ix],
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });

        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
          client.refetchQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint, skipCache: true },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-token',
              { endpoint: connection.rpcEndpoint, address: wallet.publicKey },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-mint-transfer-fee-config',
              { endpoint: connection.rpcEndpoint, mint },
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

export function useEditData({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: [
      'edit-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: EditMintArgs) => {
      if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      let ixs: TransactionInstruction[] = [];
      try {
        if (input.previous.admin.toString() != input.admin.toString()) {
          ixs.push(
            await changeAdmin(connection, wallet.publicKey, mint, input.admin)
          );
        }
        if (
          input.previous.transferFeeBasisPoints != input.fee ||
          Number(input.previous.maximumFee) !=
            (input.maxFee ? input.maxFee : Number.MAX_SAFE_INTEGER)
        ) {
          ixs.push(
            await changeTransferFee(
              connection,
              wallet.publicKey,
              mint,
              input.fee,
              input.maxFee ? input.maxFee : Number.MAX_SAFE_INTEGER
            )
          );
        }
        const details = await getTokenMetadata(connection, mint);
        if (!details) return;
        const uriMetadata = await (
          await fetch(proxify(details.uri, true))
        ).json();
        let fieldsToUpdate: [string, string][] = [];
        if (uriMetadata.name !== input.name) {
          fieldsToUpdate.push(['name', input.name]);
        }
        if (uriMetadata.symbol !== input.symbol) {
          fieldsToUpdate.push(['symbol', input.symbol]);
        }
        if (
          input.picture ||
          input.description != uriMetadata.description ||
          fieldsToUpdate.length != 0
        ) {
          let imageUrl;
          if (input.picture) {
            imageUrl = await uploadMedia(input.picture, mint);
          }
          const payload = {
            ...uriMetadata,
            name: input.name,
            symbol: input.symbol,
            description: input.description,
            image: imageUrl ? imageUrl : uriMetadata.image,
          };
          const uri = await uploadMetadata(
            JSON.stringify(payload),
            mint,
            crypto.randomUUID()
          );
          fieldsToUpdate.push(['uri', uri]);

          const lamports = await getAdditionalRentForUpdatedMetadata(
            connection,
            mint,
            fieldsToUpdate
          );
          if (lamports > 0) {
            ixs.push(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mint,
                lamports: lamports,
              })
            );
          }
          for (let x of fieldsToUpdate) {
            ixs.push(
              await updateMetadata(
                connection,
                wallet.publicKey,
                mint,
                x[0],
                x[1]
              )
            );
          }
        }

        if (ixs.length == 0) return;
        signature = await buildAndSendTransaction({
          connection,
          ixs,
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });

        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        router.push(`/dashboard?mintId=${mint?.toBase58()}`);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
          client.refetchQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint, skipCache: true },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-token',
              { endpoint: connection.rpcEndpoint, address: wallet.publicKey },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-mint-transfer-fee-config',
              { endpoint: connection.rpcEndpoint, mint },
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

export function useGetMintToken({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-mint-token', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: () =>
      connection
        .getProgramAccounts(program(connection).programId, {
          filters: [
            {
              dataSize: 112,
            },
            {
              memcmp: {
                offset: 16,
                bytes: mint.toBase58(),
              },
            },
          ],
        })
        .then((result) => {
          if (result.length > 0) {
            return program(connection).coder.accounts.decode(
              'authority',
              result[0].account.data
            ) as AuthorityData;
          } else {
            return null;
          }
        }),
  });
}
