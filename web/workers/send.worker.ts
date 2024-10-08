import { Keypair } from '@solana/web3.js';
import * as airdropsender from 'helius-airship-core';
import { configureDatabase, sqlDb } from './db';

self.onmessage = async (e: MessageEvent<any>) => {
  const { privateKey, rpcUrl } = e.data;

  const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
  try {
    await configureDatabase();

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
