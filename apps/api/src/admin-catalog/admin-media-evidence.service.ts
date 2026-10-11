import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { AdminMediaEvidencePageInput, CreateAdminMediaIntakeInput, CreateAdminSourceDossierInput } from './admin-media-evidence.graphql.js';
import { boundedPage, curatorText, mediaMetadata, optionalExpiry, safeHttpsUrl, validId } from './admin-media-evidence-policy.js';

const sourceSelect = {id:true,sourceUrl:true,publisher:true,rightsBasis:true,licenseLabel:true,attribution:true,
  expiresAt:true,revokedAt:true,isQuarantined:true,createdAt:true} as const;
const mediaSelect = {id:true,animeId:true,sourceDossierId:true,kind:true,sha256:true,mime:true,
  byteLength:true,width:true,height:true,copyrightOwner:true,isQuarantined:true,createdAt:true} as const;
function missingTable(error:unknown){return !!error && typeof error==='object' && 'code' in error && error.code==='P2021';}

/** Private evidence claims and media METADATA only. No asset upload, review approval or canonical modification. */
@Injectable()
export class AdminMediaEvidenceService {
  constructor(private readonly prisma: PrismaService) {}
  private async admin(actorId:string) {
    if (!validId(actorId)) throw new ForbiddenException('Administrator session required.');
    const row = await this.prisma.user.findUnique({where:{id:actorId},select:{role:true}});
    if (row?.role!==UserRole.ADMIN) throw new ForbiddenException('Administrator session required.');
  }
  async sources(actorId:string,input?:AdminMediaEvidencePageInput) {
    const {page,perPage,skip}=boundedPage(input); await this.admin(actorId);
    const where = input?.onlyMine===false?{}:{createdById:actorId};
    try {
      const [total,items]=await Promise.all([
        this.prisma.catalogSourceDossier.count({where}),
        this.prisma.catalogSourceDossier.findMany({where,select:sourceSelect,
          orderBy:[{createdAt:'desc'},{id:'desc'}],skip,take:perPage}),
      ]);
      return {items,page,perPage,total,hasNextPage:page*perPage<total,available:true};
    } catch(e){if(missingTable(e))return {items:[],page,perPage,total:null,hasNextPage:false,available:false};throw e;}
  }
  async media(actorId:string,input?:AdminMediaEvidencePageInput) {
    const {page,perPage,skip}=boundedPage(input); await this.admin(actorId);
    const where = input?.onlyMine===false?{}:{uploaderId:actorId};
    try {
      const [total,items]=await Promise.all([
        this.prisma.catalogMediaIntake.count({where}),
        this.prisma.catalogMediaIntake.findMany({where,select:mediaSelect,
          orderBy:[{createdAt:'desc'},{id:'desc'}],skip,take:perPage}),
      ]);
      return {items,page,perPage,total,hasNextPage:page*perPage<total,available:true};
    } catch(e){if(missingTable(e))return {items:[],page,perPage,total:null,hasNextPage:false,available:false};throw e;}
  }
  async addSource(actorId:string,input:CreateAdminSourceDossierInput) {
    const sourceUrl=safeHttpsUrl(input?.sourceUrl);
    const publisher=curatorText(input?.publisher,'publisher',2,191);
    const rightsBasis=curatorText(input?.rightsBasis,'rights basis',20,500);
    const licenseLabel=input?.licenseLabel?curatorText(input.licenseLabel,'license label',2,100):null;
    const attribution=input?.attribution?curatorText(input.attribution,'attribution',2,500):null;
    const expiresAt=optionalExpiry(input?.expiresAt);
    await this.admin(actorId);
    return this.prisma.catalogSourceDossier.create({data:{sourceUrl,publisher,rightsBasis,licenseLabel,attribution,
      expiresAt,createdById:actorId,isQuarantined:true},select:sourceSelect});
  }
  async revokeSource(actorId:string,dossierId:string) {
    if(!validId(dossierId))throw new ConflictException('Valid dossier ID required.');
    await this.admin(actorId);
    const updated=await this.prisma.catalogSourceDossier.updateMany({where:{id:dossierId,createdById:actorId,
      revokedAt:null,isQuarantined:true},data:{revokedAt:new Date()}});
    if(updated.count!==1)throw new ConflictException('Dossier already revoked, inaccessible, or missing.');
    const row=await this.prisma.catalogSourceDossier.findUnique({where:{id:dossierId},select:sourceSelect});
    if(!row)throw new NotFoundException('Source dossier unavailable.');
    return row;
  }
  async addMedia(actorId:string,input:CreateAdminMediaIntakeInput) {
    const data=mediaMetadata(input);
    await this.admin(actorId);
    return this.prisma.$transaction(async tx=>{
      const actor=await tx.user.findUnique({where:{id:actorId},select:{role:true}});
      if(actor?.role!==UserRole.ADMIN)throw new ForbiddenException('Administrator session expired.');
      const [anime,source]=await Promise.all([
        tx.anime.findUnique({where:{id:data.animeId},select:{id:true}}),
        tx.catalogSourceDossier.findUnique({where:{id:data.sourceDossierId},
          select:{id:true,createdById:true,revokedAt:true,expiresAt:true,isQuarantined:true}}),
      ]);
      if(!anime)throw new NotFoundException('Canonical Anime not found.');
      if(!source || !source.isQuarantined || source.createdById!==actorId || source.revokedAt ||
          (source.expiresAt && source.expiresAt<=new Date())) {
        throw new ConflictException('Source dossier unavailable, expired, revoked or not yours.');
      }
      return tx.catalogMediaIntake.create({data:{...data,uploaderId:actorId,isQuarantined:true},select:mediaSelect});
    },{isolationLevel:'Serializable'});
  }
}
