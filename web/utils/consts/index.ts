import { PublicKey } from '@solana/web3.js';

export const LONG_STALE_TIME = 24 * 60 * 60 * 1000;

export const MEDIUM_STALE_TIME = 60 * 60 * 1000;

export const SHORT_STALE_TIME = 15 * 60 * 1000;

export const NATIVE_MINT_DECIMALS = 9;

export const DEFAULT_MINT_DECIMALS = 0;

export const ADDRESS_LOOKUP_TABLE = new PublicKey(
  '49vVdqGZ8BfxtJFkY4oaWVhGgwhFkC27FWZki5S93vS7'
);
export const COST_PER_NO_RENT_TRANSFER_IN_SOL = 0.000005;

export const PROGRAM_ID = new PublicKey(
  '2fuSFHGb38TefYzzNmqCLE6iXffQ2HhgAS3cvsmgmGUR'
);
