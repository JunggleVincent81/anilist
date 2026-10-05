#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${ANILIST_PGDATA:-$HOME/.local/share/anilist/postgres}"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/18/bin}"

if "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" stop
else
  printf 'PostgreSQL is not running: %s\n' "$DATA_DIR"
fi
