import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EditorialCaseState, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { planEditorialWorkflowTransition } from './editorial-workflow-policy.js';
import type { AdminEditorialPageInput, CreateAdminEditorialCaseInput, TransitionAdminEditorialCaseInput } from './admin-editorial-review.graphql.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const candidateSelect = { id:true, subjectType:true, sourceName:true, sourceReference:true,
  sourcePayload:true, normalizedPayload:true, fingerprint:true, creatorId:true,
  isQuarantined:true, updatedAt:true, _count:{select:{editorialCases:true}} } as const;
const itemSelect = {id:true,candidateId:true,canonicalEntityId:true,subjectType:true,state:true,revision:true,
  openedById:true,legacyChangeRequestId:true,createdAt:true,updatedAt:true,
  candidate:{select:{id:true,sourceName:true,sourceReference:true,normalizedPayload:true}} } as const;
const detailSelect = {...itemSelect,transitions:{select:{id:true,actorId:true,action:true,fromState:true,toState:true,
  previousRevision:true,nextRevision:true,note:true,createdAt:true},orderBy:{nextRevision:'asc' as const},take:200}} as const;

type Candidate = Prisma.CatalogCandidateGetPayload<{select:typeof candidateSelect}>;
type CaseItem = Prisma.EditorialCaseGetPayload<{select:typeof itemSelect}>;
type CaseDetail = Prisma.EditorialCaseGetPayload<{select:typeof detailSelect}>;

function isManual(row:Candidate):boolean {
  const p = row.sourcePayload;
  if (row.fingerprint !== null || !p || typeof p !== 'object' || Array.isArray(p)) return false;
  if (p.sourceReference !== row.sourceReference) return false;
  if (p.entryType === 'MANUAL_STRUCTURED_DRAFT_V1') return p.subjectType === row.subjectType;
  return p.entryType === 'MANUAL_ANIME_DRAFT' && row.subjectType === 'ANIME';
}
function previewLabel(data:unknown):string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Private candidate';
  const record=data as Record<string,unknown>;
  const value=record.title ?? record.displayName ?? record.synopsis ?? record.episodeKey ?? record.chapterKey;
  return typeof value==='string' ? value.slice(0,160) : 'Private candidate';
}
function item(row:CaseItem) {
  return {id:row.id,candidateId:row.candidateId!,canonicalEntityId:row.canonicalEntityId,
    subjectType:row.subjectType,state:row.state,revision:row.revision,openedById:row.openedById,
    candidateLabel:previewLabel(row.candidate?.normalizedPayload),sourceName:row.candidate?.sourceName ?? 'Unknown source',
    createdAt:row.createdAt,updatedAt:row.updatedAt};
}
function missingTable(e:unknown){return typeof e==='object' && e!==null && 'code' in e && e.code==='P2021';}
function pageInput(input?:AdminEditorialPageInput) {
  const page=input?.page??1,perPage=input?.perPage??20;
  if(!Number.isSafeInteger(page)||page<1||page>10000||!Number.isSafeInteger(perPage)||perPage<1||perPage>50||(page-1)*perPage>100000)throw new BadRequestException('Invalid pagination.');
  if(input?.onlyMine!==undefined && typeof input.onlyMine!=='boolean')throw new BadRequestException('Invalid ownership filter.');
  if(input?.state!==undefined && !['DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','REVOKED'].includes(input.state))throw new BadRequestException('Invalid case state.');
  return {page,perPage};
}

