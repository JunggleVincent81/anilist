#!/usr/bin/env python3
"""AN-129: review GraphQL contract on ephemeral local API; no DB writes."""
import json
import os
import pathlib
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
api_dir = root / 'apps/api'
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
env = os.environ.copy()
env['NODE_ENV'] = 'development'
env['API_PORT'] = str(port)
env['PORT'] = str(port)
process = None
try:
    with tempfile.TemporaryFile(mode='w+t', encoding='utf-8') as log:
        process = subprocess.Popen(['node', 'dist/main.js'], cwd=api_dir, env=env,
                                   stdout=log, stderr=subprocess.STDOUT)
        for _ in range(100):
            if process.poll() is not None:
                log.seek(0)
                raise RuntimeError('API exited: ' + log.read()[-3000:])
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/health/live', timeout=1) as response:
                    if response.status == 200:
                        break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(.3)
        else:
            log.seek(0)
            raise RuntimeError('API did not start: ' + log.read()[-3000:])

        def gql(query, variables=None):
            body = json.dumps({'query': query, 'variables': variables or {}}).encode()
            req = urllib.request.Request(f'http://127.0.0.1:{port}/graphql', body,
                                         headers={'Content-Type': 'application/json',
                                                  'Origin': 'http://localhost:3000'})
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    return json.loads(response.read())
            except urllib.error.HTTPError as error:
                return json.loads(error.read())

        anime_id = '00000000-0000-4000-8000-000000000001'
        review_id = '00000000-0000-4000-8000-000000000002'
        public_queries = [
            ('anime reviews', 'query ($animeId: ID!, $input: ReviewFeedInput) { animeReviews(animeId: $animeId, input: $input) { items { id userId animeId title body score isSpoiler createdAt updatedAt author { id username displayName avatarUrl } } pageInfo { page perPage total pageCount hasNextPage hasPreviousPage } } animeReviewStats(animeId: $animeId) { animeId totalReviews scoredReviews averageScore } }', {'animeId': anime_id, 'input': {'page': 1, 'perPage': 10}}),
            ('user reviews', 'query ($username: String!, $input: ReviewFeedInput) { userReviews(username: $username, input: $input) { items { id userId animeId title body score isSpoiler createdAt updatedAt author { id username displayName avatarUrl } } pageInfo { page perPage total pageCount hasNextPage hasPreviousPage } } }', {'username': 'an129_no_such_user', 'input': {'page': 1, 'perPage': 100}}),
        ]
        for label, query, variables in public_queries:
            response = gql(query, variables)
            assert not response.get('errors'), f'AN-129 public {label} rejected: {response}'
        print('AN-129 PUBLIC ANIME REVIEWS & STATS CONTRACT: PASS', flush=True)
        mutations = [
            ('create', 'mutation ($input: CreateAnimeReviewInput!) { createAnimeReview(input: $input) { id userId animeId } }', {'input': {'animeId': anime_id, 'body': 'Test anonymous denial', 'score': 8.5, 'isSpoiler': False}}),
            ('update', 'mutation ($input: UpdateAnimeReviewInput!) { updateAnimeReview(input: $input) { id userId animeId } }', {'input': {'id': review_id, 'body': 'Test anonymous denial'}}),
            ('delete', 'mutation ($id: ID!) { deleteMyAnimeReview(id: $id) }', {'id': review_id}),
        ]
        for label, query, variables in mutations:
            response = gql(query, variables)
            errors = response.get('errors') or []
            assert errors, f'AN-129 anonymous {label} unexpectedly succeeded: {response}'
            for error in errors:
                message = error.get('message', '')
                assert not any(word in message for word in ('Cannot query field', 'Unknown type', 'Unknown argument')), f'AN-129 {label} schema mismatch: {message}'
        print('AN-129 ANONYMOUS REVIEW MUTATIONS BLOCKED: PASS', flush=True)
finally:
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
