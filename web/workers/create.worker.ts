import { configureDatabase } from '@/components/airdrop/utils';
import * as web3 from '@solana/web3.js';
import { expose } from 'comlink';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as airdropsender from 'helius-airship-core';
import { SQLocalDrizzle } from 'sqlocal/drizzle';

const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: airdropsender.databaseFile,
  verbose: false,
});

const sqlDb = drizzle(driver, batchDriver);

export const create = async (
  signer: string,
  addresses: string[],
  amount: bigint,
  mintAddress: string
) => {
  await configureDatabase(sqlDb);
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
