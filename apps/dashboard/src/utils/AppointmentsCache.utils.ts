import { Appointment } from "../api/Appointments.api";

// How long cached data is considered fresh (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: Appointment[];
  fetchedAt: number;
}

// Lives outside React — survives re-mounts and tab switches
const cache: Record<string, CacheEntry> = {};

export function getCached(key: string): Appointment[] | null {
  const entry = cache[key];
  if (!entry) return null;

  const isStale = Date.now() - entry.fetchedAt > CACHE_TTL_MS;
  if (isStale) {
    delete cache[key];
    return null;
  }

  return entry.data;
}

export function setCache(key: string, data: Appointment[]): void {
  cache[key] = { data, fetchedAt: Date.now() };
}

export function invalidateCache(key: string): void {
  delete cache[key];
}

export function invalidateAllCache(): void {
  Object.keys(cache).forEach((k) => delete cache[k]);
}