import { MongoClient, Db } from 'mongodb';

let db: Db | null = null;
let client: MongoClient | null = null;

export async function connectToDatabase(uri: string, dbName: string) {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log('Connected to MongoDB:', dbName);
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