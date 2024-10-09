import { configureDatabase } from '@/components/airdrop/utils';
import { Keypair } from '@solana/web3.js';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as airdropsender from 'helius-airship-core';
import { SQLocalDrizzle } from 'sqlocal/drizzle';

const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: airdropsender.databaseFile,
  verbose: false,
});

const sqlDb = drizzle(driver, batchDriver);
self.onmessage = async (e: MessageEvent<any>) => {
  const { privateKey, rpcUrl } = e.data;

  const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  try {
    await configureDatabase(sqlDb);

    await airdropsender.send({
      db: sqlDb,
      keypair,
      url: rpcUrl,
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
