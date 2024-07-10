'use client';

import {
  getDistributor,
  uploadMedia,
  uploadMetadata,
} from '@/utils/firebase/functions';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  initializePool,
  issueMint,
  program,
} from '../../utils/helper/transcationInstructions';
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
      let signature: TransactionSignature = '';
      try {
        const [mint] = PublicKey.findProgramAddressSync(
          [Buffer.from('mint'), wallet.publicKey!.toBuffer()],
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

        let ix = await createMint(
          connection,
          new PublicKey(distributor),
          input.transferFee,
          input.maxTransferFee,
          wallet.publicKey!
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
            wallet.publicKey!
          )
        );
        ix.push(
          await issueMint(connection, LAMPORTS_PER_SOL, mint, wallet.publicKey!)
        );
        if (input.liquidityPoolSettings) {
          ix = ix.concat(
            await initializePool(
              connection,
              mint,
              wallet.publicKey!,
              input.liquidityPoolSettings.mintAmount,
              input.liquidityPoolSettings.solAmount
            )
          );
        }

        signature = await buildAndSendTransaction(
          connection,
          ix,
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
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}
