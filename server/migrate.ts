import dotenv from 'dotenv';
import { connectToDatabase, closeDatabase } from './sqliteConnector.js';

dotenv.config();

const SQLITE_DB = process.env.SQLITE_DB ?? 'trackit.db';

connectToDatabase(SQLITE_DB)
  .then(async () => {
    await closeDatabase();
    console.log('Migrations complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
  });
