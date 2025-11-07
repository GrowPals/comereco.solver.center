# 🔄 Workflow: Cursor ↔ Claude Code on the Web

Guía práctica para trabajar de forma sincronizada entre tu editor local (Cursor) y Claude Code on the Web.

---

## 🎯 Filosofía de Trabajo

> **Claude Code on the Web** trabaja en la nube sobre ramas dedicadas.
> **Cursor (tú)** trabajas localmente en tus propias ramas.
> **GitHub** es el punto central de sincronización.

---

## 📋 Estructura de Ramas

```
main (producción) ← Solo PRs aprobados
  │
  ├── dev (desarrollo activo) ← TÚ trabajas aquí principalmente
  │
  ├── claude/feature-notifications ← Claude trabaja aquí
  ├── claude/fix-auth-bug ← Otra tarea de Claude
  ├── claude/integration-bind-erp ← Integraciones complejas
  │
  └── feature/dashboard-redesign ← Tus features grandes
```

### Convención de Nombres

| Quién | Prefijo | Ejemplo |
|-------|---------|---------|
| **Claude Code** | `claude/` | `claude/feature-requisition-filters` |
| **Tú (features)** | `feature/` | `feature/new-dashboard` |
| **Tú (fixes)** | `fix/` | `fix/auth-session-bug` |
| **Tú (refactor)** | `refactor/` | `refactor/services-structure` |

---

## 🚀 Flujos de Trabajo

### **Escenario 1: Claude hace una tarea mientras tú trabajas en otra cosa**

#### 1️⃣ Asignas tarea a Claude Code on the Web

En `claude.ai/code`:

```
"En el repo COMERECO-WEBAPP, crea los endpoints API
para notificaciones en /src/services/notificationService.js

Requisitos:
- Obtener notificaciones por usuario
- Marcar como leídas
- Eliminar notificaciones
- Incluir React Query hooks

No toques el frontend ni los componentes React."
```

#### 2️⃣ Claude trabaja automáticamente

Claude automáticamente:
- ✅ Clona el repo
- ✅ Crea rama: `claude/feature-notifications-api`
- ✅ Implementa los cambios
- ✅ Hace commits descriptivos
- ✅ Push a GitHub
- ✅ Crea Pull Request

#### 3️⃣ Mientras tanto, tú en Cursor

```bash
# Sigues trabajando en tu rama sin conflictos
git status
# On branch feature/dashboard-redesign

# Haces tus commits normalmente
git add .
git commit -m "feat(dashboard): agregar widget de estadísticas"
git push origin feature/dashboard-redesign
```

#### 4️⃣ Claude termina y te notifica

Recibes notificación en GitHub: **"Pull Request ready for review"**

#### 5️⃣ Revisas y integras en Cursor

```bash
# Cambias a dev para integrar
git checkout dev
git pull origin dev

# Revisas el PR de Claude en GitHub
# Si todo está bien, haces merge desde GitHub UI

# Actualizas tu rama local dev
git pull origin dev

# Ahora tienes el trabajo de Claude localmente
```

---

### **Escenario 2: Quieres continuar el trabajo de Claude localmente**

#### 1️⃣ Claude hizo 70% del trabajo

Claude creó `claude/integration-bind-erp` con:
- ✅ Endpoints API básicos
- ✅ Estructura de servicios
- ❌ Tests pendientes (lo harás tú)
- ❌ UI no implementada (lo harás tú)

#### 2️⃣ Usas "Teleport" o checkout manual

**Opción A: Teleport (desde claude.ai)**
```
[Botón en Claude Code Web UI]
"Open in Claude CLI" o "Teleport to local"
```

**Opción B: Checkout manual en Cursor**
```bash
# Traes la rama de Claude a tu local
git fetch origin
git checkout claude/integration-bind-erp

# Ahora puedes editar en Cursor
```

#### 3️⃣ Continúas el trabajo

En Cursor, abres los archivos y continúas:
- Agregas tests
- Implementas el frontend
- Ajustas detalles

```bash
# Haces commits en la misma rama
git add .
git commit -m "test(bind): agregar tests unitarios"
git push origin claude/integration-bind-erp
```

#### 4️⃣ Finalizas y creas PR

```bash
# Cuando termines, crea el PR (si Claude no lo hizo)
gh pr create --base dev --head claude/integration-bind-erp
```

---

### **Escenario 3: Trabajo en paralelo (división de responsabilidades)**

#### División Recomendada

| **TÚ en Cursor** | **Claude Code on the Web** |
|------------------|----------------------------|
| Frontend / UI | Backend / API |
| Componentes React | Servicios de datos |
| Diseño / Estilos | Lógica de negocio |
| Interacciones UX | Integraciones externas |
| | Migraciones BD |
| | Tests automatizados |

#### Ejemplo Práctico

**Feature:** Sistema de notificaciones completo

