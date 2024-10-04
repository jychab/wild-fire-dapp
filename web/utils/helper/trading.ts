import { SCALE } from '../consts';

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
  scale: bigint = SCALE
): bigint {
  const FEE_DIVISOR = BigInt(10_000);

  // Step 1: Calculate amount_after_fees
  const amountAfterFees = (amount * (FEE_DIVISOR - fees)) / FEE_DIVISOR;

  // Step 2: Calculate term
  const term =
    amountAfterFees * (BigInt(3) * scale) + reserveTokenSold ** BigInt(3);

  // Step 3: Calculate cube root of term and find amount_out
  const cubeRootTerm = integerCubeRoot(term);
  const amountOut = cubeRootTerm - reserveTokenSold;

  // Return the amount_out as a BigInt
  return amountOut > BigInt(70_000_000_000) - reserveTokenSold
    ? BigInt(700_000_000) - reserveTokenSold
    : amountOut;
}

export function calculateAmountLamports(
  amount: bigint,
  fees: bigint,
  reserveTokenSold: bigint,
  scale: bigint = SCALE
): bigint {
  const FEE_DIVISOR = BigInt(10_000);

  // Step 1: Calculate amount_after_fees
  const amountAfterFees = (amount * (FEE_DIVISOR - fees)) / FEE_DIVISOR;

  if (amountAfterFees > reserveTokenSold) {
    return BigInt(0);
  }

  // Step 2: Calculate reserve_token_sold^3
  const reserveTokenSoldCubed = reserveTokenSold ** BigInt(3);

  // Step 3: Calculate (reserve_token_sold - amount_after_fees)^3
  const reserveAfterFeesCubed =
    (reserveTokenSold - amountAfterFees) ** BigInt(3);

  // Step 4: Subtract the two cubed values
  const differenceCubed = reserveTokenSoldCubed - reserveAfterFeesCubed;
  // Step 5: Divide by (SCALE * 3)
  const denominator = scale * BigInt(3);
  const amountLamports = differenceCubed / denominator;

  return amountLamports;
}
