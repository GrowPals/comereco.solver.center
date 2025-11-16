#!/bin/bash
# Test n8n API Connection Script
set -e
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo "🔍 Test de Conexión a n8n API"
echo "=============================="
N8N_API_URL="${N8N_API_URL:-}"
N8N_API_KEY="${N8N_API_KEY:-}"
if [ -z "$N8N_API_URL" ]; then
    echo -e "${YELLOW}Ingresa la URL de n8n:${NC}"
    read -r N8N_API_URL
fi
if [ -z "$N8N_API_KEY" ]; then
    echo -e "${YELLOW}Ingresa el API Key:${NC}"
    read -r N8N_API_KEY
fi
N8N_API_URL="${N8N_API_URL%/}"
echo "📡 Probando: $N8N_API_URL"
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_API_URL/api/v1/workflows" | jq '.' || echo "Error en conexión"
