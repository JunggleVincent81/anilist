import { BadRequestException } from '@nestjs/common';
import { AdminStructuredSubject } from './admin-structured-candidates.graphql.js';

type Rule = { type: 'text' | 'longtext' | 'uuid' | 'int' | 'decimal' | 'date' | 'enum'; required?: boolean; max?: number; min?: number; values?: readonly string[] };
const txt = (max = 500, required = false): Rule => ({ type: 'text', max, required });
const uuid = (required = false): Rule => ({ type: 'uuid', required });
const num = (min = 0, max = 100000): Rule => ({ type: 'int', min, max });
const choice = (values: readonly string[]): Rule => ({ type: 'enum', values });

/** Strict field-level allowlist: intentionally omits isPublished, isAdult, assets and rights. */
export const SUBJECT_FIELDS: Record<AdminStructuredSubject, Readonly<Record<string, Rule>>> = {
  ANIME: { title: txt(500, true), titleRomaji: txt(500), titleEnglish: txt(500), titleNative: txt(500), synopsis: {type:'longtext',max:10000}, format: choice(['TV','MOVIE','OVA','ONA','SPECIAL','MUSIC','UNKNOWN']), seasonYear: num(1900,2200) },
  ANIME_EPISODE: { animeId: uuid(true), episodeKey: txt(180,true), title: txt(500), number: num(0,100000), durationMinutes: num(0,100000), sourceReference: txt(500) },
  MANGA_WORK: { title: txt(500,true), slug: txt(220), synopsis: {type:'longtext',max:10000} },
  MANGA_VOLUME: { mangaWorkId: uuid(true), volumeKey: txt(180,true), title: txt(500), number: num(0,100000), releaseDate: {type:'date'} },
  MANGA_CHAPTER: { mangaWorkId: uuid(true), chapterKey: txt(180,true), title: txt(500), chapterNumber: {type:'decimal'}, volumeId: uuid(), releaseDate: {type:'date'} },
  MUSIC_TRACK: { title: txt(500,true), artistName: txt(250,true), category: choice(['OPENING','ENDING','SOUNDTRACK','INSERT_SONG','OTHER']), animeId: uuid() },
  MUSIC_ARTIST: { displayName: txt(250,true), artistKey: txt(220,true) },
  MUSIC_RECORDING: { title: txt(500,true), recordingKey: txt(220,true), versionLabel: txt(250), durationMs: num(0,86400000) },
  MUSIC_RELEASE: { title: txt(500,true), releaseKey: txt(220,true), releaseType: choice(['SINGLE','EP','ALBUM','SOUNDTRACK','OTHER']), releaseDate: {type:'date'} },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex -- Intentional rejection of unsafe ASCII control characters.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;

export function cleanCandidateText(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || CONTROL.test(value)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value.trim();
}

export function normalizeStructuredFields(subjectType: AdminStructuredSubject, raw: string): Record<string,string|number> {
  const schema = SUBJECT_FIELDS[subjectType];
  if (!schema || typeof raw !== 'string' || raw.length < 2 || raw.length > 16000) {
    throw new BadRequestException('Unknown subject type or invalid structured payload.');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new BadRequestException('Invalid JSON field values.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.getPrototypeOf(parsed) !== Object.prototype) {
    throw new BadRequestException('Field values must be a JSON object.');
  }
  const source = parsed as Record<string,unknown>;
  const fields: Record<string,string|number> = {};
  if (Object.keys(source).length > 24) throw new BadRequestException('Too many fields.');
  for (const name of Object.keys(source)) {
    const rule = schema[name];
    if (!Object.hasOwn(schema,name) || !rule) throw new BadRequestException(`Unsupported field ${name}.`);
    const value = source[name];
    if (value === null || value === '') continue;
    if (rule.type === 'int') {
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < (rule.min ?? 0) || value > (rule.max ?? 100000)) {
        throw new BadRequestException(`Invalid ${name}.`);
      }
      fields[name] = value; continue;
    }
    if (typeof value !== 'string' || CONTROL.test(value)) throw new BadRequestException(`Invalid ${name}.`);
    const text = value.trim();
    if (!text) continue;
    if (rule.type === 'text' || rule.type === 'longtext') {
      if (text.length > (rule.max ?? 500)) throw new BadRequestException(`Invalid ${name}.`);
    } else if (rule.type === 'uuid' && !UUID.test(text)) throw new BadRequestException(`Invalid ${name}.`);
    else if (rule.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00.000Z`)) || new Date(`${text}T00:00:00.000Z`).toISOString().slice(0,10)!==text)) throw new BadRequestException(`Invalid ${name}.`);
    else if (rule.type === 'decimal' && !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/.test(text)) throw new BadRequestException(`Invalid ${name}.`);
    else if (rule.type === 'enum' && !rule.values?.includes(text)) throw new BadRequestException(`Invalid ${name}.`);
    fields[name]=text;
  }
  for (const [name,rule] of Object.entries(schema)) {
    if (rule.required && !Object.hasOwn(fields,name)) throw new BadRequestException(`Missing ${name}.`);
  }
  return fields;
}
