'use client';

import {
  getDistributor,
  getDistributorSponsored,
  uploadMedia,
  uploadMetadata,
} from '@/utils/firebase/functions';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  initializePool,
  issueMint,
  program,
} from '@/utils/helper/transcationInstructions';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

interface CreateMintArgs {
  name: string;
  symbol: string;
  picture: File;
  description: string;
  transferFee: number;
  maxTransferFee?: number;
  liquidityPoolSettings?: {
    solAmount: number;
    mintAmount: number;
  };
}

export function useCreateMint({ address }: { address: string | null }) {
  const { connection } = useConnection();
  const router = useRouter();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      'create-mint',
      {
        endpoint: connection.rpcEndpoint,
        address,
      },
    ],
    mutationFn: async (input: CreateMintArgs) => {
      if (!wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        const [mint] = PublicKey.findProgramAddressSync(
          [Buffer.from('mint'), wallet.publicKey.toBuffer()],
          program(connection).programId
        );
        const distributor = await getDistributor(mint.toBase58());
        toast('Uploading image metadata...');
        const imageUrl = await uploadMedia(input.picture, mint);
        toast('Uploading text metadata...');
        const payload = {
          name: input.name,
          symbol: input.symbol,
          description: input.description,
          image: imageUrl,
        };
        const uri = await uploadMetadata(JSON.stringify(payload), mint);
        let ix = [];
        let tx;
        if (input.liquidityPoolSettings) {
          ix.push(
            await createMint(
              connection,
              new PublicKey(distributor),
              input.transferFee,
              input.maxTransferFee,
              wallet.publicKey
            )
          );
          ix.push(
            await createMintMetadata(
              connection,
              {
                name: input.name,
                symbol: input.symbol,
                uri: uri,
                additionalMetadata: [],
                mint: mint,
              },
              wallet.publicKey
            )
          );
          ix.push(
            await issueMint(
              connection,
              LAMPORTS_PER_SOL,
              mint,
              wallet.publicKey
            )
          );
          ix.push(
            ...(await initializePool(
              connection,
              mint,
              wallet.publicKey,
              input.liquidityPoolSettings.mintAmount,
              input.liquidityPoolSettings.solAmount
            ))
          );
          ix.push(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: new PublicKey(distributor),
              lamports: 0.1 * LAMPORTS_PER_SOL,
            })
          );
        } else {
          const metadata: TokenMetadata = {
            name: input.name,
            symbol: input.symbol,
            uri: uri,
            additionalMetadata: [],
            mint: mint,
          };
          const { partialTx, distributor } = await getDistributorSponsored(
            metadata
          );
          // insufficient lamports for fund account
          if (!partialTx) {
            ix.push(
              await createMint(
                connection,
                new PublicKey(distributor),
                input.transferFee,
                input.maxTransferFee,
                wallet.publicKey
              )
            );
            ix.push(
              await createMintMetadata(connection, metadata, wallet.publicKey)
            );
            ix.push(
              await issueMint(
                connection,
                LAMPORTS_PER_SOL,
                mint,
                wallet.publicKey
              )
            );
          } else {
            tx = VersionedTransaction.deserialize(
              Buffer.from(partialTx, 'base64')
            );
          }
        }
        signature = await buildAndSendTransaction({
          connection: connection,
          partialSignedTx: tx,
          ixs: ix,
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });
        return { signature, mint };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: (result) => {
      if (result) {
        transactionToast(result.signature);
        router.push(`/dashboard?mintId=${result.mint.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}
