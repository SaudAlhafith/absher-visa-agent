import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

// TTL: 24h for visa checks, 7 days for map
const TTL = { check: 24 * 60 * 60 * 1000, map: 7 * 24 * 60 * 60 * 1000 };

interface CacheEntry<T = any> { data: T; timestamp: number; }

// Generic cache helpers
function read<T>(file: string): T | null {
  try {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) { console.error(`[Cache] Read error (${file}):`, e); }
  return null;
}

function write(file: string, data: any): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
  } catch (e) { console.error(`[Cache] Write error (${file}):`, e); }
}

// Visa check cache (per destination)
const CACHE_FILE = "visa-cache.json";

export function getCachedVisaInfo(passport: string, dest: string): any | null {
  const cache = read<Record<string, CacheEntry>>(CACHE_FILE) || {};
  const key = `${passport}-${dest}`.toUpperCase();
  const entry = cache[key];
  
  if (entry && Date.now() - entry.timestamp < TTL.check) {
    console.log(`[Cache] Hit: ${key}`);
    return entry.data;
  }
  return null;
}

export function setCachedVisaInfo(passport: string, dest: string, data: any): void {
  const cache = read<Record<string, CacheEntry>>(CACHE_FILE) || {};
  const key = `${passport}-${dest}`.toUpperCase();
  cache[key] = { data, timestamp: Date.now() };
  write(CACHE_FILE, cache);
  console.log(`[Cache] Stored: ${key}`);
}

// Visa map cache (single entry)
const MAP_FILE = "visa-map-cache.json";

export interface VisaMapData {
  data: { passport: string; colors: Record<string, string>; };
  meta: { version: string; language: string; generated_at: string; };
}

export function getCachedVisaMap(): VisaMapData | null {
  const entry = read<CacheEntry<VisaMapData>>(MAP_FILE);
  if (entry && Date.now() - entry.timestamp < TTL.map) {
    console.log("[Cache] Map hit");
    return entry.data;
  }
  return null;
}

export function setCachedVisaMap(data: VisaMapData): void {
  write(MAP_FILE, { data, timestamp: Date.now() });
  console.log("[Cache] Map stored");
}
