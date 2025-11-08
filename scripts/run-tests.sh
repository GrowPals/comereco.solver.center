#!/bin/bash

# 🧪 Script para ejecutar tests de Playwright
# Uso: ./scripts/run-tests.sh [opciones]

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Verificar que Playwright está instalado
check_playwright() {
    if ! command -v npx &> /dev/null; then
        print_warning "npx no encontrado. Instalando dependencias..."
        npm install
    fi

    if ! npx playwright --version &> /dev/null; then
        print_warning "Playwright no encontrado. Instalando..."
        npx playwright install --with-deps chromium
    fi
}

# Ejecutar tests
run_tests() {
    local test_type="${1:-all}"
    
    case "$test_type" in
        smoke)
            print_info "Ejecutando smoke tests..."
            npx playwright test tests/e2e/smoke.spec.ts
            ;;
        routes)
            print_info "Ejecutando tests de rutas..."
            npx playwright test tests/e2e/routes.spec.ts
            ;;
        performance)
            print_info "Ejecutando tests de performance..."
            npx playwright test tests/e2e/performance.spec.ts
            ;;
        sync)
            print_info "Ejecutando tests de workflow..."
            npx playwright test tests/e2e/sync-workflow.spec.ts
            ;;
        e2e)
            print_info "Ejecutando todos los tests e2e..."
            npx playwright test tests/e2e/
            ;;
        all|*)
            print_info "Ejecutando todos los tests..."
            npx playwright test
            ;;
    esac
}

# Mostrar ayuda
show_help() {
    cat << EOF
🧪 Script de Tests de Playwright

USAGE:
    ./scripts/run-tests.sh [tipo] [opciones]

TIPOS DE TESTS:
    smoke        Tests básicos de humo
    routes       Tests de rutas normalizadas
    performance  Tests de performance y optimizaciones
    sync         Tests de workflow de sincronización
    e2e          Todos los tests e2e
    all          Todos los tests (default)

OPCIONES:
    --ui         Abrir UI de Playwright
    --headed     Ejecutar en modo headed (ver navegador)
    --debug      Modo debug
    --help       Mostrar esta ayuda

EJEMPLOS:
    ./scripts/run-tests.sh smoke
    ./scripts/run-tests.sh routes --headed
    ./scripts/run-tests.sh all --ui

EOF
}

# MAIN
main() {
    if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
        show_help
        exit 0
    fi

    check_playwright
    
    local test_type="${1:-all}"
    shift || true
    
    # Procesar opciones adicionales
    local playwright_args=""
    for arg in "$@"; do
        case "$arg" in
            --ui)
                playwright_args="$playwright_args --ui"
                ;;
            --headed)
                playwright_args="$playwright_args --headed"
                ;;
            --debug)
                playwright_args="$playwright_args --debug"
                ;;
        esac
    done
    
    if [ -n "$playwright_args" ]; then
        print_info "Ejecutando: npx playwright test $playwright_args"
        npx playwright test $playwright_args
    else
        run_tests "$test_type"
    fi
    
    print_success "Tests completados"
}

main "$@"

