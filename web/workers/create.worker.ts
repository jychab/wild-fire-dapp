import * as web3 from '@solana/web3.js';
import { expose } from 'comlink';
import * as airdropsender from 'helius-airship-core';
import { configureDatabase, sqlDb } from './db'; // Adjust the import path as needed

export const create = async (
  signer: string,
  addresses: string[],
  amount: bigint,
  mintAddress: string
) => {
  await configureDatabase();
  // Call the airdrop sender function
  await airdropsender.create({
    db: sqlDb,
    signer: new web3.PublicKey(signer),
    addresses: addresses.map((address) => new web3.PublicKey(address)),
    amount,
    mintAddress: new web3.PublicKey(mintAddress),
  });
};

// Expose the create function using Comlink
expose({ create });
