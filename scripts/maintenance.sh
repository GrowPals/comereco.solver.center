#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🔧 MAINTENANCE - Mantenimiento Automatizado
# ═══════════════════════════════════════════════════════════════
# Ejecuta tareas de mantenimiento periódicas
# Ejecutar: ./scripts/maintenance.sh
# Cron: 0 3 * * 1 (Lunes a las 3 AM)
# ═══════════════════════════════════════════════════════════════

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
LOG_FILE="maintenance-data/logs/maintenance_$(date +%Y%m%d_%H%M%S).log"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_TO="${MAINTENANCE_EMAIL:-}"

# Crear directorio de logs si no existe
mkdir -p "$(dirname "$LOG_FILE")"

# Función de logging
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${BLUE}→${NC} $1" | tee -a "$LOG_FILE"
}

# Función para notificar
notify() {
  local title=$1
  local message=$2
  local status=$3  # success, error, warning

  # Slack
  if [ -n "$SLACK_WEBHOOK" ]; then
    local color="good"
    [ "$status" = "error" ] && color="danger"
    [ "$status" = "warning" ] && color="warning"

    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"attachments\":[{\"color\":\"$color\",\"title\":\"$title\",\"text\":\"$message\"}]}" \
      &> /dev/null || true
  fi

  # Email (requiere mailutils o similar)
  if [ -n "$EMAIL_TO" ] && command -v mail &> /dev/null; then
    echo "$message" | mail -s "$title" "$EMAIL_TO" || true
  fi
}

# Capturar errores
trap 'log_error "Mantenimiento falló con error en línea $LINENO"; notify "Mantenimiento Falló" "Error en línea $LINENO" "error"; exit 1' ERR

# ═══════════════════════════════════════════════════════════════
# INICIO
# ═══════════════════════════════════════════════════════════════

log "═══════════════════════════════════════════════════════════════"
log "🔧 INICIO DE MANTENIMIENTO AUTOMÁTICO"
log "═══════════════════════════════════════════════════════════════"
log ""

START_TIME=$(date +%s)

# ═══════════════════════════════════════════════════════════════
# 1. LIMPIEZA DE LOGS
# ═══════════════════════════════════════════════════════════════

log_info "1️⃣  Limpieza de logs antiguos..."

if [ -f "scripts/cleanup-logs.sh" ]; then
  bash scripts/cleanup-logs.sh --days 30 >> "$LOG_FILE" 2>&1
  log_success "Logs limpiados"
else
  log_warning "Script cleanup-logs.sh no encontrado"
fi

# ═══════════════════════════════════════════════════════════════
# 2. LIMPIEZA DE NODE_MODULES CACHE
# ═══════════════════════════════════════════════════════════════

log_info "2️⃣  Limpieza de cache de node_modules..."

if [ -d "node_modules/.cache" ]; then
  SIZE_BEFORE=$(du -sh node_modules/.cache 2>/dev/null | cut -f1 || echo "0")
  find node_modules/.cache -type f -mtime +7 -delete 2>/dev/null || true
  SIZE_AFTER=$(du -sh node_modules/.cache 2>/dev/null | cut -f1 || echo "0")
  log_success "Cache limpiado (antes: $SIZE_BEFORE, después: $SIZE_AFTER)"
else
  log_info "No hay cache de node_modules"
fi

# ═══════════════════════════════════════════════════════════════
# 3. LIMPIEZA DE DIST Y BUILD ARTIFACTS
# ═══════════════════════════════════════════════════════════════

log_info "3️⃣  Limpieza de build artifacts antiguos..."

# Limpiar builds antiguos en dist/
if [ -d "dist" ]; then
  find dist -type f -mtime +7 -delete 2>/dev/null || true
  log_success "Build artifacts limpiados"
fi

# Limpiar .vercel builds antiguos
if [ -d ".vercel" ]; then
  find .vercel -type f -mtime +7 -delete 2>/dev/null || true
  log_success "Vercel artifacts limpiados"
fi

# ═══════════════════════════════════════════════════════════════
# 4. VERIFICACIÓN DE DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════

log_info "4️⃣  Verificando dependencias npm..."

