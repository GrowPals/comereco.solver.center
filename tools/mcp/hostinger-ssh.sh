#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# 🧭 Inicialización y entorno
# ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${HOSTINGER_MCP_ENV_FILE:-${REPO_ROOT}/.env.mcp.hostinger}"

if [[ ! -f "${ENV_FILE}" ]]; then
  cat <<EOF >&2
[hostinger-ssh] ❌ No se encontró el archivo de variables requerido:
  ${ENV_FILE}
Crea uno a partir de .env.mcp.hostinger.example y vuelve a ejecutar.
EOF
  exit 1
fi

# Cargar variables del entorno
set -a
source "${ENV_FILE}"
set +a

: "${HOSTINGER_VPS_HOST:?Debes definir HOSTINGER_VPS_HOST en ${ENV_FILE}}"
: "${HOSTINGER_VPS_USER:?Debes definir HOSTINGER_VPS_USER en ${ENV_FILE}}"
PORT_VALUE="${HOSTINGER_VPS_PORT:-22}"

# ──────────────────────────────────────────────
# ⚙️ Construcción del comando base
# ──────────────────────────────────────────────
CMD=(npx -y ssh-mcp --host="${HOSTINGER_VPS_HOST}" --user="${HOSTINGER_VPS_USER}" --port="${PORT_VALUE}")

if [[ -n "${HOSTINGER_VPS_SSH_KEY_PATH:-}" ]]; then
  CMD+=("--key=${HOSTINGER_VPS_SSH_KEY_PATH}")
elif [[ -n "${HOSTINGER_VPS_PASSWORD:-}" ]]; then
  CMD+=("--password=${HOSTINGER_VPS_PASSWORD}")
else
  echo "[hostinger-ssh] ⚠️ No se definió llave ni password; se usará llave por defecto en ~/.ssh/id_rsa" >&2
fi

[[ -n "${HOSTINGER_VPS_SUDO_PASSWORD:-}" ]] && CMD+=("--sudoPassword=${HOSTINGER_VPS_SUDO_PASSWORD}")
[[ -n "${HOSTINGER_VPS_SU_PASSWORD:-}" ]] && CMD+=("--suPassword=${HOSTINGER_VPS_SU_PASSWORD}")
[[ -n "${HOSTINGER_VPS_TIMEOUT:-}" ]] && CMD+=("--timeout=${HOSTINGER_VPS_TIMEOUT}")
[[ -n "${HOSTINGER_VPS_MAX_CHARS:-}" ]] && CMD+=("--maxChars=${HOSTINGER_VPS_MAX_CHARS}")
[[ "${HOSTINGER_VPS_DISABLE_SUDO:-false}" == "true" ]] && CMD+=("--disableSudo")

# Flags extra (permite personalización avanzada)
if [[ -n "${HOSTINGER_VPS_EXTRA_FLAGS:-}" ]]; then
  # shellcheck disable=SC2206
  EXTRA_FLAGS=(${HOSTINGER_VPS_EXTRA_FLAGS})
  CMD+=("${EXTRA_FLAGS[@]}")
fi

# Mantiene la sesión activa y limpia la salida
CMD+=("--keepAlive" "--noColor" "--reconnect" "--heartbeatInterval=30")

# ──────────────────────────────────────────────
# 🧠 Compatibilidad con comandos compuestos
# ──────────────────────────────────────────────
# Esto permite ejecutar secuencias como:
#   @hostinger-ssh cd /var/www && git pull && docker compose up -d
#
# Si el MCP recibe varios comandos en una línea, los enviará en un solo bloque
# y este script los ejecutará de forma secuencial sin reconectar.

if [[ "${HOSTINGER_VPS_ALLOW_COMPOUND_COMMANDS:-true}" == "true" ]]; then
  CMD+=("--compoundMode")
fi

# ──────────────────────────────────────────────
# 📜 Logging y reconexión automática
# ──────────────────────────────────────────────
LOG_FILE="${SCRIPT_DIR}/hostinger-ssh.log"
echo "[hostinger-ssh] 🚀 Iniciando conexión con ${HOSTINGER_VPS_USER}@${HOSTINGER_VPS_HOST}:${PORT_VALUE}" > "$LOG_FILE"

until "${CMD[@]}" >>"$LOG_FILE" 2>&1; do
  echo "[hostinger-ssh] 🔁 Reconectando en 5s..." >>"$LOG_FILE"
  sleep 5
done
