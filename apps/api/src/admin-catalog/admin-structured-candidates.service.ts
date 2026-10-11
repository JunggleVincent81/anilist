import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { AdminStructuredSubject } from './admin-structured-candidates.graphql.js';
import type { AdminStructuredCandidatePageInput, CreateAdminStructuredCandidateInput, UpdateAdminStructuredCandidateInput } from './admin-structured-candidates.graphql.js';
import { cleanCandidateText, normalizeStructuredFields } from './admin-structured-candidate-fields.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ENTRY_TYPE = 'MANUAL_STRUCTURED_DRAFT_V1';
const selection = {id:true,subjectType:true,sourceName:true,sourceReference:true,sourcePayload:true,normalizedPayload:true,
  fingerprint:true,isQuarantined:true,creatorId:true,createdAt:true,updatedAt:true,
  _count:{select:{editorialCases:true,synopsisEvidence:true}}} as const;

type Candidate = Prisma.CatalogCandidateGetPayload<{select:typeof selection}>;
function manual(row: Candidate): boolean {
  const source = row.sourcePayload;
  return row.fingerprint === null && !!source && typeof source === 'object' && !Array.isArray(source) &&
    source.entryType === ENTRY_TYPE && source.sourceReference === row.sourceReference && source.subjectType === row.subjectType;
}
function present(row: Candidate, actorId: string) {
  let fieldsJson: string|null = null;
  if (manual(row) && row.normalizedPayload && typeof row.normalizedPayload === 'object' && !Array.isArray(row.normalizedPayload)) {
    const fields = row.normalizedPayload;
    try { fieldsJson = JSON.stringify(normalizeStructuredFields(row.subjectType as AdminStructuredSubject, JSON.stringify(fields))); }
    catch { fieldsJson = null; }
  }
  const editable = manual(row) && fieldsJson !== null && row.creatorId === actorId && row.isQuarantined &&
    row._count.editorialCases === 0 && row._count.synopsisEvidence === 0;
  return {id:row.id,subjectType:row.subjectType as AdminStructuredSubject,sourceName:row.sourceName,
    sourceReference:row.sourceReference,fieldsJson,isQuarantined:row.isQuarantined,
    editable,createdAt:row.createdAt,updatedAt:row.updatedAt};
}

/** P16-W04 private draft-first editor. No canonical/public writes or provenance attestations. */
@Injectable()
export class AdminStructuredCandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async admin(actorId: string) {
    if (!UUID.test(actorId)) throw new ForbiddenException('Administrator required.');
    const actor = await this.prisma.user.findUnique({where:{id:actorId},select:{role:true}});
    if (actor?.role !== UserRole.ADMIN) throw new ForbiddenException('Administrator required.');
  }
  private validate(input: CreateAdminStructuredCandidateInput) {
    if (!input || !Object.values(AdminStructuredSubject).includes(input.subjectType)) {
      throw new BadRequestException('Unknown draft subject type.');
    }
    return {subjectType:input.subjectType,sourceName:cleanCandidateText(input.sourceName,'source name',150),
      sourceReference:cleanCandidateText(input.sourceReference,'source reference',500),
      fields:normalizeStructuredFields(input.subjectType,input.fieldsJson)};
  }
  async page(actorId:string,input:AdminStructuredCandidatePageInput) {
    if (!input || !Object.values(AdminStructuredSubject).includes(input.subjectType)) throw new BadRequestException('Unknown subject type.');
    const page=input.page??1,perPage=input.perPage??20;
    if (!Number.isSafeInteger(page) || page<1 || page>100000 || !Number.isSafeInteger(perPage) || perPage<1 || perPage>50 || (page-1)*perPage>100000) {
      throw new BadRequestException('Invalid pagination.');
    }
    if(input.onlyMine!==undefined && typeof input.onlyMine!=='boolean')throw new BadRequestException('Invalid ownership filter.');
    if(input.search!==undefined && typeof input.search!=='string')throw new BadRequestException('Invalid search.');
    const search=input.search?.trim()??'';
    if(search.length>120)throw new BadRequestException('Search exceeds 120 characters.');
    await this.admin(actorId);
    const where:Prisma.CatalogCandidateWhereInput={subjectType:input.subjectType,
      ...(input.onlyMine===false?{}:{creatorId:actorId}),
      ...(search?{OR:[{sourceName:{contains:search,mode:'insensitive'}},{sourceReference:{contains:search,mode:'insensitive'}}]}:{})};
    const [total,rows]=await Promise.all([
      this.prisma.catalogCandidate.count({where}),
      this.prisma.catalogCandidate.findMany({where,select:selection,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*perPage,take:perPage}),
    ]);
    return {items:rows.map(row=>present(row,actorId)),page,perPage,total,hasNextPage:page*perPage<total};
  }
  async create(actorId:string,input:CreateAdminStructuredCandidateInput) {
    const payload=this.validate(input);
    await this.admin(actorId);
    const row=await this.prisma.catalogCandidate.create({data:{subjectType:payload.subjectType,sourceName:payload.sourceName,
      sourceReference:payload.sourceReference,creatorId:actorId,isQuarantined:true,
      sourcePayload:{entryType:ENTRY_TYPE,subjectType:payload.subjectType,sourceReference:payload.sourceReference},
      normalizedPayload:payload.fields},select:selection});
    return present(row,actorId);
  }
  async update(actorId:string,input:UpdateAdminStructuredCandidateInput) {
    if(!input || !UUID.test(input.candidateId) || typeof input.expectedUpdatedAt!=='string' || !ISO.test(input.expectedUpdatedAt) ||
      Number.isNaN(Date.parse(input.expectedUpdatedAt)))throw new BadRequestException('Exact candidate/version token required.');
    const payload=this.validate(input);
    await this.admin(actorId);
    const expected=new Date(input.expectedUpdatedAt);
    return this.prisma.$transaction(async tx=>{
      const current=await tx.catalogCandidate.findUnique({where:{id:input.candidateId},select:selection});
      if(!current || current.subjectType!==payload.subjectType || !manual(current) || current.creatorId!==actorId ||
        !current.isQuarantined || current.updatedAt.getTime()!==expected.getTime() ||
        current._count.editorialCases!==0 || current._count.synopsisEvidence!==0) {
        throw new ConflictException('Candidate changed, locked, or inaccessible. Refresh before editing.');
      }
      const result=await tx.catalogCandidate.updateMany({where:{id:current.id,subjectType:payload.subjectType,
        creatorId:actorId,isQuarantined:true,fingerprint:null,updatedAt:expected,
        editorialCases:{none:{}},synopsisEvidence:{none:{}}},
        data:{sourceName:payload.sourceName,sourceReference:payload.sourceReference,
          sourcePayload:{entryType:ENTRY_TYPE,subjectType:payload.subjectType,sourceReference:payload.sourceReference},
          normalizedPayload:payload.fields,updatedAt:new Date(Math.max(Date.now(),expected.getTime()+1))}});
      if(result.count!==1)throw new ConflictException('Candidate changed; refresh before editing.');
      const saved=await tx.catalogCandidate.findUnique({where:{id:current.id},select:selection});
      if(!saved)throw new ConflictException('Candidate unavailable.');
      return present(saved,actorId);
    },{isolationLevel:'Serializable'});
  }
}
