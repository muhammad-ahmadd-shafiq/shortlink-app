import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import { createClient } from 'redis';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// --- Postgres pool ---
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// --- Redis client ---
const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});
redis.on('error', (err) => console.error('Redis error:', err));

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      code TEXT PRIMARY KEY,
      original_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      click_count INTEGER DEFAULT 0
    );
  `);
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create a short link
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    new URL(url); // validates format
  } catch {
    return res.status(400).json({ error: 'invalid url' });
  }

  const code = nanoid(7);
  await pool.query(
    'INSERT INTO links (code, original_url) VALUES ($1, $2)',
    [code, url]
  );
  await redis.set(code, url, { EX: 3600 }); // cache for 1 hour

  res.status(201).json({ code, short_url: `${BASE_URL}/${code}` });
});

// Redirect + click tracking
app.get('/:code', async (req, res) => {
  const { code } = req.params;

  let originalUrl = await redis.get(code);

  if (!originalUrl) {
    const result = await pool.query(
      'SELECT original_url FROM links WHERE code = $1',
      [code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    originalUrl = result.rows[0].original_url;
    await redis.set(code, originalUrl, { EX: 3600 });
  }

  pool
    .query('UPDATE links SET click_count = click_count + 1 WHERE code = $1', [code])
    .catch((err) => console.error('click count update failed:', err));

  res.redirect(originalUrl);
});

// Stats
app.get('/api/stats/:code', async (req, res) => {
  const result = await pool.query(
    'SELECT code, original_url, created_at, click_count FROM links WHERE code = $1',
    [req.params.code]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
  res.json(result.rows[0]);
});

async function start() {
  await redis.connect();
  await initDb();
  app.listen(PORT, () => console.log(`ShortLink API listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
