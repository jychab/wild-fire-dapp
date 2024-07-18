'use client';

import { ONE_BILLION } from '@/utils/consts';
import {
  getDistributor,
  uploadMedia,
  uploadMetadata,
} from '@/utils/firebase/functions';
import { generateMintApiEndPoint } from '@/utils/helper/proxy';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  createOracle,
  initializeMint,
  program,
} from '@/utils/helper/transcationInstructions';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionSignature,
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

        const distributor = new PublicKey(
          await getDistributor(mint.toBase58())
        );
        const imageUrl = await uploadMedia(input.picture, mint);

        const payload = {
          name: input.name,
          symbol: input.symbol,
          description: input.description,
          image: imageUrl,
        };
        const uri = await uploadMetadata(JSON.stringify(payload), mint);

        const metadata: TokenMetadata = {
          name: input.name,
          symbol: input.symbol,
          uri: uri,
          additionalMetadata: [['hashfeed', generateMintApiEndPoint(mint)]],
          mint: mint,
        };
        // const { partialTx: partialTx } = await getDistributorSponsored(
        //   metadata
        // );
        // if (!partialTx) {
        const ix = [];
        ix.push(
          await createMint(
            connection,
            distributor,
            input.transferFee,
            input.maxTransferFee,
            wallet.publicKey
          )
        );
        ix.push(
          await createMintMetadata(connection, metadata, wallet.publicKey)
        );
        ix.push(
          await initializeMint(
            connection,
            ONE_BILLION,
            LAMPORTS_PER_SOL * 0.001,
            mint,
            wallet.publicKey
          )
        );
        ix.push(await createOracle(connection, mint, wallet.publicKey));
        ix.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: distributor,
            lamports: LAMPORTS_PER_SOL * 0.01,
          })
        );
        signature = await buildAndSendTransaction({
          connection: connection,
          ixs: ix,
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        });
        // } else {
        //   let tx = VersionedTransaction.deserialize(bs58.decode(partialTx));
        //   signature = await buildAndSendTransaction({
        //     connection: connection,
        //     partialSignedTx: tx,
        //     publicKey: wallet.publicKey,
        //     signTransaction: wallet.signTransaction,
        //   });
        // }

        return { signature, mint };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: (result) => {
      if (result) {
        transactionToast(result.signature);
        router.push(`/profile?mintId=${result.mint.toBase58()}`);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}
