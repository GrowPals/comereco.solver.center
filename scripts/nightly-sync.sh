#!/bin/bash

# 🌙 Script de Sincronización Nocturna Automática
# Se ejecuta automáticamente antes de dormir para dejar todo sincronizado

set -e

# Modo silencioso por defecto
QUIET=true

# Colores (solo si no es silencioso)
if [ "$QUIET" != "true" ]; then
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
    print_success() { echo -e "${GREEN}✓${NC} $1"; }
else
    print_info() { :; }
    print_success() { :; }
fi

cd "$(dirname "$0")/.." || exit 1

print_info "Iniciando sincronización nocturna..."

# 1. Sincronizar con remoto
print_info "Sincronizando con remoto..."
git fetch --all --prune --quiet 2>/dev/null || git fetch --all --prune

# 2. Verificar si hay cambios locales sin commitear
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    print_info "Hay cambios sin commitear, haciendo commit..."
    git add -A
    git commit -m "🌙 Auto: Cambios automáticos antes de sincronización" --no-verify 2>/dev/null || true
fi

# 3. Hacer push si hay commits locales
LOCAL_COMMITS=$(git rev-list --count origin/dev..HEAD 2>/dev/null || echo 0)
if [ "$LOCAL_COMMITS" -gt 0 ]; then
    print_info "Haciendo push de $LOCAL_COMMITS commits..."
    git push origin dev --quiet 2>/dev/null || git push origin dev
fi

# 4. Optimizaciones automáticas
print_info "Ejecutando optimizaciones..."
if [ -f "scripts/auto-optimize.sh" ]; then
    bash scripts/auto-optimize.sh --silent 2>/dev/null || true
fi

# 5. Optimizar Git
print_info "Optimizando repositorio Git..."
git gc --auto --quiet 2>/dev/null || true

# 6. Verificar estado final
print_success "Sincronización completada"
print_info "Estado: $(git branch --show-current) sincronizado con origin/dev"

exit 0

