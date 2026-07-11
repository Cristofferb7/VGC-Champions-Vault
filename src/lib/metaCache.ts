import { Capacitor } from "@capacitor/core";
import type { MetaSnapshot, PokemonDetail, Roster } from "../types";

const DB_NAME = "champions-analyzer";
const STORE = "meta";

/**
 * Native-only roster backup: Android WebView can evict IndexedDB under
 * storage pressure, so roster writes are mirrored to Capacitor
 * Preferences (SharedPreferences — survives eviction) and restored on
 * boot when IndexedDB comes up empty (sprint 8 §3). No-ops on web.
 */
const preferencesBackup = {
  async read(): Promise<Roster[] | null> {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: "rosters:v1" });
      return value ? (JSON.parse(value) as Roster[]) : null;
    } catch {
      return null;
    }
  },
  async write(rosters: Roster[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({
        key: "rosters:v1",
        value: JSON.stringify(rosters),
      });
    } catch {
      // Backup is best-effort; IndexedDB remains the primary store.
    }
  },
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const metaCache = {
  getSnapshot: (formatCode: string) =>
    idbGet<MetaSnapshot>(`snapshot:${formatCode}`),
  setSnapshot: (snapshot: MetaSnapshot) =>
    idbSet(`snapshot:${snapshot.formatCode}`, snapshot),
  getDetail: (formatCode: string, name: string) =>
    idbGet<PokemonDetail>(`detail:${formatCode}:${name.toLowerCase()}`),
  setDetail: (formatCode: string, detail: PokemonDetail) =>
    idbSet(`detail:${formatCode}:${detail.name.toLowerCase()}`, detail),
  getRosters: async (): Promise<Roster[] | null> => {
    const stored = await idbGet<Roster[]>("rosters:v1");
    if (stored !== null) return stored;
    // IndexedDB empty: restore from the native backup if one exists
    // (evicted WebView storage) before the caller falls back to seeds.
    const backup = await preferencesBackup.read();
    if (backup !== null) await idbSet("rosters:v1", backup).catch(() => {});
    return backup;
  },
  setRosters: async (rosters: Roster[]): Promise<void> => {
    await idbSet("rosters:v1", rosters);
    void preferencesBackup.write(rosters);
  },
  // Monthly Smogon snapshots are immutable once published — cached forever.
  getSmogonMonth: <T>(month: string) => idbGet<T>(`smogon:${month}`),
  setSmogonMonth: (month: string, snapshot: unknown) =>
    idbSet(`smogon:${month}`, snapshot),
};
