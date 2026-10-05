#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${ANILIST_PGDATA:-$HOME/.local/share/anilist/postgres}"
SOCKET_DIR="${ANILIST_PGSOCKET:-$HOME/.local/share/anilist/postgres-socket}"
LOG_FILE="${ANILIST_PGLOG:-$HOME/.local/share/anilist/postgres.log}"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/18/bin}"
PORT="${ANILIST_PGPORT:-55435}"
DB_NAME="${ANILIST_PGDB:-anime_platform}"
DB_USER="${ANILIST_PGUSER:-anilist}"

mkdir -p "$(dirname "$DATA_DIR")" "$SOCKET_DIR"

if [[ ! -f "$DATA_DIR/PG_VERSION" ]]; then
  "$PG_BIN/initdb" -D "$DATA_DIR" --auth=trust --username="$DB_USER" --no-locale >/dev/null
fi

if ! "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" \
    -o "-p $PORT -h 127.0.0.1 -k $SOCKET_DIR" start >/dev/null
fi

until pg_isready -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; do
  sleep 1
done

createdb -h 127.0.0.1 -p "$PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
printf 'PostgreSQL ready: %s:%s/%s\n' 127.0.0.1 "$PORT" "$DB_NAME"