if command -v npm &> /dev/null; then
  # Contar paquetes desactualizados
  OUTDATED=$(npm outdated --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")

  if [ "$OUTDATED" -gt 0 ]; then
    log_warning "$OUTDATED paquetes desactualizados encontrados"
    npm outdated >> "$LOG_FILE" 2>&1 || true
  else
    log_success "Todas las dependencias están actualizadas"
  fi

  # Auditoría de seguridad
  VULNERABILITIES=$(npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")

  if [ "$VULNERABILITIES" -gt 0 ]; then
    log_warning "$VULNERABILITIES vulnerabilidades encontradas"
    npm audit >> "$LOG_FILE" 2>&1 || true
    notify "⚠️ Vulnerabilidades Detectadas" "$VULNERABILITIES vulnerabilidades en dependencias npm" "warning"
  else
    log_success "No se encontraron vulnerabilidades"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# 5. VERIFICACIÓN DE ESPACIO EN DISCO
# ═══════════════════════════════════════════════════════════════

log_info "5️⃣  Verificando espacio en disco..."

DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 90 ]; then
  log_error "⚠️ Espacio en disco crítico: ${DISK_USAGE}%"
  notify "🚨 Espacio en Disco Crítico" "Uso de disco: ${DISK_USAGE}%" "error"
elif [ "$DISK_USAGE" -gt 80 ]; then
  log_warning "Espacio en disco alto: ${DISK_USAGE}%"
  notify "⚠️ Espacio en Disco Alto" "Uso de disco: ${DISK_USAGE}%" "warning"
else
  log_success "Espacio en disco OK: ${DISK_USAGE}%"
fi

# ═══════════════════════════════════════════════════════════════
# 6. BACKUP DE .ENV (ROTACIÓN)
# ═══════════════════════════════════════════════════════════════

log_info "6️⃣  Rotación de backups de .env..."

if [ -f ".env" ]; then
  BACKUP_DIR="backups/env"
  mkdir -p "$BACKUP_DIR"

  # Crear backup
  cp .env "$BACKUP_DIR/.env.$(date +%Y%m%d)" 2>/dev/null || true

  # Mantener solo últimos 7 backups
  ls -t "$BACKUP_DIR"/.env.* 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true

  BACKUP_COUNT=$(ls "$BACKUP_DIR"/.env.* 2>/dev/null | wc -l)
  log_success "Backup de .env creado (total: $BACKUP_COUNT backups)"
else
  log_warning "Archivo .env no encontrado"
fi

# ═══════════════════════════════════════════════════════════════
# 7. VERIFICACIÓN DE SALUD DEL SISTEMA
# ═══════════════════════════════════════════════════════════════

log_info "7️⃣  Verificación de salud del sistema..."

if [ -f "scripts/check-health.sh" ]; then
  bash scripts/check-health.sh >> "$LOG_FILE" 2>&1 && log_success "Health check OK" || log_warning "Health check con advertencias"
else
  log_info "Script check-health.sh no encontrado (opcional)"
fi

# ═══════════════════════════════════════════════════════════════
# 8. OPTIMIZACIÓN DE GIT
# ═══════════════════════════════════════════════════════════════

log_info "8️⃣  Optimización de repositorio Git..."

if [ -d ".git" ]; then
  # Git garbage collection
  git gc --auto --quiet 2>/dev/null || true

  # Contar objetos
  OBJECTS=$(git count-objects -v 2>/dev/null | grep 'count:' | awk '{print $2}' || echo "0")
  SIZE=$(git count-objects -vH 2>/dev/null | grep 'size-pack:' | awk '{print $2}' || echo "0")

  log_success "Git optimizado ($OBJECTS objetos, $SIZE)"
else
  log_info "No es un repositorio Git"
fi

# ═══════════════════════════════════════════════════════════════
# 9. REPORTE DE TAMAÑO DE PROYECTO
# ═══════════════════════════════════════════════════════════════

log_info "9️⃣  Generando reporte de tamaño..."

echo "" >> "$LOG_FILE"
echo "📊 TAMAÑOS DE DIRECTORIOS:" >> "$LOG_FILE"
du -sh node_modules 2>/dev/null | awk '{print "  node_modules: "$1}' >> "$LOG_FILE" || true
du -sh dist 2>/dev/null | awk '{print "  dist: "$1}' >> "$LOG_FILE" || true
du -sh .vercel 2>/dev/null | awk '{print "  .vercel: "$1}' >> "$LOG_FILE" || true
du -sh migration-data 2>/dev/null | awk '{print "  migration-data: "$1}' >> "$LOG_FILE" || true
du -sh docs 2>/dev/null | awk '{print "  docs: "$1}' >> "$LOG_FILE" || true

log_success "Reporte generado"

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

log ""
log "═══════════════════════════════════════════════════════════════"
log "✅ MANTENIMIENTO COMPLETADO"
log "═══════════════════════════════════════════════════════════════"
log "Duración: ${MINUTES}m ${SECONDS}s"
log "Log guardado en: $LOG_FILE"
log ""

# Notificar éxito
notify "✅ Mantenimiento Completado" "Duración: ${MINUTES}m ${SECONDS}s\nDisco: ${DISK_USAGE}%" "success"

exit 0
