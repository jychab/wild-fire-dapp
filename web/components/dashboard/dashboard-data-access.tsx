'use client';

import { proxify } from '@/utils/helper/proxy';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { DAS } from '@/utils/types/das';
import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTokenMetadata,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature,
} from '@solana/web3.js';
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
import { Content } from '../upload/upload.data-access';
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

export function useGetMintDetails({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-mint-details',
      { endpoint: connection.rpcEndpoint, mint: mint ? mint : null },
    ],
    queryFn: () =>
      mint && getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID),
    enabled: !!mint,
  });
}

export function useGetMintMetadata({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-mint-metadata', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: () =>
      mint &&
      getTokenMetadata(connection, mint).then(async (details) => {
        if (!details) return null;
        const uriMetadata = await (await fetch(proxify(details.uri))).json();
        const imageUrl = uriMetadata.image;
        const description = uriMetadata.description;
        const content = uriMetadata.content;
        return {
          metaData: details,
          image: imageUrl as string,
          description: description as string | undefined,
          content: content as Content[] | undefined,
        };
      }),
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
  });
}

export function useGetAllTokenAccountsFromMint({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-all-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      let allTokenAccounts = new Set<DAS.TokenAccounts>();
      let cursor;

      while (true) {
        let params: {
          limit: number;
          mint: string;
          cursor?: any;
          options: any;
        } = {
          limit: 1000,
          mint: mint.toBase58(),
          options: {
            showZeroBalance: true,
          },
        };

        if (cursor != undefined) {
          params.cursor = cursor;
        }

        const response = await fetch(connection.rpcEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '',
            method: 'getTokenAccounts',
            params: params,
          }),
        });
        const data = (await response.json())
          .result as DAS.GetTokenAccountsResponse;

        if (!data || !data.token_accounts || data.token_accounts.length == 0) {
          break;
        }

        data.token_accounts.forEach((account) => {
          allTokenAccounts.add(account);
        });
        cursor = data.cursor;
      }
      return Array.from(allTokenAccounts);
    },
    staleTime: 1000 * 5 * 60,
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
      const data = (await response.json()).result as DAS.GetAssetResponse;
      return data;
    },
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
      if (!mint) return;
      let signature: TransactionSignature = '';
      try {
        let ixs;
        if (type == SwapType.BasedOutput) {
          ixs = await swapBaseOutput(
            connection,
            wallet.publicKey!,
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
            wallet.publicKey!,
            amount,
            inputToken,
            inputTokenProgram,
            inputTokenDecimal,
            outputToken,
            outputTokenProgram
          );
        }

        signature = await buildAndSendTransaction(
          connection,
          ixs,
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

export function useInitializePool({ mint }: { mint: PublicKey }) {
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
    mutationFn: async () => {
      let signature: TransactionSignature = '';
      try {
        const ixs = await initializePool(
          connection,
          mint,
          wallet.publicKey!,
          LAMPORTS_PER_SOL * 0.7,
          LAMPORTS_PER_SOL * 0.1
        );

        signature = await buildAndSendTransaction(
          connection,
          ixs,
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
