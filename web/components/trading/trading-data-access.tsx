import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  NATIVE_MINT,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const { publicKey, signTransaction } = useWallet();

  return useMutation({
    mutationKey: [
      'swap-mint',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({
      // poolState,
      amount,
      inputMint,
      outputMint,
      swapMode,
    }: {
      // poolState: any | undefined;
      inputMint: string;
      outputMint: string;
      amount: number;
      swapMode: string;
    }) => {
      if (!mint || !tokenProgram || !publicKey || !signTransaction) return null;
      let signature: TransactionSignature = '';
      try {
        let payload = {
          // quoteResponse from /quote api
          quoteResponse: await (
            await fetch(
              `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toString()}&slippageBps=50&swapMode=${swapMode}`
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
        var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        signature = await buildAndSendTransaction({
          connection: connection,
          publicKey: publicKey,
          signTransaction: signTransaction,
          partialSignedTx: transaction,
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
    mutationFn: async (subscribeOnly: boolean) => {
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
      if (subscribeOnly && !ixs) {
        toast.error('Already Subscribed');
        return;
      }
      if (account && !subscribeOnly) {
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
