import { API_BASE_URL } from '../config/api.ts';

export type InvalidationReason = 'init' | 'mutation' | 'broadcast' | 'manual' | 'auth';

export interface CacheState {
  version: number;
  lastReason: InvalidationReason;
  manualTick: number;
}

interface CachedResponse {
  bodyText: string;
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  expiresAt: number;
}

interface InFlightResult {
  cached: CachedResponse | null;
  rawResponse?: Response;
}

export interface ApiCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  maxEntryBytes?: number;
}

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_MAX_ENTRY_BYTES = 5_000_000; // 5 MB
const CHANNEL_NAME = 'abaca_api_cache';

const GET_EXCLUDED_EXACT = new Set([
  '/api/maintenance/status',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

const MUTATION_EXCLUDED_EXACT = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
]);

const responseCache = new Map<string, CachedResponse>();
const inFlight = new Map<string, Promise<InFlightResult>>();
const listeners = new Set<() => void>();

let snapshot: CacheState = {
  version: 0,
  lastReason: 'init',
  manualTick: 0,
};

let installed = false;
let broadcastChannel: BroadcastChannel | null = null;

function getBaseOrigin(apiBaseUrl: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return apiBaseUrl;
}

function isAllowedApiHost(hostname: string, apiHostname: string): boolean {
  if (hostname === apiHostname) return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (typeof window !== 'undefined' && window.location?.hostname === hostname) return true;
  return false;
}

function parseBackendApiUrl(urlStr: string): URL | null {
  try {
    const apiBaseUrl = API_BASE_URL;
    const apiHost = new URL(apiBaseUrl).hostname;
    const parsed = new URL(urlStr, getBaseOrigin(apiBaseUrl));
    if (!parsed.pathname.startsWith('/api/')) return null;
    if (!isAllowedApiHost(parsed.hostname, apiHost)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isGetExcluded(pathname: string): boolean {
  return GET_EXCLUDED_EXACT.has(pathname) || pathname.startsWith('/api/auth/register');
}

function isMutationExcluded(pathname: string): boolean {
  return MUTATION_EXCLUDED_EXACT.has(pathname) || pathname.startsWith('/api/auth/register');
}

function getHeader(
  initHeaders: HeadersInit | undefined,
  requestHeaders: Headers | undefined,
  targetName: string
): string | null {
  const lower = targetName.toLowerCase();

  if (initHeaders) {
    if (typeof Headers !== 'undefined' && initHeaders instanceof Headers) {
      return initHeaders.get(targetName);
    }
    if (Array.isArray(initHeaders)) {
      for (const [key, value] of initHeaders) {
        if (key.toLowerCase() === lower) return value;
      }
      return null;
    }
    for (const [key, value] of Object.entries(initHeaders)) {
      if (key.toLowerCase() === lower && typeof value === 'string') {
        return value;
      }
    }
  }

  if (requestHeaders) {
    return requestHeaders.get(targetName);
  }

  return null;
}

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  if (typeof atob === 'function') {
    const binary = atob(padded);
    if (typeof TextDecoder !== 'undefined') {
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return binary;
  }

  // Fallback for runtimes without atob
  const nodeBuf = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (nodeBuf) {
    return nodeBuf.from(padded, 'base64').toString('utf8');
  }

  throw new Error('No base64 decoder available');
}

function shortHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getAuthScope(authHeader: string | null): string {
  if (!authHeader) return 'public';
  const trimmed = authHeader.trim();
  if (!trimmed) return 'public';

  const token = trimmed.toLowerCase().startsWith('bearer ')
    ? trimmed.slice(7).trim()
    : trimmed;

  const parts = token.split('.');
  if (parts.length === 3 && parts[1]) {
    try {
      const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
      const userType = typeof payload.userType === 'string' && payload.userType ? payload.userType : 'u';
      const rawId = payload.userId ?? payload.id ?? payload.sub;
      const userId = rawId !== undefined && rawId !== null && String(rawId) !== '' ? String(rawId) : 'anon';
      return `${userType}:${userId}`;
    } catch {
      // Fallback to hash below
    }
  }

  return `h:${shortHash(trimmed)}`;
}

function buildResponse(entry: CachedResponse): Response {
  return new Response(entry.bodyText, {
    status: entry.status,
    statusText: entry.statusText,
    headers: entry.headers,
  });
}

function isCacheableContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const lower = contentType.toLowerCase();
  return lower.includes('application/json') || lower.includes('+json') || lower.startsWith('text/');
}

function getByteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

function setCachedEntry(key: string, entry: CachedResponse, maxEntries: number): void {
  if (responseCache.has(key)) {
    responseCache.delete(key);
  }
  responseCache.set(key, entry);
  while (responseCache.size > maxEntries) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey === undefined) break;
    responseCache.delete(oldestKey);
  }
}

