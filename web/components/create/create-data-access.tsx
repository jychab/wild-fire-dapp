'use client';

import { ONBOARDING_WALLET, ONE_BILLION } from '@/utils/consts';
import {
  getDistributor,
  getSponsoredDistributor,
  uploadMedia,
  uploadMetadata,
} from '@/utils/firebase/functions';
import { generateMintApiEndPoint } from '@/utils/helper/proxy';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  initializeMint,
  program,
} from '@/utils/helper/transcationInstructions';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

interface CreateMintArgs {
  name: string;
  symbol: string;
  picture: File | string;
  description: string;
}

export function useCreateMint({ address }: { address: string | null }) {
  const { connection } = useConnection();
  const router = useRouter();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();
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
          program.programId
        );
        const [distributor, metadata, onboardingWallet] = await Promise.all([
          getDistributor(),
          buildTokenMetadata(input, mint),
          connection.getAccountInfo(ONBOARDING_WALLET),
        ]);
        const sponsoredResult =
          onboardingWallet &&
          onboardingWallet.lamports > 0.03 * LAMPORTS_PER_SOL
            ? await getSponsoredDistributor(metadata)
            : null;
        if (sponsoredResult && sponsoredResult.partialTx) {
          signature = await handleSponsoredDistributor(
            sponsoredResult.partialTx,
            connection,
            wallet
          );
        } else {
          signature = await handleSelfDistributor(
            metadata,
            connection,
            wallet,
            new PublicKey(distributor),
            mint
          );
        }

        return { signature, mint };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error}` + signature);
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        transactionToast(result.signature);
        router.push(`/profile?mintId=${result.mint.toBase58()}`);
        (
          document.getElementById('notification') as HTMLDialogElement
        ).showModal();
        return await Promise.all([
          client.invalidateQueries({
            queryKey: ['get-claim-availability', { mint: result.mint }],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-token',
              { endpoint: connection.rpcEndpoint, address },
            ],
          }),
          client.refetchQueries({
            queryKey: [
              'get-token',
              { endpoint: connection.rpcEndpoint, address },
            ],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}

async function handleSponsoredDistributor(
  partialTx: string,
  connection: Connection,
  wallet: any
): Promise<TransactionSignature> {
  let tx = VersionedTransaction.deserialize(bs58.decode(partialTx));
  return await buildAndSendTransaction({
    connection: connection,
    partialSignedTx: tx,
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
  });
}

async function handleSelfDistributor(
  metadata: TokenMetadata,
  connection: Connection,
  wallet: any,
  distributor: PublicKey,
  mint: PublicKey
): Promise<TransactionSignature> {
  const [mintIx, metadataIx, initMintIx] = await Promise.all([
    createMint(distributor, 10, undefined, wallet.publicKey),
    createMintMetadata(connection, metadata, wallet.publicKey),
    initializeMint(ONE_BILLION, mint, wallet.publicKey),
  ]);

  return await buildAndSendTransaction({
    connection: connection,
    ixs: [mintIx, metadataIx, initMintIx],
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
  });
}
export async function buildTokenMetadata(
  input: CreateMintArgs,
  mint: PublicKey
): Promise<TokenMetadata> {
  let imageUrl;
  if (typeof input.picture != 'string') {
    imageUrl = await uploadMedia(input.picture, mint);
  } else {
    imageUrl = input.picture;
  }
  const payload = {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: imageUrl,
  };
  const uri = await uploadMetadata(JSON.stringify(payload), mint);
  return {
    name: input.name,
    symbol: input.symbol,
    uri: uri,
    additionalMetadata: [['hashfeed', generateMintApiEndPoint(mint)]],
    mint: mint,
  };
}
