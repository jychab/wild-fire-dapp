import * as airdropsender from 'helius-airship-core';
import { configureDatabase, sqlDb } from './db';

self.onmessage = async (e: MessageEvent<any>) => {
  const { rpcUrl } = e.data;

  try {
    await configureDatabase();

    await airdropsender.poll({ db: sqlDb, url: rpcUrl });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
