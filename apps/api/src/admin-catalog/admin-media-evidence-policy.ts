import { BadRequestException } from '@nestjs/common';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX = /^[0-9a-f]{64}$/i;
// eslint-disable-next-line no-control-regex -- Reject unsafe ASCII control characters in curator-provided evidence.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
export function validId(value: unknown): value is string { return typeof value === 'string' && UUID.test(value); }
export function curatorText(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'string' || CONTROL.test(value) || value.trim().length < min || value.trim().length > max) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value.trim();
}
export function safeHttpsUrl(value: unknown): string {
  const url = curatorText(value, 'source URL', 10, 2048);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash ||
        !parsed.hostname.includes('.') || /\s/.test(url) || !url.startsWith('https://')) throw new Error('Invalid');
    return url;
  } catch { throw new BadRequestException('A canonical HTTPS source URL is required.'); }
}
export function optionalExpiry(value: unknown, now = new Date()): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new BadRequestException('Expiry must be exact UTC ISO 8601 or absent.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value || date <= now) {
    throw new BadRequestException('Expiry must be in the future.');
  }
  return date;
}
export function mediaMetadata(input: { animeId: string; sourceDossierId: string; kind: string; sha256: string;
  mime: string; byteLength: number; width: number; height: number; copyrightOwner: string }) {
  if (!validId(input.animeId) || !validId(input.sourceDossierId)) throw new BadRequestException('Valid existing record identifiers required.');
  if (input.kind !== 'COVER' && input.kind !== 'BANNER') throw new BadRequestException('Unsupported media kind.');
  if (typeof input.sha256 !== 'string' || !HEX.test(input.sha256)) throw new BadRequestException('SHA-256 digest required.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(input.mime)) throw new BadRequestException('Unsupported image MIME.');
  if (![input.byteLength, input.width, input.height].every(n => Number.isSafeInteger(n) && n > 0) ||
      input.byteLength > 50_000_000 || input.width > 20000 || input.height > 20000) {
    throw new BadRequestException('Invalid image dimensions or byte length.');
  }
  return { animeId: input.animeId, sourceDossierId: input.sourceDossierId,
    kind: input.kind as 'COVER' | 'BANNER', sha256: input.sha256.toLowerCase(), mime: input.mime,
    byteLength: input.byteLength, width: input.width, height: input.height,
    copyrightOwner: curatorText(input.copyrightOwner, 'copyright owner', 2, 255) };
}
export function boundedPage(input?: {page?:number; perPage?:number; onlyMine?:boolean}) {
  const page = input?.page ?? 1, perPage = input?.perPage ?? 20;
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(perPage) || perPage < 1 || perPage > 50 ||
      (page - 1) * perPage > 100000 || (input?.onlyMine !== undefined && typeof input.onlyMine !== 'boolean')) {
    throw new BadRequestException('Invalid media evidence pagination.');
  }
  return {page,perPage,skip:(page-1)*perPage};
}
