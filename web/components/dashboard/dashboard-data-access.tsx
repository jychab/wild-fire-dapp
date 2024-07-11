'use client';

import { proxify } from '@/utils/helper/proxy';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { DAS } from '@/utils/types/das';
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchSwapPoolDetails,
  initializePool,
  program,
  swapBaseInput,
  swapBaseOutput,
} from '../../utils/helper/transcationInstructions';
import { useTransactionToast } from '../ui/ui-layout';
import { UploadContent } from '../upload/upload.data-access';
import { AuthorityData } from './dashboard-ui';

export function useGetMintTransferFeeConfig({
  mint,
}: {
  mint: Mint | undefined;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-transfer-fee-config',
      { endpoint: connection.rpcEndpoint, mint: mint?.address },
    ],
    queryFn: () => mint && getTransferFeeConfig(mint),
    enabled: !!mint,
  });
}

export function useGetMintDetails({
  mint,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  mint: PublicKey | undefined;
  tokenProgram?: PublicKey;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-details',
      { endpoint: connection.rpcEndpoint, mint: mint ? mint : null },
    ],
    queryFn: () => mint && getMint(connection, mint, undefined, tokenProgram),
    enabled: !!mint,
  });
}

export function useGetToken({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () =>
      address &&
      connection
        .getProgramAccounts(program(connection).programId, {
          filters: [
            {
              dataSize: 120,
            },
            {
              memcmp: {
                offset: 88,
                bytes: address.toBase58(),
              },
            },
          ],
        })
        .then((result) => {
          if (result.length > 0) {
            return result.map((acc) => {
              return program(connection).coder.accounts.decode(
                'authority',
                acc.account.data
              ) as AuthorityData;
            });
          } else {
            return null;
          }
        }),
    enabled: !!address,
  });
}

export function useGetLargestAccountFromMint({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-largest-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      return connection.getTokenLargestAccounts(mint, 'confirmed');
    },
    staleTime: 1000 * 60 * 10, //10mins
  });
}

export function useGetTokenDetails({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token-details', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      const response = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '',
          method: 'getAsset',
          params: {
            id: mint.toBase58(),
          },
        }),
      });
      const data = (await response.json()).result;
      try {
        const uriMetadata = await (
          await fetch(proxify(data.content!.json_uri))
        ).json();
        const imageUrl = uriMetadata.image as string;
        const description = uriMetadata.description as string;
        const content = uriMetadata.content as UploadContent[] | undefined;
        return {
          ...data,
          jsonUriData: { imageUrl, description, content },
        } as DAS.GetAssetResponse;
      } catch (e) {
        return data as DAS.GetAssetResponse;
      }
    },
    enabled: !!mint,
  });
}

export enum SwapType {
  BasedInput,
  BasedOutput,
}

export function useSwapDetails({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-swap-details', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      return fetchSwapPoolDetails(connection, mint);
    },
    enabled: !!mint,
  });
}

export function useSwapMint({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      'swap-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({
      type,
      amount,
      inputToken,
      inputTokenDecimal,
      inputTokenProgram,
      outputToken,
      outputTokenProgram,
      outputTokenDecimal,
    }: {
      type: SwapType;
      amount: number;
      inputToken: PublicKey;
      inputTokenProgram: PublicKey;
      inputTokenDecimal: number;
      outputToken: PublicKey;
      outputTokenProgram: PublicKey;
      outputTokenDecimal: number;
    }) => {
      if (!mint || !wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        let ixs;
        if (type == SwapType.BasedOutput) {
          ixs = await swapBaseOutput(
            connection,
            wallet.publicKey,
            amount,
            inputToken,
            inputTokenProgram,
            outputToken,
            outputTokenProgram,
            outputTokenDecimal
          );
        } else {
          ixs = await swapBaseInput(
            connection,
            wallet.publicKey,
            amount,
            inputToken,
            inputTokenProgram,
            inputTokenDecimal,
            outputToken,
            outputTokenProgram
          );
        }

        signature = await buildAndSendTransaction({
          connection,
          ixs,
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
      console.error(`Transaction failed! ${error}`);
    },
  });
}

export function useInitializePool({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      'initialize-pool',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({
      mintAmount,
      solAmount,
    }: {
      mintAmount: number;
      solAmount: number;
    }) => {
      if (!wallet.publicKey || !wallet.signTransaction || !mint) return;
      let signature: TransactionSignature = '';
      try {
        const ixs = await initializePool(
          connection,
          mint,
          wallet.publicKey,
          mintAmount,
          solAmount
        );

        signature = await buildAndSendTransaction({
          connection,
          ixs,
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
      console.error(`Transaction failed! ${error}`);
    },
  });
}
