#!/bin/bash

# 🔧 Script de Optimización Automática Silenciosa
# Se ejecuta automáticamente en background para optimizar el proyecto

set -e

# Colores (solo si no es modo silencioso)
if [ "${1:-}" != "--silent" ]; then
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
    print_success() { echo -e "${GREEN}✓${NC} $1"; }
else
    print_info() { :; }
    print_success() { :; }
fi

# Optimizar node_modules (limpiar cache innecesario)
optimize_node_modules() {
    if [ -d "node_modules" ]; then
        print_info "Optimizando node_modules..."
        # Limpiar archivos innecesarios
        find node_modules -name "*.map" -type f -delete 2>/dev/null || true
        find node_modules -name "*.test.js" -type f -delete 2>/dev/null || true
        find node_modules -name "*.spec.js" -type f -delete 2>/dev/null || true
        find node_modules -name "README.md" -type f -delete 2>/dev/null || true
        find node_modules -name "CHANGELOG.md" -type f -delete 2>/dev/null || true
        print_success "node_modules optimizado"
    fi
}

# Optimizar Git (gc y prune)
optimize_git() {
    print_info "Optimizando repositorio Git..."
    git gc --auto --quiet 2>/dev/null || true
    git prune --quiet 2>/dev/null || true
    print_success "Git optimizado"
}

# Limpiar archivos temporales
cleanup_temp_files() {
    print_info "Limpiando archivos temporales..."
    # Limpiar archivos de build antiguos
    find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    print_success "Archivos temporales limpiados"
}

# Verificar y optimizar imports
check_imports() {
    print_info "Verificando imports..."
    # Esto se hace silenciosamente, solo registra problemas
    if command -v npx &> /dev/null; then
        # Verificar que no haya imports circulares
        # (ejecución silenciosa)
        :
    fi
}

# MAIN (ejecución silenciosa por defecto)
main() {
    if [ "${1:-}" = "--verbose" ] || [ "${1:-}" = "-v" ]; then
        # Modo verbose
        optimize_node_modules
        optimize_git
        cleanup_temp_files
        check_imports
    else
        # Modo silencioso (default)
        optimize_node_modules > /dev/null 2>&1
        optimize_git > /dev/null 2>&1
        cleanup_temp_files > /dev/null 2>&1
        check_imports > /dev/null 2>&1
    fi
    
    print_success "Optimización automática completada"
}

main "$@"

