#!/bin/bash

# ================================================
# Test n8n API Connection Script
# ================================================
# Prueba la conexión a n8n usando la API REST
# ================================================

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Test de Conexión a n8n API"
echo "=============================="
echo ""

# Leer variables de entorno o pedirlas
N8N_API_URL="${N8N_API_URL:-}"
N8N_API_KEY="${N8N_API_KEY:-}"

# Si no están definidas, pedirlas
if [ -z "$N8N_API_URL" ]; then
    echo -e "${YELLOW}Ingresa la URL de n8n (ej: https://n8n.tudominio.com):${NC}"
    read -r N8N_API_URL
fi

if [ -z "$N8N_API_KEY" ]; then
    echo -e "${YELLOW}Ingresa el API Key de n8n (Settings → API en n8n):${NC}"
    read -r N8N_API_KEY
fi

# Validar URL
if [[ ! "$N8N_API_URL" =~ ^https?:// ]]; then
    echo -e "${RED}❌ Error: URL debe empezar con http:// o https://${NC}"
    exit 1
fi

# Remover trailing slash
N8N_API_URL="${N8N_API_URL%/}"

echo ""
echo "📡 Probando conexión a: $N8N_API_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$N8N_API_URL/healthz" || echo -e "\n000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "000" ]; then
    echo -e "${GREEN}✅ Health check OK${NC}"
else
    echo -e "${RED}❌ Health check falló (HTTP $HTTP_CODE)${NC}"
fi

# Test 2: API Authentication
echo ""
echo "2️⃣  Autenticación API..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    "$N8N_API_URL/api/v1/workflows" || echo -e "\n000")
HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
BODY=$(echo "$AUTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Autenticación OK${NC}"
    WORKFLOW_COUNT=$(echo "$BODY" | jq '.data | length' 2>/dev/null || echo "?")
    echo "   Workflows encontrados: $WORKFLOW_COUNT"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}❌ Autenticación falló (HTTP $HTTP_CODE)${NC}"
    echo "   Verifica que el API key sea correcto"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}❌ No se pudo conectar a $N8N_API_URL${NC}"
    echo "   Verifica que la URL sea correcta y que n8n esté corriendo"
else
    echo -e "${YELLOW}⚠️  Respuesta inesperada (HTTP $HTTP_CODE)${NC}"
    echo "   Body: $BODY"
fi

# Test 3: List Workflows
if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "3️⃣  Listando Workflows..."
    echo "$BODY" | jq -r '.data[] | "   - \(.name) (ID: \(.id), Active: \(.active))"' 2>/dev/null || echo "   (No se pudo parsear JSON)"
fi

# Test 4: Get Executions (últimas 5)
echo ""
echo "4️⃣  Últimas Ejecuciones..."
EXEC_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    "$N8N_API_URL/api/v1/executions?limit=5" || echo -e "\n000")
HTTP_CODE=$(echo "$EXEC_RESPONSE" | tail -n1)
BODY=$(echo "$EXEC_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "$BODY" | jq -r '.data[] | "   - \(.workflowName): \(.finishedAt // "running") - \(.status)"' 2>/dev/null || echo "   (No hay ejecuciones recientes)"
else
    echo -e "${YELLOW}⚠️  No se pudieron obtener ejecuciones (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "=============================="
echo -e "${GREEN}✅ Test completado${NC}"
echo ""
echo "Para usar el MCP de n8n, configura en Cursor:"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "n8n": {'
echo '      "command": "npx",'
echo '      "args": ['
echo '        "-y",'
echo '        "@n8n/mcp-server",'
echo '        "--url", "'"$N8N_API_URL"'",'
echo '        "--api-key", "'"$N8N_API_KEY"'"'
echo '      ]'
echo '    }'
echo '  }'
echo '}'
echo ""

