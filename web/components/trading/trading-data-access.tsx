import { REFERRAL_KEY } from '@/utils/consts';
import { buildAndSendTransaction } from '@/utils/helper/transactionBuilder';
import { program } from '@/utils/helper/transcationInstructions';
import {
  getAccount,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      const quoteResponse = await getQuote(
        inputMint,
        outputMint,
        amount,
        swapMode
      );
      const [feeAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('referral_ata'),
          REFERRAL_KEY.toBuffer(),
          NATIVE_MINT.toBuffer(),
        ],
        new PublicKey('REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3')
      );
      let payload;
      payload = {
        // quoteResponse from /quote api
        quoteResponse,
        // user public key to be used for the swap
        userPublicKey: publicKey.toString(),
        // auto wrap and unwrap SOL. default is true
        wrapAndUnwrapSol: true,
        // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
      };
      if (
        (swapMode == 'ExactIn' && outputMint == NATIVE_MINT.toBase58()) ||
        (swapMode == 'ExactOut' && inputMint == NATIVE_MINT.toBase58())
      ) {
        payload = { ...payload, feeAccount };
      }
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

      const txSig = await buildAndSendTransaction({
        connection: connection,
        publicKey: publicKey,
        signTransaction: signTransaction,
        partialSignedTx: transaction,
      });

      return txSig;
    },

    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
        return Promise.all([
          client.invalidateQueries({
            queryKey: [
              'get-address-account-info',
              { endpoint: connection.rpcEndpoint, address: publicKey },
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

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  swapMode: string
) {
  return await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&swapMode=${swapMode}${
        swapMode == 'ExactIn'
          ? outputMint == NATIVE_MINT.toBase58()
            ? '&platformFeeBps=20'
            : ''
          : inputMint == NATIVE_MINT.toBase58()
          ? '&platformFeeBps=20'
          : ''
      }`
    )
  ).json();
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
      const result = await (
        await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}`)
      ).json();
      return result.data?.price != undefined;
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
