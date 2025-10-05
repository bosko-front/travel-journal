// db/index.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDb() {
    db = await SQLite.openDatabaseAsync('travel_journal.db');

    // Base schema (idempotent)
    await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      note TEXT,
      date_iso TEXT NOT NULL,
      lat REAL,
      lng REAL,
      place_name TEXT,
      locality TEXT,
      country_code TEXT,
      weather_temp REAL,
      weather_desc TEXT,
      weather_icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(entry_id) REFERENCES entries(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_photos_entry ON photos(entry_id);
  `);

    // Best-effort migrations for older DBs (ignore errors if columns already exist)
    await db.execAsync(`ALTER TABLE entries ADD COLUMN place_name TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE entries ADD COLUMN locality TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE entries ADD COLUMN country_code TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE entries ADD COLUMN weather_temp REAL;`).catch(() => {});
    await db.execAsync(`ALTER TABLE entries ADD COLUMN weather_desc TEXT;`).catch(() => {});
    await db.execAsync(`ALTER TABLE entries ADD COLUMN weather_icon TEXT;`).catch(() => {});
}

export const listEntries = async (q?: string) => {
    if (q?.trim()) {
        const like = `%${q.trim()}%`;
        return db.getAllAsync(
            `
                SELECT * FROM entries
                WHERE
                    title     LIKE ? OR
                    note      LIKE ? OR
                    place_name LIKE ? OR
                    locality   LIKE ? OR
                    weather_desc LIKE ?
                ORDER BY date_iso DESC, created_at DESC
            `,
            [like, like, like, like, like]
        );
    }
    return db.getAllAsync(
        `SELECT * FROM entries ORDER BY date_iso DESC, created_at DESC`
    );
};

export const createEntryTx = async (
    payload: {
        title: string;
        note?: string | null;
        date_iso: string;
        lat?: number | null;
        lng?: number | null;
        place_name?: string | null;
        locality?: string | null;
        country_code?: string | null;
        weather?: {
            temp: number;
            desc: string;
            icon: string;
        } | null;
    },
    photoUris: string[]
) => {
    const now = new Date().toISOString();

    const res = await db.runAsync(
        `
            INSERT INTO entries
            (title, note, date_iso, lat, lng, place_name, locality, country_code,
             weather_temp, weather_desc, weather_icon, created_at, updated_at)
            VALUES
                (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
        [
            payload.title.trim(),
            payload.note ?? null,
            payload.date_iso,
            payload.lat ?? null,
            payload.lng ?? null,
            payload.place_name ?? null,
            payload.locality ?? null,
            payload.country_code ?? null,
            payload.weather?.temp ?? null,
            payload.weather?.desc ?? null,
            payload.weather?.icon ?? null,
            now,
            now,
        ]
    );

    const id = res.lastInsertRowId!;
    for (const uri of photoUris) {
        await db.runAsync(
            `INSERT INTO photos (entry_id, uri, created_at) VALUES (?,?,?)`,
            [id, uri, now]
        );
    }
    return id;
};

export const getEntry = async (id: number) => {
    const entry = await db.getFirstAsync(
        `SELECT * FROM entries WHERE id = ?`,
        [id]
    );
    const photos = await db.getAllAsync(
        `SELECT * FROM photos WHERE entry_id = ? ORDER BY created_at ASC`,
        [id]
    );
    return { entry, photos };
};

export const addPhotosToEntry = async (entryId: number, uris: string[]) => {
    const now = new Date().toISOString();
    for (const uri of uris) {
        await db.runAsync(
            `INSERT INTO photos (entry_id, uri, created_at) VALUES (?,?,?)`,
            [entryId, uri, now]
        );
    }
};

export const deletePhoto = async (photoId: number) => {
    await db.runAsync(`DELETE FROM photos WHERE id = ?`, [photoId]);
};

export const deleteEntry = async (id: number) => {
    // photos will be removed via ON DELETE CASCADE
    await db.runAsync(`DELETE FROM entries WHERE id = ?`, [id]);
};

// === Updates ===

// Note-only updater (avoids undefined params)
export const updateEntryNote = async (id: number, note: string | null) => {
    const now = new Date().toISOString();
    await db.runAsync(
        `UPDATE entries SET note = ?, updated_at = ? WHERE id = ?`,
        [note, now, id]
    );
};

// Generic patch updater (only sets provided fields; null clears)
type EntryPatch = {
    title?: string | null;
    note?: string | null;
    date_iso?: string | null;
    lat?: number | null;
    lng?: number | null;
    place_name?: string | null;
    locality?: string | null;
    country_code?: string | null;
    weather_temp?: number | null;
    weather_desc?: string | null;
    weather_icon?: string | null;
};

export const updateEntry = async (id: number, patch: EntryPatch) => {
    const sets: string[] = [];
    const params: (string | number | null)[] = [];

    if ('title' in patch)        { sets.push('title = ?');        params.push(patch.title ?? null); }
    if ('note' in patch)         { sets.push('note = ?');         params.push(patch.note ?? null); }
    if ('date_iso' in patch)     { sets.push('date_iso = ?');     params.push(patch.date_iso ?? null); }
    if ('lat' in patch)          { sets.push('lat = ?');          params.push(patch.lat ?? null); }
    if ('lng' in patch)          { sets.push('lng = ?');          params.push(patch.lng ?? null); }
    if ('place_name' in patch)   { sets.push('place_name = ?');   params.push(patch.place_name ?? null); }
    if ('locality' in patch)     { sets.push('locality = ?');     params.push(patch.locality ?? null); }
    if ('country_code' in patch) { sets.push('country_code = ?'); params.push(patch.country_code ?? null); }
    if ('weather_temp' in patch) { sets.push('weather_temp = ?'); params.push(patch.weather_temp ?? null); }
    if ('weather_desc' in patch) { sets.push('weather_desc = ?'); params.push(patch.weather_desc ?? null); }
    if ('weather_icon' in patch) { sets.push('weather_icon = ?'); params.push(patch.weather_icon ?? null); }

    // always bump updated_at
    sets.push('updated_at = ?');
    params.push(new Date().toISOString());

    // id last
    params.push(id);

    if (sets.length === 1) return { rowsAffected: 0 }; // nothing to update besides updated_at

    const sql = `UPDATE entries SET ${sets.join(', ')} WHERE id = ?`;
    const res = await db.runAsync(sql, params);
    return { rowsAffected: res.changes };
};
