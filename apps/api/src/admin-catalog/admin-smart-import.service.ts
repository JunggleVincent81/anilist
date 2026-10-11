import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogImportStatus, EditorialSubjectType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { AdminImportHistoryInput, ApplyAdminImportInput, PreviewAdminImportInput } from './admin-smart-import.graphql.js';
import { AdminStructuredSubject } from './admin-structured-candidates.graphql.js';
import { IMPORT_MAX_BYTES, inspectImport, sha256, type ImportFormat, type ParsedImportRow } from './admin-smart-import.parser.js';
import { cleanCandidateText } from './admin-structured-candidate-fields.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DIGEST=/^[0-9a-f]{64}$/;
const selection={id:true,creatorId:true,subjectType:true,fileName:true,fileSha256:true,format:true,sourceName:true,
  sourceReference:true,status:true,rowCount:true,validCount:true,invalidCount:true,
  createdCount:true,skippedCount:true,rows:true,createdAt:true,appliedAt:true} as const;
type Batch=Prisma.CatalogImportBatchGetPayload<{select:typeof selection}>;
function parseStored(value:Prisma.JsonValue):ParsedImportRow[] {
  if(!Array.isArray(value) || value.length>100)throw new ConflictException('Stored import preview is invalid.');
  const rows=value as unknown as ParsedImportRow[];
  if(rows.some(r=>!r||!Number.isInteger(r.line)||r.line<2||r.line>101||
    (r.digest!==null&&!DIGEST.test(r.digest))||
    (r.fields!==null&&(!r.fields||typeof r.fields!=='object'||Array.isArray(r.fields)))))
    throw new ConflictException('Stored import preview integrity failure.');
  return rows;
}
function view(batch:Batch){
  const rows=parseStored(batch.rows);
  return {id:batch.id,subjectType:batch.subjectType,fileName:batch.fileName,fileSha256:batch.fileSha256,
    format:batch.format,sourceName:batch.sourceName,sourceReference:batch.sourceReference,status:batch.status,
    rowCount:batch.rowCount,validCount:batch.validCount,invalidCount:batch.invalidCount,
    createdCount:batch.createdCount,skippedCount:batch.skippedCount,createdAt:batch.createdAt,appliedAt:batch.appliedAt,
    issuesJson:JSON.stringify(rows.filter(x=>x.error).map(x=>({row:x.line,reason:x.error})).slice(0,100))};
}
function missingTable(e:unknown){return e!==null&&typeof e==='object'&&'code' in e&&e.code==='P2021';}
function normalizeBase64(text:unknown):Buffer {
  if(typeof text!=='string'||text.length<4||text.length>90000||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))
    throw new BadRequestException('Invalid RFC4648 base64 upload.');
  const bytes=Buffer.from(text,'base64');
  if(bytes.length<2||bytes.length>IMPORT_MAX_BYTES||bytes.toString('base64')!==text)
    throw new BadRequestException('Spreadsheet exceeds secure import bounds.');
  return bytes;
}
function formatOf(fileName:string):ImportFormat {
  if(/\.csv$/i.test(fileName))return 'CSV';
  if(/\.xlsx$/i.test(fileName))return 'XLSX';
  throw new BadRequestException('Only CSV and XLSX files are supported.');
}
function historyInput(input?:AdminImportHistoryInput){
  const page=input?.page??1,perPage=input?.perPage??20;
  if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(perPage)||perPage<1||perPage>50||
      (page-1)*perPage>100000)throw new BadRequestException('Invalid history pagination.');
  return {page,perPage};
}
/** Two-stage private import: PREVIEWED ledger first, then explicit APPLIED, never canonical/public. */
@Injectable()
export class AdminSmartImportService {
  constructor(private readonly prisma:PrismaService){}
  private async admin(actorId:string,db:Pick<PrismaService,'user'>=this.prisma){
    if(!UUID.test(actorId))throw new ForbiddenException('Authenticated ADMIN required.');
    const user=await db.user.findUnique({where:{id:actorId},select:{role:true}});
    if(user?.role!==UserRole.ADMIN)throw new ForbiddenException('Persisted ADMIN role required.');
  }
  async history(actorId:string,input?:AdminImportHistoryInput){
    const {page,perPage}=historyInput(input);await this.admin(actorId);
    const where={creatorId:actorId};
    try{
      const [total,records]=await Promise.all([
        this.prisma.catalogImportBatch.count({where}),
        this.prisma.catalogImportBatch.findMany({where,select:selection,
          orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*perPage,take:perPage}),
      ]);
      return {items:records.map(view),page,perPage,total,hasNextPage:page*perPage<total,available:true};
    }catch(e){if(missingTable(e))return {items:[],page,perPage,total:null,hasNextPage:false,available:false};throw e;}
  }
  async preview(actorId:string,input:PreviewAdminImportInput){
    if(!input||!Object.values(EditorialSubjectType).includes(input.subjectType))throw new BadRequestException('Unsupported import kind.');
    const kind=input.subjectType as AdminStructuredSubject;
    const name=cleanCandidateText(input.fileName,'filename',150);
    if(name.includes('/')||name.includes('\\')||name.includes('..'))throw new BadRequestException('Unsafe filename.');
    const format=formatOf(name);
    const sourceName=cleanCandidateText(input.sourceName,'source name',150);
    const sourceReference=cleanCandidateText(input.sourceReference,'source reference',450);
    await this.admin(actorId);
    const bytes=normalizeBase64(input.base64);
    let parsed:ParsedImportRow[];
    try{parsed=inspectImport(bytes,format,kind);}catch(e){if(e instanceof BadRequestException)throw e;throw new BadRequestException('Spreadsheet format is unsupported or malformed.');}
    const fileSha256=sha256(bytes);
    const validCount=parsed.filter(x=>!!x.fields).length;
    const invalidCount=parsed.filter(x=>x.error!=='Duplicate row in this file.'&&x.error!==null).length;
    const key={creatorId_subjectType_fileSha256:{creatorId:actorId,subjectType:input.subjectType,fileSha256}};
    const previous=await this.prisma.catalogImportBatch.findUnique({where:key,select:selection});
    if(previous)return view(previous);
    try{
      const created=await this.prisma.catalogImportBatch.create({data:{creatorId:actorId,subjectType:input.subjectType,
        fileName:name,fileSha256,format,sourceName,sourceReference,status:CatalogImportStatus.PREVIEWED,
        rowCount:parsed.length,validCount,invalidCount,createdCount:0,skippedCount:0,
        rows:parsed as unknown as Prisma.InputJsonValue},select:selection});
      return view(created);
    }catch(e){if(e!==null&&typeof e==='object'&&'code' in e&&e.code==='P2002'){
      const existing=await this.prisma.catalogImportBatch.findUnique({where:key,select:selection});
      if(existing)return view(existing);
    }throw e;}
  }
  async apply(actorId:string,input:ApplyAdminImportInput){
    if(!input||!UUID.test(input.batchId)||!DIGEST.test(input.expectedFileSha256))throw new BadRequestException('Batch identifier and exact SHA-256 required.');
    return this.prisma.$transaction(async tx=>{
      await this.admin(actorId,tx);
      const batch=await tx.catalogImportBatch.findUnique({where:{id:input.batchId},select:selection});
      if(!batch||batch.creatorId!==actorId)throw new NotFoundException('Import batch unavailable.');
      if(batch.fileSha256!==input.expectedFileSha256)throw new ConflictException('Spreadsheet checksum mismatch.');
      if(batch.status===CatalogImportStatus.APPLIED)return view(batch);
      if(batch.status!==CatalogImportStatus.PREVIEWED||batch.invalidCount!==0)
        throw new ConflictException('Resolve all invalid rows before staging.');
      const rows=parseStored(batch.rows);
      if(rows.length!==batch.rowCount||rows.filter(r=>r.fields).length!==batch.validCount)
        throw new ConflictException('Import audit counts are inconsistent.');
      const accepted=rows.filter(r=>r.fields!==null&&r.digest!==null);
      const digests=accepted.map(r=>r.digest!);
      const existing=digests.length?await tx.catalogCandidate.findMany({where:{subjectType:batch.subjectType,
        fingerprint:{in:digests}},select:{fingerprint:true}}):[];
      const seen=new Set(existing.map(x=>x.fingerprint));
      const creations=accepted.filter(r=>!seen.has(r.digest));
      const skipped=rows.length-creations.length;
      if(creations.length){
        await tx.catalogCandidate.createMany({data:creations.map(r=>({subjectType:batch.subjectType,
          sourceName:batch.sourceName,sourceReference:batch.sourceReference,creatorId:actorId,
          sourcePayload:{entryType:'STRUCTURED_IMPORT_V1',batchId:batch.id,fileSha256:batch.fileSha256,
            line:r.line,sourceReference:batch.sourceReference,subjectType:batch.subjectType},
          normalizedPayload:r.fields!,fingerprint:r.digest!,isQuarantined:true}))});
      }
      const changed=await tx.catalogImportBatch.updateMany({where:{id:batch.id,creatorId:actorId,
        status:CatalogImportStatus.PREVIEWED,fileSha256:input.expectedFileSha256},
        data:{status:CatalogImportStatus.APPLIED,createdCount:creations.length,skippedCount:skipped,appliedAt:new Date()}});
      if(changed.count!==1)throw new ConflictException('Concurrent import operation detected.');
      const completed=await tx.catalogImportBatch.findUnique({where:{id:batch.id},select:selection});
      if(!completed)throw new ConflictException('Committed import history is unavailable.');
      return view(completed);
    },{isolationLevel:'Serializable'});
  }
}
