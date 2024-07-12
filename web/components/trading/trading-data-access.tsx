import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  fetchSwapPoolDetails,
  fetchSwapPoolOracle,
  fetchSwapPrice,
  initializePool,
  swapBaseInput,
  swapBaseOutput,
} from '@/utils/helper/transcationInstructions';
import { getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export enum SwapType {
  BasedInput,
  BasedOutput,
}

export function useGetTokenAccountInfo({
  address,
  tokenProgram = TOKEN_2022_PROGRAM_ID,
}: {
  address: PublicKey | null;
  tokenProgram?: PublicKey;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-address-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return getAccount(connection, address, undefined, tokenProgram);
    },
    enabled: !!address,
  });
}

export function useGetAddressInfo({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-address-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return connection.getAccountInfo(address);
    },
    enabled: !!address,
  });
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

export function useSwapPrice({
  mint,
  mintFee,
  solFee,
}: {
  mint: PublicKey | null;
  mintFee: number | undefined;
  solFee: number | undefined;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-swap-price', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint || !mintFee || !solFee) return null;

      return fetchSwapPrice(connection, mint, mintFee, solFee);
    },
    enabled: !!mint && !!mintFee && !!solFee,
  });
}

export function useSwapOracle({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-swap-oracle', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      return fetchSwapPoolOracle(connection, mint);
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
      inputTokenProgram,
      outputToken,
      outputTokenProgram,
    }: {
      type: SwapType;
      amount: number;
      inputToken: PublicKey;
      inputTokenProgram: PublicKey;
      outputToken: PublicKey;
      outputTokenProgram: PublicKey;
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
            outputTokenProgram
          );
        } else {
          ixs = await swapBaseInput(
            connection,
            wallet.publicKey,
            amount,
            inputToken,
            inputTokenProgram,
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
