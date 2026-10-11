import { test, expect } from '@playwright/test';

const ID = '5bd2df9c-8268-418a-9960-e660c0025804';
const STAMP = '2026-10-12T00:00:00.000Z';
const HASH = 'a'.repeat(64);
const ADMIN = {id:ID,email:'admin@example.invalid',username:'acceptance-admin',displayName:'Acceptance Admin',bio:null,avatarUrl:null,role:'ADMIN'};
const pages = [
  ['/admin/catalog','Catalog curation'],
  ['/admin/catalog/anime','Anime Manager'],
  ['/admin/catalog/manga','Manga Manager'],
  ['/admin/catalog/music','Music Manager'],
  ['/admin/catalog/editor','Quick Add & Full Editors'],
  ['/admin/catalog/relations','Relation Manager'],
  ['/admin/catalog/evidence','Media, Sources & Evidence'],
  ['/admin/catalog/editorial','Editorial Review & Audit'],
  ['/admin/catalog/import','Smart Import & History'],
];
const empty = (available=true) => ({available, page:1,perPage:20,total:available?0:null,hasNextPage:false,items:[]});
const candidatePage = {page:1,perPage:20,total:0,hasNextPage:false,items:[]};
const animePage = {items:[],pageInfo:{page:1,perPage:20,total:0,pageCount:0,hasNextPage:false,hasPreviousPage:false}};
const metrics = {manga:{available:false,works:null,volumes:null,chapters:null},
  music:{available:false,tracks:null,artists:null,recordings:null,releases:null,credits:null},
  editorial:{available:false,candidates:null,quarantined:null,cases:null,submitted:null,underReview:null,approved:null}};
const result = (input,status,invalidCount,issuesJson) => ({
  id:ID,subjectType:input.subjectType,fileName:input.fileName,fileSha256:HASH,format:'CSV',
  sourceName:input.sourceName,sourceReference:input.sourceReference,status,rowCount:1,
  validCount:invalidCount?0:1,invalidCount,createdCount:status==='APPLIED'?1:0,skippedCount:0,
  issuesJson,createdAt:STAMP,appliedAt:status==='APPLIED'?STAMP:null,
});

async function mockGraphQL(page, role='ADMIN') {
  const operations = [];
  // Catch any unexpected destination. Real APIs are never contacted by these browser tests.
  await page.route('**/*', route => {
    const address = new URL(route.request().url());
    if (address.hostname === '127.0.0.1' && address.port === String(process.env.P16_W09_WEB_PORT)) return route.continue();
    return route.abort('blockedbyclient');
  });
  await page.route('**/graphql', async route => {
    const request = route.request();
    const origin = `http://127.0.0.1:${process.env.P16_W09_WEB_PORT}`;
    const headers = {'access-control-allow-origin':origin,'access-control-allow-credentials':'true',
      'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type',
      'content-type':'application/json','cache-control':'no-store'};
    if (request.method() === 'OPTIONS') return route.fulfill({status:204,headers,body:''});
    if (request.method() !== 'POST') return route.fulfill({status:405,headers,body:''});
    const body = JSON.parse(request.postData() ?? '{}');
    const query = String(body.query ?? '');
    const op = query.match(/\b(?:query|mutation)\s+(\w+)/)?.[1] ?? 'unknown';
    operations.push({op,variables:body.variables ?? {}});
    if (op === 'Me') {
      if (!role) return route.fulfill({status:200,headers,body:JSON.stringify({errors:[{message:'Authentication required',extensions:{code:'UNAUTHENTICATED'}}]})});
      return route.fulfill({status:200,headers,body:JSON.stringify({data:{me:{...ADMIN,role}}})});
    }
    if (role !== 'ADMIN') return route.fulfill({status:200,headers,body:JSON.stringify({errors:[{message:'Forbidden',extensions:{code:'FORBIDDEN'}}]})});
    const table = {
      AdminCatalogOverview: {adminCatalogOverview:{total:0,included:0,review:0,excluded:0,unverifiedAge:0,emptySynopsis:0,missingCover:0,curationRequests:0}},
      AdminCatalogPage: {adminCatalogPage:animePage},
      AdminWorkspaceOverview: {adminWorkspaceOverview:metrics},
      AdminAnimeCandidatePage: {adminAnimeCandidatePage:candidatePage},
      AdminDomainRecordPage: {adminDomainRecordPage:{...empty(false),domain:body.variables?.input?.domain ?? 'MANGA_WORK'}},
      AdminStructuredCandidatePage: {adminStructuredCandidatePage:candidatePage},
      AdminRelationCanonicalPage: {adminRelationCanonicalPage:empty(false)},
      AdminRelationProposalPage: {adminRelationProposalPage:empty(false)},
      AdminSourceDossiers: {adminSourceDossiers:empty(false)},
      AdminMediaIntakes: {adminMediaIntakes:empty(false)},
      AdminEditorialCases: {adminEditorialCases:empty(false)},
      AdminImportHistory: {adminImportHistory:empty()},
    };
    let data = table[op];
    if (op === 'CreateAdminStructuredCandidate') {
      const input = body.variables?.input ?? {};
      data = {createAdminStructuredCandidate:{id:ID,...input,isQuarantined:true,editable:true,createdAt:STAMP,updatedAt:STAMP}};
    } else if (op === 'PreviewAdminImport') {
      const input = body.variables?.input ?? {};
      const invalid = input.fileName?.startsWith('bad-') ? 1 : 0;
      data = {previewAdminImport:result(input,'PREVIEWED',invalid,
        invalid ? JSON.stringify([{row:2,reason:'Spreadsheet formula blocked'}]):'[]')};
    } else if (op === 'ApplyAdminImport') {
      const previous = operations.findLast(x=>x.op==='PreviewAdminImport');
      const input = previous?.variables.input ?? {};
      data = {applyAdminImport:result(input,'APPLIED',0,'[]')};
    }
    if (!data) return route.fulfill({status:200,headers,body:JSON.stringify({errors:[{message:`Unexpected mock operation: ${op}`,extensions:{code:'BAD_REQUEST'}}]})});
    await route.fulfill({status:200,headers,body:JSON.stringify({data})});
  });
  return operations;
}

