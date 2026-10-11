import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { UserRole } from '@prisma/client';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogModule } from './admin-catalog.module.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';

const queries = [
  'adminWorkspaceOverview', 'adminAnimeCandidatePage', 'adminDomainRecordPage',
  'adminStructuredCandidatePage', 'adminRelationCanonicalPage', 'adminRelationProposalPage',
  'adminSourceDossiers', 'adminMediaIntakes', 'adminEditorialCases', 'adminEditorialCaseDetail',
  'adminImportHistory', 'adminCatalogOverview', 'adminCatalogPage',
  'adminSynopsisDraft', 'adminSynopsisReviewQueue',
] as const;
const mutations = [
  'createAdminAnimeCandidate', 'updateAdminAnimeCandidate', 'createAdminStructuredCandidate',
  'updateAdminStructuredCandidate', 'createAdminRelationProposal',
  'createAdminSourceDossier', 'revokeAdminSourceDossier', 'createAdminMediaIntake',
  'createAdminEditorialCase', 'transitionAdminEditorialCase', 'previewAdminImport',
  'applyAdminImport', 'createAdminSynopsisDraft', 'updateAdminSynopsisDraft',
  'submitAdminSynopsisDraft', 'reviewAdminSynopsisSubmission',
] as const;
const forbidden = [
  'approveAdminEditorialCase', 'publishAdminEditorialCase', 'publishAdminCandidate',
  'approveAdminImport', 'unquarantineAdminCandidate', 'commitAdminCanonicalRecord',
  'uploadAdminMediaBytes', 'publishAdminRelation',
];

describe('P16-W09 cross-workspace authorization and publication boundary acceptance', () => {
  it('every named ADMIN workspace query and mutation is RolesGuard protected', () => {
    for (const operation of [...queries, ...mutations]) {
      const method = AdminCatalogResolver.prototype[operation];
      expect(typeof method).toBe('function');
      expect(Reflect.getMetadata(ROLES_KEY, method)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', method)).toContain(RolesGuard);
    }
  });
  it('no existing AdminCatalogResolver operation is unguarded', () => {
    const methods = Object.getOwnPropertyNames(AdminCatalogResolver.prototype)
      .filter(name => name !== 'constructor');
    for (const name of methods) {
      const method: unknown = Reflect.get(AdminCatalogResolver.prototype, name);
      expect(typeof method).toBe('function');
      expect(Reflect.getMetadata(ROLES_KEY, method as object)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', method as object)).toContain(RolesGuard);
    }
    for (const operation of [...queries, ...mutations]) expect(methods).toContain(operation);
  });
  it('approval, publication, unquarantine, upload and canonical commit are not W01-W09 operations', () => {
    const methods = Object.getOwnPropertyNames(AdminCatalogResolver.prototype);
    for (const operation of forbidden) expect(methods).not.toContain(operation);
  });
  it('private synopsis approval and canonical commit services remain unregistered in the module', () => {
    const providers: unknown[] = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AdminCatalogModule) ?? [];
    const names = providers.map(provider => typeof provider === 'function' ? provider.name : String(provider));
    expect(names).toContain('AdminCatalogResolver');
    expect(names).toContain('AdminSmartImportService');
    expect(names).toContain('AdminEditorialReviewService');
    expect(names).not.toContain('PrivateEditorialApprovalService');
    expect(names).not.toContain('PrivateAnimeSynopsisCommitService');
    expect(names).not.toContain('PrivateSynopsisEvidenceEntryService');
  });
});
