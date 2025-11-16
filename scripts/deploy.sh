#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 DEPLOY - Deploy Automatizado a Producción
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 DEPLOY A PRODUCCIÓN${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Pre-checks
echo -e "${BLUE}→${NC} Verificando pre-requisitos..."

# 1. Git status
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}✗${NC} Hay cambios sin commitear"
  git status --short
  exit 1
fi
echo -e "${GREEN}✓${NC} Git limpio"

# 2. Branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  echo -e "${YELLOW}⚠${NC} No estás en main/master (actual: $CURRENT_BRANCH)"
  read -p "¿Continuar? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
echo -e "${GREEN}✓${NC} Branch: $CURRENT_BRANCH"

# 3. Tests
echo -e "${BLUE}→${NC} Ejecutando tests..."
npm run test:rls || { echo -e "${RED}✗${NC} Tests fallaron"; exit 1; }
echo -e "${GREEN}✓${NC} Tests pasaron"

# 4. Build
echo -e "${BLUE}→${NC} Generando build..."
npm run build:clean || { echo -e "${RED}✗${NC} Build falló"; exit 1; }
echo -e "${GREEN}✓${NC} Build exitoso"

# 5. Deploy a Vercel
echo -e "${BLUE}→${NC} Desplegando a Vercel..."
if command -v vercel &> /dev/null; then
  vercel --prod || { echo -e "${RED}✗${NC} Deploy falló"; exit 1; }
  echo -e "${GREEN}✓${NC} Deploy completado"
else
  echo -e "${YELLOW}⚠${NC} Vercel CLI no instalado, usando Git push"
  git push origin "$CURRENT_BRANCH"
  echo -e "${GREEN}✓${NC} Push completado (Vercel auto-deploy)"
fi

# Resumen
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOY EXITOSO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "🌐 Revisa tu deploy en: https://vercel.com/dashboard"
