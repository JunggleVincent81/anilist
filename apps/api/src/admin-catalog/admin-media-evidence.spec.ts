import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole, CatalogAssetKind } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminMediaEvidenceService } from './admin-media-evidence.service.js';
import { boundedPage, mediaMetadata, optionalExpiry, safeHttpsUrl } from './admin-media-evidence-policy.js';

const actor='f9dcaa8a-e750-48b4-9d80-30f67172ddf9';
const animeId='5bd2df9c-8268-418a-9960-e660c0025804';
const dossierId='61d6c28b-113c-4a38-90ab-2444333ac2ce';
const source={sourceUrl:'https://example.org/rights',publisher:'Example Publisher',rightsBasis:'Human reviewer observed an explicit rights statement, pending verification.'};
const media={animeId,sourceDossierId:dossierId,kind:CatalogAssetKind.COVER,sha256:'a'.repeat(64),mime:'image/png',byteLength:1024,width:512,height:768,copyrightOwner:'Rights holder'};
function fixture(role:UserRole=UserRole.ADMIN){
  const user=jest.fn(async(_args?:unknown):Promise<{role:UserRole}>=>({role}));
  const sourceRow={id:dossierId,...source,licenseLabel:null,attribution:null,expiresAt:null,revokedAt:null,
    createdById:actor,isQuarantined:true,createdAt:new Date()};
  const sourceCreate=jest.fn(async(_args?:unknown)=>sourceRow);
  const sourceFind=jest.fn(async(_args?:unknown):Promise<unknown>=>sourceRow);
  const sourceUpdate=jest.fn(async(_args?:unknown)=>({count:1}));
  const sourceCount=jest.fn(async(_args?:unknown)=>1);
  const sourceList=jest.fn(async(_args?:unknown)=>[sourceRow]);
  const mediaCreate=jest.fn(async(_args?:unknown)=>({id:dossierId,...media,isQuarantined:true,createdAt:new Date()}));
  const mediaCount=jest.fn(async(_args?:unknown)=>0);
  const mediaList=jest.fn(async(_args?:unknown)=>[]);
  const anime=jest.fn(async(_args?:unknown):Promise<{id:string}|null>=>({id:animeId}));
  const tx={user:{findUnique:user},anime:{findUnique:anime},catalogSourceDossier:{findUnique:sourceFind},catalogMediaIntake:{create:mediaCreate}};
  const prisma={user:{findUnique:user},anime:{findUnique:anime},catalogSourceDossier:{create:sourceCreate,findUnique:sourceFind,
    updateMany:sourceUpdate,count:sourceCount,findMany:sourceList},catalogMediaIntake:{create:mediaCreate,count:mediaCount,findMany:mediaList},
    $transaction:async <T>(fn:(transaction:typeof tx)=>Promise<T>):Promise<T>=>fn(tx)};
  return {service:new AdminMediaEvidenceService(prisma as unknown as PrismaService),user,sourceCreate,sourceFind,sourceUpdate,sourceCount,mediaCreate,anime};
}
describe('P16-W06 private media, sources and evidence',()=>{
  it('requires ADMIN and RolesGuard on every W06 operation',()=>{
    for(const name of ['adminSourceDossiers','adminMediaIntakes','createAdminSourceDossier','revokeAdminSourceDossier','createAdminMediaIntake'] as const){
      const method=AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY,method)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__',method)).toContain(RolesGuard);
    }
  });
  it('rejects unsafe source URLs, expired evidence, bad MIME and unbounded pagination',()=>{
    expect(()=>safeHttpsUrl('http://example.org/')).toThrow();
    expect(()=>safeHttpsUrl('https://u:p@example.org/')).toThrow();
    expect(()=>safeHttpsUrl('https://example.org/a#frag')).toThrow();
    expect(()=>optionalExpiry('2020-01-01T00:00:00.000Z')).toThrow();
    expect(()=>boundedPage({perPage:100})).toThrow();
    expect(()=>mediaMetadata({...media,mime:'image/svg+xml'})).toThrow();
    expect(()=>mediaMetadata({...media,sha256:'bad'})).toThrow();
    expect(()=>mediaMetadata({...media,width:0})).toThrow();
  });
  it('requires persisted ADMIN and creates only quarantined evidence claims',async()=>{
    const f=fixture();const result=await f.service.addSource(actor,source);
    expect(result.isQuarantined).toBe(true);
    expect(f.sourceCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({createdById:actor,isQuarantined:true})}));
    expect(JSON.stringify(f.sourceCreate.mock.calls)).not.toMatch(/approved|isPublished|isAdult|licenseVerified/);
    const denied=fixture(UserRole.USER);
    await expect(denied.service.addSource(actor,source)).rejects.toThrow(ForbiddenException);
    expect(denied.sourceCreate).not.toHaveBeenCalled();
  });
  it('revokes claims irreversibly with creator-scoped conditional update',async()=>{
    const f=fixture(); await f.service.revokeSource(actor,dossierId);
    expect(f.sourceUpdate).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({id:dossierId,createdById:actor,revokedAt:null})}));
    const denied=fixture();denied.sourceUpdate.mockResolvedValueOnce({count:0});
    await expect(denied.service.revokeSource(actor,dossierId)).rejects.toThrow(ConflictException);
  });
  it('creates only private media metadata under owned, current evidence',async()=>{
    const f=fixture();const result=await f.service.addMedia(actor,media);
    expect(result.isQuarantined).toBe(true);
    expect(f.mediaCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({animeId,sourceDossierId:dossierId,
      uploaderId:actor,isQuarantined:true,sha256:'a'.repeat(64)})}));
    expect(JSON.stringify(f.mediaCreate.mock.calls)).not.toMatch(/storageKey|publish|approve|licenseVerified/);
    const revoked=fixture();revoked.sourceFind.mockResolvedValueOnce({id:dossierId,...source,createdById:actor,
      isQuarantined:true,revokedAt:new Date(),expiresAt:null,licenseLabel:null,attribution:null,createdAt:new Date()});
    await expect(revoked.service.addMedia(actor,media)).rejects.toThrow(ConflictException);
    expect(revoked.mediaCreate).not.toHaveBeenCalled();
  });
  it('distinguishes unavailable staging from empty staging',async()=>{
    const f=fixture();f.sourceCount.mockImplementationOnce(async()=>{throw {code:'P2021'};});
    const page=await f.service.sources(actor,{page:1});
    expect(page.available).toBe(false);expect(page.total).toBeNull();
  });
});
