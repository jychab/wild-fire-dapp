'use client';

import { ExtensionType, getMintLen } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getDistributor,
  uploadImage,
  uploadMetadata,
} from '../../utils/firebase/functions';
import { buildAndSendTransaction } from '../../utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  issueMint,
} from '../../utils/helper/transcationInstructions';
import { useTransactionToast } from '../ui/ui-layout';

interface CreateMintArgs {
  name: string;
  symbol: string;
  picture: File;
  description: string;
  transferFee: number;
  maxTransferFee?: number;
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
        const mintKeypair = Keypair.generate();
        const mint = mintKeypair.publicKey;
        const distributor = await getDistributor(mint.toBase58());
        toast('Uploading image metadata...');
        const imageUrl = await uploadImage(input.picture, mint);
        toast('Uploading text metadata...');
        const payload = {
          name: input.name,
          symbol: input.symbol,
          description: input.description,
          image: imageUrl,
        };
        const uri = await uploadMetadata(JSON.stringify(payload), mint);
        const mintLen = getMintLen([
          ExtensionType.TransferFeeConfig,
          ExtensionType.MetadataPointer,
        ]);
        let ix = await createMint(
          connection,
          mintKeypair,
          mint,
          mintLen,
          new PublicKey(distributor),
          input.transferFee,
          input.maxTransferFee,
          wallet.publicKey!,
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
          await issueMint(connection, 1000000000, mint, wallet.publicKey!)
        );

        signature = await buildAndSendTransaction(
          connection,
          ix,
          wallet.publicKey!,
          wallet.signTransaction!,
          'confirmed',
          [mintKeypair]
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
