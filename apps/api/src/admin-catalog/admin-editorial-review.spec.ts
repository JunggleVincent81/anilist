import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminEditorialReviewService } from './admin-editorial-review.service.js';

const actor='f9dcaa8a-e750-48b4-9d80-30f67172ddf9';
const reviewer='39dcaa8a-e750-48b4-9d80-30f67172ddf8';
const candidateId='5bd2df9c-8268-418a-9960-e660c0025804';
const caseId='61d6c28b-113c-4a38-90ab-2444333ac2ce';
const stamp=new Date('2026-10-11T17:00:00.000Z');
const candidate={id:candidateId,subjectType:'MANGA_WORK',sourceName:'Human curator',sourceReference:'https://example.org/manga',
  sourcePayload:{entryType:'MANUAL_STRUCTURED_DRAFT_V1',subjectType:'MANGA_WORK',sourceReference:'https://example.org/manga'},
  normalizedPayload:{title:'New manga'},fingerprint:null,creatorId:actor,isQuarantined:true,updatedAt:stamp,
  _count:{editorialCases:0}};
const row={id:caseId,candidateId,canonicalEntityId:null,subjectType:'MANGA_WORK',state:'DRAFT',
  revision:1,openedById:actor,legacyChangeRequestId:null,createdAt:stamp,updatedAt:stamp,
  candidate,transitions:[]};
function fixture(role:UserRole=UserRole.ADMIN){
  const user=jest.fn(async(_args?:unknown):Promise<{role:UserRole}>=>({role}));
  const getCandidate=jest.fn(async(_args?:unknown):Promise<unknown>=>candidate);
  const lock=jest.fn(async(_args?:unknown)=>({count:1}));
  const getCase=jest.fn(async(_args?:unknown):Promise<unknown>=>row);
  const addCase=jest.fn(async(_args?:unknown):Promise<unknown>=>row);
  const updateCase=jest.fn(async(_args?:unknown)=>({count:1}));
  const addHistory=jest.fn(async(_args?:unknown)=>({id:caseId}));
  const tx={user:{findUnique:user},catalogCandidate:{findUnique:getCandidate,updateMany:lock},
    editorialCase:{findUnique:getCase,create:addCase,updateMany:updateCase},
    editorialCaseTransition:{create:addHistory},anime:{findUnique:jest.fn(async()=>({id:caseId}))},
    mangaWork:{findUnique:jest.fn(async()=>({id:caseId}))},animeMusicTrack:{findUnique:jest.fn(async()=>({id:caseId}))}};
  const prisma={...tx,editorialCase:{...tx.editorialCase,
    count:jest.fn(async(_args?:unknown)=>1),findMany:jest.fn(async(_args?:unknown)=>[row])},
    $transaction:async <T>(callback:(db:typeof tx)=>Promise<T>):Promise<T>=>callback(tx)};
  return {service:new AdminEditorialReviewService(prisma as unknown as PrismaService),user,getCandidate,lock,getCase,addCase,updateCase,addHistory};
}
describe('P16-W07 private editorial review and audit',()=>{
  it('gates every new GraphQL query/mutation to ADMIN via RolesGuard',()=>{
    for(const name of ['adminEditorialCases','adminEditorialCaseDetail','createAdminEditorialCase','transitionAdminEditorialCase'] as const){
      const fn=AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY,fn)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__',fn)).toContain(RolesGuard);
    }
  });
  it('creates an owned manually quarantined case and locks the candidate version atomically',async()=>{
    const x=fixture();const result=await x.service.create(actor,{candidateId});
    expect(result.state).toBe('DRAFT');
    expect(x.lock).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({
      creatorId:actor,isQuarantined:true,editorialCases:{none:{}}
    })}));
    expect(x.addCase).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({
      candidateId,openedById:actor,state:'DRAFT',canonicalEntityId:null
    })}));
    expect(JSON.stringify(x.addCase.mock.calls)).not.toMatch(/isPublished|catalogStatus|approve/i);
  });
  it('denies non-admin, imported candidates and concurrent relinks',async()=>{
    const notAdmin=fixture(UserRole.USER);
    await expect(notAdmin.service.create(actor,{candidateId})).rejects.toThrow(ForbiddenException);
    expect(notAdmin.addCase).not.toHaveBeenCalled();
    const imported=fixture();imported.getCandidate.mockResolvedValueOnce({...candidate,sourcePayload:{entryType:'IMPORTED'}});
    await expect(imported.service.create(actor,{candidateId})).rejects.toThrow(ConflictException);
    const conflict=fixture();conflict.lock.mockResolvedValueOnce({count:0});
    await expect(conflict.service.create(actor,{candidateId})).rejects.toThrow(ConflictException);
    expect(conflict.addCase).not.toHaveBeenCalled();
  });
  it('requires independent reviewer, uses revision CAS, logs an immutable human reason',async()=>{
    const own=fixture();
    await expect(own.service.transition(actor,{caseId,expectedRevision:1,action:'BEGIN_REVIEW'})).rejects.toThrow(ConflictException);
    const other=fixture();other.getCase.mockResolvedValueOnce({...row,state:'SUBMITTED',revision:2});
    await expect(other.service.transition(actor,{caseId,expectedRevision:2,action:'REJECT',note:'Insufficient source evidence'})).rejects.toThrow(ForbiddenException);
    const reviewerCase=fixture();reviewerCase.getCase.mockResolvedValueOnce({...row,state:'SUBMITTED',revision:2});
    await reviewerCase.service.transition(reviewer,{caseId,expectedRevision:2,action:'REJECT',note:'Insufficient source evidence'});
    expect(reviewerCase.updateCase).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({revision:2,state:'SUBMITTED'})}));
    expect(reviewerCase.addHistory).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({
      action:'REJECT',actorId:reviewer,fromState:'SUBMITTED',toState:'REJECTED',note:'Insufficient source evidence'
    })}));
  });
  it('rejects approval/publication actions and invalid pagination',async()=>{
    const x=fixture();
    await expect(x.service.transition(actor,{caseId,expectedRevision:1,action:'APPROVE'})).rejects.toThrow(BadRequestException);
    await expect(x.service.transition(actor,{caseId,expectedRevision:1,action:'PUBLISH'})).rejects.toThrow(BadRequestException);
    await expect(x.service.page(actor,{page:0})).rejects.toThrow(BadRequestException);
    expect(x.updateCase).not.toHaveBeenCalled();
  });
  it('provides private case details and explicit blocked canonical readiness',async()=>{
    const x=fixture();const detail=await x.service.detail(actor,caseId);
    expect(detail.commitReady).toBe(false);
    expect(detail.comparisonStatus).toBe('NEW_ENTRY');
    expect(detail.proposedJson).toContain('New manga');
    expect(detail.blockers).toHaveLength(3);
    expect(JSON.stringify(detail)).not.toContain('sourcePayload');
  });
});
