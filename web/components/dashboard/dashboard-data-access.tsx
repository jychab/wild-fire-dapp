'use client';

import {
  Mint,
  TOKEN_2022_PROGRAM_ID,
  createHarvestWithheldTokensToMintInstruction,
  getMint,
  getTokenMetadata,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { program, withdrawFees } from '../program/instructions';
import { buildAndSendTransaction } from '../program/utils/transactionBuilder';
import { useTransactionToast } from '../ui/ui-layout';

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

export function useGetMintMetadata({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-mint-metadata', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: () =>
      getTokenMetadata(connection, mint).then(async (details) => {
        if (!details) return null;
        const uriMetadata = await (await fetch(details.uri)).json();
        const imageUrl = uriMetadata.image;
        const description = uriMetadata.description;
        return {
          metaData: details,
          image: imageUrl,
          description: description,
        };
      }),
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
            return result.map((acc) =>
              program(connection).coder.accounts.decode(
                'authority',
                acc.account.data
              )
            );
          } else {
            return null;
          }
        }),
  });
}

export function useGetAllTokenAccounts({ mint }: { mint: PublicKey }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-all-token-accounts',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      let allTokenAccounts = new Set<{
        address: string;
        mint: string;
        owner: string;
        amount: number;
        frozen: boolean;
        token_extensions: {
          transfer_fee_amount: {
            withheld_amount: number;
          };
        };
      }>();
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
        const data = await response.json();

        if (!data.result || data.result.token_accounts.length === 0) {
          break;
        }

        data.result.token_accounts.forEach((account: any) => {
          allTokenAccounts.add(account);
        });
        cursor = data.result.cursor;
      }
      return Array.from(allTokenAccounts);
    },
    staleTime: 1000 * 5 * 60,
  });
}

export function useClaim({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      'claim-fees',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async (tokenAccounts: PublicKey[] | undefined) => {
      if (
        !mint ||
        !wallet.publicKey ||
        !wallet.signTransaction ||
        !tokenAccounts ||
        tokenAccounts.length == 0
      )
        return;
      let signature: TransactionSignature = '';
      try {
        const ix1 = createHarvestWithheldTokensToMintInstruction(
          mint,
          tokenAccounts,
          TOKEN_2022_PROGRAM_ID
        );
        const ix2 = await withdrawFees(connection, wallet.publicKey, mint);
        signature = await buildAndSendTransaction(
          connection,
          [ix1, ix2],
          wallet.publicKey,
          wallet.signTransaction,
          'confirmed'
        );
        return signature;
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error} ` + signature);
        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-all-token-accounts',
              { endpoint: connection.rpcEndpoint, mint },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-token',
              { endpoint: connection.rpcEndpoint, address: wallet.publicKey },
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
