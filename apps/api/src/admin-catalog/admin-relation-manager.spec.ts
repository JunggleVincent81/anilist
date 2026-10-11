import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CatalogRelationKind, UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { normalizeRelationProposal } from './admin-relation-policy.js';
import { AdminRelationManagerService } from './admin-relation-manager.service.js';

const admin = 'f9dcaa8a-e750-48b4-9d80-30f67172ddf9';
const manga = '5bd2df9c-8268-418a-9960-e660c0025804';
const base = {kind:CatalogRelationKind.ANIME_MANGA,sourceId:admin,targetId:manga,
  relationKey:'ADAPTATION',detailsJson:'{}',sourceName:'Human editor',sourceReference:'https://example.org/source'};
function fixture(role:UserRole = UserRole.ADMIN) {
  const user = jest.fn(async ():Promise<{role:UserRole}>=>({role}));
  const anime = jest.fn(async()=>({id:admin}));
  const mangaWork = jest.fn(async()=>({id:manga}));
  const findEdge = jest.fn(async ():Promise<{id:string}|null>=>null);
  const create = jest.fn(async(_args?: unknown)=>({id:manga,kind:base.kind,sourceId:admin,targetId:manga,relationKey:'ADAPTATION',
    details:{},sourceName:base.sourceName,sourceReference:base.sourceReference,isQuarantined:true,createdAt:new Date()}));
  const count = jest.fn(async()=>0);
  const proposals = jest.fn(async(_args?: unknown)=>[]);
  const tx = {user:{findUnique:user},anime:{findUnique:anime},mangaWork:{findUnique:mangaWork},
    animeMangaRelation:{findFirst:findEdge},catalogRelationProposal:{create}};
  const prisma = { ...tx,catalogRelationProposal:{create,count,findMany:proposals},
    $transaction:async <T>(fn:(input:typeof tx)=>Promise<T>)=>fn(tx) };
  const service = new AdminRelationManagerService(prisma as unknown as PrismaService);
  return {service,user,anime,mangaWork,findEdge,create,count,proposals};
}

describe('P16-W05 guarded relation proposals and canonical inventory',()=>{
  it('all W05 GraphQL operations require ADMIN and RolesGuard',()=>{
    for(const name of ['adminRelationCanonicalPage','adminRelationProposalPage','createAdminRelationProposal'] as const){
      const method=AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY,method)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__',method)).toContain(RolesGuard);
    }
  });
  it('accepts only typed allowlisted proposals and forbids episode rewiring',()=>{
    expect(normalizeRelationProposal(base).relationKey).toBe('ADAPTATION');
    expect(()=>normalizeRelationProposal({...base,kind:CatalogRelationKind.ANIME_EPISODE})).toThrow(BadRequestException);
    expect(()=>normalizeRelationProposal({...base,relationKey:'ANYTHING'})).toThrow(BadRequestException);
    expect(()=>normalizeRelationProposal({...base,detailsJson:'{"isPublished":true}'})).toThrow(BadRequestException);
    expect(()=>normalizeRelationProposal({...base,sourceId:'invalid'})).toThrow(BadRequestException);
    expect(()=>normalizeRelationProposal({...base,sourceReference:'   '})).toThrow(BadRequestException);
  });
  it('rejects wrong slots, inconsistent episode ranges and malformed credit fields',()=>{
    expect(()=>normalizeRelationProposal({...base,kind:CatalogRelationKind.MUSIC_RELEASE_TRACK,relationKey:'1:2',detailsJson:'{"discNumber":1,"trackNumber":3}'})).toThrow();
    expect(()=>normalizeRelationProposal({...base,kind:CatalogRelationKind.ANIME_MUSIC_USAGE,relationKey:'OP-01',detailsJson:'{"usageType":"OPENING","episodeStart":9,"episodeEnd":1}'})).toThrow();
    expect(()=>normalizeRelationProposal({...base,kind:CatalogRelationKind.MUSIC_CREDIT_TRACK,relationKey:'PRIMARY_ARTIST:composer',detailsJson:'{"creditKind":"PRIMARY_ARTIST","role":"Performer"}'})).toThrow();
    expect(normalizeRelationProposal({...base,kind:CatalogRelationKind.MUSIC_CREDIT_RECORDING,relationKey:'CONTRIBUTOR:composer',detailsJson:'{"creditKind":"CONTRIBUTOR","role":"Composer"}'}).details.role).toBe('Composer');
  });
  it('revalidates persisted admin and creates ONLY quarantined proposals',async()=>{
    const x=fixture();const result=await x.service.create(admin,base);
    expect(result.isQuarantined).toBe(true);
    expect(x.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({
      creatorId:admin,isQuarantined:true,kind:'ANIME_MANGA',sourceId:admin,targetId:manga,
    })}));
    const args=x.create.mock.calls[0];
    expect(JSON.stringify(args)).not.toMatch(/publish|approve|catalogStatus|isAdult/i);
    expect(x.user).toHaveBeenCalledTimes(2);
  });
  it('rejects a revoked/regular actor before storing anything',async()=>{
    const x=fixture(UserRole.USER);
    await expect(x.service.create(admin,base)).rejects.toThrow(ForbiddenException);
    expect(x.create).not.toHaveBeenCalled();
  });
  it('blocks canonical duplicates and missing target entities',async()=>{
    const x=fixture();x.findEdge.mockResolvedValueOnce({id:manga});
    await expect(x.service.create(admin,base)).rejects.toThrow(ConflictException);
    expect(x.create).not.toHaveBeenCalled();
    const y=fixture();y.mangaWork.mockResolvedValueOnce(null as unknown as {id:string});
    await expect(y.service.create(admin,base)).rejects.toThrow(NotFoundException);
  });
  it('paginates only owned quarantined proposals, without fallback zero for absent table',async()=>{
    const x=fixture();
    const result=await x.service.proposals(admin,{kind:CatalogRelationKind.ANIME_MANGA,page:1,perPage:20});
    expect(result.available).toBe(true);
    expect(x.proposals).toHaveBeenCalledWith(expect.objectContaining({where:{kind:'ANIME_MANGA',creatorId:admin}}));
    await expect(x.service.proposals(admin,{kind:CatalogRelationKind.ANIME_MANGA,perPage:100})).rejects.toThrow(BadRequestException);
    const y=fixture();y.count.mockImplementationOnce(async()=>{throw {code:'P2021'};});
    const missing=await y.service.proposals(admin,{kind:CatalogRelationKind.ANIME_MANGA});
    expect(missing.available).toBe(false);
  });
});
