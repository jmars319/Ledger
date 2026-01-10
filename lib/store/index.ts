import { createDbStore } from "./db";
import { createMemoryStore } from "./memory";
import type { StorageAdapter } from "./types";

let store: StorageAdapter | null = null;

export const getStore = (): StorageAdapter => {
  if (store) return store;
  const mode = process.env.STORAGE_MODE ?? "memory";
  const useDb = mode === "db" && Boolean(process.env.DATABASE_URL);
  store = useDb ? createDbStore() : createMemoryStore();
  return store;
};
