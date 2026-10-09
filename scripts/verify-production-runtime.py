#!/usr/bin/env python3
"""Start production-mode compiled API on an ephemeral port; always stop it."""
import os
import pathlib
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
api_dir = root / 'apps' / 'api'
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]

env = os.environ.copy()
env['NODE_ENV'] = 'production'
env['API_PORT'] = str(port)
env['WEB_URL'] = 'https://frontend.example.test'
env['PORT'] = str(port)
process = None
try:
    with tempfile.TemporaryFile(mode='w+t', encoding='utf-8') as logfile:
        process = subprocess.Popen(
            ['node', 'dist/main.js'], cwd=api_dir, env=env,
            stdout=logfile, stderr=subprocess.STDOUT,
        )
        for attempt in range(100):
            if process.poll() is not None:
                logfile.seek(0)
                raise RuntimeError('Production-mode API exited early: ' + logfile.read()[-3000:])
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/health/live', timeout=1) as response:
                    if response.status == 200:
                        break
            except Exception:
                time.sleep(0.3)
        else:
            logfile.seek(0)
            raise RuntimeError('Production-mode API not ready: ' + logfile.read()[-3000:])
        smoke = os.environ.copy()
        smoke.update({
            'API_PUBLIC_URL': f'http://127.0.0.1:{port}',
            'WEB_PUBLIC_URL': env['WEB_URL'],
            'SMOKE_ALLOW_HTTP_LOCAL': '1',
            'SMOKE_CHECK_PRODUCTION': '1',
        })
        print('===== AN-126 LIVE PRODUCTION-MODE SMOKE =====', flush=True)
        result = subprocess.run(['node', 'scripts/production-smoke.mjs'], cwd=root, env=smoke)
        if result.returncode:
            raise RuntimeError(f'Production smoke failed (exit {result.returncode})')
finally:
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
