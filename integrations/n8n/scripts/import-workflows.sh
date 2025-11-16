#!/bin/bash

# ================================================
# Import n8n Workflows Script
# ================================================
# Importa workflows desde carpeta local a n8n
# ================================================

set -e

CONTAINER_NAME="n8n"
WORKFLOWS_DIR="./workflows"

echo "📥 Importando workflows a n8n..."

# Verificar que n8n está corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Error: Container n8n no está corriendo"
    echo "Iniciar con: docker-compose up -d"
    exit 1
fi

# Verificar que existen workflows
if [ ! -d "$WORKFLOWS_DIR" ] || [ -z "$(ls -A "$WORKFLOWS_DIR"/*.json 2>/dev/null)" ]; then
    echo "❌ Error: No se encontraron workflows en $WORKFLOWS_DIR/"
    exit 1
fi

# Copiar workflows al container
echo "📂 Copiando workflows..."
for workflow in "$WORKFLOWS_DIR"/*.json; do
    filename=$(basename "$workflow")
    echo "  📄 Importando: $filename"
    docker cp "$workflow" "${CONTAINER_NAME}:/home/node/.n8n/workflows/${filename}"
done

# Reiniciar n8n para que detecte los workflows
echo "🔄 Reiniciando n8n..."
docker restart "$CONTAINER_NAME"

echo "⏳ Esperando que n8n inicie..."
sleep 5

# Verificar que n8n está corriendo
until curl -s http://localhost:5678/healthz > /dev/null 2>&1; do
    echo "  Esperando..."
    sleep 2
done

echo "✅ Workflows importados correctamente"
echo "🌐 Abrir n8n: http://localhost:5678"
echo ""
echo "📝 Próximos pasos:"
echo "1. Abrir n8n en el navegador"
echo "2. Ir a Workflows"
echo "3. Configurar credenciales en cada workflow"
echo "4. Activar workflows"
