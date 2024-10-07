import { SHORT_STALE_TIME } from '@/utils/consts';
import { program, sell } from '@/utils/program/instructions';
import {
  buildTransaction,
  pollAndSendTransaction,
} from '@/utils/program/transactionBuilder';
import { NATIVE_MINT } from '@solana/spl-token';
import {
  PublicKey,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useConnection, useWallet } from 'unified-wallet-adapter-with-telegram';
import { useTransactionToast } from '../ui/ui-layout';
import { getOwnerTokenBalance } from './claim-feature';

export function useMultipleSellMutation() {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const { publicKey, signAllTransactions } = useWallet();

  return useMutation({
    mutationKey: [
      'multiple-sell-orders',
      {
        endpoint: connection.rpcEndpoint,
      },
    ],
    mutationFn: async (
      x: {
        mint: string;
        amount: number;
      }[]
    ) => {
      if (!publicKey || !signAllTransactions) return null;
      let signature: TransactionSignature = '';
      try {
        const transactions = await Promise.all(
          x.map(async (y) => {
            const [liquidityPool] = PublicKey.findProgramAddressSync(
              [Buffer.from('liquidity_pool'), new PublicKey(y.mint).toBuffer()],
              program.programId
            );
            const poolState = await program.account.liquidityPool.fetch(
              liquidityPool
            );
            if (!poolState.thresholdReached) {
              const ix = await sell(y.amount, new PublicKey(y.mint), publicKey);
              return await buildTransaction({
                connection: connection,
                publicKey: publicKey,
                ixs: [ix],
              });
            } else {
              let payload = {
                // quoteResponse from /quote api
                quoteResponse: await (
                  await fetch(
                    `https://quote-api.jup.ag/v6/quote?inputMint=${
                      y.mint
                    }&outputMint=${NATIVE_MINT.toBase58()}&amount=${y.amount.toString()}&slippageBps=50&swapMode=${'exactIn'}`
                  )
                ).json(),
                // user public key to be used for the swap
                userPublicKey: publicKey.toString(),
                // auto wrap and unwrap SOL. default is true
                wrapAndUnwrapSol: true,
                // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
              };
              // get serialized transactions for the swap
              const { swapTransaction } = await (
                await fetch('https://quote-api.jup.ag/v6/swap', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
                })
              ).json();
              // deserialize the transaction
              const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
              var transaction =
                VersionedTransaction.deserialize(swapTransactionBuf);
              return await buildTransaction({
                connection: connection,
                publicKey: publicKey,
                partialSignedTx: transaction,
              });
            }
          })
        );
        const signedTxs = await signAllTransactions(
          transactions.filter((x) => !!x) as (
            | VersionedTransaction
            | Transaction
          )[]
        );
        const signatures = await Promise.all(
          signedTxs.map((x) =>
            pollAndSendTransaction(connection, x as VersionedTransaction)
          )
        );
        return signatures[signatures.length - 1];
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error} ` + signature);
        return;
      }
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        (document.getElementById('claim')! as HTMLDialogElement).close();
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: publicKey!,
              },
            ],
          }),
        ]);
      }
    },
    onError: (error) => {
      console.error(`Transaction failed! ${JSON.stringify(error)}`);
    },
  });
}

export function useGetAssetByAuthority({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-asset-by-owner',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return await getOwnerTokenBalance(address.toBase58());
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
}
