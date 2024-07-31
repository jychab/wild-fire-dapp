import { PublicKey } from '@solana/web3.js';

export const HASHFEED_MINT = new PublicKey(
  'CtiPMWDvrYm8SaWwuVJWWbq9qHCsGZjxVi4RShrgtyCY'
);

export const LONG_STALE_TIME = 24 * 60 * 60 * 1000;

export const MEDIUM_STALE_TIME = 60 * 60 * 1000;

export const SHORT_STALE_TIME = 15 * 60 * 1000;

export const U32_MAX = BigInt(4294967296);

export const USDC = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);

export const USDC_DECIMALS = 6;

export const OFF_SET = BigInt(1000 * 10 ** USDC_DECIMALS);

export const CONFIG = new PublicKey(
  'HGJmF15t1JjkPizvWM6wG5zg5MHLgPrz5WBAVe6VdQAT'
);

export const ONE_BILLION = 1_000_000_000;

export const AMOUNT_RESERVE = ONE_BILLION * 0.1;

export const AMOUNT_CREATOR = ONE_BILLION * 0.9;

export const AMOUNT_LIQUIDITY_POOL = ONE_BILLION * 0.85;

export const ADDRESS_LOOKUP_TABLE = new PublicKey(
  '49vVdqGZ8BfxtJFkY4oaWVhGgwhFkC27FWZki5S93vS7'
);

export const ONBOARDING_WALLET = new PublicKey(
  '7K2SANnkAuEb385d8YtyC6s4v44xD4pwWZ1H82UdcNNF'
);

export const REFERRAL_KEY = new PublicKey(
  '6k6ELxTcnT7NVAhxEZ3wV6n6VsxdgXXzG1ehr1GqAbdr'
);
