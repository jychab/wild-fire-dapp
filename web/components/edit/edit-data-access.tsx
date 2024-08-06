'use client';

import { LONG_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { proxify } from '@/utils/helper/proxy';
import { TokenState } from '@/utils/types/program';
import { getTokenMetadata } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getSponsoredUpdateMetadata,
  uploadMedia,
  uploadMetadata,
} from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  closeAuthorityAccount,
  getAdditionalRentForUpdatedMetadata,
  program,
  updateMetadata,
} from '../../utils/helper/transcationInstructions';
import { useTransactionToast } from '../ui/ui-layout';

interface EditMintArgs {
  name: string;
  symbol: string;
  picture: File | null;
  description: string;
  // fee: number;
  // admin: PublicKey;
  previous: {
    distributor: string;
    // transferFeeBasisPoints: number;
    // admin: PublicKey;
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
        const ix = await closeAuthorityAccount(wallet.publicKey, mint);

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
      let partialTx;
      try {
        // if (input.previous.admin.toString() != input.admin.toString()) {
        //   ixs.push(await changeAdmin(wallet.publicKey, mint, input.admin));
        // }
        // if (input.previous.transferFeeBasisPoints != input.fee) {
        //   ixs.push(
        //     await changeTransferFee(
        //       wallet.publicKey,
        //       mint,
        //       input.fee,
        //       Number.MAX_SAFE_INTEGER
        //     )
        //   );
        // }
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
          const uri = await uploadMetadata(JSON.stringify(payload), mint);
          fieldsToUpdate.push(['uri', uri]);
        }
        if (fieldsToUpdate.length > 0) {
          if (ixs.length == 0) {
            const distributor = await connection.getAccountInfo(
              new PublicKey(input.previous.distributor)
            );
            if (
              distributor &&
              distributor.lamports > 0.0001 * LAMPORTS_PER_SOL
            ) {
              partialTx = await getSponsoredUpdateMetadata(
                mint.toBase58(),
                fieldsToUpdate
              );
            }
          }
          if (!partialTx) {
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
                await updateMetadata(wallet.publicKey, mint, x[0], x[1])
              );
            }
          }
        }

        if (partialTx) {
          const partialSignedTx = VersionedTransaction.deserialize(
            Buffer.from(partialTx, 'base64')
          );
          signature = await buildAndSendTransaction({
            connection,
            partialSignedTx,
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
          });
          return signature;
        } else if (ixs.length > 0) {
          signature = await buildAndSendTransaction({
            connection,
            ixs,
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction,
          });

          return signature;
        }
        return 'Success';
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        router.push(`/profile?mintId=${mint?.toBase58()}`);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
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

export function useGetMintToken({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-mint-token', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      const result = await connection.getProgramAccounts(program.programId, {
        filters: [
          {
            dataSize: 123,
          },
          {
            memcmp: {
              offset: 40,
              bytes: mint.toBase58(),
            },
          },
        ],
      });
      if (result.length > 0) {
        const tokenState: TokenState = program.coder.accounts.decode(
          'tokenState',
          result[0].account.data
        );
        return tokenState;
      } else {
        const mintData = await getDoc(doc(db, `Mint/${mint.toBase58()}`));
        if (!mintData.exists) {
          return null;
        } else {
          return {
            mint: mintData.data()!.mint,
            admin: mintData.data()!.admin,
            mutable: 0,
          } as TokenState;
        }
      }
    },
    staleTime: LONG_STALE_TIME,
    enabled: !!mint,
  });
}