**División:**

```
TÚ:
- feature/notifications-ui
  ├── NotificationBell.jsx
  ├── NotificationPanel.jsx
  └── NotificationItem.jsx

CLAUDE:
- claude/notifications-backend
  ├── notificationService.js
  ├── useNotifications hook
  └── migration: notifications table
```

**Workflow:**

```bash
# TÚ creas tu rama
git checkout -b feature/notifications-ui

# CLAUDE trabaja en paralelo en su rama
# (lo asignas desde claude.ai/code)

# Ambos trabajan sin conflictos porque son archivos diferentes

# Cuando ambos terminan:
# 1. Haces merge de claude/notifications-backend → dev
# 2. Actualizas tu rama desde dev
git checkout feature/notifications-ui
git merge dev

# 3. Ahora tu UI puede usar el backend de Claude
# 4. Terminas y haces merge de feature/notifications-ui → dev
```

---

## 🛡️ Reglas de Oro (Evitar Conflictos)

### ✅ **DO: Hacer esto**

1. **Siempre pull antes de empezar el día**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Comunicación clara con Claude**
   ```
   ✅ BIEN:
   "Claude, crea SOLO el servicio API en /src/services/productService.js
   No toques componentes React ni estilos."

   ❌ MAL:
   "Claude, mejora el módulo de productos"
   (Muy vago, puede tocar código que estás editando)
   ```

3. **Una rama = Una persona/agente**
   - Tú no editas ramas `claude/*`
   - Claude no edita ramas `feature/*` o `fix/*`

4. **Revisar PRs de Claude antes de merge**
   - Lee los cambios en GitHub
   - Verifica que no rompe nada
   - Haz merge solo si estás seguro

### ❌ **DON'T: Evitar esto**

1. **No trabajes directamente en `main`**
   ```bash
   # ❌ Nunca
   git checkout main
   git commit -m "quick fix"
   ```

2. **No hagas force push a ramas compartidas**
   ```bash
   # ❌ Nunca en dev o main
   git push --force origin dev
   ```

3. **No edites archivos que Claude está tocando**
   - Si Claude está trabajando en `userService.js`, no lo edites tú
   - Espera a que termine o cancela su tarea

4. **No hagas merge sin probar**
   ```bash
   # ❌ NO hacer ciegamente
   git merge claude/feature-x

   # ✅ PRIMERO revisar en GitHub UI
   # LUEGO hacer merge desde GitHub
   # FINALMENTE pull local
   ```

---

## 🔧 Comandos Útiles

### Ver estado general

```bash
# Ver todas las ramas (locales y remotas)
git branch -a

# Ver ramas de Claude en GitHub
git branch -r | grep claude

# Ver qué cambió desde ayer
git log --since="yesterday" --oneline --all
```

### Trabajar con ramas de Claude

```bash
# Traer rama específica de Claude
git fetch origin claude/nombre-feature
git checkout claude/nombre-feature

# Ver diferencias entre dev y rama de Claude
git diff dev..claude/nombre-feature

# Ver archivos modificados
git diff --name-only dev..claude/nombre-feature
```

### Sincronización diaria

```bash
# RUTINA MAÑANA (cada día antes de trabajar)
git checkout dev
git pull origin dev

# Ver qué hay nuevo
git log --oneline -10

# Actualizar tu rama de trabajo
git checkout feature/mi-trabajo
git merge dev
```

### Integrar trabajo de Claude

```bash
# Opción A: Merge desde GitHub (RECOMENDADO)
# 1. Ir a GitHub → Pull Requests
# 2. Revisar PR de Claude
# 3. Merge desde UI

# Opción B: Merge local (solo si conoces Git bien)
git checkout dev
git merge claude/nombre-feature
git push origin dev
```

---

## 🎨 Workflow Visual

```
┌──────────────────────────────────────────────────────┐
│              GITHUB (Fuente de Verdad)               │
│                                                      │
│  main ──────┬──── dev (integración)                 │
│             │                                        │
│             ├──── claude/task-1 ←─── Claude Code    │
│             ├──── claude/task-2 ←─── Claude Code    │
│             └──── feature/ui ←────── Tú (Cursor)    │
└──────────────────────────────────────────────────────┘
              ↓                          ↓
       ┌─────────────┐           ┌─────────────┐
       │ Claude Code │           │   Cursor    │
       │  (en nube)  │           │   (local)   │
       └─────────────┘           └─────────────┘
              ↓                          ↓
         Crea PRs               Haces commits
       automáticos              y push manual
```

---

## 📅 Flujo Diario Sugerido

### 🌅 **MAÑANA (9:00 AM)**

```bash
# 1. Actualizar todo
cd ~/COMERECO-WEBAPP
git checkout dev
git pull origin dev

# 2. Ver qué hizo Claude ayer (si aplica)
git log --oneline --author="Claude" --since="yesterday"

# 3. Revisar PRs pendientes en GitHub
gh pr list

# 4. Crear tu rama del día
git checkout -b feature/hoy-$(date +%Y%m%d)
```

