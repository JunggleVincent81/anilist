/** Local community-only Bayesian smoothing; not the MyAnimeList formula parameters. */
export const COMMUNITY_PRIOR_WEIGHT = 10;

export function communityWeightedScore(mean: number, count: number, communityMean: number): number {
  if (![mean, count, communityMean].every(Number.isFinite) || count <= 0 || COMMUNITY_PRIOR_WEIGHT <= 0) {
    throw new Error('Invalid community score inputs');
  }
  return (count * mean + COMMUNITY_PRIOR_WEIGHT * communityMean) / (count + COMMUNITY_PRIOR_WEIGHT);
}