export function getCacheState(): CacheState {
  return snapshot;
}

export function subscribeCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitStateChange(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('API cache listener error:', error);
    }
  });
}

export function invalidateApiCache(
  reason: Exclude<InvalidationReason, 'init'> = 'manual'
): void {
  responseCache.clear();
  inFlight.clear();

  snapshot = {
    version: snapshot.version + 1,
    lastReason: reason,
    manualTick: reason === 'manual' ? snapshot.manualTick + 1 : snapshot.manualTick,
  };

  if (reason === 'mutation' && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'invalidate', ts: Date.now() });
    } catch {
      // Ignore BroadcastChannel post failures (e.g. closed channel)
    }
  }

  emitStateChange();
}

export function clearApiCache(): void {
  invalidateApiCache('auth');
}

export function createCachedFetch(
  baseFetch: typeof fetch,
  options: ApiCacheOptions = {}
): typeof fetch {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = typeof Request !== 'undefined' && input instanceof Request ? input : undefined;
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const parsedUrl = parseBackendApiUrl(rawUrl);
    if (!parsedUrl) {
      return baseFetch(input, init);
    }

    const method = (init?.method || request?.method || 'GET').toUpperCase();
    const pathname = parsedUrl.pathname;

    // Non-GET requests bypass cache and trigger global invalidation if successful
    if (method !== 'GET') {
      const response = await baseFetch(input, init);
      if (response.ok && !isMutationExcluded(pathname)) {
        invalidateApiCache('mutation');
      }
      return response;
    }

    if (isGetExcluded(pathname)) {
      return baseFetch(input, init);
    }

    const cacheMode = init?.cache || request?.cache;
    const bypassHeader = getHeader(init?.headers, request?.headers, 'x-bypass-cache');
    if (cacheMode === 'no-store') {
      return baseFetch(input, init);
    }

    const forceReload = cacheMode === 'reload' || bypassHeader === '1';
    const authHeader = getHeader(init?.headers, request?.headers, 'authorization');
    const authScope = getAuthScope(authHeader);
    const cacheKey = `${authScope}::${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}`;

    const now = Date.now();
    if (!forceReload) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        if (cached.expiresAt > now) {
          // Refresh LRU order
          responseCache.delete(cacheKey);
          responseCache.set(cacheKey, cached);
          return buildResponse(cached);
        }
        responseCache.delete(cacheKey);
      }

      const existingPromise = inFlight.get(cacheKey);
      if (existingPromise) {
        const result = await existingPromise;
        if (result.cached) {
          return buildResponse(result.cached);
        }
        return result.rawResponse!.clone();
      }
    }

    const fetchPromise: Promise<InFlightResult> = (async () => {
      const response = await baseFetch(input, init);
      const contentType = response.headers.get('content-type');
      const contentLengthHeader = response.headers.get('content-length');
      const declaredLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;

      if (!isCacheableContentType(contentType)) {
        return { cached: null, rawResponse: response };
      }

      if (!Number.isNaN(declaredLength) && declaredLength > maxEntryBytes) {
        return { cached: null, rawResponse: response };
      }

      const bodyText = await response.text();
      const headers: Array<[string, string]> = [];
      response.headers.forEach((value, key) => {
        headers.push([key, value]);
      });

      const materialized: CachedResponse = {
        bodyText,
        status: response.status,
        statusText: response.statusText,
        headers,
        expiresAt: Date.now() + ttlMs,
      };

      if (response.ok && getByteLength(bodyText) <= maxEntryBytes) {
        setCachedEntry(cacheKey, materialized, maxEntries);
      }

      return { cached: materialized };
    })();

    if (!forceReload) {
      inFlight.set(cacheKey, fetchPromise);
    }

    try {
      const result = await fetchPromise;
      if (result.cached) {
        return buildResponse(result.cached);
      }
      return result.rawResponse!;
    } finally {
      if (!forceReload && inFlight.get(cacheKey) === fetchPromise) {
        inFlight.delete(cacheKey);
      }
    }
  };
}

export function installApiCache(): void {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = createCachedFetch(nativeFetch);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.addEventListener('message', (event: MessageEvent) => {
        if (event?.data && event.data.type === 'invalidate') {
          invalidateApiCache('broadcast');
        }
      });
    } catch {
      broadcastChannel = null;
    }
  }
}
