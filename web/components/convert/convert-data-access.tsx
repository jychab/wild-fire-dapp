import { NATIVE_MINT_DECIMALS, SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import {
  decompressTokenIxs,
  mergeTokenAccounts,
  program,
  sell,
} from '@/utils/program/instructions';
import {
  buildTransaction,
  pollAndSendTransaction,
} from '@/utils/program/transactionBuilder';
import { DAS } from '@/utils/types/das';
import { createRpc, Rpc } from '@lightprotocol/stateless.js';
import { NATIVE_MINT } from '@solana/spl-token';
import {
  PublicKey,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useWallet } from 'unified-wallet-adapter-with-telegram';
import { getAssetBatch } from '../trending/trending-data-access';
import { useTransactionToast } from '../ui/ui-layout';

export function useMultipleSellMutation() {
  const connection: Rpc = createRpc(
    process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    process.env.NEXT_PUBLIC_RPC_ENDPOINT
  );
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
    mutationFn: async (x: {
      mints: {
        mint: string;
        amount: number;
        compressed?: boolean;
      }[];
      summary:
        | {
            all: { collectionMint: string; memberMint: string }[];
            allTokenPrices: {
              collectionMint: string;
              memberMint: string;
              price: number;
              supply: number;
              volume: number;
            }[];
            initializedMints: {
              collectionMint: string;
              memberMint: string;
            }[];
          }
        | null
        | undefined;
      solPrice: number | null | undefined;
    }) => {
      if (!publicKey || !signAllTransactions) return null;
      let signature: TransactionSignature = '';
      try {
        const failed: string[] = [];
        const transactions = [];
        for (let i = 0; i < x.mints.length; i++) {
          const mint = new PublicKey(x.mints[i].mint);
          const amount = x.mints[i].amount;

          try {
            if (x.mints[i].compressed) {
              await mergeTokenAccounts(
                connection,
                publicKey,
                mint,
                publicKey,
                signAllTransactions
              );
              const ixs = await decompressTokenIxs(
                connection,
                publicKey,
                mint,
                amount
              );
              await buildTransaction({
                connection: connection,
                publicKey: publicKey,
                ixs,
              });
            }
            const [liquidityPool] = PublicKey.findProgramAddressSync(
              [Buffer.from('liquidity_pool'), mint.toBuffer()],
              program.programId
            );
            const poolState = await program.account.liquidityPool.fetchNullable(
              liquidityPool
            );
            if (poolState && !poolState.thresholdReached) {
              let ixs = [];
              ixs.push(await sell(amount, mint, publicKey));
              transactions.push(
                await buildTransaction({
                  connection: connection,
                  publicKey: publicKey,
                  ixs,
                })
              );
            } else {
              const quoteResponse = await (
                await fetch(
                  `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toBase58()}&outputMint=${NATIVE_MINT.toBase58()}&amount=${amount.toString()}&slippageBps=50&swapMode=${'ExactIn'}`
                )
              ).json();
              let payload = {
                // quoteResponse from /quote api
                quoteResponse: quoteResponse,
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
              transactions.push(
                await buildTransaction({
                  connection: connection,
                  publicKey: publicKey,
                  partialSignedTx: transaction,
                })
              );
            }
          } catch (e) {
            console.error(e);
            failed.push(mint.toBase58());
          }
        }

        if (failed.length > 0) {
          toast.error(
            `Error encountered in selling ${failed.length} mint${
              failed.length > 1 ? 's' : ''
            }.`
          );
          if (failed.length == x.mints.length) {
            return;
          }
        }
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
        return {
          signature: signatures[signatures.length - 1],
          summary: x.summary,
          solPrice: x.solPrice,
        };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error} ` + signature);
        return;
      }
    },

    onSuccess: (payload) => {
      if (payload) {
        transactionToast(payload.signature);
        (document.getElementById('convert')! as HTMLDialogElement).close();
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
          client.invalidateQueries({
            queryKey: [
              'get-asset-by-owner',
              {
                endpoint: connection.rpcEndpoint,
                address: publicKey!,
                summary: payload.summary,
                solPrice: payload.solPrice,
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

export function useGetOwnTokenBalance({
  address,
  summary,
  solPrice,
}: {
  address: PublicKey | null;
  summary: {
    all: { collectionMint: string; memberMint: string }[];
    allTokenPrices: {
      collectionMint: string;
      memberMint: string;
      price: number;
      supply: number;
      volume: number;
    }[];
    initializedMints: {
      collectionMint: string;
      memberMint: string;
    }[];
  } | null;
  solPrice: number | null | undefined;
}) {
  const connection: Rpc = createRpc(
    process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    process.env.NEXT_PUBLIC_RPC_ENDPOINT
  );
  return useQuery({
    queryKey: [
      'get-asset-by-owner',
      { endpoint: connection.rpcEndpoint, address, summary, solPrice },
    ],
    queryFn: async () => {
      if (!address) return null;
      const result = await getOwnerTokenBalance(connection, address.toBase58());
      if (summary && solPrice) {
        const filteredResults = await Promise.all(
          result
            .filter((x) => summary.all.map((x) => x.memberMint).includes(x.id))
            .map(async (x) => {
              let price = x.token_info?.price_info?.price_per_token;
              if (
                !price &&
                summary.all.find((y) => y.memberMint == x.id)?.collectionMint
              ) {
                const docData = await getDocs(
                  query(
                    collection(
                      db,
                      `Mint/${
                        summary.all.find((y) => y.memberMint == x.id)
                          ?.collectionMint
                      }/TradeEvents`
                    ),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                  )
                );
                const realTimeData = docData.docs[0].data() as {
                  event: 'buy' | 'sell';
                  amount: number;
                  amountOut: number;
                  memberMint: string;
                  priceInLamports: number;
                  volume: number;
                  timestamp: number;
                };
                price =
                  (realTimeData.priceInLamports * solPrice) /
                  10 ** NATIVE_MINT_DECIMALS;
              }

              return {
                collectionMint: summary.all.find((y) => y.memberMint == x.id)
                  ?.collectionMint,
                ...x,
                token_info: {
                  ...x.token_info,
                  price_info: {
                    currency: 'USDC',
                    price_per_token: price || 0,
                  },
                },
              };
            })
        );
        return filteredResults;
      }
      return result;
    },
    enabled: !!address,
    staleTime: SHORT_STALE_TIME,
  });
}

export async function getOwnerTokenBalance(connection: Rpc, address: string) {
  const nonCompressedTokens = await fetch(
    program.provider.connection.rpcEndpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getAssetsByOwner',
        id: '',
        params: {
          page: 1,
          limit: 1000,
          displayOptions: {
            showUnverifiedCollections: true,
            showFungible: true,
          },
          ownerAddress: address,
        },
      }),
    }
  );
  const nonCompressedData = (await nonCompressedTokens.json()).result
    .items as DAS.GetAssetResponse[];

  const compressedTokens = await connection.getCompressedTokenBalancesByOwner(
    new PublicKey(address)
  );

  const compressedTokenMetadata = await getAssetBatch(
    compressedTokens.items.map((account) => account.mint.toBase58())
  );
  const compressedData = compressedTokens.items
    .map((x) => {
      const metadata = compressedTokenMetadata.find(
        (y) => y.id == x.mint.toBase58()
      );
      if (metadata) {
        return {
          ...metadata,
          compressedToken: true,
          token_info: {
            ...metadata.token_info,
            balance: x.balance,
          },
        };
      }
    })
    .filter((x) => x != null) as DAS.GetAssetResponse[];

  return nonCompressedData
    .filter((x) => x.interface === 'FungibleToken')
    .concat(compressedData);
}
