'use client';

import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  updateMetadataSponsored,
  uploadMedia,
  uploadMetadata,
} from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  changeAdmin,
  changeTransferFee,
  closeFeeAccount,
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
    metaData: TokenMetadata;
    image: string;
    description: string | undefined;
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
        const ix = await closeFeeAccount(connection, wallet.publicKey, mint);

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

      let ixs: TransactionInstruction[] = [];
      let tx;
      try {
        if (!wallet.publicKey || !mint || !wallet.signTransaction) return;
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
        let fieldsToUpdate = new Map<string, string>();
        if (input.previous.metaData.name !== input.name) {
          fieldsToUpdate.set('name', input.name);
        }
        if (input.previous.metaData.symbol !== input.symbol) {
          fieldsToUpdate.set('symbol', input.symbol);
        }
        if (
          input.picture ||
          input.description != input.previous.description ||
          fieldsToUpdate.size != 0
        ) {
          let imageUrl;
          if (input.picture) {
            toast('Uploading image metadata...');
            imageUrl = await uploadMedia(input.picture, mint);
          }
          toast('Uploading text metadata...');
          const payload = {
            name: input.name,
            symbol: input.symbol,
            description: input.description,
            image: imageUrl ? imageUrl : input.previous.image,
          };
          const uri = await uploadMetadata(JSON.stringify(payload), mint);
          fieldsToUpdate.set('uri', uri);

          if (ixs.length == 0) {
            const partialTx = await updateMetadataSponsored(
              mint.toBase58(),
              fieldsToUpdate
            );
            if (partialTx) {
              tx = VersionedTransaction.deserialize(
                Buffer.from(partialTx, 'base64')
              );
            }
          }
          if (!tx) {
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
        }

        if (!tx && ixs.length == 0) return;
        signature = await buildAndSendTransaction({
          connection,
          ixs,
          partialSignedTx: tx,
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
              'authority',
              result[0].account.data
            ) as AuthorityData;
          } else {
            return null;
          }
        }),
  });
}
