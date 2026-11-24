import assert from 'node:assert/strict';
import {
  clearApiCache,
  createCachedFetch,
  getCacheState,
  invalidateApiCache,
} from '../src/utils/apiCache.ts';

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

function makeJsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  });
}

async function runTests() {
  clearApiCache();

  // 1. Repeated GET hits cache (underlying fetch called once, both .json() succeed)
  {
    let networkCalls = 0;
    const cachedFetch = createCachedFetch(async () => {
      networkCalls += 1;
      return makeJsonResponse({ items: [1, 2, 3], call: networkCalls });
    });

    const url = 'https://fibersupplychain.onrender.com/api/harvests/farmer/harvests';
    const token = makeJwt({ userType: 'farmer', userId: 'f-1' });

    const res1 = await cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const res2 = await cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data1 = await res1.json();
    const data2 = await res2.json();

    assert.equal(networkCalls, 1, 'Second GET should hit cache');
    assert.deepEqual(data1, { items: [1, 2, 3], call: 1 });
    assert.deepEqual(data2, { items: [1, 2, 3], call: 1 });
  }

  // 2. Concurrent GET requests deduplicate in-flight
  {
    let networkCalls = 0;
    const cachedFetch = createCachedFetch(async () => {
      networkCalls += 1;
      await new Promise((r) => setTimeout(r, 15));
      return makeJsonResponse({ concurrent: true, call: networkCalls });
    });

    const url = 'https://fibersupplychain.onrender.com/api/buyers/profile';
    const token = makeJwt({ userType: 'buyer', userId: 'b-1' });

    const [r1, r2] = await Promise.all([
      cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } }),
      cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    assert.equal(networkCalls, 1, 'Concurrent GETs should share 1 in-flight request');
    assert.deepEqual(await r1.json(), { concurrent: true, call: 1 });
    assert.deepEqual(await r2.json(), { concurrent: true, call: 1 });
  }

  // 3. Successful POST/PUT/PATCH/DELETE invalidates cache and bumps version
  {
    let count = 0;
    const cachedFetch = createCachedFetch(async (input, init) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET') {
        count += 1;
        return makeJsonResponse({ count });
      }
      return makeJsonResponse({ ok: true }, 201);
    });

    const getUrl = 'https://fibersupplychain.onrender.com/api/inventory/inventory';
    const postUrl = 'https://fibersupplychain.onrender.com/api/inventory/inventory';
    const token = makeJwt({ userType: 'association_officer', userId: 'a-1' });

    const vBefore = getCacheState().version;
    const g1 = await (await cachedFetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })).json();
    assert.equal(g1.count, 1);

    await cachedFetch(postUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: 10 }),
    });

    const stateAfter = getCacheState();
    assert.equal(stateAfter.version, vBefore + 1, 'POST should bump cacheVersion');
    assert.equal(stateAfter.lastReason, 'mutation');

    const g2 = await (await cachedFetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })).json();
    assert.equal(g2.count, 2, 'GET after mutation should re-fetch from server');
  }

  // 4. Failed mutation (500) preserves cache and does NOT bump cacheVersion
  {
    let getCalls = 0;
    const cachedFetch = createCachedFetch(async (_input, init) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET') {
        getCalls += 1;
        return makeJsonResponse({ getCalls });
      }
      return makeJsonResponse({ error: 'boom' }, 500);
    });

    const url = 'https://fibersupplychain.onrender.com/api/sales/reports';
    const token = makeJwt({ userType: 'farmer', userId: 'f-2' });

    await cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const vBefore = getCacheState().version;

    const failRes = await cachedFetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: '{}',
    });
    assert.equal(failRes.status, 500);
    assert.equal(getCacheState().version, vBefore, 'Failed mutation should not invalidate');

    await cachedFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(getCalls, 1, 'Cache should remain intact after failed mutation');
  }

  // 5. User isolation & refreshed token continuity
  {
    let calls = 0;
    const cachedFetch = createCachedFetch(async () => {
      calls += 1;
      return makeJsonResponse({ calls });
    });

    const url = 'https://fibersupplychain.onrender.com/api/farmers/monitoring';
    const farmer1a = makeJwt({ userType: 'farmer', userId: 'u-1', iat: 100 });
    const farmer1b = makeJwt({ userType: 'farmer', userId: 'u-1', iat: 200 });
    const farmer2 = makeJwt({ userType: 'farmer', userId: 'u-2', iat: 100 });

    const r1 = await (await cachedFetch(url, { headers: { Authorization: `Bearer ${farmer1a}` } })).json();
    const r1Refreshed = await (await cachedFetch(url, { headers: { Authorization: `Bearer ${farmer1b}` } })).json();
    const r2 = await (await cachedFetch(url, { headers: { Authorization: `Bearer ${farmer2}` } })).json();

    assert.equal(r1.calls, 1);
    assert.equal(r1Refreshed.calls, 1, 'Refreshed token with same userId+userType must hit cache');
    assert.equal(r2.calls, 2, 'Different userId must not share cache entry');
  }

  // 6. Excluded endpoints & external URLs bypass cache
  {
    let calls = 0;
    const cachedFetch = createCachedFetch(async () => {
      calls += 1;
      return makeJsonResponse({ calls });
    });

    await cachedFetch('https://fibersupplychain.onrender.com/api/maintenance/status');
    await cachedFetch('https://fibersupplychain.onrender.com/api/maintenance/status');
    await cachedFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini');
    await cachedFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini');
    assert.equal(calls, 4, 'Maintenance status and external URLs must bypass cache');
  }

  // 7. cache: 'reload' and x-bypass-cache: '1' force fresh fetch and update cache
  {
    let calls = 0;
    const cachedFetch = createCachedFetch(async () => {
      calls += 1;
      return makeJsonResponse({ calls });
    });

    const url = 'https://fibersupplychain.onrender.com/api/mao/officers';
    const headers = { Authorization: `Bearer ${makeJwt({ userType: 'officer', userId: 'o-1' })}` };

    assert.equal((await (await cachedFetch(url, { headers })).json()).calls, 1);
    assert.equal((await (await cachedFetch(url, { headers, cache: 'reload' })).json()).calls, 2);
    assert.equal((await (await cachedFetch(url, { headers })).json()).calls, 2);
    assert.equal(
      (await (await cachedFetch(url, { headers: { ...headers, 'x-bypass-cache': '1' } })).json()).calls,
      3
    );
    assert.equal((await (await cachedFetch(url, { headers })).json()).calls, 3);
  }

  // 8. clearApiCache() bumps version with lastReason === 'auth' and manual invalidation bumps manualTick
  {
    const before = getCacheState();
    clearApiCache();
    const afterAuth = getCacheState();
    assert.equal(afterAuth.version, before.version + 1);
    assert.equal(afterAuth.lastReason, 'auth');
    assert.equal(afterAuth.manualTick, before.manualTick);

    invalidateApiCache('manual');
    const afterManual = getCacheState();
    assert.equal(afterManual.version, afterAuth.version + 1);
    assert.equal(afterManual.lastReason, 'manual');
    assert.equal(afterManual.manualTick, afterAuth.manualTick + 1);
  }

  // 9. TTL expiration
  {
    let calls = 0;
    const cachedFetch = createCachedFetch(
      async () => {
        calls += 1;
        return makeJsonResponse({ calls });
      },
      { ttlMs: 25 }
    );

    const url = 'https://fibersupplychain.onrender.com/api/articles';
    await cachedFetch(url);
    await cachedFetch(url);
    assert.equal(calls, 1);
    await new Promise((r) => setTimeout(r, 40));
    await cachedFetch(url);
    assert.equal(calls, 2, 'Expired cache entry must re-fetch after TTL');
  }

  console.log('PASS: All 9 API cache unit tests succeeded.');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
