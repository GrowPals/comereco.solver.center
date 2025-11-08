#!/bin/bash

# 🤖 Script de Sincronización Inteligente con Claude Web
# Sincroniza automáticamente cambios entre local y remoto
# Resuelve conflictos de forma inteligente preservando lo mejor de ambos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración
BRANCH_DEV="dev"
BRANCH_MAIN="main"
CLAUDE_BRANCH_PATTERN="origin/claude/"

print_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Verificar que estamos en un repo git
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "No estás en un repositorio Git"
        exit 1
    fi
}

# Obtener rama actual
get_current_branch() {
    git branch --show-current
}

# Verificar si hay cambios sin commitear
has_uncommitted_changes() {
    ! git diff-index --quiet HEAD --
}

# Guardar cambios locales en stash
stash_changes() {
    if has_uncommitted_changes; then
        print_info "Guardando cambios locales..."
        git stash push -m "Auto-stash before sync $(date +%Y-%m-%d_%H:%M:%S)"
        return 0
    fi
    return 1
}

# Recuperar cambios del stash
pop_stash() {
    if git stash list | grep -q "Auto-stash before sync"; then
        print_info "Recuperando cambios guardados..."
        git stash pop || {
            print_warning "Hubo conflictos al recuperar stash. Resuelve manualmente."
            return 1
        }
        return 0
    fi
    return 1
}

# Fetch todas las ramas remotas
fetch_all() {
    print_info "Obteniendo cambios del remoto..."
    git fetch --all --prune
    print_success "Cambios obtenidos"
}

# Detectar ramas de Claude nuevas
detect_claude_branches() {
    git branch -r | grep "$CLAUDE_BRANCH_PATTERN" | sed 's/origin\///' || echo ""
}

# Sincronizar rama dev con origin/dev
sync_dev_branch() {
    local current_branch=$(get_current_branch)
    
    print_info "Cambiando a rama $BRANCH_DEV..."
    git checkout $BRANCH_DEV
    
    print_info "Sincronizando con origin/$BRANCH_DEV..."
    git pull origin $BRANCH_DEV || {
        print_warning "Hubo conflictos al hacer pull. Intentando merge..."
        return 1
    }
    
    print_success "Rama $BRANCH_DEV sincronizada"
    return 0
}

# Merge inteligente de rama de Claude
merge_claude_branch() {
    local claude_branch=$1
    
    print_info "Integrando cambios de $claude_branch..."
    
    # Estrategia: preferir cambios locales pero incorporar mejoras de Claude
    if git merge "origin/$claude_branch" --no-ff --no-edit -Xours; then
        print_success "Merge exitoso de $claude_branch"
        return 0
    else
        print_warning "Conflictos detectados en $claude_branch"
        return 1
    fi
}

# Resolver conflictos automáticamente cuando sea posible
resolve_conflicts() {
    local conflicted_files=$(git diff --name-only --diff-filter=U)
    
    if [ -z "$conflicted_files" ]; then
        return 0
    fi
    
    print_info "Intentando resolver conflictos automáticamente..."
    
    # Estrategia: para archivos de configuración, preferir local
    # Para código fuente, intentar merge inteligente
    for file in $conflicted_files; do
        case "$file" in
            *.config.js|*.config.ts|package.json|package-lock.json)
                print_info "Resolviendo $file (preferir versión local)..."
                git checkout --ours "$file"
                git add "$file"
                ;;
            src/config/routes.config.js)
                print_info "Resolviendo $file (preferir versión local)..."
                git checkout --ours "$file"
                git add "$file"
                ;;
            *)
                print_warning "Conflicto en $file requiere resolución manual"
                ;;
        esac
    done
    
    # Verificar si quedan conflictos
    if git diff --check --diff-filter=U; then
        print_warning "Quedan conflictos por resolver manualmente"
        return 1
    else
        print_success "Conflictos resueltos automáticamente"
        return 0
    fi
}

