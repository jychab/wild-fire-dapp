import { DEFAULT_MINT_DECIMALS, SHORT_STALE_TIME } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import {
  buy,
  decompressTokenIxs,
  jupiterInstructions,
  mergeTokenAccounts,
  program,
  sell,
} from '@/utils/program/instructions';
import { buildAndSendTransaction } from '@/utils/program/transactionBuilder';
import { createRpc, Rpc } from '@lightprotocol/stateless.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  getMultipleAccounts,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

export function useGetTokenAccountInfo({
  address,
  tokenProgram,
}: {
  address: PublicKey | null;
  tokenProgram: PublicKey | undefined;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-address-token-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address || !tokenProgram) return null;

      return getAccount(connection, address, undefined, tokenProgram);
    },
    enabled: !!address && !!tokenProgram,
  });
}

export function useGetCompressedTokenAccountBalanceInfo({
  address,
  mint,
  tokenProgram,
}: {
  address: PublicKey | null;
  mint: PublicKey | null;
  tokenProgram: PublicKey | undefined;
}) {
  const connection: Rpc = createRpc(
    process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    process.env.NEXT_PUBLIC_RPC_ENDPOINT
  );
  return useQuery({
    queryKey: [
      'get-compressed-token-account-info',
      { endpoint: connection.rpcEndpoint, address, mint, tokenProgram },
    ],
    queryFn: async () => {
      if (
        !address ||
        tokenProgram?.toBase58() !== TOKEN_PROGRAM_ID.toBase58() ||
        !mint
      )
        return null;
      const result = await connection.getCompressedTokenBalancesByOwner(
        address,
        {
          mint,
        }
      );
      return result.items.reduce((acc, x) => acc + Number(x.balance), 0);
    },
    enabled: !!address && !!tokenProgram && !!mint,
  });
}

export function useGetAccountInfo({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-account-info',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) return null;
      return connection.getAccountInfo(address);
    },
    enabled: !!address,
  });
}

