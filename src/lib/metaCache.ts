import type { MetaSnapshot, PokemonDetail, Roster } from "../types";

const DB_NAME = "champions-analyzer";
const STORE = "meta";

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
  getRosters: () => idbGet<Roster[]>("rosters:v1"),
  setRosters: (rosters: Roster[]) => idbSet("rosters:v1", rosters),
};
