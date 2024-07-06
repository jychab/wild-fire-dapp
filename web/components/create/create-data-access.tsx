'use client';

import { ExtensionType, getMintLen } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { ref, uploadBytes, uploadString } from 'firebase/storage';
import toast from 'react-hot-toast';
import { storage } from '../firebase/firebase';
import { getDistributor } from '../firebase/functions';
import {
  createMint,
  createMintMetadata,
  issueMint,
} from '../program/instructions';
import { useTransactionToast } from '../ui/ui-layout';
import { buildAndSendTransaction } from '../utils/transactionBuilder';

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
        const uri = await uploadMetadata(
          input.name,
          input.symbol,
          input.description,
          imageUrl,
          mint
        );
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

export async function uploadMetadata(
  name: string,
  symbol: string,
  description: string,
  image: string,
  mint: PublicKey
) {
  const payload = {
    name,
    symbol,
    description,
    image,
  };
  const path = `${mint.toBase58()}/${crypto.randomUUID()}`;
  const payloadRef = ref(storage, path);
  await uploadString(payloadRef, JSON.stringify(payload), undefined, {
    contentType: 'text/plain',
  });
  return 'https://' + payloadRef.bucket + '/' + path;
}

export async function uploadImage(picture: File, mint: PublicKey) {
  const path = `${mint.toBase58()}/${crypto.randomUUID()}`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, picture);
  return 'https://' + imageRef.bucket + '/' + path;
}
