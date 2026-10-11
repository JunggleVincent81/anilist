/**
 * AN-170: real Prisma -> PostgreSQL transaction integration, disposable Docker only.
 * This file is intentionally UNREGISTERED and runs only when AN170_PG_CONTAINER
 * is provided by the vetted no-network Docker runner. NEVER use an application DB.
 */
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Duplex } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaService } from '../database/prisma.service.js';
import { PrivateSynopsisEvidenceEntryService } from './private-synopsis-evidence-entry.service.js';
import { PrivateEditorialApprovalService } from './private-editorial-approval.service.js';
import { PrivateAnimeSynopsisCommitService } from './private-anime-synopsis-commit.service.js';

const container = process.env.AN170_PG_CONTAINER ?? '';
const isIsolated = /^an170-isolated-[0-9]+-[0-9]+$/.test(container);
// AN-170 is opt-in. Ordinary API Jest must never attempt to open a Docker bridge.
// Only the isolated Docker runner may set AN170_PG_CONTAINER to enable these tests.
const isolatedDescribe = isIsolated ? describe : describe.skip;

/** Docker exec pipe is a private byte transport, not a host TCP listener.
 * PostgreSQL listens only INSIDE a --network none container. No port is exposed.
 */
function dockerPostgresStream(): Duplex {
  const child = spawn('docker', ['exec', '-i', container, 'bash', '-c',
    'exec 3<>/dev/tcp/127.0.0.1/5432; cat <&3 & reader=$!; cat >&3; kill "$reader" 2>/dev/null || true; wait "$reader" 2>/dev/null || true'],
  { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const socket = new Duplex({
    read() { /* child stdout drives incoming bytes */ },
    write(chunk: Buffer, _encoding, callback) {
      if (child.stdin.destroyed) return callback(new Error('Docker stdin closed'));
      if (child.stdin.write(chunk)) callback();
      else child.stdin.once('drain', callback);
    },
    final(callback) { child.stdin.end(); callback(); },
    destroy(error, callback) {
      if (!child.killed) child.kill();
      callback(error);
    },
  });
  const adapter = socket as Duplex & {
    connect: (port?: number, host?: string) => Duplex;
    setNoDelay: () => Duplex;
    setKeepAlive: () => Duplex;
    readyState: string;
    ref: () => Duplex;
    unref: () => Duplex;
  };
  adapter.readyState = 'closed';
  adapter.connect = () => { setImmediate(() => { adapter.readyState = 'open'; socket.emit('connect'); }); return socket; };
  adapter.setNoDelay = () => socket;
  adapter.setKeepAlive = () => socket;
  adapter.ref = () => { child.ref(); return socket; };
  adapter.unref = () => { child.unref(); return socket; };
  child.stdout.on('data', data => { socket.push(data); });
  child.stdout.on('end', () => { socket.push(null); });
  child.on('error', error => socket.destroy(error));
  child.stderr.on('data', () => { /* don't interpret protocol diagnostic as data */ });
  child.on('close', code => {
    if (code && !socket.destroyed) socket.destroy(new Error('Isolated Docker transport failed'));
    else if (!socket.destroyed) socket.push(null);
  });
  return socket;
}

const adapter = new PrismaPg({
  user: 'postgres', password: 'an170-only-disposable-test', database: 'postgres',
  host: '127.0.0.1', port: 1, ssl: false, max: 3,
  connectionTimeoutMillis: 15_000, idleTimeoutMillis: 3_000,
  stream: dockerPostgresStream,
} as ConstructorParameters<typeof PrismaPg>[0]);
const prisma = new PrismaClient({ adapter });
const evidenceEntry = new PrivateSynopsisEvidenceEntryService(prisma as unknown as PrismaService);
const approval = new PrivateEditorialApprovalService(prisma as unknown as PrismaService);
const canonical = new PrivateAnimeSynopsisCommitService(prisma as unknown as PrismaService);

const humanReason = 'Human review of original rights evidence, isolated fixture only.';
const rightsBasis = 'Independent curator attestation for synthetic E2E text only, NOT production rights.';

type Fixture = Awaited<ReturnType<typeof fixture>>;
async function fixture() {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
  const opener = randomUUID();
  const reviewer = randomUUID();
  const verifier = randomUUID();
  const ordinary = randomUUID();
  const caseId = randomUUID();
  const candidateId = randomUUID();
  const animeId = randomUUID();
  const synopsis = `Original synthetic synopsis ${suffix}; no rights asserted for real content.`;
  await prisma.user.createMany({ data: [
    { id: opener, username: `o${suffix}`, email: `o${suffix}@example.invalid`, passwordHash: 'AN170-test', role: 'ADMIN' },
    { id: reviewer, username: `r${suffix}`, email: `r${suffix}@example.invalid`, passwordHash: 'AN170-test', role: 'ADMIN' },
    { id: verifier, username: `v${suffix}`, email: `v${suffix}@example.invalid`, passwordHash: 'AN170-test', role: 'ADMIN' },
    { id: ordinary, username: `u${suffix}`, email: `u${suffix}@example.invalid`, passwordHash: 'AN170-test', role: 'USER' },
  ] });
  const anime = await prisma.anime.create({ data: {
    id: animeId, title: `AN170 ${suffix}`, slug: `an170-${suffix}`,
    description: 'Before test synopsis', isAdult: null, catalogStatus: 'REVIEW',
  } });
  await prisma.catalogCandidate.create({ data: {
    id: candidateId, subjectType: 'ANIME', creatorId: opener,
    sourceName: 'AN170 synthetic fixture', sourceReference: `fixture-${suffix}`,
    sourcePayload: { synthetic: true, name: suffix }, normalizedPayload: { synopsis },
    isQuarantined: true,
  } });
  await prisma.editorialCase.create({ data: {
    id: caseId, subjectType: 'ANIME', candidateId, canonicalEntityId: animeId,
    openedById: opener, state: 'UNDER_REVIEW', revision: 3,
  } });
  await prisma.editorialCaseTransition.createMany({ data: [
    { caseId, actorId: opener, action: 'SUBMIT', fromState: 'DRAFT', toState: 'SUBMITTED', previousRevision: 1, nextRevision: 2, policyVersion: 'AN170-fixture' },
    { caseId, actorId: reviewer, action: 'BEGIN_REVIEW', fromState: 'SUBMITTED', toState: 'UNDER_REVIEW', previousRevision: 2, nextRevision: 3, policyVersion: 'AN170-fixture' },
  ] });
  return { caseId, animeId, opener, reviewer, verifier, ordinary, anime, synopsis };
}
async function attest(f: Fixture) {
  return evidenceEntry.recordAttestation({ id: f.verifier, role: 'ADMIN' }, {
    caseId: f.caseId, expectedRevision: 3,
    sourceUrl: 'https://example.invalid/an170-synthetic-fixture', rightsBasis,
  });
}
async function approve(f: Fixture) {
  return approval.approve({ id: f.reviewer, role: 'ADMIN' },
    { caseId: f.caseId, expectedRevision: 3, note: humanReason });
}
async function commit(f: Fixture) {
  return canonical.commit({ id: f.reviewer, role: 'ADMIN' },
    { caseId: f.caseId, expectedRevision: 4, expectedAnimeUpdatedAt: f.anime.updatedAt.toISOString() });
}

async function installInsertFailure(table: 'EditorialSynopsisApproval'|'EditorialSynopsisCommit', id: string) {
  const fn = `an170_fail_${table.toLowerCase()}`;
  const trg = `AN170_fail_${table}`;
  await prisma.$executeRawUnsafe(`CREATE FUNCTION "${fn}"() RETURNS trigger AS $$
    BEGIN IF NEW."caseId" = '${id}'::uuid THEN
      RAISE EXCEPTION 'AN170 simulated audit insert rejection' USING ERRCODE='55000';
    END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER "${trg}" BEFORE INSERT ON "${table}"
    FOR EACH ROW EXECUTE FUNCTION "${fn}"()`);
  return async () => {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${trg}" ON "${table}"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${fn}"()`);
  };
}

jest.setTimeout(90_000);
isolatedDescribe('AN-170 real Prisma service transactions on disposable PostgreSQL 18 (opt-in Docker only)', () => {
  beforeAll(async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ ready: number }>>('SELECT 1::int AS ready');
    expect(rows[0]?.ready).toBe(1);
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it('attests, approves, commits exactly description, audits, and retries idempotently', async () => {
    const f = await fixture();
    await expect(attest(f)).resolves.toMatchObject({ status: 'HUMAN_ATTESTATION_RECORDED' });
    await expect(approve(f)).resolves.toMatchObject({ state: 'APPROVED', revision: 4 });
    await expect(commit(f)).resolves.toMatchObject({ status: 'COMMITTED' });
    await expect(commit(f)).resolves.toMatchObject({ status: 'ALREADY_COMMITTED' });
    const anime = await prisma.anime.findUniqueOrThrow({ where: { id: f.animeId } });
    expect(anime.description).toBe(f.synopsis);
    expect({ id: anime.id, slug: anime.slug, isAdult: anime.isAdult, catalogStatus: anime.catalogStatus,
      coverImageUrl: anime.coverImageUrl }).toEqual({
      id: f.anime.id, slug: f.anime.slug, isAdult: f.anime.isAdult,
      catalogStatus: f.anime.catalogStatus, coverImageUrl: f.anime.coverImageUrl,
    });
    expect(await prisma.editorialSynopsisCommit.count({ where: { caseId: f.caseId } })).toBe(1);
    expect(await prisma.editorialSynopsisApproval.count({ where: { caseId: f.caseId } })).toBe(1);
    expect(await prisma.editorialCaseTransition.count({ where: { caseId: f.caseId, action: 'APPROVE' } })).toBe(1);
  });

  it('rejects actor spoofing, self-attestation, and duplicate evidence, using persisted roles', async () => {
    const f = await fixture();
    await expect(evidenceEntry.recordAttestation({ id: f.ordinary, role: 'ADMIN' }, {
      caseId: f.caseId, expectedRevision: 3, sourceUrl: 'https://example.invalid/fixture', rightsBasis,
    })).rejects.toThrow();
    await expect(evidenceEntry.recordAttestation({ id: f.opener, role: 'ADMIN' }, {
      caseId: f.caseId, expectedRevision: 3, sourceUrl: 'https://example.invalid/fixture', rightsBasis,
    })).rejects.toThrow();
    await attest(f);
    await expect(attest(f)).rejects.toThrow();
    expect(await prisma.editorialSynopsisEvidence.count({ where: { caseId: f.caseId } })).toBe(1);
  });

  it('rolls back case CAS and transition when approval audit INSERT fails', async () => {
    const f = await fixture();
    await attest(f);
    const removeTrigger = await installInsertFailure('EditorialSynopsisApproval', f.caseId);
    try { await expect(approve(f)).rejects.toThrow(); }
    finally { await removeTrigger(); }
    const editorial = await prisma.editorialCase.findUniqueOrThrow({ where: { id: f.caseId } });
    expect({ state: editorial.state, revision: editorial.revision }).toEqual({ state: 'UNDER_REVIEW', revision: 3 });
    expect(await prisma.editorialSynopsisApproval.count({ where: { caseId: f.caseId } })).toBe(0);
    expect(await prisma.editorialCaseTransition.count({ where: { caseId: f.caseId, action: 'APPROVE' } })).toBe(0);
  });

  it('rolls back Anime.description when immutable commit audit INSERT fails', async () => {
    const f = await fixture();
    await attest(f); await approve(f);
    const removeTrigger = await installInsertFailure('EditorialSynopsisCommit', f.caseId);
    try { await expect(commit(f)).rejects.toThrow(); }
    finally { await removeTrigger(); }
    const anime = await prisma.anime.findUniqueOrThrow({ where: { id: f.animeId } });
    expect(anime.description).toBe(f.anime.description);
    expect(anime.updatedAt).toEqual(f.anime.updatedAt);
    expect(await prisma.editorialSynopsisCommit.count({ where: { caseId: f.caseId } })).toBe(0);
  });

  it('rejects revoked provenance, wrong revision, and concurrent approvals', async () => {
    const revoked = await fixture(); await attest(revoked);
    await prisma.editorialSynopsisEvidence.update({
      where: { caseId: revoked.caseId }, data: { revokedAt: new Date() },
    });
    await expect(approve(revoked)).rejects.toThrow();
    expect(await prisma.editorialCase.findUniqueOrThrow({ where: { id: revoked.caseId } }))
      .toMatchObject({ state: 'UNDER_REVIEW', revision: 3 });
    const concurrent = await fixture(); await attest(concurrent);
    await expect(approval.approve({ id: concurrent.reviewer, role: 'ADMIN' },
      { caseId: concurrent.caseId, expectedRevision: 2, note: humanReason })).rejects.toThrow();
    const results = await Promise.allSettled([approve(concurrent), approve(concurrent)]);
    expect(results.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(x => x.status === 'rejected')).toHaveLength(1);
    expect(await prisma.editorialSynopsisApproval.count({ where: { caseId: concurrent.caseId } })).toBe(1);
  });
});
