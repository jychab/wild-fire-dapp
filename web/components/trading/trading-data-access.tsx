import { OFF_SET, USDC, USDC_DECIMALS } from '@/utils/consts';
import { db } from '@/utils/firebase/firebase';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import {
  initializePool,
  program,
  swapBaseInput,
  swapBaseOutput,
  swapProgram,
} from '@/utils/helper/transcationInstructions';
import { BN } from '@coral-xyz/anchor';
import {
  Account,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTransactionToast } from '../ui/ui-layout';

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

export function useGetPoolState({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-pool-state', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      return swapProgram.account.poolState.fetch(getPool(mint));
    },
    enabled: !!mint,
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
            collection(db, `Trading/${mint}/Ohlcv`),
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

export function useGetPrice({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-price', { endpoint: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      const usdcVault = await getAccount(
        connection,
        getUSDCVault(mint),
        undefined,
        TOKEN_PROGRAM_ID
      );
      const mintVault = await getAccount(
        connection,
        getMintVault(mint),
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      const poolState = await swapProgram.account.poolState.fetch(
        getPool(mint)
      );

      const result =
        usdcVault.amount -
        BigInt(Number(poolState.creatorFeesTokenUsdc)) -
        BigInt(Number(poolState.protocolFeesTokenUsdc)) +
        OFF_SET /
          (mintVault.amount -
            BigInt(Number(poolState.creatorFeesTokenMint)) -
            BigInt(Number(poolState.protocolFeesTokenMint)));

      return Number(result) / 10 ** USDC_DECIMALS;
    },
    enabled: !!mint,
    staleTime: 15 * 60 * 1000,
  });
}

export function useSwapMutation({ mint }: { mint: PublicKey | null }) {
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
      amount,
      inputMint,
      outputMint,
      swapMode,
    }: {
      inputMint: string;
      outputMint: string;
      amount: number;
      swapMode: string;
    }) => {
      if (!mint || !publicKey || !signTransaction) return null;
      let signature: TransactionSignature = '';
      try {
        let instructions = [];

        if (swapMode == 'ExactIn') {
          instructions.push(
            ...(await swapBaseInput(
              program.provider.connection,
              publicKey,
              mint,
              amount,
              new PublicKey(inputMint),
              inputMint == USDC.toBase58()
                ? TOKEN_PROGRAM_ID
                : TOKEN_2022_PROGRAM_ID,
              new PublicKey(outputMint),
              outputMint == USDC.toBase58()
                ? TOKEN_PROGRAM_ID
                : TOKEN_2022_PROGRAM_ID
            ))
          );
        } else {
          instructions.push(
            ...(await swapBaseOutput(
              program.provider.connection,
              publicKey,
              mint,
              amount,
              new PublicKey(inputMint),
              inputMint == USDC.toBase58()
                ? TOKEN_PROGRAM_ID
                : TOKEN_2022_PROGRAM_ID,
              new PublicKey(outputMint),
              outputMint == USDC.toBase58()
                ? TOKEN_PROGRAM_ID
                : TOKEN_2022_PROGRAM_ID
            ))
          );
        }

        // const [feeAccount] = PublicKey.findProgramAddressSync(
        //   [
        //     Buffer.from('referral_ata'),
        //     REFERRAL_KEY.toBuffer(),
        //     NATIVE_MINT.toBuffer(),
        //   ],
        //   new PublicKey('REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3')
        // );
        // let payload;
        // payload = {
        //   // quoteResponse from /quote api
        //   quoteResponse,
        //   // user public key to be used for the swap
        //   userPublicKey: publicKey.toString(),
        //   // auto wrap and unwrap SOL. default is true
        //   wrapAndUnwrapSol: true,
        //   // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
        // };
        // if (
        //   (swapMode == 'ExactIn' && outputMint == NATIVE_MINT.toBase58()) ||
        //   (swapMode == 'ExactOut' && inputMint == NATIVE_MINT.toBase58())
        // ) {
        //   payload = { ...payload, feeAccount };
        // }
        // // get serialized transactions for the swap
        // const { swapTransaction } = await (
        //   await fetch('https://quote-api.jup.ag/v6/swap', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(payload),
        //   })
        // ).json();
        // // deserialize the transaction
        // const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        // var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        signature = await buildAndSendTransaction({
          connection: connection,
          publicKey: publicKey,
          signTransaction: signTransaction,
          ixs: instructions,
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
              'get-address-token-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: getUSDCVault(mint!),
              },
            ],
          }),
          client.invalidateQueries({
            queryKey: ['get-price', { endpoint: connection.rpcEndpoint, mint }],
          }),
          client.invalidateQueries({
            queryKey: [
              'get-address-token-account-info',
              {
                endpoint: connection.rpcEndpoint,
                address: getAssociatedTokenAddressSync(
                  USDC,
                  publicKey!,
                  false,
                  TOKEN_PROGRAM_ID
                ),
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
                  TOKEN_2022_PROGRAM_ID
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

export function getMintVault(mint: PublicKey) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    swapProgram.programId
  );
  const [mintVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), mint.toBuffer()],
    swapProgram.programId
  );

  return mintVault;
}

