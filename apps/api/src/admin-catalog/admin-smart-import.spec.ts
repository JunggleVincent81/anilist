import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CatalogImportStatus, EditorialSubjectType, UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { inspectImport, parseCsv, parseXlsx, sha256 } from './admin-smart-import.parser.js';
import { AdminSmartImportService } from './admin-smart-import.service.js';
import { AdminStructuredSubject } from './admin-structured-candidates.graphql.js';

const actor='f9dcaa8a-e750-48b4-9d80-30f67172ddf9';
const id='5bd2df9c-8268-418a-9960-e660c0025804';
const data=Buffer.from('title,synopsis\nExample manga,Some description\n','utf8');
const request={subjectType:EditorialSubjectType.MANGA_WORK,fileName:'titles.csv',base64:data.toString('base64'),
  sourceName:'Curator',sourceReference:'https://example.org/source'};

function zipStored(name:string,contents:string):Buffer {
  const path=Buffer.from(name),payload=Buffer.from(contents);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt32LE(payload.length,18);
  local.writeUInt32LE(payload.length,22);local.writeUInt16LE(path.length,26);
  const dir=Buffer.alloc(46);dir.writeUInt32LE(0x02014b50,0);dir.writeUInt32LE(payload.length,20);
  dir.writeUInt32LE(payload.length,24);dir.writeUInt16LE(path.length,28);
  const offset=local.length+path.length+payload.length;
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
  end.writeUInt32LE(dir.length+path.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([local,path,payload,dir,path,end]);
}
function fixture(role:UserRole=UserRole.ADMIN) {
  const batch={id,creatorId:actor,subjectType:EditorialSubjectType.MANGA_WORK,fileName:'titles.csv',
    fileSha256:sha256(data),format:'CSV',sourceName:'Curator',sourceReference:'https://example.org/source',
    status:CatalogImportStatus.PREVIEWED,rowCount:1,validCount:1,invalidCount:0,createdCount:0,skippedCount:0,
    rows:[{line:2,fields:{title:'Example manga',synopsis:'Some description'},digest:sha256('MANGA_WORK\n'+JSON.stringify({title:'Example manga',synopsis:'Some description'})),error:null}],
    createdAt:new Date(),appliedAt:null};
  const user=jest.fn(async(_args?:unknown)=>({role}));
  const findUnique=jest.fn(async(_args?:unknown):Promise<typeof batch|null>=>batch);
  const count=jest.fn(async(_args?:unknown)=>1);
  const findMany=jest.fn(async(_args?:unknown)=>[]);
  const batchCreate=jest.fn(async(_args?:unknown)=>batch);
  const updateMany=jest.fn(async(_args?:unknown)=>({count:1}));
  const candidates=jest.fn(async(_args?:unknown)=>[]);
  const createMany=jest.fn(async(_args?:unknown)=>({count:1}));
  const tx={user:{findUnique:user},catalogImportBatch:{findUnique,updateMany},
    catalogCandidate:{findMany:candidates,createMany}};
  const db={user:{findUnique:user},catalogImportBatch:{findUnique,count,findMany,create:batchCreate},
    catalogCandidate:{findMany:candidates,createMany},
    $transaction:async<T>(f:(transaction:typeof tx)=>Promise<T>):Promise<T>=>f(tx)};
  return {service:new AdminSmartImportService(db as unknown as PrismaService),batch,user,findUnique,batchCreate,
    updateMany,createMany,candidates};
}

describe('P16-W08 staged import parser and guarded workflows',()=>{
  it('all W08 operations require persisted ADMIN and RolesGuard',()=>{
    for(const name of ['adminImportHistory','previewAdminImport','applyAdminImport'] as const){
      const method=AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY,method)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__',method)).toContain(RolesGuard);
    }
  });
  it('parses UTF-8 quoted CSV, validates W04 fields and detects duplicate rows',()=>{
    expect(parseCsv('title,synopsis\r\n"Manga, A","Has ""quote"""\r\n')).toEqual([
      ['title','synopsis'],['Manga, A','Has "quote"']]);
    const rows=inspectImport(Buffer.from('title\nFoo\nFoo\n'), 'CSV', AdminStructuredSubject.MANGA_WORK);
    expect(rows.map(x=>x.error)).toEqual([null,'Duplicate row in this file.']);
    expect(()=>inspectImport(Buffer.from('title,isPublished\nFoo,true\n'),'CSV',AdminStructuredSubject.MANGA_WORK)).toThrow(BadRequestException);
  });
  it('rejects formula injection, malformed base64 and unsupported spreadsheet',async()=>{
    expect(inspectImport(Buffer.from('title\n=HYPERLINK(1)\n'),'CSV',AdminStructuredSubject.MANGA_WORK)[0]?.error).toMatch(/formula/i);
    const x=fixture();
    await expect(x.service.preview(actor,{...request,base64:'!!!'})).rejects.toThrow(BadRequestException);
    await expect(x.service.preview(actor,{...request,fileName:'malware.xlsm'})).rejects.toThrow(BadRequestException);
    expect(x.batchCreate).not.toHaveBeenCalled();
  });
  it('reads plain spreadsheet OOXML sheet1 without evaluating formulas',()=>{
    const xml='<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>title</t></is></c></row>'+
      '<row r="2"><c r="A2" t="inlineStr"><is><t>Foo</t></is></c></row></sheetData></worksheet>';
    expect(parseXlsx(zipStored('xl/worksheets/sheet1.xml',xml))).toEqual([['title'],['Foo']]);
    expect(()=>parseXlsx(zipStored('xl/worksheets/sheet1.xml',xml.replace('<t>Foo</t>','<f>HYPERLINK(1)</f><v>2</v>')))).toThrow(BadRequestException);
  });
  it('rejects non-admin before any preview ledger write',async()=>{
    const x=fixture(UserRole.USER);
    await expect(x.service.preview(actor,request)).rejects.toThrow(ForbiddenException);
    expect(x.batchCreate).not.toHaveBeenCalled();
  });
  it('persists safe dry-run without creating catalog candidates',async()=>{
    const x=fixture();const result=await x.service.preview(actor,request);
    expect(result.status).toBe(CatalogImportStatus.PREVIEWED);
    expect(x.createMany).not.toHaveBeenCalled();
  });
  it('requires explicit SHA and blocks invalid audit rows before candidate writes',async()=>{
    const x=fixture();
    await expect(x.service.apply(actor,{batchId:id,expectedFileSha256:'f'.repeat(64)})).rejects.toThrow(ConflictException);
    expect(x.createMany).not.toHaveBeenCalled();
    const y=fixture();y.findUnique.mockImplementationOnce(async()=>({...y.batch,invalidCount:1}));
    await expect(y.service.apply(actor,{batchId:id,expectedFileSha256:y.batch.fileSha256})).rejects.toThrow(ConflictException);
    expect(y.createMany).not.toHaveBeenCalled();
  });
  it('creates quarantined fingerprinted candidates atomically with applied history',async()=>{
    const x=fixture();await x.service.apply(actor,{batchId:id,expectedFileSha256:x.batch.fileSha256});
    expect(x.createMany).toHaveBeenCalledWith(expect.objectContaining({data:expect.arrayContaining([
      expect.objectContaining({isQuarantined:true,creatorId:actor,subjectType:'MANGA_WORK',
        sourcePayload:expect.objectContaining({entryType:'STRUCTURED_IMPORT_V1',batchId:id})}),
    ])}));
    expect(x.updateMany).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:CatalogImportStatus.APPLIED})}));
  });
});
