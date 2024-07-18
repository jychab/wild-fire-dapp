import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createOracle,
  fetchSwapPoolDetails,
  fetchSwapPoolOracle,
  fetchSwapPrice,
  swapBaseInput,
  swapBaseOutput,
} from '@/utils/helper/transcationInstructions';
import { getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      'get-address-token-account-info',
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

export function useFetchSwapPrice({
  mint,
  swapDetails,
}: {
  mint: PublicKey | null;
  swapDetails:
    | {
        protocolFeesTokenMint: number;
        protocolFeesTokenWsol: number;
        creatorFeesTokenMint: number;
        creatorFeesTokenWsol: number;
        offset: number;
      }
    | undefined
    | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-swap-price', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint || !swapDetails) return null;
      return fetchSwapPrice(connection, mint, swapDetails);
    },
    enabled: !!mint && !!swapDetails,
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
  const client = useQueryClient();
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
      amount_in,
      amount_out,
      max_amount_in,
      min_amount_out,
      inputToken,
      inputTokenProgram,
      outputToken,
      outputTokenProgram,
    }: {
      type: SwapType;
      amount_in?: number;
      max_amount_in?: number;
      amount_out?: number;
      min_amount_out?: number;
      inputToken: PublicKey;
      inputTokenProgram: PublicKey;
      outputToken: PublicKey;
      outputTokenProgram: PublicKey;
    }) => {
      if (!mint || !wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        let ixs;
        if (
          type == SwapType.BasedOutput &&
          max_amount_in != undefined &&
          amount_out
        ) {
          ixs = await swapBaseOutput(
            connection,
            mint,
            wallet.publicKey,
            max_amount_in,
            amount_out,
            inputToken,
            inputTokenProgram,
            outputToken,
            outputTokenProgram
          );
        } else if (
          type == SwapType.BasedInput &&
          amount_in &&
          min_amount_out != undefined
        ) {
          ixs = await swapBaseInput(
            connection,
            mint,
            wallet.publicKey,
            amount_in,
            min_amount_out,
            inputToken,
            inputTokenProgram,
            outputToken,
            outputTokenProgram
          );
        }
        if (!ixs) return;
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
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-address-account-info',
            { endpoint: connection.rpcEndpoint, address: wallet.publicKey! },
          ],
        }),
        client.refetchQueries({
          queryKey: [
            'get-address-token-account-info',
            { endpoint: connection.rpcEndpoint, address: wallet.publicKey! },
          ],
        }),
      ]);
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}

export function useCreateOracle({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'create-mint-oracle',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async () => {
      if (!mint || !wallet.publicKey || !wallet.signTransaction) return;
      let signature: TransactionSignature = '';
      try {
        const ix = await createOracle(connection, mint, wallet.publicKey);

        signature = await buildAndSendTransaction({
          connection,
          ixs: [ix],
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
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-swap-oracle',
            { endpoint: connection.rpcEndpoint, mint },
          ],
        }),
      ]);
    },
    onError: (error) => {
      console.error(`Transaction failed! ${error}`);
    },
  });
}
