import { describe, expect, it } from '@jest/globals';
import { communityWeightedScore, COMMUNITY_PRIOR_WEIGHT } from './community-weighted-score.js';

describe('AN-134 community weighted scoring', () => {
  it('pulls a sparse high-scoring anime toward the community mean', () => {
    const score = communityWeightedScore(10, 3, 7);
    expect(score).toBeGreaterThan(7);
    expect(score).toBeLessThan(10);
  });
  it('converges toward its local average as review volume grows', () => {
    expect(communityWeightedScore(9, 2000, 7)).toBeGreaterThan(communityWeightedScore(9, 3, 7));
  });
  it('preserves community mean when title mean is equal', () => {
    expect(communityWeightedScore(7.5, 3, 7.5)).toBe(7.5);
    expect(COMMUNITY_PRIOR_WEIGHT).toBe(10);
  });
  it('rejects invalid scores', () => {
    expect(() => communityWeightedScore(Number.NaN, 3, 7)).toThrow();
    expect(() => communityWeightedScore(9, 0, 7)).toThrow();
  });
});
