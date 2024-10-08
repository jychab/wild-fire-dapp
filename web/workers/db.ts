import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { databaseFile } from 'helius-airship-core';
import { SQLocalDrizzle } from 'sqlocal/drizzle';

// Database setup
const { driver, batchDriver } = new SQLocalDrizzle({
  databasePath: databaseFile,
  verbose: false,
});

export const sqlDb = drizzle(driver, batchDriver);

export async function configureDatabase() {
  await sqlDb.run(sql`PRAGMA journal_mode = WAL;`);
  await sqlDb.run(sql`PRAGMA synchronous = normal;`);
}
