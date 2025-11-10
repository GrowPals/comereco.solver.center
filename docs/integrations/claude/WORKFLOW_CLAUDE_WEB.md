# 🔄 Workflow Optimizado para Colaboración con Claude Web

Sistema completo de sincronización y colaboración entre desarrollo local (Cursor) y Claude Code on the Web.

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Configuración Inicial](#configuración-inicial)
- [Workflow Diario](#workflow-diario)
- [Scripts Disponibles](#scripts-disponibles)
- [Resolución de Conflictos](#resolución-de-conflictos)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🎯 Visión General

Este workflow está diseñado para permitir colaboración fluida entre:
- **Desarrollo Local** (Cursor IDE)
- **Claude Code on the Web** (claude.ai/code)

### Principios

1. **Sincronización Constante**: Mantener local y remoto siempre sincronizados
2. **Preservación Inteligente**: Conservar lo mejor de ambos mundos
3. **Automatización**: Minimizar trabajo manual
4. **Validación**: Verificar integridad antes de push

## ⚙️ Configuración Inicial

### 1. Configurar Token de GitHub

```bash
# El token ya está guardado en ~/.git-credentials
# Verificar que funciona:
git ls-remote origin
```

### 2. Instalar Scripts

```bash
# Hacer scripts ejecutables
chmod +x scripts/*.sh
chmod +x .git/hooks/*
```

### 3. Configurar Git Hooks

Los hooks ya están instalados en `.git/hooks/`:
- `pre-push`: Valida antes de push
- `post-merge`: Valida después de merge

### 4. Verificar Configuración

```bash
# Verificar estado
./scripts/sync-with-claude.sh check

# Probar sincronización
./scripts/sync-intelligent.sh sync
```

## 📅 Workflow Diario

### Rutina Matutina

```bash
# 1. Sincronización completa
./scripts/sync-intelligent.sh sync

# O usar el script original:
./scripts/sync-with-claude.sh morning
```

**Qué hace:**
- Guarda cambios locales en stash
- Actualiza rama dev desde remoto
- Detecta e integra ramas de Claude
- Resuelve conflictos automáticamente cuando es posible
- Recupera cambios locales

### Durante el Día

**Trabajando en Cursor:**
```bash
# Trabajas normalmente en tu código
# Los cambios se guardan localmente
```

**Claude Web trabaja en paralelo:**
- Claude crea ramas con patrón `claude/feature-*`
- Los cambios se hacen directamente en GitHub
- No interfieren con tu trabajo local

### Verificar Estado

```bash
# Ver estado actual
./scripts/sync-with-claude.sh check

# O ver directamente:
git status
git log --oneline --all --graph -10
```

### Rutina Vespertina

```bash
# 1. Sincronizar cambios de Claude
./scripts/sync-intelligent.sh sync

# 2. Resolver conflictos si los hay (ver sección de conflictos)

# 3. Push de tus cambios
./scripts/sync-intelligent.sh push

# O usar el script original:
./scripts/sync-with-claude.sh evening
```

## 🛠️ Scripts Disponibles

### sync-intelligent.sh (Recomendado)

**Sincronización inteligente completa:**

```bash
# Sincronizar todo
./scripts/sync-intelligent.sh sync

# Push después de sincronizar
./scripts/sync-intelligent.sh push
```

**Características:**
- ✅ Guarda automáticamente cambios locales
- ✅ Detecta ramas de Claude automáticamente
- ✅ Resuelve conflictos cuando es posible
- ✅ Preserva cambios locales en configuraciones
- ✅ Valida estado antes de push

### sync-with-claude.sh (Original)

**Script original con más opciones:**

```bash
# Rutina matutina
./scripts/sync-with-claude.sh morning

# Ver estado
./scripts/sync-with-claude.sh check

# Integrar rama específica
./scripts/sync-with-claude.sh integrate claude/feature-notifications

# Rutina vespertina
./scripts/sync-with-claude.sh evening
```

## 🔀 Resolución de Conflictos

### Conflictos Automáticos

El script `sync-intelligent.sh` resuelve automáticamente:

- **Archivos de configuración** (`*.config.js`, `package.json`): Prefiere versión local
- **Rutas normalizadas** (`routes.config.js`): Prefiere versión local
- **Otros archivos**: Requiere resolución manual

### Resolución Manual

Si hay conflictos que requieren atención:

```bash
# 1. Ver archivos con conflictos
git status

# 2. Abrir archivos conflictivos
# Los conflictos están marcados con:
# <<<<<<< HEAD
# (tu código)
# =======
# (código de Claude)
# >>>>>>> claude/branch-name

# 3. Resolver manualmente eligiendo lo mejor de ambos

# 4. Marcar como resuelto
git add archivo-resuelto.jsx

# 5. Completar merge
git commit
```

### Estrategia de Resolución

**Para código fuente:**
- Revisar cambios de Claude (suelen ser mejoras)
- Integrar mejoras preservando tu lógica
- Mantener consistencia con el resto del código

**Para configuraciones:**
- Preferir versión local (tienes contexto completo)
- Incorporar cambios de Claude si son claramente mejores

**Para rutas:**
- Siempre usar rutas normalizadas (`/products/` no `/producto/`)
- Verificar `routes.config.js` está actualizado

## ✅ Mejores Prácticas

### 1. Sincronización Frecuente

```bash
# Al menos 2-3 veces al día
./scripts/sync-intelligent.sh sync
```

### 2. Commits Atómicos

```bash
# Hacer commits pequeños y frecuentes
git add archivo-especifico.jsx
git commit -m "feat: agregar funcionalidad X"
```

### 3. Mensajes de Commit Claros

```bash
# Usar convención:
# tipo: descripción breve
# 
# tipo puede ser: feat, fix, refactor, docs, style, test

git commit -m "feat: agregar sistema de notificaciones"
git commit -m "fix: corregir navegación en mobile"
git commit -m "refactor: normalizar rutas a inglés"
```

### 4. Verificar Antes de Push

```bash
# El hook pre-push valida automáticamente, pero puedes verificar manualmente:
git status
git log --oneline -5
./scripts/sync-intelligent.sh sync
```

### 5. Trabajar en Ramas Específicas

```bash
# Para features grandes, crear rama propia:
git checkout -b feature/mi-feature
# Trabajar...
git push origin feature/mi-feature
# Merge a dev cuando esté listo
```

## 🐛 Troubleshooting

### Error: "Hay cambios sin commitear"

```bash
# Opción 1: Hacer commit
git add .
git commit -m "tus cambios"

# Opción 2: Guardar en stash
git stash save "descripción"
# Trabajar...
git stash pop
```

### Error: "Estás X commits atrás"

```bash
# Sincronizar primero
./scripts/sync-intelligent.sh sync

# Luego hacer push
./scripts/sync-intelligent.sh push
```

### Conflictos Persistentes

```bash
# Ver archivos conflictivos
git status

# Abortar merge si es necesario
git merge --abort

# Sincronizar de nuevo
./scripts/sync-intelligent.sh sync

# Resolver conflictos manualmente
# (ver sección de resolución de conflictos)
```

### Rama de Claude No Detectada

```bash
# Fetch manual
git fetch --all

# Ver ramas disponibles
git branch -r | grep claude

# Integrar manualmente
git checkout dev
git merge origin/claude/nombre-rama
```

### Rutas No Normalizadas Detectadas

```bash
# El hook pre-push detecta esto automáticamente
# Buscar y reemplazar manualmente:
grep -r "/producto/" src/
# Reemplazar con /products/
```

## 📊 Flujo Visual

```
┌─────────────────┐
│  Desarrollo     │
│  Local (Cursor) │
└────────┬────────┘
         │
         │ Trabajo diario
         │
         ▼
┌─────────────────┐
│  Git Local      │
│  (commits)      │
└────────┬────────┘
         │
         │ sync-intelligent.sh sync
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│  GitHub Remote  │◄─────│  Claude Web     │
│  (origin/dev)   │      │  (claude/*)     │
└────────┬────────┘      └─────────────────┘
         │
         │ sync-intelligent.sh sync
         │
         ▼
┌─────────────────┐
│  Git Local      │
│  (actualizado)  │
└─────────────────┘
```

## 🎯 Checklist Diario

- [ ] **Mañana**: `./scripts/sync-intelligent.sh sync`
- [ ] **Durante el día**: Trabajar normalmente, commits frecuentes
- [ ] **Tarde**: `./scripts/sync-intelligent.sh sync`
- [ ] **Antes de terminar**: `./scripts/sync-intelligent.sh push`
- [ ] **Verificar**: `git status` muestra working tree limpio

## 📚 Recursos Adicionales

- [Scripts de Automatización](../scripts/README.md)
- [Configuración de Rutas](../src/config/routes.config.js)
- [Git Hooks](../.git/hooks/)

---

**Última actualización**: 2025-11-07
**Mantenido por**: Sistema de automatización COMERECO

