'use client';

import {
  AMOUNT_CREATOR,
  AMOUNT_RESERVE,
  LONG_STALE_TIME,
  ONBOARDING_WALLET,
} from '@/utils/consts';
import {
  createOrUpdateAdminForExternalMint,
  getDistributor,
  getSponsoredDistributor,
  uploadMedia,
  uploadMetadata,
} from '@/utils/firebase/functions';
import { generateMintApiEndPoint } from '@/utils/helper/endpoints';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createMint,
  createMintMetadata,
  initializeMint,
  program,
} from '@/utils/helper/transcationInstructions';
import { DAS } from '@/utils/types/das';
import { TokenMetadata } from '@solana/spl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export function useCreateMintWithExistingToken({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  const router = useRouter();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [
      'create-mint-with-existing-token',
      {
        address,
      },
    ],
    mutationFn: async (mint: PublicKey) => {
      await createOrUpdateAdminForExternalMint(mint.toBase58());
      return mint;
    },
    onSuccess: async (result) => {
      router.push(`/profile?mintId=${result.toBase58()}`);
      return await Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-token-details',
            { endpoint: connection.rpcEndpoint, mint: result },
          ],
        }),
      ]);
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}

interface CreateMintArgs {
  name: string;
  symbol: string;
  picture: File | string | undefined;
  description: string;
}

export function useCreateMint({ address }: { address: PublicKey | null }) {
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
      if (!wallet.publicKey || !wallet.signTransaction || !input.picture)
        return;
      let signature: TransactionSignature = '';
      try {
        const [mint] = PublicKey.findProgramAddressSync(
          [Buffer.from('mint'), wallet.publicKey.toBuffer()],
          program.programId
        );
        const distributor = await getDistributor();
        const [metadata, onboardingWallet] = await Promise.all([
          buildTokenMetadata(input, mint, wallet.publicKey),
          connection.getAccountInfo(ONBOARDING_WALLET),
        ]);
        const sponsoredResult =
          onboardingWallet &&
          onboardingWallet.lamports > 0.012 * LAMPORTS_PER_SOL
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
        return await Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-token-details',
              { endpoint: connection.rpcEndpoint, mint: result.mint },
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
  let tx = VersionedTransaction.deserialize(Buffer.from(partialTx, 'base64'));
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
    initializeMint(AMOUNT_RESERVE, AMOUNT_CREATOR, mint, wallet.publicKey),
    // initializePool(
    //   connection,
    //   mint,
    //   wallet.publicKey,
    //   wallet.publicKey,
    //   AMOUNT_LIQUIDITY_POOL,
    //   Number(OFF_SET)
    // ),
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
  mint: PublicKey,
  publicKey: PublicKey
): Promise<TokenMetadata> {
  let imageUrl;
  if (typeof input.picture != 'string') {
    imageUrl = await uploadMedia(input.picture!, publicKey);
  } else {
    imageUrl = input.picture;
  }
  const payload = {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: imageUrl,
  };
  const uri = await uploadMetadata(JSON.stringify(payload), publicKey);
  return {
    name: input.name,
    symbol: input.symbol,
    uri: uri,
    additionalMetadata: [['hashfeed', generateMintApiEndPoint(mint)]],
    mint: mint,
  };
}

export function useGetJupiterVerifiedTokens() {
  return useQuery({
    queryKey: [
      'get-jupiter-verified-tokens',
      { endpoint: 'https://tokens.jup.ag/tokens?tags=verified' },
    ],
    queryFn: async () => {
      const result = await (
        await fetch('https://tokens.jup.ag/tokens?tags=verified')
      ).json();
      return result as any[];
    },
    staleTime: LONG_STALE_TIME,
  });
}

export function useGetAssetByAuthority({
  address,
  verifiedTokenList,
}: {
  address: PublicKey | null;
  verifiedTokenList?: string[];
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-asset-by-authority',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      const assets = await getAssetsByAuthority(connection, address);
      const fungibleTokens = assets.items.filter(
        (x) =>
          x.token_info &&
          x.token_info.supply &&
          x.token_info.supply > 1 &&
          verifiedTokenList?.includes(x.id)
      );
      return fungibleTokens;
    },
    enabled: !!address,
    staleTime: LONG_STALE_TIME,
  });
}

export const getAssetsByAuthority = async (
  connection: Connection,
  address: PublicKey
) => {
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByAuthority',
      params: {
        authorityAddress: address.toBase58(),
        page: 1, // Starts at 1
        limit: 1000,
      },
    }),
  });
  const { result } = await response.json();
  return result as DAS.GetAssetResponseList;
};
