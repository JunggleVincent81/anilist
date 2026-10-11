import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogRelationKind, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { AdminRelationPageInput, CreateAdminRelationProposalInput } from './admin-relation-manager.graphql.js';
import { normalizeRelationProposal } from './admin-relation-policy.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const proposalSelect = { id: true, kind: true, sourceId: true, targetId: true, relationKey: true,
  details: true, sourceName: true, sourceReference: true, isQuarantined: true, createdAt: true } as const;
function proposal(row: Prisma.CatalogRelationProposalGetPayload<{select:typeof proposalSelect}>) {
  return { ...row, detailsJson: JSON.stringify(row.details) };
}
function missingTable(e: unknown) { return typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2021'; }
function pageInfo(input: AdminRelationPageInput) {
  if (!input || !Object.values(CatalogRelationKind).includes(input.kind)) throw new BadRequestException('Unknown relation kind.');
  const page = input.page ?? 1, perPage = input.perPage ?? 20;
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 ||
      !Number.isSafeInteger(perPage) || perPage < 1 || perPage > 50 || (page - 1) * perPage > 100000) {
    throw new BadRequestException('Invalid relation pagination.');
  }
  if (input.onlyMine !== undefined && typeof input.onlyMine !== 'boolean') throw new BadRequestException('Invalid ownership filter.');
  return { page, perPage, skip: (page - 1) * perPage };
}

