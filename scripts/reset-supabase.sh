#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

DB_URL="${DB_URL:-}"
if [[ -z "$DB_URL" ]]; then
	if [[ -f "$ROOT_DIR/.env" ]]; then
		# shellcheck disable=SC2046
		export $(grep -E '^(DB_URL|SUPABASE_DB_URL)=' "$ROOT_DIR/.env" | xargs -r)
	fi
	DB_URL="${DB_URL:-${SUPABASE_DB_URL:-}}"
fi

if [[ -z "$DB_URL" ]]; then
	echo "❌ Define DB_URL o SUPABASE_DB_URL antes de correr este script" >&2
	exit 1
fi

log() {
	echo -e "\n==== $1 ===="
}

cd "$ROOT_DIR"

log "1) Ejecutando supabase/limpieza_total.sql"
psql "$DB_URL" -f supabase/limpieza_total.sql

log "2) Ejecutando scripts/db/run_rls_checks.sql"
psql "$DB_URL" -f scripts/db/run_rls_checks.sql

log "3) Reinsertando admins core"
node tools/bootstrap-core-admins.mjs

log "Reset completado ✅"