export function getUSDCVault(mint: PublicKey) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    swapProgram.programId
  );
  const [usdcVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_vault'), poolAddress.toBuffer(), USDC.toBuffer()],
    swapProgram.programId
  );

  return usdcVault;
}

export function getPool(mint: PublicKey) {
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mint.toBuffer()],
    swapProgram.programId
  );

  return poolAddress;
}

export async function getQuote(
  connection: Connection,
  mint: PublicKey,
  mintVault: Account,
  usdcVault: Account,
  poolState: {
    creatorFeesTokenMint: BN;
    creatorFeesTokenUsdc: BN;
    protocolFeesTokenMint: BN;
    protocolFeesTokenUsdc: BN;
  },
  inputMint: string,
  amount: bigint,
  swapMode: string
) {
  if (swapMode == 'ExactIn') {
    if (inputMint == USDC.toBase58()) {
      return calculateMintAmountGivenUSDC(
        mintVault.amount -
          BigInt(Number(poolState.creatorFeesTokenMint)) -
          BigInt(Number(poolState.protocolFeesTokenMint)),
        usdcVault.amount -
          BigInt(Number(poolState.creatorFeesTokenUsdc)) -
          BigInt(Number(poolState.protocolFeesTokenUsdc)),
        OFF_SET,
        amount
      );
    } else {
      return calculateUSDCAmountGivenMint(
        mintVault.amount -
          BigInt(Number(poolState.creatorFeesTokenMint)) -
          BigInt(Number(poolState.protocolFeesTokenMint)),
        usdcVault.amount -
          BigInt(Number(poolState.creatorFeesTokenUsdc)) -
          BigInt(Number(poolState.protocolFeesTokenUsdc)),
        OFF_SET,
        amount
      );
    }
  } else {
    return BigInt(0);
  }

  // return await (
  //   await fetch(
  //     `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&swapMode=${swapMode}${
  //       swapMode == 'ExactIn'
  //         ? outputMint == NATIVE_MINT.toBase58()
  //           ? '&platformFeeBps=20'
  //           : ''
  //         : inputMint == NATIVE_MINT.toBase58()
  //         ? '&platformFeeBps=20'
  //         : ''
  //     }`
  //   )
  // ).json();
}

export function useIsLiquidityPoolFound({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'check-liquidity-pool-status',
      { endpoint: connection.rpcEndpoint, mint },
    ],
    queryFn: async () => {
      if (!mint) return null;
      return true;
      // const result = await (
      //   await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`)
      // ).json();
      // return result.data[mint.toBase58()] != undefined;
    },
    enabled: !!mint,
  });
}

export function getAssociatedTokenStateAccount(mint: PublicKey) {
  const [tokenState] = PublicKey.findProgramAddressSync(
    [Buffer.from('token'), mint.toBuffer()],
    program.programId
  );

  return tokenState;
}

export function useCreatePoolMutation({ mint }: { mint: PublicKey | null }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();
  const { publicKey, signTransaction } = useWallet();

  return useMutation({
    mutationKey: [
      'initialize-pool',
      {
        endpoint: connection.rpcEndpoint,
        mint,
      },
    ],
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!mint || !publicKey || !signTransaction) return null;
      let signature: TransactionSignature = '';
      try {
        let instructions = await initializePool(
          connection,
          mint,
          publicKey,
          publicKey,
          amount,
          Number(OFF_SET)
        );

        signature = await buildAndSendTransaction({
          connection: connection,
          publicKey: publicKey,
          signTransaction: signTransaction,
          ixs: instructions,
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
            queryKey: ['get-price', { endpoint: connection.rpcEndpoint, mint }],
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
                  TOKEN_2022_PROGRAM_ID
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

export function calculateUSDCAmountGivenMint(
  mintSupply: bigint,
  usdcSupply: bigint,
  off_set: bigint,
  amount: bigint
) {
  amount = (amount * BigInt(99)) / BigInt(100); // trading fee
  const numerator = amount * (usdcSupply + off_set);
  const denominator = mintSupply + amount;
  return numerator / denominator;
}

export function calculateMintAmountGivenUSDC(
  mintSupply: bigint,
  usdcSupply: bigint,
  off_set: bigint,
  amount: bigint
) {
  amount = (amount * BigInt(99)) / BigInt(100); // trading fee
  const numerator = amount * mintSupply;
  const denominator = usdcSupply + off_set + amount;
  const result = numerator / denominator;
  return result;
}
