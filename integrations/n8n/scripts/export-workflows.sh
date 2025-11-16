#!/bin/bash

# ================================================
# Export n8n Workflows Script
# ================================================
# Exporta todos los workflows de n8n a archivos JSON
# ================================================

set -e

CONTAINER_NAME="n8n"
WORKFLOWS_DIR="./workflows"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "📤 Exportando workflows de n8n..."

# Verificar que n8n está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Error: Container n8n no está corriendo"
    exit 1
fi

# Crear carpeta de workflows si no existe
mkdir -p "$WORKFLOWS_DIR"

# Exportar workflows
echo "🔍 Buscando workflows..."

# Copiar workflows desde container
docker exec "$CONTAINER_NAME" sh -c "ls /home/node/.n8n/*.json 2>/dev/null" | while read -r file; do
    filename=$(basename "$file")
    echo "  📄 Exportando: $filename"
    docker cp "${CONTAINER_NAME}:${file}" "${WORKFLOWS_DIR}/${filename}"
done

# Contar workflows exportados
TOTAL=$(ls -1 "$WORKFLOWS_DIR"/*.json 2>/dev/null | wc -l)

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️ No se encontraron workflows para exportar"
    echo "Asegúrate de haber creado workflows en n8n primero"
    exit 0
fi

echo "✅ Exportados $TOTAL workflows"
echo "📁 Ubicación: $WORKFLOWS_DIR/"
echo ""
echo "Workflows exportados:"
ls -1 "$WORKFLOWS_DIR"/*.json

echo ""
echo "💡 Tip: Renombra los archivos a nombres descriptivos:"
echo "   mv My_Workflow.json nombre-descriptivo.json"
