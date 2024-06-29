'use client';

import { WebIrys } from '@irys/sdk';
import { ExtensionType, getMintLen } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createMint,
  createMintMetadata,
  issueMint,
} from '../program/instructions';
import { buildAndSendTransaction } from '../program/utils/transactionBuilder';
import { useTransactionToast } from '../ui/ui-layout';

interface CreateMintArgs {
  name: string;
  symbol: string;
  picture: File;
  description: string;
  transferFee: number;
  maxTransferFee?: number;
  distributor: PublicKey;
  authority: PublicKey;
  totalSupply: number;
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
        const webIrys = new WebIrys({
          network: 'mainnet',
          token: 'solana',
          wallet: {
            rpcUrl: connection.rpcEndpoint,
            name: 'solana',
            provider: wallet,
          },
        });
        await webIrys.ready();
        toast('Checking if there is sufficient funds to upload metadata...');
        const balance = (
          await webIrys.getBalance(wallet.publicKey!.toBase58())
        ).toNumber();
        const price =
          (await webIrys.getPrice(input.picture.size)).toNumber() + 10000; // 10000 if the estimated number of bytes for description + imageurl
        if (balance < price) {
          toast(
            'Insufficient funds, topping up required. This might take awhile please wait...'
          );
          await webIrys.fund(price);
        }
        toast('Uploading image metadata...');
        const imageUrl = await uploadImage(webIrys, input.picture);
        toast('Uploading text metadata...');
        const uri = await uploadMetadata(
          webIrys,
          input.name,
          input.symbol,
          input.description,
          imageUrl
        );
        toast('Creating Mint...');
        const mintKeypair = Keypair.generate();
        const mint = mintKeypair.publicKey;
        const mintLen = getMintLen([
          ExtensionType.TransferFeeConfig,
          ExtensionType.MetadataPointer,
        ]);

        let ix = await createMint(
          connection,
          mintKeypair,
          mint,
          mintLen,
          input.distributor,
          input.transferFee,
          input.maxTransferFee,
          input.authority,
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
          await issueMint(
            connection,
            input.totalSupply,
            mint,
            wallet.publicKey!
          )
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
  webIrys: WebIrys,
  name: string,
  symbol: string,
  description: string,
  image: string
) {
  const payload = {
    name,
    symbol,
    description,
    image,
  };

  const receipt = await webIrys.upload(JSON.stringify(payload));
  return `https://gateway.irys.xyz/${receipt.id}`;
}

export async function uploadImage(webIrys: WebIrys, picture: File) {
  const receipt = await webIrys.uploadFile(picture);
  return `https://gateway.irys.xyz/${receipt.id}`;
}
