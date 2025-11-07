# 🌐 ComerECO está preparado para Claude Code on the Web

Este proyecto ha sido configurado para trabajar de forma óptima con **Claude Code on the Web**.

---

## 🎯 ¿Qué se configuró?

### ✅ Archivos Creados

1. **[`.claude.md`](.claude.md)** - Guías y convenciones para Claude
   - Estructura del proyecto
   - Zonas de trabajo permitidas
   - Convenciones de código
   - Reglas de desarrollo
   - Tips para tareas comunes

2. **[`docs/WORKFLOW_CLAUDE_CODE_WEB.md`](docs/WORKFLOW_CLAUDE_CODE_WEB.md)** - Workflow completo
   - Flujos de trabajo detallados
   - Escenarios de uso
   - Comandos útiles
   - Solución de problemas

3. **[`docs/CLAUDE_CODE_SETUP.md`](docs/CLAUDE_CODE_SETUP.md)** - Guía de setup
   - Checklist inicial
   - Primera tarea de prueba
   - Tips de comunicación con Claude
   - Mejores prácticas

4. **[`scripts/sync-with-claude.sh`](scripts/sync-with-claude.sh)** - Script de sincronización
   - Rutinas matutina y vespertina
   - Integración de ramas de Claude
   - Verificación de estado

### ✅ Estructura de Ramas

```
main                      ← Producción
  │
  └─ dev (NUEVA)         ← Desarrollo activo
       │
       └─ claude/*       ← Ramas de Claude Code
```

---

## 🚀 Inicio Rápido

### 1. Push de la Rama `dev` a GitHub

```bash
# La rama dev fue creada localmente, ahora súbela:
git push -u origin dev
```

### 2. Conecta Claude Code on the Web

