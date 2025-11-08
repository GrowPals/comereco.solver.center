#!/bin/bash

# 🔄 Script de Sincronización con Claude Code on the Web
# Uso: ./scripts/sync-with-claude.sh [comando]
#
# Comandos disponibles:
#   morning     - Rutina matutina (actualizar todo)
#   check       - Ver estado y ramas de Claude
#   integrate   - Integrar rama de Claude a dev
#   evening     - Rutina vespertina (push y limpieza)

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar que estamos en el repositorio correcto
check_repo() {
    if [ ! -d ".git" ]; then
        print_error "No estás en un repositorio Git"
        exit 1
    fi

    # Verificar que existe la rama dev
    if ! git show-ref --verify --quiet refs/heads/dev; then
        print_warning "No existe rama 'dev'. Creando..."
        git checkout -b dev
        print_success "Rama 'dev' creada"
    fi
}

# 🌅 RUTINA MATUTINA
morning_routine() {
    print_header "🌅 Rutina Matutina - Sincronización"

    check_repo

    print_info "Guardando cambios locales (si hay)..."
    git stash save "Auto-stash before morning sync $(date +%Y-%m-%d)"

    print_info "Actualizando rama dev desde origin..."
    git checkout dev
    git pull origin dev
    print_success "Rama dev actualizada"

    print_info "Fetching todas las ramas remotas..."
    git fetch --all
    print_success "Ramas actualizadas"

    print_header "📊 Estado Actual"

    echo -e "${YELLOW}Ramas de Claude disponibles:${NC}"
    git branch -r | grep "claude/" || echo "  (ninguna por ahora)"

    echo -e "\n${YELLOW}Commits recientes:${NC}"
    git log --oneline --all --decorate -10

    echo -e "\n${YELLOW}Pull Requests pendientes:${NC}"
    if command -v gh &> /dev/null; then
        gh pr list --limit 5
    else
        print_warning "GitHub CLI (gh) no instalado. Instalar con: brew install gh"
    fi

    # Recuperar stash si existe
    if git stash list | grep -q "Auto-stash before morning sync"; then
        print_info "Recuperando cambios guardados..."
        git stash pop
    fi

    print_success "¡Listo para trabajar!"
}

# 🔍 VERIFICAR ESTADO
check_status() {
    print_header "🔍 Estado del Repositorio"

    check_repo

    echo -e "${YELLOW}Rama actual:${NC}"
    git branch --show-current

    echo -e "\n${YELLOW}Estado de archivos:${NC}"
    git status --short

    echo -e "\n${YELLOW}Ramas locales:${NC}"
    git branch

    echo -e "\n${YELLOW}Ramas remotas (Claude):${NC}"
    git branch -r | grep "claude/" || echo "  (ninguna)"

    echo -e "\n${YELLOW}Últimos commits:${NC}"
    git log --oneline -5

    echo -e "\n${YELLOW}Diferencia con dev:${NC}"
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "dev" ]; then
        commits_ahead=$(git rev-list --count dev..$current_branch)
        commits_behind=$(git rev-list --count $current_branch..dev)
        echo "  Commits adelante de dev: $commits_ahead"
        echo "  Commits atrás de dev: $commits_behind"
    else
        echo "  Estás en dev"
    fi
}

