import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { AdminStructuredSubject } from './admin-structured-candidates.graphql.js';
import { SUBJECT_FIELDS, normalizeStructuredFields } from './admin-structured-candidate-fields.js';

export const IMPORT_MAX_BYTES = 64 * 1024;
export const IMPORT_MAX_ROWS = 100;
export type ImportFormat = 'CSV' | 'XLSX';
export type ParsedImportRow = { line: number; fields: Record<string, string | number> | null; digest: string | null; error: string | null };
export function sha256(data: string | Buffer): string { return createHash('sha256').update(data).digest('hex'); }
function invalid(message: string): never { throw new BadRequestException(message); }

export function parseCsv(text: string): string[][] {
  if (text.includes('\0')) invalid('Control bytes are not allowed in CSV.');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else cell += c;
      continue;
    }
    if (afterQuote) {
      if (c === ',') { row.push(cell); cell = ''; afterQuote = false; }
      else if (c === '\n' || c === '\r') {
        row.push(cell); rows.push(row); row = []; cell = ''; afterQuote = false;
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else invalid('Unexpected text after closing CSV quote.');
      continue;
    }
    if (c === '"') { if (cell) invalid('Invalid CSV quoting.'); quoted = true; }
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      row.push(cell); rows.push(row); row = []; cell = '';
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else cell += c;
    if (cell.length > 12_000) invalid('Spreadsheet cell exceeds size limit.');
    if (rows.length > IMPORT_MAX_ROWS + 1) invalid('Import exceeds 100 data rows.');
  }
  if (quoted) invalid('Unclosed CSV quotation.');
  if (cell || row.length || afterQuote) { row.push(cell); rows.push(row); }
  if (rows.length > IMPORT_MAX_ROWS + 1) invalid('Import exceeds 100 data rows.');
  return rows;
}

function xmlEntities(source: string): string {
  return source.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);/g, entity => {
    if (entity === '&amp;') return '&'; if (entity === '&lt;') return '<';
    if (entity === '&gt;') return '>'; if (entity === '&quot;') return '"';
    if (entity === '&apos;') return "'";
    const hex = entity.startsWith('&#x');
    const n = Number.parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    if (!Number.isInteger(n) || n < 1 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) invalid('Unsafe XML entity.');
    return String.fromCodePoint(n);
  });
}
function xmlText(xml: string): string {
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml)) invalid('External XML processing is not allowed.');
  const chunks = [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m => xmlEntities(m[1]));
  return chunks.join('');
}
function attr(s: string, name: string): string | null {
  return new RegExp('(?:^|\\s)' + name + '="([^"]*)"').exec(s)?.[1] ?? null;
}
/** Bounded OOXML reader: first worksheet, strings/inline strings and numeric values only. No formulas, macros or links. */
export function parseXlsx(bytes: Buffer): string[][] {
  if (bytes.length < 22 || bytes.readUInt32LE(0) !== 0x04034b50) invalid('Invalid XLSX ZIP header.');
  const eocd = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0 || eocd + 22 > bytes.length || bytes.readUInt16LE(eocd + 20) !== 0) invalid('Invalid ZIP directory.');
  const count = bytes.readUInt16LE(eocd + 10), cdSize = bytes.readUInt32LE(eocd + 12), cd = bytes.readUInt32LE(eocd + 16);
  if (count > 80 || cd + cdSize > eocd || count < 1) invalid('Invalid XLSX directory size.');
  const entries = new Map<string, Buffer>(); let pos = cd, total = 0;
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || bytes.readUInt32LE(pos) !== 0x02014b50) invalid('Corrupt XLSX ZIP directory.');
    const method = bytes.readUInt16LE(pos + 10), flags = bytes.readUInt16LE(pos + 8);
    const compressed = bytes.readUInt32LE(pos + 20), raw = bytes.readUInt32LE(pos + 24);
    const nameLen = bytes.readUInt16LE(pos + 28), extraLen = bytes.readUInt16LE(pos + 30), commentLen = bytes.readUInt16LE(pos + 32);
    const local = bytes.readUInt32LE(pos + 42);
    if (pos + 46 + nameLen + extraLen + commentLen > bytes.length) invalid('Invalid XLSX filename.');
    const name = bytes.toString('utf8', pos + 46, pos + 46 + nameLen);
    if (!name || name.includes('..') || name.startsWith('/') || name.includes('\\') || name.includes('\0')) invalid('Unsafe XLSX member path.');
    if (flags & 1 || ![0, 8].includes(method) || raw > 2_000_000 || compressed > 65536) invalid('Unsupported XLSX ZIP entry.');
    total += raw; if (total > 4_000_000) invalid('XLSX decompression limit exceeded.');
    if (/\.bin$|externalLinks|connections|vbaProject|embeddings|activeX/i.test(name)) invalid('Active or external XLSX content is not allowed.');
    if (local + 30 > bytes.length || bytes.readUInt32LE(local) !== 0x04034b50) invalid('Broken XLSX local member.');
    const off = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    if (off + compressed > bytes.length) invalid('Truncated XLSX entry.');
    const rawBytes = method === 0 ? bytes.subarray(off, off + compressed) :
      inflateRawSync(bytes.subarray(off, off + compressed), { maxOutputLength: 2_000_001 });
    if (rawBytes.length !== raw) invalid('XLSX length mismatch.');
    if (name === 'xl/worksheets/sheet1.xml' || name === 'xl/sharedStrings.xml') entries.set(name, rawBytes);
    pos += 46 + nameLen + extraLen + commentLen;
  }
  const sheet = entries.get('xl/worksheets/sheet1.xml');
  if (!sheet) invalid('Only standard sheet1 XLSX is supported. Export the first worksheet.');
  const xml = new TextDecoder('utf-8', {fatal:true}).decode(sheet);
  if (/<\s*f(?:\s|>)/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) invalid('Spreadsheet formulas or DTD are not allowed. Export values only.');
  const stringsXml = entries.get('xl/sharedStrings.xml');
  const strings = stringsXml ? [...new TextDecoder('utf-8', {fatal:true}).decode(stringsXml).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m => xmlText(m[1])) : [];
  if (strings.length > 2000) invalid('Too many shared strings.');
  const data = /<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/.exec(xml)?.[1];
  if (!data) invalid('XLSX worksheet data is missing.');
  const rows: string[][] = [];
  for (const rowMatch of data.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const line = Number(attr(rowMatch[1], 'r'));
    if (!Number.isInteger(line) || line < 1 || line > IMPORT_MAX_ROWS + 1 || line !== rows.length + 1) invalid('XLSX rows must be contiguous, starting at row 1.');
    const row: string[] = [];
    for (const cell of rowMatch[2].matchAll(/<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const reference = attr(cell[1], 'r'), kind = attr(cell[1], 't');
      const letters = /^([A-Z]+)\d+$/.exec(reference ?? '')?.[1];
      if (!letters || letters.length > 2) invalid('Invalid XLSX cell reference.');
      let col = 0; for (const char of letters) col = col * 26 + char.charCodeAt(0) - 64;
      if (col < 1 || col > 40 || row[col - 1] !== undefined) invalid('Invalid or repeated XLSX column.');
      const content = cell[2] ?? '';
      let value: string;
      if (kind === 'inlineStr') value = xmlText(content);
      else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(content)?.[1] ?? '';
        value = kind === 's' ? strings[Number(raw)] : xmlEntities(raw);
        if (value === undefined || !['s', 'str', 'n', null].includes(kind)) invalid('Unsupported XLSX cell type.');
      }
      row[col - 1] = value;
    }
    rows.push(Array.from({length:row.length},(_,i)=>row[i]??''));
  }
  if (rows.length > IMPORT_MAX_ROWS + 1) invalid('Too many XLSX rows.');
  return rows;
}

