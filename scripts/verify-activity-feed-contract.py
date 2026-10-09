#!/usr/bin/env python3
"""AN-127: read-only GraphQL contract smoke on an isolated ephemeral API port."""
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
        for _ in range(90):
            if process.poll() is not None:
                log.seek(0)
                raise RuntimeError('API exited early: ' + log.read()[-3000:])
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
                                         headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:3000'})
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    return json.loads(response.read())
            except urllib.error.HTTPError as error:
                return json.loads(error.read())

        selection = '''items { id type text animeStatus progressEpisodes createdAt likeCount replyCount actor { username displayName } anime { slug title } achievement { name } } pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }'''
        data = gql(f'query ($input: ActivityFeedInput) {{ publicActivityFeed(input: $input) {{ {selection} }} }}', {'input': {'page': 1, 'perPage': 10}})
        assert not data.get('errors'), f'Public activity query errors: {str(data.get("errors"))[:900]}'
        assert isinstance(data['data']['publicActivityFeed']['items'], list)
        assert isinstance(data['data']['publicActivityFeed']['pageInfo']['total'], int)
        print('AN-127 PUBLIC ACTIVITY FEED CONTRACT: PASS', flush=True)

        private = gql('query { followingActivityFeed { pageInfo { total } } }')
        assert private.get('errors'), 'Anonymous user unexpectedly accessed following feed'
        print('AN-127 ANONYMOUS FOLLOWING FEED BLOCKED: PASS', flush=True)
        print('AN-127 LIVE GRAPHQL CONTRACT: PASS', flush=True)
finally:
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
