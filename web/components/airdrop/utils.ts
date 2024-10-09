import { sql } from 'drizzle-orm';

export async function configureDatabase(db: any) {
  await db.run(sql`PRAGMA journal_mode = WAL;`);
  await db.run(sql`PRAGMA synchronous = normal;`);
}