/** ADMIN-only private review queue. Never registers the internal approval/commit services. */
@Injectable()
export class AdminEditorialReviewService {
  constructor(private readonly prisma:PrismaService){}
  private async admin(actorId:string,db:Pick<PrismaService,'user'>=this.prisma){
    if(!UUID.test(actorId))throw new ForbiddenException('ADMIN authentication required.');
    const actor=await db.user.findUnique({where:{id:actorId},select:{role:true}});
    if(actor?.role!==UserRole.ADMIN)throw new ForbiddenException('Persisted ADMIN role required.');
  }
  async page(actorId:string,input?:AdminEditorialPageInput){
    const {page,perPage}=pageInput(input);await this.admin(actorId);
    const where:Prisma.EditorialCaseWhereInput={legacyChangeRequestId:null,candidateId:{not:null},
      ...(input?.onlyMine===false?{}:{openedById:actorId}),
      ...(input?.state?{state:input.state as EditorialCaseState}: {})};
    try{
      const [total,rows]=await Promise.all([
        this.prisma.editorialCase.count({where}),
        this.prisma.editorialCase.findMany({where,select:itemSelect,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*perPage,take:perPage}),
      ]);
      return {items:rows.filter(r=>r.candidateId&&r.candidate).map(item),page,perPage,total,hasNextPage:page*perPage<total,available:true};
    }catch(e){if(missingTable(e))return {items:[],page,perPage,total:null,hasNextPage:false,available:false};throw e;}
  }
  async create(actorId:string,input:CreateAdminEditorialCaseInput){
    if(!input||!UUID.test(input.candidateId)|| (input.canonicalEntityId!==undefined && !UUID.test(input.canonicalEntityId)))throw new BadRequestException('Valid candidate/canonical identifiers required.');
    return this.prisma.$transaction(async tx=>{
      await this.admin(actorId,tx);
      const candidate=await tx.catalogCandidate.findUnique({where:{id:input.candidateId},select:candidateSelect});
      if(!candidate||candidate.creatorId!==actorId||!candidate.isQuarantined||!isManual(candidate)||
          !candidate.normalizedPayload||typeof candidate.normalizedPayload!=='object'||Array.isArray(candidate.normalizedPayload)||candidate._count.editorialCases!==0)
        throw new ConflictException('Owned, untouched manual draft required.');
      const canonical=input.canonicalEntityId??null;
      if(canonical){
        if(!['ANIME','MANGA_WORK','MUSIC_TRACK'].includes(candidate.subjectType))throw new BadRequestException('Existing-entity diff is not supported for this type. Use a new-entry case.');
        const exists=candidate.subjectType==='ANIME'?await tx.anime.findUnique({where:{id:canonical},select:{id:true}}):
          candidate.subjectType==='MANGA_WORK'?await tx.mangaWork.findUnique({where:{id:canonical},select:{id:true}}):
          await tx.animeMusicTrack.findUnique({where:{id:canonical},select:{id:true}});
        if(!exists)throw new NotFoundException('Canonical target not found.');
      }
      // This private row lock invalidates stale draft versions; the linked case prevents future edits.
      const locked=await tx.catalogCandidate.updateMany({where:{id:candidate.id,subjectType:candidate.subjectType,
        creatorId:actorId,isQuarantined:true,fingerprint:null,updatedAt:candidate.updatedAt,editorialCases:{none:{}}},
        data:{updatedAt:new Date(Math.max(Date.now(),candidate.updatedAt.getTime()+1))}});
      if(locked.count!==1)throw new ConflictException('Candidate changed or already linked to review.');
      const created=await tx.editorialCase.create({data:{subjectType:candidate.subjectType,candidateId:candidate.id,
        canonicalEntityId:canonical,openedById:actorId,state:'DRAFT',revision:1},select:itemSelect});
      return item(created);
    },{isolationLevel:'Serializable'});
  }
  async transition(actorId:string,input:TransitionAdminEditorialCaseInput){
    if(!input||!UUID.test(input.caseId)||!Number.isSafeInteger(input.expectedRevision)||
      input.expectedRevision<1||input.expectedRevision>2147483646||
      !['SUBMIT','BEGIN_REVIEW','REQUEST_CHANGES','REJECT'].includes(input.action))throw new BadRequestException('Invalid guarded transition request.');
    return this.prisma.$transaction(async tx=>{
      await this.admin(actorId,tx);
      const current=await tx.editorialCase.findUnique({where:{id:input.caseId},select:{
        id:true,subjectType:true,candidateId:true,canonicalEntityId:true,legacyChangeRequestId:true,
        state:true,revision:true,openedById:true,candidate:{select:{isQuarantined:true,creatorId:true,subjectType:true}}}});
      if(!current)throw new NotFoundException('Editorial case unavailable.');
      if(current.revision!==input.expectedRevision||!current.candidateId||!current.candidate||
        !current.candidate.isQuarantined||current.candidate.subjectType!==current.subjectType||
        current.candidate.creatorId!==current.openedById||current.legacyChangeRequestId!==null)
        throw new ConflictException('Candidate or case changed; reload.');
      const policy=planEditorialWorkflowTransition({actorId,actorRole:'ADMIN',action:input.action,state:current.state,
        revision:current.revision,openedById:current.openedById,legacyChangeRequestId:current.legacyChangeRequestId,note:input.note});
      const changed=await tx.editorialCase.updateMany({where:{id:current.id,revision:current.revision,
        state:current.state,openedById:current.openedById,legacyChangeRequestId:null,
        candidateId:current.candidateId,subjectType:current.subjectType},
        data:{state:policy.nextState,revision:{increment:1}}});
      if(changed.count!==1)throw new ConflictException('Concurrent review transition detected.');
      await tx.editorialCaseTransition.create({data:{caseId:current.id,actorId,action:input.action as 'SUBMIT'|'BEGIN_REVIEW'|'REQUEST_CHANGES'|'REJECT',
        fromState:current.state,toState:policy.nextState,previousRevision:current.revision,nextRevision:policy.nextRevision,
        policyVersion:policy.policyVersion,note:input.action==='REJECT'||input.action==='REQUEST_CHANGES'?input.note!.trim():null}});
      const updated=await tx.editorialCase.findUnique({where:{id:current.id},select:itemSelect});
      if(!updated)throw new ConflictException('Editorial case no longer available.');
      return item(updated);
    },{isolationLevel:'Serializable'});
  }
  async detail(actorId:string,caseId:string){
    if(!UUID.test(caseId))throw new BadRequestException('Invalid case ID.');
    await this.admin(actorId);
    const row:CaseDetail|null=await this.prisma.editorialCase.findUnique({where:{id:caseId},select:detailSelect});
    if(!row||row.legacyChangeRequestId!==null||!row.candidateId||!row.candidate)throw new NotFoundException('Private editorial case not found.');
    let beforeJson:string|null=null;
    let comparisonStatus='NEW_ENTRY';
    if(row.canonicalEntityId){
      comparisonStatus='UNSUPPORTED_CANONICAL_PREVIEW';
      let before:unknown=null;
      if(row.subjectType==='ANIME')before=await this.prisma.anime.findUnique({where:{id:row.canonicalEntityId},
        select:{id:true,title:true,description:true,format:true,status:true,updatedAt:true}});
      if(row.subjectType==='MANGA_WORK')before=await this.prisma.mangaWork.findUnique({where:{id:row.canonicalEntityId},
        select:{id:true,title:true,synopsis:true,updatedAt:true}});
      if(row.subjectType==='MUSIC_TRACK')before=await this.prisma.animeMusicTrack.findUnique({where:{id:row.canonicalEntityId},
        select:{id:true,title:true,artistName:true,category:true,updatedAt:true}});
      if(before){beforeJson=JSON.stringify(before);comparisonStatus='CURRENT_CANONICAL_SNAPSHOT';}
      else if(comparisonStatus!=='UNSUPPORTED_CANONICAL_PREVIEW')comparisonStatus='CANONICAL_TARGET_MISSING';
    }
    const proposedJson=row.candidate.normalizedPayload&&typeof row.candidate.normalizedPayload==='object'&&!Array.isArray(row.candidate.normalizedPayload)?
      JSON.stringify(row.candidate.normalizedPayload):null;
    return {...item(row),sourceReference:row.candidate.sourceReference,proposedJson,canonicalBeforeJson:beforeJson,
      comparisonStatus,history:row.transitions,commitReady:false,
      blockers:['This queue has no approve, unquarantine or canonical-commit command.',
        'Human source and media rights evidence require separate independent verification.',
        'Current baseline is a read-time preview, not a stored immutable canonical snapshot.']};
  }
}
