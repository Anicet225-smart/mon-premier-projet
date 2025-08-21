import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config(); // charge .env

const app = express();
app.use(cors());
app.use(express.json());

// Connexion Postgres via .env
// Exemple de .env : DATABASE_URL=postgres://admin:admNi123@localhost:5432/appdb
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ping
app.get('/', (_req, res) => {
  res.send('✅ Serveur Node/Express connecté !');
});

// Lire les notes
app.get('/api/notes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, content, created_at FROM notes ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une note
app.post('/api/notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content requis' });

    const { rows } = await pool.query(
      'INSERT INTO notes(content) VALUES($1) RETURNING id, content, created_at',
      [content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 Serveur lancé sur http://localhost:${port}`)
);
