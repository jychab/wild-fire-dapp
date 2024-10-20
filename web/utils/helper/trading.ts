import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { SCALE } from '../consts';
import { program } from '../program/instructions';

function integerCubeRoot(n: bigint): bigint {
  // Use a binary search method to find the cube root of a BigInt
  let low = BigInt(0);
  let high = n;
  while (low < high) {
    const mid = (low + high + BigInt(1)) >> BigInt(1);
    if (mid * mid * mid > n) {
      high = mid - BigInt(1);
    } else {
      low = mid;
    }
  }
  return low;
}

export function calculateAmountOut(
  amount: bigint,
  fees: bigint,
  reserveTokenSold: bigint,
  scale: bigint = SCALE,
  threshold: bigint = BigInt(70_000_000_000)
): bigint {
  const FEE_DIVISOR = BigInt(10_000);
  const amountAfterFees = (amount * (FEE_DIVISOR - fees)) / FEE_DIVISOR;
  const term =
    amountAfterFees * (BigInt(3) * scale) + reserveTokenSold ** BigInt(3);
  const cubeRootTerm = integerCubeRoot(term);
  const amountOut = cubeRootTerm - reserveTokenSold;
  return amountOut > threshold - reserveTokenSold
    ? threshold - reserveTokenSold
    : amountOut;
}

export function calculateAmountLamports(
  amount: bigint,
  fees: bigint,
  reserveTokenSold: bigint,
  scale: bigint = SCALE
): bigint {
  const FEE_DIVISOR = BigInt(10_000);
  const amountAfterFees = (amount * (FEE_DIVISOR - fees)) / FEE_DIVISOR;
  if (amountAfterFees > reserveTokenSold) {
    return BigInt(0);
  }
  const reserveTokenSoldCubed = reserveTokenSold ** BigInt(3);
  const reserveAfterFeesCubed =
    (reserveTokenSold - amountAfterFees) ** BigInt(3);
  const differenceCubed = reserveTokenSoldCubed - reserveAfterFeesCubed;
  const denominator = scale * BigInt(3);
  const amountLamports = differenceCubed / denominator;

  return amountLamports;
}

export const getAddressLookupTableAccounts = async (
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos =
    await program.provider.connection.getMultipleAccountsInfo(
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
};

export const deserializeInstruction = (instruction: {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string;
}) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, 'base64'),
  });
};
