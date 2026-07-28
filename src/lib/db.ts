import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { seedGames } from "@/lib/seed-data";

const configuredDatabasePath = process.env.JOYCIRCUIT_DB_PATH?.trim();
const databasePath = configuredDatabasePath
  ? path.resolve(configuredDatabasePath)
  : path.join(process.cwd(), "data", "joycircuit.db");
const dataDirectory = path.dirname(databasePath);

type GlobalWithJoyCircuitDb = typeof globalThis & {
  __joyCircuitDb?: DatabaseSync;
};

const globalForDb = globalThis as GlobalWithJoyCircuitDb;

function createDatabase(): DatabaseSync {
  mkdirSync(dataDirectory, { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA busy_timeout = 5000");

  database.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT NOT NULL,
      developer_name TEXT NOT NULL,
      developer_website TEXT,
      embed_url TEXT,
      thumbnail_url TEXT NOT NULL,
      cover_url TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL,
      orientation TEXT NOT NULL,
      input_modes_json TEXT NOT NULL,
      multiplayer_mode TEXT NOT NULL,
      age_rating TEXT NOT NULL,
      status TEXT NOT NULL,
      featured_rank INTEGER,
      license_type TEXT NOT NULL,
      license_proof_url TEXT NOT NULL,
      rights_expires_at TEXT,
      published_at TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      accent TEXT NOT NULL,
      catalog_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      game_id INTEGER NOT NULL,
      visitor_id TEXT,
      started_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS play_sessions_game_id_idx
      ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS play_sessions_created_at_idx
      ON play_sessions(created_at);

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      game_id INTEGER NOT NULL,
      reporter_id TEXT,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS reports_game_id_idx ON reports(game_id);
    CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
  `);

  const gameColumns = database.prepare("PRAGMA table_info(games)").all() as Array<{
    name: string;
  }>;
  if (!gameColumns.some((column) => column.name === "catalog_active")) {
    database.exec("ALTER TABLE games ADD COLUMN catalog_active INTEGER NOT NULL DEFAULT 1");
  }

  seedDatabase(database);
  return database;
}

function seedDatabase(database: DatabaseSync): void {
  const seedHash = createHash("sha256").update(JSON.stringify(seedGames)).digest("hex");
  const readSeedHash = database.prepare("SELECT value FROM app_meta WHERE key = 'seed_hash' LIMIT 1");
  const currentSeed = readSeedHash.get() as { value: string } | undefined;
  if (currentSeed?.value === seedHash) return;

  const upsert = database.prepare(`
    INSERT INTO games (
      slug, title, tagline, description, instructions,
      developer_name, developer_website, embed_url,
      thumbnail_url, cover_url, aspect_ratio, orientation,
      input_modes_json, multiplayer_mode, age_rating, status,
      featured_rank, license_type, license_proof_url, rights_expires_at,
      published_at, categories_json, tags_json, accent, catalog_active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1
    )
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      tagline = excluded.tagline,
      description = excluded.description,
      instructions = excluded.instructions,
      developer_name = excluded.developer_name,
      developer_website = excluded.developer_website,
      embed_url = excluded.embed_url,
      thumbnail_url = excluded.thumbnail_url,
      cover_url = excluded.cover_url,
      aspect_ratio = excluded.aspect_ratio,
      orientation = excluded.orientation,
      input_modes_json = excluded.input_modes_json,
      multiplayer_mode = excluded.multiplayer_mode,
      age_rating = excluded.age_rating,
      status = excluded.status,
      featured_rank = excluded.featured_rank,
      license_type = excluded.license_type,
      license_proof_url = excluded.license_proof_url,
      rights_expires_at = excluded.rights_expires_at,
      published_at = excluded.published_at,
      categories_json = excluded.categories_json,
      tags_json = excluded.tags_json,
      accent = excluded.accent,
      catalog_active = 1
  `);

  database.exec("BEGIN IMMEDIATE");
  try {
    const lockedSeed = readSeedHash.get() as { value: string } | undefined;
    if (lockedSeed?.value === seedHash) {
      database.exec("COMMIT");
      return;
    }

    database.exec("UPDATE games SET catalog_active = 0");
    for (const game of seedGames) {
      upsert.run(
        game.slug,
        game.title,
        game.tagline,
        game.description,
        game.instructions,
        game.developer.name,
        game.developer.website,
        game.embedUrl,
        game.thumbnailUrl,
        game.coverUrl,
        game.aspectRatio,
        game.orientation,
        JSON.stringify(game.inputModes),
        game.multiplayerMode,
        game.ageRating,
        game.status,
        game.featuredRank,
        game.license.type,
        game.license.proofUrl,
        game.license.rightsExpiresAt,
        game.publishedAt,
        JSON.stringify(game.categories),
        JSON.stringify(game.tags),
        game.accent,
      );
    }

    database.exec(`
      DELETE FROM games
      WHERE catalog_active = 0
        AND NOT EXISTS (
          SELECT 1 FROM play_sessions WHERE play_sessions.game_id = games.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM reports WHERE reports.game_id = games.id
        )
    `);
    database.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('seed_hash', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(seedHash);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getDatabase(): DatabaseSync {
  globalForDb.__joyCircuitDb ??= createDatabase();
  return globalForDb.__joyCircuitDb;
}

export { databasePath };
