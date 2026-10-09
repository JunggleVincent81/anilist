#!/usr/bin/env python3
"""AN-128: read-only anonymous auth/GraphQL smoke on ephemeral API port."""
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

        operations = [
            ('inbox', 'query ($input: NotificationFeedInput) { myNotifications(input: $input) { items { id kind sourceId targetActivityId isRead createdAt actor { id username displayName avatarUrl } } pageInfo { page perPage total pageCount hasNextPage hasPreviousPage } } }', {'input': {'page': 1, 'perPage': 15, 'unreadOnly': False}}),
            ('count', 'query { myUnreadNotificationCount }', None),
            ('mark-read', 'mutation ($id: ID!) { markNotificationRead(id: $id) }', {'id': '00000000-0000-4000-8000-000000000000'}),
            ('mark-all', 'mutation { markAllNotificationsRead }', None),
            ('delete', 'mutation ($id: ID!) { deleteMyNotification(id: $id) }', {'id': '00000000-0000-4000-8000-000000000000'}),
        ]
        for label, query, variables in operations:
            result = gql(query, variables)
            errors = result.get('errors') or []
            assert errors, f'AN-128: anonymous {label} unexpectedly succeeded'
            for error in errors:
                message = error.get('message', '')
                assert 'Cannot query field' not in message and 'Unknown type' not in message and 'Unknown argument' not in message, f'GraphQL contract mismatch: {label}: {message}'
        print('AN-128 NOTIFICATION GRAPHQL CONTRACT: PASS', flush=True)
        print('AN-128 ANONYMOUS INBOX & MUTATIONS BLOCKED: PASS', flush=True)
finally:
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