test('anonymous and non-admin roles cannot access private editor actions', async ({page}) => {
  for (const role of [null,'USER','MODERATOR']) {
    const operations=await mockGraphQL(page,role);
    await page.goto('/admin/catalog/import');
    await expect(page.getByRole('heading',{name:'ADMIN required'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Run private dry-run'})).toHaveCount(0);
    expect(operations.filter(x=>/AdminImport|Candidate|Editorial|Relation/.test(x.op))).toHaveLength(0);
    await page.unrouteAll({behavior:'wait'});
  }
});

test('admin workspaces render real Next pages with noindex and safe unavailable states', async ({page}) => {
  const operations=await mockGraphQL(page,'ADMIN');
  for (const [path,title] of pages) {
    await page.goto(path);
    await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/i);
    await expect(page.getByRole('button',{name:/^(approve|publish|unquarantine|canonical commit)/i})).toHaveCount(0);
  }
  expect(operations.filter(x=>/Publish|Unquarantine|Approve|CanonicalCommit/.test(x.op))).toHaveLength(0);
});

test('mobile layout renders editor, evidence and import controls with keyboard-accessible headings', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await mockGraphQL(page,'ADMIN');
  for (const [path,title] of [pages[1],pages[5],pages[7],pages[8]]) {
    await page.goto(path);
    await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    const width=await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(392);
  }
});

test('Quick Add submits an allowlisted candidate to quarantine, never canonical mutation',async ({page})=>{
  const requests=await mockGraphQL(page,'ADMIN');
  await page.goto('/admin/catalog/editor');
  await expect(page.getByRole('heading',{name:'Quick Add & Full Editors'})).toBeVisible();
  await page.getByLabel('Source name').fill('Human acceptance curator');
  await page.getByLabel('Source reference').fill('https://example.invalid/curation');
  await page.getByLabel(/Work title/).fill('Acceptance manga');
  await page.getByRole('button',{name:'Quick Add: save draft'}).click();
  await expect(page.getByText(/Private quarantined draft saved/)).toBeVisible();
  const created=requests.filter(x=>x.op==='CreateAdminStructuredCandidate');
  expect(created).toHaveLength(1);
  expect(created[0].variables.input.subjectType).toBe('MANGA_WORK');
  expect(JSON.parse(created[0].variables.input.fieldsJson)).toEqual({title:'Acceptance manga'});
  expect(JSON.stringify(created)).not.toMatch(/isPublished|isAdult|approve|canonicalWrite|unquarantine/i);
});

test('Anime Episode relation is strictly read-only in the browser',async ({page})=>{
  const requests=await mockGraphQL(page,'ADMIN');
  await page.goto('/admin/catalog/relations');
  await page.getByLabel('Relation type').selectOption('ANIME_EPISODE');
  await expect(page.getByText(/Episode ownership cannot be rewired/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Save quarantined proposal'})).toHaveCount(0);
  expect(requests.filter(x=>x.op==='CreateAdminRelationProposal')).toHaveLength(0);
});

test('invalid CSV cannot apply; valid CSV needs explicit preview and confirmation',async ({page})=>{
  const requests=await mockGraphQL(page,'ADMIN');
  await page.goto('/admin/catalog/import');
  await page.getByLabel('Human source / publisher').fill('Human acceptance curator');
  await page.getByLabel('Source reference / citation').fill('https://example.invalid/import');
  const chooser=page.getByLabel('CSV / XLSX spreadsheet');
  await chooser.setInputFiles({name:'bad-formula.csv',mimeType:'text/csv',buffer:Buffer.from('title\n=HYPERLINK(1)\n')});
  await page.getByRole('button',{name:'Run private dry-run'}).click();
  await expect(page.getByText(/Invalid rows block Apply/)).toBeVisible();
  expect(requests.filter(x=>x.op==='ApplyAdminImport')).toHaveLength(0);
  await chooser.setInputFiles({name:'good-manga.csv',mimeType:'text/csv',buffer:Buffer.from('title\nAcceptance Manga\n')});
  await page.getByRole('button',{name:'Run private dry-run'}).click();
  await expect(page.getByText(/1 data rows/)).toBeVisible();
  const confirm=page.getByRole('button',{name:'Confirm import into quarantine'});
  await expect(confirm).toBeDisabled();
  await page.getByRole('checkbox',{name:/I reviewed the staged preview/}).check();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText(/quarantined candidates created/)).toBeVisible();
  const applied=requests.filter(x=>x.op==='ApplyAdminImport');
  expect(applied).toHaveLength(1);
  expect(applied[0].variables.input.expectedFileSha256).toBe(HASH);
  expect(requests.filter(x=>/Publish|Approve|Unquarantine/.test(x.op))).toHaveLength(0);
});
