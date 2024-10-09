import { configureDatabase } from '@/components/airdrop/utils';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as airdropsender from 'helius-airship-core';
import { SQLocalDrizzle } from 'sqlocal/drizzle';

const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: airdropsender.databaseFile,
  verbose: false,
});

const sqlDb = drizzle(driver, batchDriver);
self.onmessage = async (e: MessageEvent<any>) => {
  const { rpcUrl } = e.data;

  try {
    await configureDatabase(sqlDb);

    await airdropsender.poll({ db: sqlDb, url: rpcUrl });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