@Injectable()
export class AdminRelationManagerService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireAdmin(actorId: string) {
    if (!UUID.test(actorId)) throw new ForbiddenException('Administrator session required.');
    const user = await this.prisma.user.findUnique({where:{id:actorId},select:{role:true}});
    if (user?.role !== UserRole.ADMIN) throw new ForbiddenException('Administrator session required.');
  }

  async proposals(actorId: string, input: AdminRelationPageInput) {
    const {page,perPage,skip} = pageInfo(input);
    await this.requireAdmin(actorId);
    const where: Prisma.CatalogRelationProposalWhereInput = { kind:input.kind,
      ...(input.onlyMine===false?{}:{creatorId:actorId}) };
    try {
      const [total, rows] = await Promise.all([
        this.prisma.catalogRelationProposal.count({where}),
        this.prisma.catalogRelationProposal.findMany({where,select:proposalSelect,
          orderBy:[{createdAt:'desc'},{id:'desc'}],skip,take:perPage}),
      ]);
      return {items:rows.map(proposal),page,perPage,total,hasNextPage:page*perPage<total,available:true};
    } catch(e) {
      if(missingTable(e))return {items:[],page,perPage,total:0,hasNextPage:false,available:false};
      throw e;
    }
  }

  async canonical(actorId: string, input: AdminRelationPageInput) {
    const {page,perPage,skip} = pageInfo(input);
    await this.requireAdmin(actorId);
    const orderBy = [{createdAt:'desc' as const},{id:'desc' as const}];
    try {
      switch(input.kind) {
        case CatalogRelationKind.ANIME_MANGA: {
          const [total,rows]=await Promise.all([
            this.prisma.animeMangaRelation.count(),
            this.prisma.animeMangaRelation.findMany({select:{id:true,animeId:true,mangaWorkId:true,relationType:true,isPublished:true,createdAt:true},skip,take:perPage,orderBy}),
          ]);
          return {items:rows.map(r=>({id:r.id,sourceId:r.animeId,targetId:r.mangaWorkId,relationKey:r.relationType,isPublished:r.isPublished,createdAt:r.createdAt})),page,perPage,total,hasNextPage:page*perPage<total,available:true};
        }
        case CatalogRelationKind.ANIME_MUSIC_USAGE: {
          const [total,rows]=await Promise.all([
            this.prisma.animeMusicUsage.count(),
            this.prisma.animeMusicUsage.findMany({select:{id:true,animeId:true,animeMusicTrackId:true,usageKey:true,isPublished:true,createdAt:true},skip,take:perPage,orderBy}),
          ]);
          return {items:rows.map(r=>({id:r.id,sourceId:r.animeId,targetId:r.animeMusicTrackId,relationKey:r.usageKey,isPublished:r.isPublished,createdAt:r.createdAt})),page,perPage,total,hasNextPage:page*perPage<total,available:true};
        }
        case CatalogRelationKind.ANIME_EPISODE: {
          const [total,rows]=await Promise.all([
            this.prisma.animeEpisode.count(),
            this.prisma.animeEpisode.findMany({select:{id:true,animeId:true,episodeKey:true,createdAt:true},skip,take:perPage,orderBy}),
          ]);
          return {items:rows.map(r=>({id:r.id,sourceId:r.animeId,targetId:r.id,relationKey:r.episodeKey,isPublished:null,createdAt:r.createdAt})),page,perPage,total,hasNextPage:page*perPage<total,available:true};
        }
        case CatalogRelationKind.MUSIC_RELEASE_TRACK: {
          const [total,rows]=await Promise.all([
            this.prisma.musicReleaseTrack.count(),
            this.prisma.musicReleaseTrack.findMany({select:{id:true,releaseId:true,recordingId:true,discNumber:true,trackNumber:true,isPublished:true,createdAt:true},skip,take:perPage,orderBy}),
          ]);
          return {items:rows.map(r=>({id:r.id,sourceId:r.releaseId,targetId:r.recordingId,relationKey:`${r.discNumber}:${r.trackNumber}`,isPublished:r.isPublished,createdAt:r.createdAt})),page,perPage,total,hasNextPage:page*perPage<total,available:true};
        }
        default: {
          const field = {
            MUSIC_CREDIT_TRACK:'animeMusicTrackId',MUSIC_CREDIT_RECORDING:'recordingId',
            MUSIC_CREDIT_RELEASE:'releaseId',MUSIC_CREDIT_RELEASE_TRACK:'releaseTrackId',
          }[input.kind];
          if(!field)throw new BadRequestException('Unknown credit target.');
          const where:Prisma.MusicCreditWhereInput = { [field]:{not:null} };
          const [total,rows]=await Promise.all([
            this.prisma.musicCredit.count({where}),
            this.prisma.musicCredit.findMany({where,select:{id:true,artistId:true,animeMusicTrackId:true,recordingId:true,releaseId:true,releaseTrackId:true,kind:true,role:true,isPublished:true,createdAt:true},skip,take:perPage,orderBy}),
          ]);
          return {items:rows.map(r=>({id:r.id,sourceId:r.artistId,targetId:r.animeMusicTrackId??r.recordingId??r.releaseId??r.releaseTrackId??'',relationKey:`${r.kind}:${r.role.toLowerCase()}`,isPublished:r.isPublished,createdAt:r.createdAt})),page,perPage,total,hasNextPage:page*perPage<total,available:true};
        }
      }
    } catch(e) {
      if(missingTable(e))return {items:[],page,perPage,total:null,hasNextPage:false,available:false};
      throw e;
    }
  }

  async create(actorId:string,input:CreateAdminRelationProposalInput) {
    const data=normalizeRelationProposal(input);
    await this.requireAdmin(actorId);
    try {
      return await this.prisma.$transaction(async tx=>{
        const user=await tx.user.findUnique({where:{id:actorId},select:{role:true}});
        if(user?.role!==UserRole.ADMIN)throw new ForbiddenException('Administrator role revoked.');
        const exists = async (delegate:'anime'|'mangaWork'|'animeMusicTrack'|'musicArtist'|'musicRecording'|'musicRelease'|'musicReleaseTrack',id:string) => {
          switch(delegate) {
            case 'anime':return !!await tx.anime.findUnique({where:{id},select:{id:true}});
            case 'mangaWork':return !!await tx.mangaWork.findUnique({where:{id},select:{id:true}});
            case 'animeMusicTrack':return !!await tx.animeMusicTrack.findUnique({where:{id},select:{id:true}});
            case 'musicArtist':return !!await tx.musicArtist.findUnique({where:{id},select:{id:true}});
            case 'musicRecording':return !!await tx.musicRecording.findUnique({where:{id},select:{id:true}});
            case 'musicRelease':return !!await tx.musicRelease.findUnique({where:{id},select:{id:true}});
            case 'musicReleaseTrack':return !!await tx.musicReleaseTrack.findUnique({where:{id},select:{id:true}});
          }
        };
        let canonicalDuplicate = false;
        switch(data.kind) {
          case CatalogRelationKind.ANIME_MANGA:
            if(!await exists('anime',data.sourceId)||!await exists('mangaWork',data.targetId))throw new NotFoundException('Anime or Manga Work not found.');
            canonicalDuplicate = !!await tx.animeMangaRelation.findFirst({where:{animeId:data.sourceId,mangaWorkId:data.targetId,relationType:data.relationKey as 'ADAPTATION'},select:{id:true}});
            break;
          case CatalogRelationKind.ANIME_MUSIC_USAGE:
            if(!await exists('anime',data.sourceId)||!await exists('animeMusicTrack',data.targetId))throw new NotFoundException('Anime or Music Track not found.');
            canonicalDuplicate = !!await tx.animeMusicUsage.findFirst({where:{animeId:data.sourceId,animeMusicTrackId:data.targetId,usageKey:data.relationKey},select:{id:true}});
            break;
          case CatalogRelationKind.MUSIC_RELEASE_TRACK: {
            if(!await exists('musicRelease',data.sourceId)||!await exists('musicRecording',data.targetId))throw new NotFoundException('Release or Recording not found.');
            canonicalDuplicate = !!await tx.musicReleaseTrack.findFirst({where:{releaseId:data.sourceId,discNumber:data.details.discNumber as number,trackNumber:data.details.trackNumber as number},select:{id:true}});
            break;
          }
          default: {
            const target={MUSIC_CREDIT_TRACK:'animeMusicTrack',MUSIC_CREDIT_RECORDING:'musicRecording',MUSIC_CREDIT_RELEASE:'musicRelease',MUSIC_CREDIT_RELEASE_TRACK:'musicReleaseTrack'} as const;
            const field={MUSIC_CREDIT_TRACK:'animeMusicTrackId',MUSIC_CREDIT_RECORDING:'recordingId',MUSIC_CREDIT_RELEASE:'releaseId',MUSIC_CREDIT_RELEASE_TRACK:'releaseTrackId'} as const;
            const kind=data.kind as keyof typeof target;
            if(!target[kind]||!await exists('musicArtist',data.sourceId)||!await exists(target[kind],data.targetId))throw new NotFoundException('Artist or credit target not found.');
            canonicalDuplicate = !!await tx.musicCredit.findFirst({where:{artistId:data.sourceId,[field[kind]]:data.targetId,kind:data.details.creditKind as 'PRIMARY_ARTIST',role:{equals:data.details.role as string,mode:'insensitive'}},select:{id:true}});
          }
        }
        if(canonicalDuplicate)throw new ConflictException('The canonical relationship already exists.');
        const saved=await tx.catalogRelationProposal.create({data:{kind:data.kind,sourceId:data.sourceId,targetId:data.targetId,
          relationKey:data.relationKey,details:data.details as Prisma.InputJsonObject,sourceName:data.sourceName,
          sourceReference:data.sourceReference,creatorId:actorId,isQuarantined:true},select:proposalSelect});
        return proposal(saved);
      },{isolationLevel:'Serializable'});
    } catch(e) {
      if(e instanceof Prisma.PrismaClientKnownRequestError && (e.code==='P2002'||e.code==='P2034')) {
        throw new ConflictException('Duplicate or concurrent relation proposal. Refresh before retrying.');
      }
      throw e;
    }
  }
}
