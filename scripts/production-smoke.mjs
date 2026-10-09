#!/usr/bin/env node
// Safe, read-only post-deployment smoke test. No credentials or mutations.
const api = process.env.API_PUBLIC_URL;
const web = process.env.WEB_PUBLIC_URL;
if (!api || !web) throw new Error('API_PUBLIC_URL and WEB_PUBLIC_URL are required');
const base = new URL(api);
const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname.toLowerCase());
if (
  (base.protocol !== 'https:' && !(process.env.SMOKE_ALLOW_HTTP_LOCAL === '1' && base.protocol === 'http:' && local)) ||
  base.username || base.password || base.search || base.hash || base.pathname !== '/'
) throw new Error('API_PUBLIC_URL must be one HTTPS origin (HTTP loopback allowed for isolated tests only)');
const webOrigin = new URL(web);
if (webOrigin.protocol !== 'https:' || webOrigin.pathname !== '/' || webOrigin.search || webOrigin.hash) {
  throw new Error('WEB_PUBLIC_URL must be an HTTPS origin');
}

async function request(path, init = {}) {
  const response = await fetch(new URL(path, base), {
    ...init,
    signal: AbortSignal.timeout(10000),
    headers: { Origin: web, ...(init.headers || {}) },
  });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { response, body };
}
function verify(condition, name) {
  if (!condition) throw new Error(`${name}: FAIL`);
  console.log(`${name}: PASS`);
}

const live = await request('/health/live');
verify(live.response.status === 200 && live.body?.status === 'ok', 'HTTP LIVENESS');
verify(live.response.headers.get('x-content-type-options') === 'nosniff', 'SECURITY HEADERS');
verify(live.response.headers.get('cache-control') === 'no-store', 'NO-STORE HEALTH');
const ready = await request('/health/ready');
verify(ready.response.status === 200 && ready.body?.status === 'ok', 'POSTGRESQL READINESS');
const gql = await request('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ health { status } }' }),
});
verify(gql.response.status === 200 && gql.body?.data?.health?.status === 'ok' && !gql.body.errors, 'GRAPHQL HEALTH');
verify(gql.response.headers.get('access-control-allow-origin') === web, 'EXACT CORS ORIGIN');
if (process.env.SMOKE_CHECK_PRODUCTION === '1') {
  const introspection = await request('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ __schema { queryType { name } } }' }),
  });
  verify(Array.isArray(introspection.body?.errors) && !introspection.body?.data?.__schema, 'PRODUCTION INTROSPECTION DISABLED');
}
console.log('AN-126 PRODUCTION READINESS SMOKE: PASS');
