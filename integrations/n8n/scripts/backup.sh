#!/bin/bash

# ================================================
# n8n Backup Script
# ================================================
# Crea backup completo de n8n (workflows, credenciales, ejecuciones)
# ================================================

set -e  # Exit on error

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="n8n_backup_${TIMESTAMP}"
CONTAINER_NAME="n8n"

echo "🔄 Iniciando backup de n8n..."
echo "Timestamp: $TIMESTAMP"

# Crear carpeta de backups si no existe
mkdir -p "$BACKUP_DIR"

# Verificar que n8n está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Error: Container n8n no está corriendo"
    echo "Iniciar con: docker-compose up -d"
    exit 1
fi

# Crear backup
echo "📦 Creando backup..."
docker cp "${CONTAINER_NAME}:/home/node/.n8n" "${BACKUP_DIR}/${BACKUP_NAME}"

# Comprimir
echo "🗜️ Comprimiendo..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Calcular tamaño
SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

echo "✅ Backup completado!"
echo "📁 Archivo: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "📊 Tamaño: $SIZE"

# Limpiar backups antiguos (mantener últimos 7)
echo "🧹 Limpiando backups antiguos..."
ls -t n8n_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "✨ Proceso completado"
echo "Backups disponibles:"
ls -lh n8n_backup_*.tar.gz 2>/dev/null || echo "No hay backups"