### 🎯 **DURANTE EL DÍA**

- **TÚ:** Trabajas en frontend/diseño en Cursor
- **CLAUDE:** Asignas tareas de backend/integraciones desde `claude.ai/code`

```bash
# Commits frecuentes
git add .
git commit -m "feat(dashboard): agregar gráfico de ventas"
git push origin feature/hoy-20251107
```

### 🌆 **TARDE (5:00 PM)**

```bash
# 1. Revisar PRs de Claude en GitHub
gh pr list --author="claude"

# 2. Hacer merge de lo que apruebas
# (desde GitHub UI)

# 3. Actualizar tu rama local
git checkout dev
git pull origin dev

# 4. Integrar cambios en tu rama de trabajo
git checkout feature/hoy-20251107
git merge dev

# 5. Push final del día
git push origin feature/hoy-20251107

# 6. Crear PR si terminaste
gh pr create --base dev --title "feat: Dashboard con gráficos"
```

---

## 🚨 Solución de Problemas

### "Claude tocó archivos que yo estaba editando"

```bash
# Ver qué cambió
git diff HEAD origin/claude/feature-x

# Opción 1: Aceptar cambios de Claude
git checkout origin/claude/feature-x -- archivo.js

# Opción 2: Resolver conflictos manualmente
git merge claude/feature-x
# Edita archivos conflictivos
git add .
git commit -m "merge: resolver conflictos con claude/feature-x"
```

### "No sé si debo hacer merge de la rama de Claude"

```bash
# Ver qué archivos tocó
git diff --name-only dev..claude/feature-x

# Ver cambios específicos
git diff dev..claude/feature-x

# Probar en rama temporal
git checkout -b test-claude-merge
git merge claude/feature-x
npm run dev
# Si funciona, hacer merge real en dev
```

### "Perdí sincronización con GitHub"

```bash
# Resetear a estado de GitHub (¡CUIDADO!)
git fetch origin
git reset --hard origin/dev

# O solo traer cambios
git pull --rebase origin dev
```

---

## 🎯 Casos de Uso Específicos para ComerECO

### **Caso 1: Agregar módulo de notificaciones**

```
División:

CLAUDE (claude/notifications-backend):
1. Crear tabla en Supabase
2. Crear notificationService.js
3. Crear hooks de React Query
4. Edge Function para envío email

TÚ (feature/notifications-ui):
1. Componente NotificationBell
2. Panel de notificaciones
3. Estilos y animaciones
4. Integración con backend de Claude
```

### **Caso 2: Integración con Bind ERP**

```
División:

CLAUDE (claude/integration-bind-erp):
1. Crear servicio de integración
2. Configurar webhooks en n8n
3. Crear endpoints API
4. Migración de tablas necesarias
5. Tests de integración

TÚ (feature/bind-ui):
1. Dashboard de sincronización
2. Logs visuales
3. Configuración de credenciales
4. Indicadores de estado
```

### **Caso 3: Refactorización de servicios**

```
CLAUDE (claude/refactor-services):
1. Reestructurar todos los servicios
2. Agregar error handling
3. Agregar logging
4. Actualizar documentación

TÚ:
1. Revisar PR de Claude cuidadosamente
2. Probar todas las funcionalidades
3. Actualizar componentes si es necesario
```

---

## 📚 Recursos Adicionales

- **Documentación Git:** [git-scm.com](https://git-scm.com/doc)
- **GitHub CLI:** [cli.github.com](https://cli.github.com/)
- **Claude Code Docs:** [docs.claude.ai/code](https://docs.anthropic.com/en/docs/claude-code)

---

## ✅ Checklist de Setup Inicial

Antes de empezar a usar este workflow, asegúrate de:

- [ ] Tener Git configurado correctamente
- [ ] Tener acceso al repositorio en GitHub
- [ ] Tener `gh` CLI instalado (opcional pero recomendado)
- [ ] Haber leído `.claude.md` en la raíz del proyecto
- [ ] Entender la estructura de ramas
- [ ] Tener Cursor configurado con GitLens (opcional)

---

## 🎓 Resumen Ejecutivo

1. **Claude trabaja en ramas `claude/*`**
2. **Tú trabajas en ramas `feature/*` o `fix/*`**
3. **GitHub es el punto de sincronización**
4. **Siempre pull antes de empezar**
5. **Divide responsabilidades claramente**
6. **Revisa PRs antes de merge**
7. **Comunica claramente con Claude qué debe hacer**

---

¡Listo! Ahora estás preparado para trabajar de forma sincronizada con Claude Code on the Web. 🚀

---

_Última actualización: 2025-11-07_
_Mantenido por: Solver Center Team_
