import db from './db';

const indexedDbPersister = {
  async getItem(key) {
    const data = await db.queries.get(key);
    return data ? data.data : undefined;
  },
  async setItem(key, value) {
    await db.queries.put({ key, data: value });
  },
  async removeItem(key) {
    await db.queries.delete(key);
  },
};

export default indexedDbPersister;
