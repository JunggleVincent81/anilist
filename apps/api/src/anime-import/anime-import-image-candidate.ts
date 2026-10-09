/**
 * AN-139B2: source URL metadata ONLY, not permission or display approval.
 * The known-host list reflects the audited offline dataset, NOT a hotlink
 * allowlist or copyright clearance. Do not fetch any of these URLs here.
 */
const KNOWN_DATASET_IMAGE_HOSTS = new Set([
  'cdn.myanimelist.net',
  'cdn.anisearch.com',
  'media.kitsu.app',
  'cdn.anime-planet.com',
  'cdn.animenewsnetwork.com',
  'simkl.in',
  'u.livechart.me',
  'raw.githubusercontent.com',
  'cdn.anidb.net',
  's4.anilist.co',
]);

type SourceImageField = 'picture' | 'thumbnail';
type ImageRiskHint = 'SENSITIVE_URL_PATH';

type SourceImageCandidate = {
  sourceDataset: 'anime-offline-database';
  sourceField: SourceImageField;
  sourceHost: string;
  sourceUrl: string;
  rightsStatus: 'UNVERIFIED';
  displayApproved: false;
  ageApproved: false;
  riskHints: ImageRiskHint[];
};

const PLACEHOLDER_PATTERN =
  /(?:^|[/_.-])(?:no[_-]?pic|no[_-]?image|no[_-]?cover|placeholder|default|missing[_-]?image)(?:$|[/_.-])/i;
const SENSITIVE_PATH_PATTERN =
  /(?:^|[/_.-])(?:hentai|adult|nsfw|erotic|18plus)(?:$|[/_.-])/i;

function parseSourceImageCandidate(
  value: unknown,
  sourceField: SourceImageField,
): SourceImageCandidate | null {
  if (typeof value !== 'string') {
    return null;
  }
  const input = value.trim();
  // Reject URL parser normalization tricks and obviously unsafe input.
  if (
    input.length === 0 ||
    input.length > 2048 ||
    !input.startsWith('https://') ||
    /\s|\\/.test(input)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.port !== '' ||
    parsed.hash !== '' ||
    !KNOWN_DATASET_IMAGE_HOSTS.has(parsed.hostname)
  ) {
    return null;
  }

  let path: string;
  try {
    path = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (PLACEHOLDER_PATTERN.test(path)) {
    return null;
  }

  return {
    sourceDataset: 'anime-offline-database',
    sourceField,
    sourceHost: parsed.hostname,
    sourceUrl: parsed.toString(),
    rightsStatus: 'UNVERIFIED',
    displayApproved: false,
    ageApproved: false,
    // Path-word hints request review; they do NOT classify anime age.
    riskHints: SENSITIVE_PATH_PATTERN.test(path)
      ? ['SENSITIVE_URL_PATH']
      : [],
  };
}

function normalizeSourceImageCandidates(
  record: Record<string, unknown>,
): SourceImageCandidate[] {
  const candidates: SourceImageCandidate[] = [];
  for (const sourceField of ['picture', 'thumbnail'] as const) {
    const candidate = parseSourceImageCandidate(
      record[sourceField],
      sourceField,
    );
    if (candidate) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

export {
  normalizeSourceImageCandidates,
  parseSourceImageCandidate,
};
export type {
  ImageRiskHint,
  SourceImageCandidate,
  SourceImageField,
};