export function useSwapMutation({
  mint,
  tokenProgram,
}: {
  mint: PublicKey | null;
  tokenProgram: PublicKey | undefined;
}) {
  const connection: Rpc = createRpc(
    process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    process.env.NEXT_PUBLIC_RPC_ENDPOINT
  );
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const { publicKey, signAllTransactions, signTransaction } = useWallet();

  return useMutation({
    mutationKey: [
      'swap-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({
      poolState,
      amount,
      inputMint,
      outputMint,
      swapMode,
    }: {
      poolState: any | undefined;
      inputMint: string;
      outputMint: string;
      amount: number;
      swapMode: string;
    }) => {
      if (
        !mint ||
        !tokenProgram ||
        !publicKey ||
        !signAllTransactions ||
        !signTransaction
      )
        return null;
      let signature: TransactionSignature = '';
      const amountRounded = Math.round(amount);
      const sellEvent = inputMint === mint.toBase58();

      try {
        let ixs = [];
        const lookUpTableAccounts: AddressLookupTableAccount[] = [];
        let existingAmount = 0;
        const ata = getAssociatedTokenAddressSync(mint, publicKey);
        try {
          existingAmount = Number((await getAccount(connection, ata)).amount);
        } catch (e) {}

        if (
          sellEvent &&
          tokenProgram.toBase58() == TOKEN_PROGRAM_ID.toBase58()
        ) {
          if (existingAmount < amount) {
            await mergeTokenAccounts(
              connection,
              publicKey,
              mint,
              publicKey,
              signAllTransactions
            );
            ixs.push(
              ...(await decompressTokenIxs(
                connection,
                publicKey,
                mint,
                amount - existingAmount
              ))
            );
          }
        }
        if (poolState && !poolState.thresholdReached) {
          ixs.push(
            !sellEvent
              ? await buy(amountRounded, mint, publicKey)
              : await sell(amountRounded, mint, publicKey)
          );
        } else {
          const { instructions, addressLookupTableAccounts } =
            await jupiterInstructions(
              new PublicKey(inputMint),
              new PublicKey(outputMint),
              amount
            );
          ixs.push(...instructions);
          lookUpTableAccounts.push(...addressLookupTableAccounts);
        }
        // assume that we will always try to sell the non compressed tokens first, then if thats the case we can close the source token account if
        // amount we are trying to sell exceeds or equals to the existing amount in the ata

        if (existingAmount <= amount) {
          ixs.push(createCloseAccountInstruction(ata, publicKey, publicKey));
        }

        signature = await buildAndSendTransaction({
          connection: connection,
          publicKey: publicKey,
          signTransaction: signTransaction,
          ixs,
          addressLookupTableAccounts: lookUpTableAccounts,
        });
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
              'get-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: publicKey!,
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-address-token-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: getAssociatedTokenAddressSync(
                  mint!,
                  publicKey!,
                  false,
                  tokenProgram
                ),
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-liquidity-pool',
              { endpoint: connection.rpcEndpoint, mint },
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

export function useSubscriptionMutation({
  mint,
  tokenProgram,
}: {
  mint: PublicKey | null;
  tokenProgram: PublicKey | undefined;
}) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const { publicKey, signTransaction } = useWallet();

  return useMutation({
    mutationKey: [
      'handle-subscribe-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async () => {
      if (!mint || !publicKey || !signTransaction) return null;
      let signature: TransactionSignature = '';
      const associatedTokenAddress = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        tokenProgram
      );
      let account;
      const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
      let ixs;
      try {
        account = await getAccount(
          connection,
          associatedTokenAddress,
          undefined,
          tokenProgram
        );
      } catch (error: unknown) {
        ixs = [
          createAssociatedTokenAccountIdempotentInstruction(
            publicKey,
            associatedTokenAddress,
            publicKey,
            mint,
            tokenProgram
          ),
        ];
      }
      if (!ixs) {
        toast.error('Already Subscribed');
        return;
      }
      if (account) {
        try {
          if (account.amount == BigInt(0)) {
            throw new Error('Amount is zero');
          }
          let payload = {
            // quoteResponse from /quote api
            quoteResponse: await (
              await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${mint.toBase58()}&outputMint=${NATIVE_MINT.toBase58()}&amount=${account.amount.toString()}&slippageBps=50&swapMode=ExactIn`
              )
            ).json(),
            // user public key to be used for the swap
            userPublicKey: publicKey.toString(),
            // auto wrap and unwrap SOL. default is true
            wrapAndUnwrapSol: true,
            // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
          };
          const instructions = await (
            await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
          ).json();
          if (instructions.error) {
            throw new Error(
              'Failed to get swap instructions: ' + instructions.error
            );
          }
          const {
            setupInstructions, // Setup missing ATA for the users.
            swapInstruction: swapInstructionPayload, // The actual swap instruction.
            cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
            addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
          } = instructions;

          addressLookupTableAccounts.push(
            ...(await getAddressLookupTableAccounts(
              connection,
              addressLookupTableAddresses
            ))
          );
          ixs = [
            ...setupInstructions.map(deserializeInstruction),
            deserializeInstruction(swapInstructionPayload),
            deserializeInstruction(cleanupInstruction),
            createCloseAccountInstruction(
              account.address,
              publicKey,
              publicKey,
              undefined,
              tokenProgram
            ),
          ];
        } catch (error: unknown) {
          const mintInfo = await getMint(
            connection,
            mint,
            undefined,
            tokenProgram
          );
          ixs = [
            createBurnCheckedInstruction(
              account.address,
              mint,
              publicKey,
              account.amount,
              mintInfo.decimals,
              undefined,
              tokenProgram
            ),
            createCloseAccountInstruction(
              account.address,
              publicKey,
              publicKey,
              undefined,
              tokenProgram
            ),
          ];
        }
      }
      if (!ixs) return;
      try {
        signature = await buildAndSendTransaction({
          connection,
          publicKey,
          signTransaction,
          ixs: ixs,
          addressLookupTableAccounts,
        });

        return { signature, associatedTokenAddress };
      } catch (error: unknown) {
        toast.error(`Transaction failed! ${error} ` + signature);
        return;
      }
    },
    onSuccess: (data) => {
      if (data) {
        transactionToast(data.signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-address-token-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: data.associatedTokenAddress,
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

function deserializeInstruction(instruction: any) {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map(
      (key: { pubkey: PublicKeyInitData; isSigner: any; isWritable: any }) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })
    ),
    data: Buffer.from(instruction.data, 'base64'),
  });
}

async function getAddressLookupTableAccounts(
  connection: Connection,
  keys: string[]
) {
  const addressLookupTableAccountInfos =
    await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );
  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }

    return acc;
  }, new Array<AddressLookupTableAccount>());
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: bigint,
  swapMode: string
) {
  if (swapMode == 'ExactIn') {
    if (amount == BigInt(0)) {
      return BigInt(0);
    }
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toString()}&slippageBps=50&swapMode=${swapMode}`
    );
    if (response.status == 200) {
      return BigInt((await response.json()).outAmount);
    } else {
      throw Error((await response.json()).error);
    }
  } else {
    throw Error('Swap Mode other than ExactIn is not supported at the moment');
  }
}

export function useIsLiquidityPoolFound({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['check-liquidity-pool-status', { mint }],
    queryFn: async () => {
      if (!mint) return false;
      const result = await (
        await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`)
      ).json();
      return result.data[mint.toBase58()] != undefined;
    },
    enabled: !!mint,
  });
}

export function useGetTokenPrice({ mint }: { mint: PublicKey | null }) {
  return useQuery({
    queryKey: ['get-token-price', { mint }],
    queryFn: async () => {
      if (!mint) return null;
      const result = await (
        await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`)
      ).json();
      return result.data[mint.toBase58()].price as number;
    },
    enabled: !!mint,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGetOhlcv({
  mint,
  from,
  to,
}: {
  mint: PublicKey | null;
  from: number;
  to: number;
}) {
  return useQuery({
    queryKey: ['get-mint-ohlcv', { mint, from, to }],
    queryFn: async () => {
      if (!mint) return null;
      const data = (
        await getDocs(
          query(
            collection(db, `Mint/${mint}/Ohlcv`),
            where('time', '>=', from),
            where('time', '<', to)
          )
        )
      ).docs.map((x) => x.data());
      return data;
    },
    enabled: !!mint,
  });
}
export function calculatePriceInLamports(reserveTokensSold: number): number {
  const reserveTokensSoldBigInt = BigInt(reserveTokensSold);

  // Calculate the square of reserveTokensSold
  const square = reserveTokensSoldBigInt * reserveTokensSoldBigInt;

  // Scale factor and precision to avoid overflow
  const scaleFactor = BigInt(1_280_000_000_000_000_000_000n); // Scale factor in BigInt
  const scaledResult = (square * BigInt(10 ** 12)) / scaleFactor; // Scale up by 10^12 for precision, then divide

  // Final result: Adjust according to DEFAULT_DECIMAL = 2
  const finalResult =
    scaledResult / BigInt(10 ** Number(12 - DEFAULT_MINT_DECIMALS)); // Adjust based on DEFAULT_DECIMAL

  return Number(finalResult); // Convert to Number at the end
}

export function useGetLiquidityPool({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-liquidity-pool',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      if (!mint) return null;
      const [liquidityPool] = PublicKey.findProgramAddressSync(
        [Buffer.from('liquidity_pool'), mint.toBuffer()],
        program.programId
      );
      return await program.account.liquidityPool.fetch(liquidityPool);
    },
    enabled: !!mint,
  });
}
export function useGetLargestAccountFromMint({
  mint,
  tokenProgram,
}: {
  mint: PublicKey | null;
  tokenProgram: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'get-largest-token-accounts-from-mint',
      { endpoint: connection.rpcEndpoint, mint, tokenProgram },
    ],
    queryFn: async () => {
      if (!mint || !tokenProgram) return null;
      const result = await connection.getTokenLargestAccounts(
        mint,
        'confirmed'
      );
      const accounts = await getMultipleAccounts(
        connection,
        result.value.map((x) => x.address),
        undefined,
        tokenProgram
      );
      return accounts;
    },
    staleTime: SHORT_STALE_TIME,
    enabled: !!mint && !!tokenProgram,
  });
}
