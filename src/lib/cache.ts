import "server-only";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_redis) _redis = new Redis({ url, token });
  return _redis;
}

type CachedEnvelope<T> = { value: T; cachedAt: number };

export type CacheResult<T> =
  | { value: T; stale: false; cachedAt: number | null }
  | { value: T; stale: true; cachedAt: number };

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<CacheResult<T>> {
  const redis = getRedis();

  if (!redis) {
    const value = await fetcher();
    return { value, stale: false, cachedAt: null };
  }

  const hit = await redis.get<CachedEnvelope<T>>(key);
  if (hit) return { value: hit.value, stale: false, cachedAt: hit.cachedAt };

  try {
    const value = await fetcher();
    const envelope: CachedEnvelope<T> = { value, cachedAt: Date.now() };
    await redis.set(key, envelope, { ex: ttlSeconds });
    return { value, stale: false, cachedAt: envelope.cachedAt };
  } catch (err) {
    const stale = await redis.get<CachedEnvelope<T>>(`${key}:stale`);
    if (stale) return { value: stale.value, stale: true, cachedAt: stale.cachedAt };
    throw err;
  }
}
