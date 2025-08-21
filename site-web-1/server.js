// server.js (ESM)
// Frontend statique + API /api/notes avec PostgreSQL

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware
app.use(cors());
app.use(express.json());           // JSON pour les POST
app.use(express.static("public")); // sert /public (index.html, style.css, app.js)

// --- Connexion PostgreSQL
// .env : DATABASE_URL=postgres://admin:admin123@localhost:5432/appdb
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // <= uniquement si vous êtes sur un hébergeur qui l'exige
});

// Optionnel : s’assurer que la table existe au démarrage
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id BIGSERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
ensureSchema().catch((err) => {
  console.error("Erreur init DB:", err);
  process.exit(1);
});

// --- Routes API
app.get("/api/notes", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, content, created_at FROM notes ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "content requis" });
    }
    const { rows } = await pool.query(
      "INSERT INTO notes(content) VALUES($1) RETURNING id, content, created_at",
      [content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  // Sécurité : empêcher les ID non numériques
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'id invalide' });

  try {
    const { rowCount, rows } = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING id',
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Note introuvable' });
    res.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Petit endpoint de santé (facultatif)
app.get("/health", (_req, res) => {
  res.send("✅ Serveur Node/Express connecté !");
});

// --- Lancement serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});

