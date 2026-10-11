import 'reflect-metadata';
import {describe,expect,it,jest} from '@jest/globals';
import {BadRequestException,ConflictException,ForbiddenException} from '@nestjs/common';
import {UserRole} from '@prisma/client';
import type {PrismaService} from '../database/prisma.service.js';
import {ROLES_KEY} from '../auth/authorization/roles.decorator.js';
import {RolesGuard} from '../auth/authorization/roles.guard.js';
import {AdminCatalogResolver} from './admin-catalog.resolver.js';
import {AdminStructuredSubject} from './admin-structured-candidates.graphql.js';
import {SUBJECT_FIELDS,normalizeStructuredFields} from './admin-structured-candidate-fields.js';
import {AdminStructuredCandidatesService} from './admin-structured-candidates.service.js';

const actor='1734d284-0b04-48e4-b593-65e6d6d2744c', id='276f04cb-04f4-4e63-a8d3-e763bf429b36';
const stamp=new Date('2026-10-11T13:00:00.000Z');
const fields={title:'My curated anime',format:'TV'};
const input={subjectType:AdminStructuredSubject.ANIME,sourceName:'Human curator',sourceReference:'https://example.invalid/catalog/anime',fieldsJson:JSON.stringify(fields)};
const row={id,subjectType:'ANIME',sourceName:input.sourceName,sourceReference:input.sourceReference,
  sourcePayload:{entryType:'MANUAL_STRUCTURED_DRAFT_V1',subjectType:'ANIME',sourceReference:input.sourceReference},
  normalizedPayload:fields,fingerprint:null,isQuarantined:true,creatorId:actor,
  _count:{editorialCases:0,synopsisEvidence:0},createdAt:stamp,updatedAt:stamp};
function fixture(){
  const user=jest.fn(async ():Promise<{role:UserRole}>=>({role:UserRole.ADMIN}));
  const list=jest.fn(async (_args?:unknown)=>[row]);
  const create=jest.fn(async (_args?:unknown)=>row);
  const find=jest.fn(async (_args?:unknown):Promise<unknown>=>row);
  const update=jest.fn(async (_args?:unknown)=>({count:1}));
  const count=jest.fn(async (_args?:unknown)=>1);
  const client={user:{findUnique:user},catalogCandidate:{findMany:list,count,create,findUnique:find,updateMany:update},
    $transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({catalogCandidate:{findUnique:find,updateMany:update}})};
  return {service:new AdminStructuredCandidatesService(client as unknown as PrismaService),user,list,create,find,update,count};
}

describe('P16-W04 private structured full editors',()=>{
  it('all GraphQL entrypoints demand ADMIN metadata/guard',()=>{
    for(const name of ['adminStructuredCandidatePage','createAdminStructuredCandidate','updateAdminStructuredCandidate'] as const){
      const m=AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY,m)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__',m)).toContain(RolesGuard);
    }
  });
  it('supports all 9 declared editorial subject types',()=>{
    expect(Object.keys(SUBJECT_FIELDS).sort()).toEqual(Object.values(AdminStructuredSubject).sort());
  });
  it('normalizes typed fields but never accepts publication, age or license flags',()=>{
    expect(normalizeStructuredFields(AdminStructuredSubject.ANIME,JSON.stringify({title:' Text ',format:'TV',seasonYear:2026})))
      .toEqual({title:'Text',format:'TV',seasonYear:2026});
    for(const forbidden of ['isPublished','isAdult','rightsBasis','catalogStatus','isQuarantined','__proto__']){
      const raw=`{"title":"Anime","${forbidden}":true}`;
      expect(()=>normalizeStructuredFields(AdminStructuredSubject.ANIME,raw)).toThrow(BadRequestException);
    }
  });
  it('rejects malformed structured values and invalid required fields',()=>{
    for(const raw of ['[]','null','{}','{"title":""}','{"title":"X","seasonYear":2400}',
      '{"title":"X","format":"STREAMING"}','{"title":"X","animeId":"invalid"}']){
      expect(()=>normalizeStructuredFields(AdminStructuredSubject.ANIME,raw)).toThrow(BadRequestException);
    }
    expect(()=>normalizeStructuredFields(AdminStructuredSubject.MANGA_CHAPTER,
      JSON.stringify({mangaWorkId:actor,chapterKey:'1.5',chapterNumber:'1.5'}))).not.toThrow();
  });
  it('lists owner-filtered drafts and returns only normalized form data',async()=>{
    const f=fixture();const result=await f.service.page(actor,{subjectType:AdminStructuredSubject.ANIME});
    expect(result.items[0]).toMatchObject({editable:true,fieldsJson:JSON.stringify(fields),isQuarantined:true});
    expect(JSON.stringify(result)).not.toContain('sourcePayload');
    expect(f.list).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({creatorId:actor,subjectType:'ANIME'})}));
  });
  it('rejects invalid pagination before database access',async()=>{
    const f=fixture();
    await expect(f.service.page(actor,{subjectType:AdminStructuredSubject.ANIME,perPage:51})).rejects.toThrow();
    await expect(f.service.page(actor,{subjectType:AdminStructuredSubject.ANIME,search:'x'.repeat(121)})).rejects.toThrow();
    expect(f.user).not.toHaveBeenCalled();
  });
  it('creates ONLY quarantined manual candidate, never canonical records',async()=>{
    const f=fixture();await f.service.create(actor,input);
    const a=f.create.mock.calls[0]?.[0] as {data:Record<string,unknown>};
    expect(a.data).toMatchObject({subjectType:'ANIME',creatorId:actor,isQuarantined:true,normalizedPayload:fields});
    expect(Object.keys(a.data).sort()).toEqual(['creatorId','isQuarantined','normalizedPayload','sourceName','sourcePayload','sourceReference','subjectType']);
  });
  it('requires persisted admin role regardless of authenticated context',async()=>{
    const f=fixture();f.user.mockResolvedValueOnce({role:UserRole.USER});
    await expect(f.service.create(actor,input)).rejects.toThrow(ForbiddenException);
    expect(f.create).not.toHaveBeenCalled();
  });
  it('CAS requires exact version, owner, quarantine, manual provenance, no editorial evidence',async()=>{
    const f=fixture();await f.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:stamp.toISOString()});
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({
      creatorId:actor,subjectType:'ANIME',isQuarantined:true,fingerprint:null,updatedAt:stamp,
      editorialCases:{none:{}},synopsisEvidence:{none:{}}})}));
  });
  it('refuses foreign/imported/review-linked/stale and failed concurrent CAS',async()=>{
    const a=fixture();a.find.mockResolvedValueOnce({...row,creatorId:id});
    await expect(a.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:stamp.toISOString()})).rejects.toThrow(ConflictException);
    const b=fixture();b.find.mockResolvedValueOnce({...row,sourcePayload:{entryType:'IMPORTED'}});
    await expect(b.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:stamp.toISOString()})).rejects.toThrow(ConflictException);
    const c=fixture();c.find.mockResolvedValueOnce({...row,_count:{editorialCases:1,synopsisEvidence:0}});
    await expect(c.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:stamp.toISOString()})).rejects.toThrow(ConflictException);
    const d=fixture();d.update.mockResolvedValueOnce({count:0});
    await expect(d.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:stamp.toISOString()})).rejects.toThrow(ConflictException);
    const e=fixture();await expect(e.service.update(actor,{...input,candidateId:id,expectedUpdatedAt:'bogus'})).rejects.toThrow(BadRequestException);
  });
});
