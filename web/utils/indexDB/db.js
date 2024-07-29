import Dexie from 'dexie';

const db = new Dexie('HashFeedDB');
db.version(1).stores({
  queries: 'key, data', // Example schema
});

export default db;
