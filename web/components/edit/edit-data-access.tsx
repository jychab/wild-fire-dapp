'use client';

import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uploadImage, uploadMetadata } from '../create/create-data-access';
import { AuthorityData } from '../dashboard/dashboard-ui';
import {
  changeAdmin,
  changeTransferFee,
  closeFeeAccount,
  program,
  setToImmutable,
  updateMetadata,
} from '../program/instructions';
import { useTransactionToast } from '../ui/ui-layout';
import { buildAndSendTransaction } from '../utils/transactionBuilder';

interface EditMintArgs {
  name: string;
  symbol: string;
  picture: File | null;
  description: string;
  fee: number;
  maxFee: number | undefined;
  immutable: boolean;
  admin: PublicKey;
  previous: {
    maximumFee: bigint;
    transferFeeBasisPoints: number;
    admin: PublicKey;
    metaData: TokenMetadata;
    image: string;
    description: string;
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
        if (!wallet.publicKey || !mint) return;
        const ix = await closeFeeAccount(connection, wallet.publicKey, mint);

        signature = await buildAndSendTransaction(
          connection,
          [ix],
          wallet.publicKey!,
          wallet.signTransaction!,
          'confirmed'
        );

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
              'get-mint-metadata',
              { endpoint: connection.rpcEndpoint, mint },
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

  return useMutation({
    mutationKey: [
      'edit-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (input: EditMintArgs) => {
      let signature: TransactionSignature = '';
      try {
        if (!wallet.publicKey || !mint) return;
        let fieldsToUpdate = new Map<string, string>();
        if (input.previous.metaData.name !== input.name) {
          fieldsToUpdate.set('name', input.name);
        }
        if (input.previous.metaData.symbol !== input.symbol) {
          fieldsToUpdate.set('symbol', input.symbol);
        }

        let tx: TransactionInstruction[] = [];
        if (
          input.picture ||
          input.description != input.previous.description ||
          fieldsToUpdate.size != 0
        ) {
          let imageUrl;
          if (input.picture) {
            toast('Uploading image metadata...');
            imageUrl = await uploadImage(input.picture, mint);
          }

          toast('Uploading text metadata...');
          const uri = await uploadMetadata(
            input.name,
            input.symbol,
            input.description,
            imageUrl ? imageUrl : input.previous.image,
            mint
          );

          fieldsToUpdate.set('uri', uri);

          toast('Editing Mint...');

          fieldsToUpdate.forEach(async (value, key) => {
            tx.push(
              await updateMetadata(
                connection,
                wallet.publicKey!,
                mint,
                key,
                value
              )
            );
          });
        }
        if (input.previous.admin.toString() != input.admin.toString()) {
          tx.push(
            await changeAdmin(connection, wallet.publicKey, mint, input.admin)
          );
        }

        if (
          input.previous.transferFeeBasisPoints != input.fee ||
          Number(input.previous.maximumFee) != input.maxFee
        ) {
          tx.push(
            await changeTransferFee(
              connection,
              wallet.publicKey,
              mint,
              input.fee,
              input.maxFee ? input.maxFee : Number.MAX_SAFE_INTEGER
            )
          );
        }
        if (input.immutable) {
          tx.push(await setToImmutable(connection, wallet.publicKey, mint));
        }
        if (tx.length == 0) return;
        signature = await buildAndSendTransaction(
          connection,
          tx,
          wallet.publicKey!,
          wallet.signTransaction!,
          'confirmed'
        );

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
              'get-mint-metadata',
              { endpoint: connection.rpcEndpoint, mint },
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
              dataSize: 120,
            },
            {
              memcmp: {
                offset: 24,
                bytes: mint.toBase58(),
              },
            },
          ],
        })
        .then((result) => {
          if (result.length > 0) {
            return program(connection).coder.accounts.decode(
              'Authority',
              result[0].account.data
            ) as AuthorityData;
          } else {
            return null;
          }
        }),
  });
}