1. Ve a [claude.ai/code](https://claude.ai/code)
2. Conecta tu cuenta de GitHub
3. Autoriza acceso al repositorio `COMERECO-WEBAPP`

### 3. Prueba con una Tarea Sencilla

En `claude.ai/code`, escribe:

```
En el repositorio COMERECO-WEBAPP, crea un servicio de utilidad
en /src/services/testService.js con una función que retorne
la fecha actual formateada.

Sigue las convenciones en .claude.md
Crea rama claude/test-service
```

### 4. Revisa el PR en GitHub

Claude creará:
- ✅ Rama `claude/test-service`
- ✅ Código implementado
- ✅ Pull Request

### 5. Integra Localmente

```bash
# Opción A: Script automático
./scripts/sync-with-claude.sh integrate claude/test-service

# Opción B: Manual desde GitHub
# Merge el PR → luego localmente:
git checkout dev && git pull origin dev
```

---

## 📋 Rutina Diaria Recomendada

### 🌅 Mañana

```bash
./scripts/sync-with-claude.sh morning
```

Esto:
- Actualiza todas las ramas
- Muestra ramas de Claude disponibles
- Lista PRs pendientes

### 💼 Durante el Día

**TÚ en Cursor:**
- Frontend / UI
- Diseño / Estilos
- Decisiones de negocio

**CLAUDE en la Web:**
- Backend / API
- Integraciones
- Migraciones DB
- Tests

### 🌆 Tarde

```bash
./scripts/sync-with-claude.sh evening
```

Esto:
- Commit de cambios pendientes
- Push de tu rama
- Lista PRs de Claude para revisar

---

## 🎨 División de Trabajo Sugerida

### Para Claude (claude.ai/code)

✅ **Backend:**
```
- Crear servicios en /src/services/
- Endpoints de API
- Lógica de negocio
- Validaciones
```

✅ **Base de Datos:**
```
- Migraciones de Supabase
- RLS policies
- Edge Functions
- Seeds de datos
```

✅ **Integraciones:**
```
- Integración Bind ERP
- Webhooks n8n
- APIs externas
```

✅ **Utilidades:**
```
- Helper functions
- Formatters
- Validators
- Scripts
```

### Para Ti (Cursor)

🎨 **Frontend:**
```
- Componentes React
- Diseño UI/UX
- Estilos visuales
- Animaciones
- Responsive design
```

🧠 **Decisiones:**
```
- Arquitectura
- Flujos de usuario
- Reglas de negocio
- Aprobación de PRs
```

---

## 📚 Documentación

### Lee ANTES de empezar:

1. **[`.claude.md`](.claude.md)** ← IMPORTANTE
   - Claude leerá este archivo
   - Define cómo debe trabajar

2. **[`WORKFLOW_CLAUDE_CODE_WEB.md`](docs/WORKFLOW_CLAUDE_CODE_WEB.md)**
   - Flujos de trabajo completos
   - Escenarios comunes

3. **[`CLAUDE_CODE_SETUP.md`](docs/CLAUDE_CODE_SETUP.md)**
   - Setup inicial
   - Tips prácticos

### Docs del Proyecto

- [`README.md`](README.md) - Documentación principal
- [`docs/README.md`](docs/README.md) - Índice de docs

---

## 🔧 Scripts Disponibles

### Sincronización con Claude

```bash
# Rutina matutina (actualizar todo)
./scripts/sync-with-claude.sh morning

# Ver estado actual
./scripts/sync-with-claude.sh check

# Integrar rama de Claude
./scripts/sync-with-claude.sh integrate

# Rutina vespertina (push y limpieza)
./scripts/sync-with-claude.sh evening

# Ver ayuda
./scripts/sync-with-claude.sh help
```

### Desarrollo Normal

```bash
# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## ✅ Checklist de Verificación

Antes de usar Claude Code on the Web:

- [ ] Rama `dev` creada y en GitHub: `git push -u origin dev`
- [ ] Leído `.claude.md`
- [ ] Leído `docs/WORKFLOW_CLAUDE_CODE_WEB.md`
- [ ] Cuenta en claude.ai conectada a GitHub
- [ ] Repositorio autorizado en Claude
- [ ] Script de sincronización probado: `./scripts/sync-with-claude.sh check`

---

## 💡 Tips para Éxito

### 1. Tareas Bien Definidas

```
✅ BIEN:
"Crea servicio de productos en /src/services/productService.js
con funciones: getAll(), getById(id), create(data)
Usa cliente de Supabase. No toques componentes UI."

❌ MAL:
"Mejora los productos"
```

### 2. Límites Claros

```
✅ "Trabaja SOLO en /src/services/ y /supabase/migrations/"
✅ "NO toques /src/components/"
✅ "NO modifiques estilos"
```

### 3. Revisar Siempre

Antes de hacer merge de PRs de Claude:
- ✅ Lee el código
- ✅ Prueba localmente si es crítico
- ✅ Verifica que sigue convenciones
- ✅ Confirma que no hay credenciales hardcodeadas

---

## 🎯 Ejemplo de Tarea Real

### Asignar a Claude: Sistema de Notificaciones

```
En el repositorio COMERECO-WEBAPP:

1. Crea migración en /supabase/migrations/ para tabla notifications
2. Crea servicio en /src/services/notificationService.js con:
   - getNotifications(userId)
   - markAsRead(notificationId)
   - deleteNotification(notificationId)
3. Crea hooks de React Query en el mismo archivo
4. Incluye RLS policies en la migración

NO toques componentes UI, solo backend.
Lee .claude.md para convenciones.
Crea rama claude/notifications-backend
```

### Mientras Claude Trabaja

Tú en Cursor creas en paralelo:
- `feature/notifications-ui`
- Componente `NotificationBell.jsx`
- Componente `NotificationPanel.jsx`
- Estilos y animaciones

### Después

1. Claude termina → PR listo
2. Revisas y apruebas PR de Claude
3. Haces merge: `claude/notifications-backend` → `dev`
4. Actualizas tu rama: `git checkout feature/notifications-ui && git merge dev`
5. Conectas tu UI con el backend de Claude
6. Terminas y creas tu PR: `feature/notifications-ui` → `dev`

---

## 🚨 Solución Rápida de Problemas

### "No puedo hacer push a GitHub"

```bash
# Configura credenciales (solo primera vez)
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# O usa GitHub CLI
gh auth login
```

### "Claude no puede acceder al repo"

1. Ve a GitHub → Settings → Applications
2. Busca "Claude"
3. Autoriza acceso al repositorio

### "Conflictos al hacer merge"

```bash
# Ver archivos en conflicto
git status

# Resolver manualmente en Cursor
# Luego:
git add .
git commit -m "merge: resolver conflictos"
```

---

## 📞 Recursos de Ayuda

- **Claude Code Docs:** https://docs.anthropic.com/en/docs/claude-code
- **Claude Code Web:** https://claude.ai/code
- **GitHub CLI:** https://cli.github.com/
- **GitLens Extension:** https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens

---

## 🎉 ¡Listo para Comenzar!

Tu proyecto ComerECO está completamente configurado para trabajar con Claude Code on the Web.

### Próximos Pasos:

1. ✅ `git push -u origin dev`
2. ✅ Lee `.claude.md`
3. ✅ Conecta claude.ai/code
4. ✅ Prueba con tarea sencilla
5. ✅ Establece rutina diaria
6. 🚀 ¡A construir!

---

## 🤝 Filosofía

> **Claude Code on the Web** no reemplaza al desarrollador, lo potencia.
>
> Tú mantienes control total sobre:
> - Qué se construye
> - Cómo debe funcionar
> - Qué código se aprueba
>
> Claude ejecuta las tareas técnicas bien definidas,
> permitiéndote enfocarte en diseño, UX y decisiones de negocio.

---

**¿Preguntas o problemas?**

Consulta la documentación completa en [`docs/`](docs/) o el workflow en [`docs/WORKFLOW_CLAUDE_CODE_WEB.md`](docs/WORKFLOW_CLAUDE_CODE_WEB.md).

---

_Configuración completada: 2025-11-07_
_Solver Center Team - Powered by Human + AI Collaboration 🤝🤖_
