#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 💾 BACKUP-DB - Backup de Base de Datos Supabase
# ═══════════════════════════════════════════════════════════════
# Cron: 0 1 * * * (Diario a la 1 AM)
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="backups/database"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 BACKUP DE BASE DE DATOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Crear directorio
mkdir -p "$BACKUP_DIR"

# Cargar variables
if [ -f ".env" ]; then
  source .env
else
  echo -e "${RED}✗${NC} Archivo .env no encontrado"
  exit 1
fi

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}✗${NC} Supabase CLI no instalado"
  echo "Instala con: npm install -g supabase"
  exit 1
fi

# Backup usando Supabase CLI
echo -e "${BLUE}→${NC} Creando backup..."

BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

supabase db dump --db-url "$VITE_SUPABASE_URL" > "$BACKUP_FILE" 2>/dev/null || {
  echo -e "${RED}✗${NC} Backup falló"
  exit 1
}

# Comprimir
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Backup creado: $BACKUP_FILE ($SIZE)"

# Limpiar backups antiguos
echo -e "${BLUE}→${NC} Limpiando backups antiguos (>${RETENTION_DAYS} días)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
echo -e "${GREEN}✓${NC} Backups antiguos eliminados (quedan: $REMAINING)"

# Resumen
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BACKUP COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo "  Archivo: $BACKUP_FILE"
echo "  Tamaño: $SIZE"
echo "  Total backups: $REMAINING"
