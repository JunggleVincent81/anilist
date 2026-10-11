import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

/** P16-W01: private aggregate counts only. Never return candidate payloads, rights or public permissions. */
@Injectable()
export class AdminWorkspaceOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    // Each domain is independent: Phase 14/15 migrations may not be installed in
    // the current database. Missing tables MUST NOT be represented as zero rows.
    const [manga, music, editorial] = await Promise.all([
      this.manga(), this.music(), this.editorial(),
    ]);
    return { manga, music, editorial };
  }

  private async manga() {
    try {
      const [works, volumes, chapters] = await Promise.all([
        this.prisma.mangaWork.count(), this.prisma.mangaVolume.count(), this.prisma.mangaChapter.count(),
      ]);
      return { available: true, works, volumes, chapters };
    } catch {
      return { available: false, works: null, volumes: null, chapters: null };
    }
  }

  private async music() {
    try {
      const [tracks, artists, recordings, releases, credits] = await Promise.all([
        this.prisma.animeMusicTrack.count(), this.prisma.musicArtist.count(),
        this.prisma.musicRecording.count(), this.prisma.musicRelease.count(),
        this.prisma.musicCredit.count(),
      ]);
      return { available: true, tracks, artists, recordings, releases, credits };
    } catch {
      return { available: false, tracks: null, artists: null, recordings: null, releases: null, credits: null };
    }
  }

  private async editorial() {
    try {
      const [candidates, quarantined, cases, submitted, underReview, approved] = await Promise.all([
        this.prisma.catalogCandidate.count(),
        this.prisma.catalogCandidate.count({ where: { isQuarantined: true } }),
        this.prisma.editorialCase.count(),
        this.prisma.editorialCase.count({ where: { state: 'SUBMITTED' } }),
        this.prisma.editorialCase.count({ where: { state: 'UNDER_REVIEW' } }),
        this.prisma.editorialCase.count({ where: { state: 'APPROVED' } }),
      ]);
      return { available: true, candidates, quarantined, cases, submitted, underReview, approved };
    } catch {
      return { available: false, candidates: null, quarantined: null, cases: null,
        submitted: null, underReview: null, approved: null };
    }
  }
}
