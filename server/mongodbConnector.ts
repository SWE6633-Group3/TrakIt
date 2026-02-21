import { MongoClient, Db } from 'mongodb';

let db: Db | null = null;
let client: MongoClient | null = null;

export async function connectToDatabase(uri: string, dbName: string) {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB:', dbName);
  
  process.on('exit', async () => {
    await closeDatabase();
    console.log('MongoDB connection closed due to process exit');
  });
  process.on('SIGINT', async () => {
    await closeDatabase();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });

  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connectToDatabase first.');
  return db;
}

export async function closeDatabase() {
  if (client) await client.close();
  db = null;
  client = null;
}