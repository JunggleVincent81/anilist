/**
 * P16 operational gate: actual Nest GraphQL HTTP + Prisma + disposable PostgreSQL.
 * Opt-in ONLY through pinned Docker runner. Uses NO normal DATABASE_URL, production API,
 * public listeners, networked Postgres, or canonical publication permissions.
 */
import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import { Duplex } from 'node:stream';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { hashSessionToken } from '../auth/security/session.security.js';

const container = process.env.P16_HTTP_TEST_CONTAINER ?? '';
const enabled = /^p16http-isolated-[0-9]+-[0-9]+$/.test(container) &&
  process.env.P16_HTTP_TEST_MODE === 'disposable-no-ports';
const suite = enabled ? describe : describe.skip;
const cookieName = 'anilist_session';
const fixedPassword = 'p16-http-disposable-only';

type HttpGraphql = { data?: Record<string, unknown>; errors?: Array<{ message: string; extensions?: { code?: string } }> };
type AdminCookieKey = 'owner' | 'reviewer' | 'user' | 'moderator';

/** TCP is tunneled through `docker exec -i`, no host-postgres port or Docker network. */
function isolatedPgStream(): Duplex {
  const child = spawn('docker', ['exec', '-i', container, 'bash', '-c',
    'exec 3<>/dev/tcp/127.0.0.1/5432; cat <&3 & reader=$!; cat >&3; kill "$reader" 2>/dev/null || true; wait "$reader" 2>/dev/null || true'],
  { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const socket = new Duplex({
    read() { /* read from child stdout */ },
    write(chunk: Buffer, _enc, cb) {
      if (child.stdin.destroyed) return cb(new Error('Isolated DB stdin closed.'));
      if (child.stdin.write(chunk)) cb(); else child.stdin.once('drain', cb);
    },
    final(cb) { child.stdin.end(); cb(); },
    destroy(error, cb) { if (!child.killed) child.kill(); cb(error); },
  });
  const p = socket as Duplex & {
    connect: (port?: number, host?: string) => Duplex;
    setNoDelay: () => Duplex;
    setKeepAlive: () => Duplex;
    readyState: string;
    ref: () => Duplex;
    unref: () => Duplex;
  };
  p.readyState = 'closed';
  p.connect = () => { setImmediate(() => { p.readyState = 'open'; socket.emit('connect'); }); return socket; };
  p.setNoDelay = () => socket;
  p.setKeepAlive = () => socket;
  p.ref = () => { child.ref(); return socket; };
  p.unref = () => { child.unref(); return socket; };
  child.stdout.on('data', data => socket.push(data));
  child.stdout.on('end', () => socket.push(null));
  child.on('error', error => socket.destroy(error));
  child.stderr.on('data', () => { /* diagnostics must never become postgres bytes */ });
  child.on('close', code => {
    if (code && !socket.destroyed) socket.destroy(new Error('Disposable Docker database transport failed.'));
    else if (!socket.destroyed) socket.push(null);
  });
  return socket;
}

jest.setTimeout(180_000);
suite('P16 real Nest HTTP → GraphQL → Prisma → disposable PostgreSQL 18', () => {
  let prisma: PrismaClient;
  let app: INestApplication;
  let url = '';
  const sessions = {} as Record<AdminCookieKey, string>;
  let importerCandidateId = '';
  let editorialId = '';
  let canonicalBaseline = { anime: -1, manga: -1, music: -1 };
  const ownerId = randomUUID(), reviewerId = randomUUID();
  const userId = randomUUID(), moderatorId = randomUUID();
  const idByRole: Record<AdminCookieKey, string> = {
    owner: ownerId, reviewer: reviewerId, user: userId, moderator: moderatorId,
  };

  async function gql(query: string, variables?: Record<string, unknown>, role?: AdminCookieKey, extraHeaders?: Record<string, string>): Promise<HttpGraphql> {
    const res = await fetch(`${url}/graphql`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(role ? { cookie: `${cookieName}=${sessions[role]}` } : {}), ...extraHeaders },
      body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30_000),
    });
    expect(res.status).toBe(200);
    return await res.json() as HttpGraphql;
  }
  function value<T>(r: HttpGraphql, key: string): T {
    if (r.errors?.length || !r.data || !(key in r.data)) {
      throw new Error(`GraphQL ${key} rejected unexpectedly: ${JSON.stringify(r.errors ?? r)}`);
    }
    return r.data[key] as T;
  }
  function denied(r: HttpGraphql) {
    expect(r.errors?.length).toBeGreaterThan(0);
  }
  async function counts() {
    const [anime, manga, music] = await Promise.all([
      prisma.anime.count(), prisma.mangaWork.count(), prisma.animeMusicTrack.count(),
    ]);
    return { anime, manga, music };
  }

  beforeAll(async () => {
    // Never read a workstation's database URL as a valid E2E target.
    if (process.env.NODE_ENV !== 'test' ||
        process.env.DATABASE_URL !== 'postgresql://blocked:blocked@127.0.0.1:1/no-live-db' ||
        process.env.P16_HTTP_TEST_MODE !== 'disposable-no-ports') {
      throw new Error('STOP: isolation variables missing or workstation DB target not blocked.');
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({
      user: 'postgres', password: fixedPassword, database: 'postgres',
      host: '127.0.0.1', port: 1, ssl: false, max: 4,
      connectionTimeoutMillis: 20000, idleTimeoutMillis: 3000,
      stream: isolatedPgStream,
    } as ConstructorParameters<typeof PrismaPg>[0]) });
    await prisma.$connect();
    const probe = await prisma.$queryRawUnsafe<Array<{ ready: number }>>('SELECT 1::int AS ready');
    expect(probe[0]?.ready).toBe(1);
    const suffix = randomBytes(4).toString('hex');
    await prisma.user.createMany({ data: (
      [
        ['owner', UserRole.ADMIN], ['reviewer', UserRole.ADMIN], ['user', UserRole.USER], ['moderator', UserRole.MODERATOR],
      ] as const).map(([role, userRole]) => ({
        id: idByRole[role], username: `h${suffix}${role.slice(0, 3)}`, email: `h${suffix}${role}@example.invalid`,
        passwordHash: 'synthetic-no-login', role: userRole,
      })) });
    for (const role of ['owner', 'reviewer', 'user', 'moderator'] as const) {
      const raw = randomBytes(32).toString('base64url');
      sessions[role] = raw;
      await prisma.session.create({ data: { userId: idByRole[role], tokenHash: hashSessionToken(raw),
        expiresAt: new Date(Date.now() + 1200000) } });
    }
    canonicalBaseline = await counts();
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    if (!address || address.address !== '127.0.0.1' || !Number.isInteger(address.port)) {
      throw new Error('STOP: Nest listener must bind exclusively to loopback.');
    }
    url = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { if (app) await app.close(); if (prisma) await prisma.$disconnect(); });

  it('denies unauthenticated, USER and MODERATOR at real GraphQL and ignores spoofed role headers', async () => {
    const query = 'query { adminImportHistory { available total items { id } } }';
    for (const role of [undefined, 'user', 'moderator'] as const) {
      denied(await gql(query, undefined, role, { 'x-role': 'ADMIN', 'x-user-id': ownerId }));
    }
    const data = value<{ available: boolean; total: number | null }>(await gql(query, undefined, 'owner'), 'adminImportHistory');
    expect(data.available).toBe(true);
    expect(data.total).toBe(0);
  });

  it('creates manual Manga, Anime and Music drafts only in private quarantine', async () => {
    const query = `mutation Make($input:CreateAdminStructuredCandidateInput!){ createAdminStructuredCandidate(input:$input){id subjectType editable isQuarantined fieldsJson} }`;
    for (const [subjectType, fields] of [
      ['MANGA_WORK', { title: 'P16 disposable Manga work' }],
      ['ANIME', { title: 'P16 disposable Anime' }],
      ['MUSIC_RELEASE', { title: 'P16 disposable Music release', releaseKey: 'e2e-release' }],
    ] as const) {
      const input = { subjectType, sourceName: 'P16 synthetic curator', sourceReference: 'https://example.invalid/p16', fieldsJson: JSON.stringify(fields) };
      const r = value<{ id: string; editable: boolean; isQuarantined: boolean; subjectType: string }>(await gql(query, { input }, 'owner'), 'createAdminStructuredCandidate');
      expect(r.subjectType).toBe(subjectType);
      expect(r.isQuarantined).toBe(true);
      expect(r.editable).toBe(true);
      expect((await prisma.catalogCandidate.findUniqueOrThrow({ where: { id: r.id } })).creatorId).toBe(ownerId);
    }
    expect(await counts()).toEqual(canonicalBaseline);
  });

  it('validates real CSV dry-run, rejects invalid SHA, applies once and preserves import history', async () => {
    const PREVIEW = `mutation Preview($input:PreviewAdminImportInput!){previewAdminImport(input:$input){id status fileSha256 invalidCount validCount createdCount skippedCount issuesJson}}`;
    const APPLY = `mutation Apply($input:ApplyAdminImportInput!){applyAdminImport(input:$input){id status createdCount skippedCount}}`;
    const input = (csv: string, filename: string) => ({ input: { subjectType: 'MANGA_WORK', fileName: filename,
      base64: Buffer.from(csv).toString('base64'), sourceName: 'P16 synthetic CSV', sourceReference: 'https://example.invalid/import' } });
    const bad = value<{ id: string; fileSha256: string; invalidCount: number }>(await gql(PREVIEW,
      input('title\n=HYPERLINK(1)\n', 'bad.csv'), 'owner'), 'previewAdminImport');
    expect(bad.invalidCount).toBe(1);
    denied(await gql(APPLY, { input: { batchId: bad.id, expectedFileSha256: bad.fileSha256 } }, 'owner'));
    const before = await prisma.catalogCandidate.count();
    const ok = value<{ id: string; fileSha256: string; invalidCount: number; validCount: number; status: string }>(await gql(PREVIEW,
      input('title,synopsis\nP16 imported Manga A,Synthetic only\nP16 imported Manga B,Synthetic only\n', 'valid.csv'), 'owner'), 'previewAdminImport');
    expect(ok.status).toBe('PREVIEWED');
    expect(ok.validCount).toBe(2);
    expect(ok.invalidCount).toBe(0);
    expect(await prisma.catalogCandidate.count()).toBe(before);
    denied(await gql(APPLY, { input: { batchId: ok.id, expectedFileSha256: 'f'.repeat(64) } }, 'owner'));
    const request = { input: { batchId: ok.id, expectedFileSha256: ok.fileSha256 } };
    denied(await gql(APPLY, request, 'reviewer')); // different ADMIN cannot apply another admin's batch
    const applied = value<{ status: string; createdCount: number; skippedCount: number }>(await gql(APPLY, request, 'owner'), 'applyAdminImport');
    expect(applied).toMatchObject({ status: 'APPLIED', createdCount: 2, skippedCount: 0 });
    const again = value<{ status: string; createdCount: number }>(await gql(APPLY, request, 'owner'), 'applyAdminImport');
    expect(again.createdCount).toBe(2);
    expect(await prisma.catalogCandidate.count()).toBe(before + 2);
    const imported = await prisma.catalogCandidate.findFirstOrThrow({ where: {
      creatorId: ownerId, fingerprint: { not: null }, subjectType: 'MANGA_WORK',
    }, orderBy: { createdAt: 'asc' } });
    expect(imported.isQuarantined).toBe(true);
    importerCandidateId = imported.id;
    const history = value<{ total: number; items: Array<{ status: string }> }>(await gql(
      'query { adminImportHistory { total items { status } } }', undefined, 'owner'), 'adminImportHistory');
    expect(history.total).toBe(2);
    expect(history.items.filter(x => x.status === 'APPLIED')).toHaveLength(1);
    expect(await counts()).toEqual(canonicalBaseline);
  });

  it('independent ADMIN review audits a quarantined import; approval and canonical writes remain blocked', async () => {
    expect(importerCandidateId).not.toBe('');
    const CREATE = `mutation($input:CreateAdminEditorialCaseInput!){createAdminEditorialCase(input:$input){id state revision}}`;
    const MOVE = `mutation($input:TransitionAdminEditorialCaseInput!){transitionAdminEditorialCase(input:$input){id state revision}}`;
    const c = value<{ id: string; state: string; revision: number }>(await gql(CREATE,
      { input: { candidateId: importerCandidateId } }, 'owner'), 'createAdminEditorialCase');
    expect(c).toMatchObject({ state: 'DRAFT', revision: 1 });
    editorialId = c.id;
    const submitted = value<{ state: string; revision: number }>(await gql(MOVE,
      { input: { caseId: editorialId, expectedRevision: 1, action: 'SUBMIT' } }, 'owner'), 'transitionAdminEditorialCase');
    expect(submitted).toMatchObject({ state: 'SUBMITTED', revision: 2 });
    denied(await gql(MOVE, { input: { caseId: editorialId, expectedRevision: 2, action: 'BEGIN_REVIEW' } }, 'owner'));
    const reviewing = value<{ state: string; revision: number }>(await gql(MOVE,
      { input: { caseId: editorialId, expectedRevision: 2, action: 'BEGIN_REVIEW' } }, 'reviewer'), 'transitionAdminEditorialCase');
    expect(reviewing).toMatchObject({ state: 'UNDER_REVIEW', revision: 3 });
    denied(await gql(MOVE, { input: { caseId: editorialId, expectedRevision: 3, action: 'APPROVE' } }, 'reviewer'));
    denied(await gql(MOVE, { input: { caseId: editorialId, expectedRevision: 3, action: 'PUBLISH' } }, 'reviewer'));
    const detail = value<{ commitReady: boolean; history: Array<{ actorId: string; action: string }> }>(await gql(
      `query($id:ID!){adminEditorialCaseDetail(id:$id){commitReady history{actorId action}}}`,
      { id: editorialId }, 'reviewer'), 'adminEditorialCaseDetail');
    expect(detail.commitReady).toBe(false);
    expect(detail.history.map(x => x.action)).toEqual(['SUBMIT', 'BEGIN_REVIEW']);
    expect(detail.history[1]?.actorId).toBe(reviewerId);
    expect(await prisma.editorialCaseTransition.count({ where: { caseId: editorialId } })).toBe(2);
    expect((await prisma.catalogCandidate.findUniqueOrThrow({ where: { id: importerCandidateId } })).isQuarantined).toBe(true);
    expect(await counts()).toEqual(canonicalBaseline);
  });
});
