import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTIVITY_REPLIES_QUERY,
  CREATE_ACTIVITY_MUTATION,
  CREATE_ACTIVITY_REPLY_MUTATION,
  FEED_PAGE_SIZE,
  FOLLOWING_ACTIVITY_FEED_QUERY,
  LIKE_ACTIVITY_MUTATION,
  PUBLIC_ACTIVITY_FEED_QUERY,
  UNLIKE_ACTIVITY_MUTATION,
  cleanActivityText,
  normalizeFeedPage,
} from '../src/lib/graphql/activity-feed.contract.ts'

test('feed page size respects server limit', () => {
  assert.equal(FEED_PAGE_SIZE, 10)
  assert.ok(FEED_PAGE_SIZE <= 50)
})
test('accepts and trims human-written post', () => {
  assert.equal(cleanActivityText('  Watching Frieren! \n '), 'Watching Frieren!')
})
test('rejects empty, whitespace-only and too-long posts or replies', () => {
  for (const text of ['', '  \n  ', 'x'.repeat(501)]) {
    assert.throws(() => cleanActivityText(text))
  }
})
test('accepts a post at the API maximum length', () => {
  assert.equal(cleanActivityText('x'.repeat(500)).length, 500)
})
test('normalizes invalid pages to 1, preserves valid page', () => {
  for (const value of [0, -1, 1.2, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(normalizeFeedPage(value), 1)
  }
  assert.equal(normalizeFeedPage(3), 3)
})
test('public and following operations use distinct backend entry points', () => {
  assert.match(PUBLIC_ACTIVITY_FEED_QUERY, /publicActivityFeed\(input: \$input\)/)
  assert.match(FOLLOWING_ACTIVITY_FEED_QUERY, /followingActivityFeed\(input: \$input\)/)
  for (const query of [PUBLIC_ACTIVITY_FEED_QUERY, FOLLOWING_ACTIVITY_FEED_QUERY]) {
    assert.match(query, /pageInfo \{ page perPage total pageCount hasNextPage hasPreviousPage \}/)
    assert.match(query, /items \{/)
    assert.match(query, /actor \{ username displayName \}/)
  }
})
test('composer sends API input object, not interpolated user text', () => {
  assert.match(CREATE_ACTIVITY_MUTATION, /\$input: CreateTextActivityInput!/)
  assert.match(CREATE_ACTIVITY_MUTATION, /createTextActivity\(input: \$input\)/)
})
test('likes and unlikes use activity IDs as variables', () => {
  for (const query of [LIKE_ACTIVITY_MUTATION, UNLIKE_ACTIVITY_MUTATION]) {
    assert.match(query, /\$activityId: ID!/)
    assert.match(query, /activityId: \$activityId/)
  }
})
test('reply read and write operations use server GraphQL contract', () => {
  assert.match(ACTIVITY_REPLIES_QUERY, /activityReplies\(activityId: \$activityId, input: \$input\)/)
  assert.match(CREATE_ACTIVITY_REPLY_MUTATION, /createActivityReply\(activityId: \$activityId, input: \$input\)/)
})
