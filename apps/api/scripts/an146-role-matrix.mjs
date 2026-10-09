import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const CONTAINER = 'an146-postgres-test';
const HOST = '127.0.0.1';
const DB_PORT = 55436;
const API_PORT = 4001;
const DB = 'an146_security_test';
const DB_USER = 'an146_runner';
const API = `http://${HOST}:${API_PORT}`;
const query = 'query AN146AdminRoleMatrix { adminCatalogOverview { __typename } }';
let prisma;
let server;
const createdUserIds = [];
let failures = 0;

function block(message) { throw new Error(`BLOCKED: ${message}`); }
function dockerInspect(format) {
  return execFileSync('docker', ['inspect', '--format', format, CONTAINER], { encoding: 'utf8', windowsHide: true }).trim();
}
function token() { return randomBytes(32).toString('hex'); }
function hash(t) { return createHash('sha256').update(t, 'utf8').digest('hex'); }
async function graphql(t) {
  const response = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(t ? { cookie: `anilist_session=${t}` } : {}) },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) block(`GraphQL HTTP ${response.status}`);
  return response.json();
}
function assertCase(name, result, code) {
  const codes = (result.errors ?? []).map(e => e.extensions?.code);
  const passed = code ? codes.includes(code) && result.data?.adminCatalogOverview == null :
    codes.length === 0 && result.data?.adminCatalogOverview?.__typename === 'AdminCatalogOverviewType';
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${code ? ` => ${code}` : ' => authorized'}`);
  if (!passed) {
    failures++;
    console.log('  Error codes:', JSON.stringify(codes));
    console.log('  Typename:', result.data?.adminCatalogOverview?.__typename ?? 'null');
  }
}
async function fixture(role, name, options = {}) {
  const t = token();
  const created = await prisma.user.create({
    data: {
      email: `${name}-${randomUUID()}@an146.invalid`,
      username: `an146_${randomBytes(7).toString('hex')}`,
      passwordHash: `AN146_DISABLED_${randomUUID()}`,
      role,
      sessions: { create: {
        tokenHash: hash(t),
        expiresAt: options.expired ? new Date(Date.now() - 60_000) : new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: options.revoked ? new Date() : null,
      } },
    },
    select: { id: true },
  });
  createdUserIds.push(created.id);
  return t;
}

async function main() {
  if (process.env.AN146_ENABLE_ROLE_MATRIX !== 'YES') block('Set AN146_ENABLE_ROLE_MATRIX=YES explicitly');
  if (process.env.NODE_ENV === 'production') block('Production env forbidden');
  if (dockerInspect('{{.Config.Image}}') !== 'postgres:16') block('Wrong image');
  if (dockerInspect('{{.State.Running}}|{{.State.Health.Status}}') !== 'true|healthy') block('Container unhealthy');
  if (dockerInspect('{{range index .HostConfig.PortBindings "5432/tcp"}}{{.HostIp}}:{{.HostPort}}{{end}}') !== `${HOST}:${DB_PORT}`) block('Port binding mismatch');
  if (dockerInspect('{{index .Config.Labels "project"}}') !== 'an146-security-test') block('Container label mismatch');
  const env = JSON.parse(dockerInspect('{{json .Config.Env}}'));
  const e = Object.fromEntries(env.map(s => [s.slice(0, s.indexOf('=')), s.slice(s.indexOf('=') + 1)]));
  if (e.POSTGRES_DB !== DB || e.POSTGRES_USER !== DB_USER || !/^[a-f0-9]{48}$/.test(e.POSTGRES_PASSWORD ?? '')) block('Container DB metadata invalid');
  const connectionString = `postgresql://${DB_USER}:${encodeURIComponent(e.POSTGRES_PASSWORD)}@${HOST}:${DB_PORT}/${DB}?schema=public`;
  const conn = new URL(connectionString);
  if (conn.hostname !== HOST || Number(conn.port) !== DB_PORT || conn.pathname !== `/${DB}`) block('Connection target mismatch');
  const live = spawnSync('node', ['-e', `const n=require('net');const s=n.connect(${API_PORT},'${HOST}');s.on('connect',()=>{process.exitCode=2;s.destroy()});s.on('error',()=>process.exitCode=0);`], { encoding: 'utf8', timeout: 5000 });
  if (live.status !== 0) block('Port 4001 already occupied or probe inconclusive');
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  await prisma.$connect();
  const id = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS usr`;
  if (id[0]?.db !== DB || id[0]?.usr !== DB_USER) block('Live DB identity mismatch');
  const migrations = await prisma.$queryRaw`SELECT count(*)::int AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  if (migrations[0]?.count !== 20) block('Expected 20 applied migrations');
  console.log('PASS isolated DB / port / migration guards');
  // Dist source was already verified in R16; stop if missing, never rebuild or migrate here.
  server = spawn(process.execPath, ['dist/main.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test', API_PORT: String(API_PORT), WEB_URL: 'http://localhost:3000', DATABASE_URL: connectionString },
    stdio: ['ignore', 'ignore', 'ignore'], windowsHide: true,
  });
  let ready = false;
  for (let i = 0; i < 45; i++) {
    if (server.exitCode != null) break;
    try {
      const r = await fetch(`${API}/health/ready`, { signal: AbortSignal.timeout(1200) });
      if (r.ok) { ready = true; break; }
    } catch {}
    await sleep(500);
  }
  if (!ready) block('Isolated API did not become ready');
  console.log('PASS isolated API readiness');
  assertCase('Anonymous', await graphql(null), 'UNAUTHENTICATED');
  const user = await fixture(UserRole.USER, 'user');
  assertCase('USER', await graphql(user), 'FORBIDDEN');
  const moderator = await fixture(UserRole.MODERATOR, 'moderator');
  assertCase('MODERATOR', await graphql(moderator), 'FORBIDDEN');
  const admin = await fixture(UserRole.ADMIN, 'admin');
  assertCase('ADMIN', await graphql(admin));
  const expired = await fixture(UserRole.ADMIN, 'expired', { expired: true });
  assertCase('Expired admin session', await graphql(expired), 'UNAUTHENTICATED');
  const revoked = await fixture(UserRole.ADMIN, 'revoked', { revoked: true });
  assertCase('Revoked admin session', await graphql(revoked), 'UNAUTHENTICATED');
  console.log(`AN-146-R17 RESULT: ${failures ? `FAIL (${failures} scenarios)` : 'PASS (6/6)'}`);
  if (failures) process.exitCode = 1;
}

try { await main(); }
catch (err) { console.error(`AN-146-R17 RESULT: FAIL: ${err.message}`); process.exitCode = 1; }
finally {
  if (prisma) {
    for (const id of createdUserIds) {
      try { await prisma.user.delete({ where: { id } }); }
      catch (err) { console.error('FAIL fixture cleanup:', err.message); process.exitCode = 1; }
    }
    try { await prisma.$disconnect(); } catch { process.exitCode = 1; }
    console.log(`Fixture cleanup: ${createdUserIds.length} test users`);
  }
  if (server && server.exitCode === null) {
    try { server.kill(); } catch { process.exitCode = 1; }
    await Promise.race([new Promise(resolve => server.once('exit', resolve)), sleep(2500)]);
    console.log('Test API stop requested');
  }
}
