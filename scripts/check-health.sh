#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🏥 CHECK-HEALTH - Verificación de Salud del Sistema
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check() {
  local name=$1
  local command=$2

  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✓${NC} $name"
    return 0
  else
    echo -e "${RED}✗${NC} $name"
    ((ERRORS++))
    return 1
  fi
}

warn() {
  local name=$1
  local command=$2

  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✓${NC} $name"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} $name"
    ((WARNINGS++))
    return 1
  fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🏥 HEALTH CHECK${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Variables de entorno
echo -e "${BLUE}📋 Variables de Entorno${NC}"
check "Archivo .env existe" "test -f .env"
check "VITE_SUPABASE_URL configurado" "grep -q 'VITE_SUPABASE_URL=' .env"
check "VITE_SUPABASE_ANON_KEY configurado" "grep -q 'VITE_SUPABASE_ANON_KEY=' .env"
echo ""

# Dependencias
echo -e "${BLUE}📦 Dependencias${NC}"
check "Node.js instalado" "command -v node"
check "npm instalado" "command -v npm"
check "node_modules existe" "test -d node_modules"
warn "Vercel CLI instalado" "command -v vercel"
warn "Supabase CLI instalado" "command -v supabase"
echo ""

# Build
echo -e "${BLUE}🔨 Build${NC}"
warn "dist/ existe" "test -d dist"
if [ -d "dist" ]; then
  SIZE=$(du -sh dist | cut -f1)
  echo "  Tamaño: $SIZE"
fi
echo ""

# Git
echo -e "${BLUE}📝 Git${NC}"
check "Git inicializado" "test -d .git"
if [ -d ".git" ]; then
  BRANCH=$(git branch --show-current)
  echo "  Branch: $BRANCH"

  if [ -n "$(git status --porcelain)" ]; then
    echo -e "  ${YELLOW}⚠${NC} Hay cambios sin commitear"
    ((WARNINGS++))
  else
    echo -e "  ${GREEN}✓${NC} Working tree limpio"
  fi
fi
echo ""

# Conectividad
echo -e "${BLUE}🌐 Conectividad${NC}"

if [ -f ".env" ]; then
  source .env

  if [ -n "$VITE_SUPABASE_URL" ]; then
    if curl -s -o /dev/null -w "%{http_code}" "$VITE_SUPABASE_URL/rest/v1/" -H "apikey: $VITE_SUPABASE_ANON_KEY" | grep -q "200\|401"; then
      echo -e "${GREEN}✓${NC} Supabase accesible"
    else
      echo -e "${RED}✗${NC} Supabase no accesible"
      ((ERRORS++))
    fi
  fi
fi
echo ""

# Espacio en disco
echo -e "${BLUE}💾 Espacio en Disco${NC}"
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}')

if [ "$DISK_USAGE" -gt 90 ]; then
  echo -e "${RED}✗${NC} Espacio crítico: ${DISK_USAGE}% usado (disponible: $DISK_AVAIL)"
  ((ERRORS++))
elif [ "$DISK_USAGE" -gt 80 ]; then
  echo -e "${YELLOW}⚠${NC} Espacio alto: ${DISK_USAGE}% usado (disponible: $DISK_AVAIL)"
  ((WARNINGS++))
else
  echo -e "${GREEN}✓${NC} Espacio OK: ${DISK_USAGE}% usado (disponible: $DISK_AVAIL)"
fi
echo ""

# Resumen
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ SISTEMA SALUDABLE${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SISTEMA OK CON ADVERTENCIAS${NC}"
  echo "  Advertencias: $WARNINGS"
  exit 0
else
  echo -e "${RED}❌ SISTEMA CON ERRORES${NC}"
  echo "  Errores: $ERRORS"
  echo "  Advertencias: $WARNINGS"
  exit 1
fi
