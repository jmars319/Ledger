import { createDbStore } from "./db";
import { createMemoryStore } from "./memory";
import type { StorageAdapter } from "./types";

let store: StorageAdapter | null = null;

export const getStore = (): StorageAdapter => {
  if (store) return store;
  const mode = process.env.STORAGE_MODE ?? "memory";
  if (mode === "db" && !process.env.DATABASE_URL) {
    throw new Error("STORAGE_MODE=db requires DATABASE_URL to be set.");
  }
  store = mode === "db" ? createDbStore() : createMemoryStore();
  return store;
};