# 🔗 INTEGRAR RAMA DE CLAUDE
integrate_claude_branch() {
    print_header "🔗 Integrar Rama de Claude"

    check_repo

    # Listar ramas de Claude disponibles
    echo -e "${YELLOW}Ramas de Claude disponibles:${NC}"
    claude_branches=$(git branch -r | grep "origin/claude/" | sed 's/origin\///' || echo "")

    if [ -z "$claude_branches" ]; then
        print_warning "No hay ramas de Claude disponibles"
        exit 0
    fi

    echo "$claude_branches"

    # Si se proporcionó nombre de rama como argumento
    if [ -n "$2" ]; then
        branch_name="$2"
    else
        echo -e "\n${BLUE}Ingresa el nombre de la rama a integrar (sin origin/):${NC}"
        read -p "Rama: " branch_name
    fi

    # Verificar que la rama existe
    if ! git show-ref --verify --quiet "refs/remotes/origin/$branch_name"; then
        print_error "La rama '$branch_name' no existe en origin"
        exit 1
    fi

    print_info "Cambiando a rama dev..."
    git checkout dev

    print_info "Actualizando dev..."
    git pull origin dev

    print_info "Haciendo merge de $branch_name..."
    if git merge "origin/$branch_name" --no-ff -m "merge: integrar $branch_name"; then
        print_success "Merge exitoso"

        echo -e "\n${YELLOW}¿Hacer push a origin/dev? (y/n):${NC}"
        read -p "> " push_confirm

        if [ "$push_confirm" = "y" ]; then
            git push origin dev
            print_success "Push completado"
        else
            print_info "Puedes hacer push más tarde con: git push origin dev"
        fi
    else
        print_error "Hubo conflictos en el merge"
        print_info "Resuelve los conflictos y luego:"
        print_info "  git add ."
        print_info "  git commit"
        print_info "  git push origin dev"
        exit 1
    fi
}

# 🌆 RUTINA VESPERTINA
evening_routine() {
    print_header "🌆 Rutina Vespertina - Finalización"

    check_repo

    current_branch=$(git branch --show-current)

    print_info "Rama actual: $current_branch"

    # Verificar si hay cambios sin commitear
    if ! git diff-index --quiet HEAD --; then
        print_warning "Hay cambios sin commitear"
        echo -e "\n${YELLOW}¿Hacer commit de cambios? (y/n):${NC}"
        read -p "> " commit_confirm

        if [ "$commit_confirm" = "y" ]; then
            git add .
            echo -e "${YELLOW}Mensaje de commit:${NC}"
            read -p "> " commit_msg
            git commit -m "$commit_msg"
            print_success "Commit realizado"
        fi
    fi

    # Hacer push de la rama actual
    echo -e "\n${YELLOW}¿Hacer push de '$current_branch'? (y/n):${NC}"
    read -p "> " push_confirm

    if [ "$push_confirm" = "y" ]; then
        git push origin "$current_branch" || git push -u origin "$current_branch"
        print_success "Push completado"
    fi

    # Verificar PRs pendientes de Claude
    if command -v gh &> /dev/null; then
        echo -e "\n${YELLOW}Pull Requests pendientes:${NC}"
        gh pr list --limit 5

        echo -e "\n${BLUE}Revisa los PRs de Claude en:${NC}"
        echo "  https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/pulls"
    fi

    print_success "¡Buen trabajo hoy! 🎉"
}

# 📋 MOSTRAR AYUDA
show_help() {
    cat << EOF
🔄 Script de Sincronización con Claude Code on the Web

USAGE:
    ./scripts/sync-with-claude.sh [comando]

COMANDOS:
    morning       Rutina matutina (actualizar ramas, ver estado)
    check         Ver estado actual del repositorio
    integrate     Integrar rama de Claude a dev
    evening       Rutina vespertina (commit, push, revisar PRs)
    help          Mostrar esta ayuda

EJEMPLOS:
    # Rutina matutina
    ./scripts/sync-with-claude.sh morning

    # Ver estado
    ./scripts/sync-with-claude.sh check

    # Integrar rama específica de Claude
    ./scripts/sync-with-claude.sh integrate claude/feature-notifications

    # Rutina vespertina
    ./scripts/sync-with-claude.sh evening

WORKFLOW RECOMENDADO:
    1. Mañana: ./scripts/sync-with-claude.sh morning
    2. Trabajar en tu código (Cursor)
    3. Claude trabaja en paralelo (claude.ai/code)
    4. Tarde: ./scripts/sync-with-claude.sh evening

Para más información, ver: docs/WORKFLOW_CLAUDE_CODE_WEB.md

EOF
}

# MAIN
main() {
    case "${1:-help}" in
        morning)
            morning_routine
            ;;
        check)
            check_status
            ;;
        integrate)
            integrate_claude_branch "$@"
            ;;
        evening)
            evening_routine
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando desconocido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
