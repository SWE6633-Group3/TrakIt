import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase, getDb } from './mongodbConnector.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB ?? 'trackit';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

app.get('/api/hello', async (req, res) => {
  // example read from a collection called "messages"
  try {
    const db = getDb();
    const one = await db.collection('messages').findOne({});
    res.json({ message: 'Hello from the server!', sample: one ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

connectToDatabase(MONGO_URI, MONGO_DB)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });