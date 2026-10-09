import { describe, expect, it } from '@jest/globals';
import { validateSync } from 'class-validator';
import { NotificationFeedInput } from './notifications.graphql.js';

function build(input: Partial<NotificationFeedInput>) {
  return Object.assign(new NotificationFeedInput(), input);
}

describe('AN-123 GraphQL NotificationFeedInput validation', () => {
  it('accepts empty optional input and valid filters', () => {
    expect(validateSync(build({}))).toHaveLength(0);
    expect(validateSync(build({ page: 1, perPage: 100, unreadOnly: true }))).toHaveLength(0);
  });

  it('rejects invalid pagination values', () => {
    expect(validateSync(build({ page: 0 }))).not.toHaveLength(0);
    expect(validateSync(build({ page: 1.5 }))).not.toHaveLength(0);
    expect(validateSync(build({ perPage: 101 }))).not.toHaveLength(0);
  });

  it('rejects non-boolean unread-only values', () => {
    expect(validateSync(build({ unreadOnly: 'yes' as unknown as boolean }))).not.toHaveLength(0);
  });
});