export function inspectImport(bytes:Buffer, format:ImportFormat, subjectType:AdminStructuredSubject):ParsedImportRow[] {
  if (bytes.length < 2 || bytes.length > IMPORT_MAX_BYTES) invalid('Import file must be 2–65536 bytes.');
  const rows = format === 'CSV' ? parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'')) : parseXlsx(bytes);
  if (rows.length < 2 || rows.length > IMPORT_MAX_ROWS + 1) invalid('Spreadsheet requires a header and 1–100 data rows.');
  const headers = rows[0].map(s=>s.trim()); const names = new Set(headers);
  if (!headers.length || headers.length > 24 || names.size !== headers.length ||
      headers.some(k=>!Object.hasOwn(SUBJECT_FIELDS[subjectType] ?? {},k))) invalid('Spreadsheet header contains duplicate or unsupported fields.');
  const seen = new Set<string>();
  return rows.slice(1).map((values,i) => {
    try {
      if (values.length > headers.length && values.slice(headers.length).some(Boolean)) invalid('Unexpected extra columns.');
      const input:Record<string,unknown>={};
      for (let j=0;j<headers.length;j++) {
        const value=values[j] ?? '';
        if (/^[\s]*[=+@-]/.test(value)) invalid('Potential spreadsheet formula in row.');
        if (value.trim()) input[headers[j]]= SUBJECT_FIELDS[subjectType][headers[j]].type === 'int' ? Number(value) : value;
      }
      const fields=normalizeStructuredFields(subjectType,JSON.stringify(input));
      const digest=sha256(subjectType+'\n'+JSON.stringify(fields));
      if (seen.has(digest)) return {line:i+2,fields:null,digest,error:'Duplicate row in this file.'};
      seen.add(digest);
      return {line:i+2,fields,digest,error:null};
    } catch (e) { return {line:i+2,fields:null,digest:null,error:e instanceof Error ? e.message.slice(0,180) : 'Invalid row.'}; }
  });
}