# Sincronización completa inteligente
intelligent_sync() {
    print_header "🔄 Sincronización Inteligente con Claude Web"
    
    check_git_repo
    
    local current_branch=$(get_current_branch)
    local had_stash=false
    
    # Guardar cambios locales
    if stash_changes; then
        had_stash=true
    fi
    
    # Fetch todas las ramas
    fetch_all
    
    # Sincronizar dev
    if ! sync_dev_branch; then
        print_error "Error al sincronizar rama dev"
        if [ "$had_stash" = true ]; then
            pop_stash
        fi
        exit 1
    fi
    
    # Detectar ramas de Claude
    local claude_branches=$(detect_claude_branches)
    
    if [ -n "$claude_branches" ]; then
        print_info "Ramas de Claude detectadas:"
        echo "$claude_branches" | sed 's/^/  - /'
        
        # Integrar cada rama de Claude
        while IFS= read -r branch; do
            if [ -n "$branch" ]; then
                print_info "Integrando $branch..."
                if merge_claude_branch "$branch"; then
                    # Intentar resolver conflictos automáticamente
                    resolve_conflicts
                    
                    # Si hay conflictos sin resolver, informar
                    if git diff --check --diff-filter=U > /dev/null 2>&1; then
                        print_warning "Conflicto en $branch requiere atención manual"
                    fi
                fi
            fi
        done <<< "$claude_branches"
    else
        print_info "No hay ramas de Claude nuevas para integrar"
    fi
    
    # Recuperar cambios locales
    if [ "$had_stash" = true ]; then
        pop_stash
    fi
    
    # Mostrar estado final
    print_header "📊 Estado Final"
    echo -e "${YELLOW}Rama actual:${NC} $(get_current_branch)"
    echo -e "${YELLOW}Commits adelante:${NC} $(git rev-list --count origin/$BRANCH_DEV..HEAD 2>/dev/null || echo 0)"
    echo -e "${YELLOW}Commits atrás:${NC} $(git rev-list --count HEAD..origin/$BRANCH_DEV 2>/dev/null || echo 0)"
    
    if has_uncommitted_changes; then
        print_warning "Hay cambios sin commitear"
        git status --short
    else
        print_success "Working tree limpio"
    fi
    
    print_success "Sincronización completada"
}

# Push inteligente (solo si está todo sincronizado)
intelligent_push() {
    print_header "📤 Push Inteligente"
    
    check_git_repo
    
    local current_branch=$(get_current_branch)
    
    # Verificar que no hay cambios sin commitear
    if has_uncommitted_changes; then
        print_error "Hay cambios sin commitear. Haz commit primero."
        exit 1
    fi
    
    # Verificar que estamos sincronizados
    fetch_all
    local commits_behind=$(git rev-list --count HEAD..origin/$current_branch 2>/dev/null || echo 0)
    
    if [ "$commits_behind" -gt 0 ]; then
        print_warning "Estás $commits_behind commits atrás. Ejecuta sync primero."
        exit 1
    fi
    
    # Hacer push
    print_info "Haciendo push de $current_branch..."
    if git push origin "$current_branch"; then
        print_success "Push completado"
    else
        print_error "Error al hacer push"
        exit 1
    fi
}

# Mostrar ayuda
show_help() {
    cat << EOF
🤖 Script de Sincronización Inteligente con Claude Web

USAGE:
    ./scripts/sync-intelligent.sh [comando]

COMANDOS:
    sync          Sincronización completa inteligente (default)
    push          Push inteligente (verifica sincronización primero)
    help          Mostrar esta ayuda

EJEMPLOS:
    # Sincronización completa
    ./scripts/sync-intelligent.sh sync

    # Push después de sincronizar
    ./scripts/sync-intelligent.sh push

WORKFLOW RECOMENDADO:
    1. Trabajar en tu código (Cursor)
    2. Claude trabaja en paralelo (claude.ai/code)
    3. Ejecutar: ./scripts/sync-intelligent.sh sync
    4. Resolver conflictos si los hay
    5. Ejecutar: ./scripts/sync-intelligent.sh push

CARACTERÍSTICAS:
    - Guarda automáticamente cambios locales antes de sync
    - Detecta y integra ramas de Claude automáticamente
    - Resuelve conflictos cuando es posible
    - Preserva cambios locales en archivos de configuración
    - Verifica estado antes de push

EOF
}

# MAIN
main() {
    case "${1:-sync}" in
        sync)
            intelligent_sync
            ;;
        push)
            intelligent_push
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando desconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"

