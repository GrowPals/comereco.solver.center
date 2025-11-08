#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🧹 CLEANUP LOGS - Limpieza Automática de Logs
# ═══════════════════════════════════════════════════════════════
# Limpia logs antiguos automáticamente
# Ejecutar: ./scripts/cleanup-logs.sh
# Cron: 0 2 * * 0 (Domingos a las 2 AM)
# ═══════════════════════════════════════════════════════════════

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
DAYS_TO_KEEP=30
DRY_RUN=false
VERBOSE=false

# Procesar argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --days)
      DAYS_TO_KEEP="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Uso: $0 [opciones]"
      echo ""
      echo "Opciones:"
      echo "  --days N       Mantener logs de últimos N días (default: 30)"
      echo "  --dry-run      Mostrar qué se eliminaría sin hacerlo"
      echo "  --verbose, -v  Mostrar detalles"
      echo "  --help, -h     Mostrar esta ayuda"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧹 LIMPIEZA DE LOGS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Configuración:"
echo "  Mantener: ${DAYS_TO_KEEP} días"
echo "  Modo: $([ "$DRY_RUN" = true ] && echo "DRY-RUN" || echo "REAL")"
echo ""

# Función para limpiar directorio
cleanup_directory() {
  local dir=$1
  local pattern=$2
  local description=$3

  if [ ! -d "$dir" ]; then
    [ "$VERBOSE" = true ] && echo -e "${YELLOW}⚠️  Directorio no existe: $dir${NC}"
    return
  fi

  echo -e "${BLUE}📁 $description${NC}"

  # Contar archivos antes
  local count_before=$(find "$dir" -name "$pattern" -type f 2>/dev/null | wc -l)

  # Encontrar y eliminar archivos antiguos
  local files_to_delete=$(find "$dir" -name "$pattern" -type f -mtime +${DAYS_TO_KEEP} 2>/dev/null)
  local count_to_delete=$(echo "$files_to_delete" | grep -c . || echo 0)

  if [ "$count_to_delete" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} No hay archivos antiguos (${count_before} archivos totales)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "   ${YELLOW}→${NC} Se eliminarían ${count_to_delete} de ${count_before} archivos:"
    [ "$VERBOSE" = true ] && echo "$files_to_delete" | head -5
    [ "$VERBOSE" = true ] && [ "$count_to_delete" -gt 5 ] && echo "   ... y $((count_to_delete - 5)) más"
  else
    echo "$files_to_delete" | xargs rm -f 2>/dev/null || true
    local count_after=$(find "$dir" -name "$pattern" -type f 2>/dev/null | wc -l)
    local deleted=$((count_before - count_after))
    echo -e "   ${GREEN}✓${NC} Eliminados ${deleted} archivos antiguos (quedan ${count_after})"
  fi
}

# Función para limpiar archivos comprimidos antiguos
cleanup_compressed() {
  local dir=$1
  local description=$2

  if [ ! -d "$dir" ]; then
    return
  fi

  echo -e "${BLUE}📦 $description${NC}"

  local count_before=$(find "$dir" -name "*.gz" -o -name "*.zip" -o -name "*.tar.gz" 2>/dev/null | wc -l)
  local files_to_delete=$(find "$dir" \( -name "*.gz" -o -name "*.zip" -o -name "*.tar.gz" \) -type f -mtime +$((DAYS_TO_KEEP * 2)) 2>/dev/null)
  local count_to_delete=$(echo "$files_to_delete" | grep -c . || echo 0)

  if [ "$count_to_delete" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} No hay archivos antiguos (${count_before} archivos totales)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "   ${YELLOW}→${NC} Se eliminarían ${count_to_delete} de ${count_before} archivos"
  else
    echo "$files_to_delete" | xargs rm -f 2>/dev/null || true
    local count_after=$(find "$dir" -name "*.gz" -o -name "*.zip" -o -name "*.tar.gz" 2>/dev/null | wc -l)
    echo -e "   ${GREEN}✓${NC} Eliminados $((count_before - count_after)) archivos (quedan ${count_after})"
  fi
}

# ═══════════════════════════════════════════════════════════════
# LIMPIEZA POR DIRECTORIO
# ═══════════════════════════════════════════════════════════════

# Logs de migración
cleanup_directory "migration-data/03-logs" "migration_*.log" "Logs de Migración"

# Logs de Vite
cleanup_directory "node_modules/.vite" "*.log" "Logs de Vite"

# Logs de npm
cleanup_directory "." "npm-debug.log*" "Logs de NPM (root)"
cleanup_directory "." "yarn-debug.log*" "Logs de Yarn (root)"
cleanup_directory "." "yarn-error.log*" "Errores de Yarn (root)"

# Archivos temporales de Vercel
cleanup_directory ".vercel" "*.log" "Logs de Vercel"

# Archivos temporales de Playwright
cleanup_directory ".playwright-mcp" "*.log" "Logs de Playwright"

# Cache de Supabase
cleanup_directory "supabase/.temp" "*" "Cache temporal de Supabase"

# Comprimidos antiguos
cleanup_compressed "." "Archivos comprimidos antiguos"

# ═══════════════════════════════════════════════════════════════
# LIMPIEZA DE AUDIT_LOGS EN SUPABASE (opcional)
# ═══════════════════════════════════════════════════════════════

if [ -f ".env" ] && grep -q "SUPABASE_URL" .env 2>/dev/null; then
  echo ""
  echo -e "${BLUE}🗄️  Limpieza de audit_logs en Supabase${NC}"

  if command -v psql &> /dev/null && [ -n "$SUPABASE_DB_URL" ]; then
    if [ "$DRY_RUN" = true ]; then
      echo -e "   ${YELLOW}→${NC} Se ejecutaría limpieza de audit_logs > ${DAYS_TO_KEEP} días"
    else
      # Intentar limpiar audit_logs
      echo -e "   ${YELLOW}→${NC} Limpiando audit_logs antiguos..."
      # Esta query se debe ejecutar manualmente en Supabase SQL Editor
      echo "   Para limpiar audit_logs, ejecuta en Supabase SQL Editor:"
      echo "   DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '${DAYS_TO_KEEP} days';"
    fi
  else
    echo -e "   ${YELLOW}⚠️  psql no disponible o SUPABASE_DB_URL no configurado${NC}"
    echo "   Para limpiar audit_logs, ejecuta manualmente en Supabase:"
    echo "   DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '${DAYS_TO_KEEP} days';"
  fi
fi

# ═══════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${GREEN}✓ Análisis completado (DRY-RUN)${NC}"
  echo ""
  echo "Para ejecutar la limpieza real:"
  echo "  ./scripts/cleanup-logs.sh"
else
  echo -e "${GREEN}✓ Limpieza completada${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Mostrar espacio liberado
if [ "$DRY_RUN" = false ]; then
  echo "💾 Ejecuta 'df -h' para ver el espacio liberado"
fi
