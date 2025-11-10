# 🚀 Setup: Claude Code on the Web para ComerECO

Guía rápida para comenzar a usar Claude Code on the Web con este proyecto.

---

## ✅ Checklist de Setup Inicial

### 1️⃣ **Preparación Local (Cursor)**

```bash
# Asegúrate de estar en la rama correcta
cd ~/COMERECO-WEBAPP  # o tu ruta
git checkout main
git pull origin main

# Crear rama dev si no existe (solo primera vez)
git checkout -b dev
git push -u origin dev

# Instalar dependencias
npm install

# Verificar que todo funciona
npm run dev
```

### 2️⃣ **Configuración en GitHub**

- ✅ Repositorio debe estar en GitHub
- ✅ Tener permisos de escritura
- ✅ Branch protection rules (opcional pero recomendado):
  - `main` → Requiere PR y revisión
  - `dev` → Permite push directo (opcional)

### 3️⃣ **Acceso a Claude Code on the Web**

1. Ve a [claude.ai/code](https://claude.ai/code)
2. Inicia sesión con tu cuenta (requiere plan Pro o Max)
3. Conecta tu cuenta de GitHub
4. Autoriza acceso al repositorio `COMERECO-WEBAPP`

### 4️⃣ **Leer Documentación**

Antes de empezar, lee:
- ✅ [`.claude.md`](../.claude.md) - Guías para Claude
- ✅ [`WORKFLOW_CLAUDE_CODE_WEB.md`](./WORKFLOW_CLAUDE_CODE_WEB.md) - Workflow completo

---

## 🎯 Primera Tarea con Claude

### Tarea de Prueba Sugerida

Asigna una tarea sencilla a Claude para probar el flujo:

```
Ve a claude.ai/code y escribe:

"En el repositorio COMERECO-WEBAPP, crea un servicio simple
en /src/services/testService.js que exporte dos funciones:

1. getTestData() - retorna un array de objetos de prueba
2. formatTestData(data) - formatea los datos

Incluye comentarios JSDoc y sigue las convenciones
del proyecto (ver .claude.md).

Crea la rama claude/test-service."
```

### Qué Esperar

1. Claude creará la rama `claude/test-service`
2. Implementará el código
3. Hará commit y push
4. Creará un Pull Request

### Verificación Local

```bash
# Ver la rama de Claude
git fetch origin
git checkout claude/test-service

# Revisar los archivos
ls -la src/services/

# Probar localmente
npm run dev
```

### Integrar Cambios

**Opción A: Desde GitHub (Recomendado)**
1. Ve a GitHub → Pull Requests
2. Revisa el PR de Claude
3. Si todo está bien, haz "Merge Pull Request"
4. Localmente: `git checkout dev && git pull origin dev`

**Opción B: Desde terminal**
```bash
./scripts/sync-with-claude.sh integrate claude/test-service
```

---

## 📋 Estructura de Ramas (Resumen)

```
main                         ← Producción (protegida)
  │
  └─ dev                     ← Desarrollo activo (tú trabajas aquí)
       │
       ├─ claude/*           ← Ramas de Claude Code
       ├─ feature/*          ← Tus features
       └─ fix/*              ← Tus bugfixes
```

---

## 🛠️ Comandos Esenciales

### Rutina Diaria

```bash
# MAÑANA
./scripts/sync-with-claude.sh morning

# TARDE
./scripts/sync-with-claude.sh evening
```

### Comandos Manuales

```bash
# Ver estado
./scripts/sync-with-claude.sh check

# Integrar rama de Claude
./scripts/sync-with-claude.sh integrate

# Ver ayuda
./scripts/sync-with-claude.sh help
```

### Git Básico

```bash
# Ver todas las ramas
git branch -a

# Ver ramas de Claude
git branch -r | grep claude

# Actualizar referencias
git fetch --all

# Cambiar a rama
git checkout nombre-rama

# Ver diferencias
git diff dev..claude/feature-x
```

---

## 🎨 Tipos de Tareas Ideales para Claude

### ✅ **PERFECTO para Claude:**

1. **Backend / API**
   - Crear servicios en `/src/services/`
   - Endpoints de API
   - Lógica de negocio

2. **Base de Datos**
   - Migraciones de Supabase
   - Políticas RLS
   - Edge Functions

3. **Integraciones**
   - Integración con Bind ERP
   - Webhooks en n8n
   - Servicios externos

4. **Utilidades**
   - Helper functions
   - Formatters, validators
   - Scripts de utilidad

5. **Tests**
   - Unit tests
   - Integration tests
   - Test data generation

### ⚠️ **CON SUPERVISIÓN:**

1. **Componentes React**
   - Lógica de componentes (Claude puede hacerlo)
   - UI básica (mejor revisarla)

2. **Refactorizaciones**
   - Reestructuración de código
   - Cambios arquitecturales

### ❌ **MEJOR TÚ en Cursor:**

1. **Diseño / UX**
   - Estilos visuales
   - Animaciones complejas
   - Responsive design refinado

2. **Decisiones de Negocio**
   - Cambios en flujos de usuario
   - Validaciones de negocio complejas

---

## 💡 Tips para Comunicarte con Claude

### ✅ **Tareas Bien Definidas**

```
BIEN:
"Crea un servicio de notificaciones en /src/services/notificationService.js
con las siguientes funciones:
- getNotifications(userId)
- markAsRead(notificationId)
- deleteNotification(notificationId)

Usa el cliente de Supabase configurado y maneja errores.
Incluye hooks de React Query.
No toques componentes UI."

MAL:
"Mejora las notificaciones"
```

### ✅ **Contexto Claro**

```
BIEN:
"En el archivo src/services/userService.js, agrega una función
updateUserProfile(userId, data) que actualice el perfil del usuario.
Usa la tabla 'profiles' de Supabase.
Maneja el caso de error y retorna el usuario actualizado."

MAL:
"Agrega update de usuario"
```

### ✅ **Límites Claros**

```
BIEN:
"Trabaja SOLO en /src/services/ y /supabase/functions/.
NO toques componentes React ni estilos."

MAL:
"Haz lo que creas conveniente"
```

---

## 🔒 Seguridad y Mejores Prácticas

### Variables de Entorno

```bash
# NUNCA incluyas en código:
❌ const API_KEY = "sk-abc123"

# SIEMPRE usa .env:
✅ const API_KEY = import.meta.env.VITE_API_KEY
```

### Credenciales en Ramas de Claude

- Claude NO tiene acceso a tu `.env` local
- Si necesita configuración, usa `.env.example` como plantilla
- Credenciales reales solo en Vercel/producción

### Revisión de PRs

Siempre revisa los PRs de Claude antes de merge:
- ✅ Verifica que no hay credenciales hardcodeadas
- ✅ Revisa la lógica de negocio
- ✅ Confirma que sigue las convenciones
- ✅ Prueba localmente si es código crítico

---

## 🚨 Solución de Problemas Comunes

### "Claude no puede acceder al repositorio"

**Solución:**
1. Ve a GitHub → Settings → Applications
2. Verifica que Claude tiene acceso
3. Re-autoriza si es necesario

### "La rama dev no existe en GitHub"

**Solución:**
```bash
git checkout -b dev
git push -u origin dev
```

### "Conflictos al hacer merge de rama de Claude"

**Solución:**
```bash
# Ver qué conflictos hay
git diff

# Resolver manualmente en Cursor
# Luego:
git add .
git commit -m "merge: resolver conflictos"
git push origin dev
```

### "Claude modificó archivos que yo estaba editando"

**Prevención:**
- Define claramente qué archivos debe tocar Claude
- Usa `.claude.md` para indicar zonas prohibidas

**Si ya pasó:**
```bash
# Ver diferencias
git diff HEAD origin/claude/feature-x

# Decidir qué cambios mantener
# Opción 1: Aceptar cambios de Claude
git checkout origin/claude/feature-x -- archivo.js

# Opción 2: Mantener tus cambios
# (no hagas nada, o cherry-pick cambios específicos)
```

---

## 📚 Recursos Adicionales

### Documentación del Proyecto
- [README.md](../README.md) - Documentación principal
- [docs/README.md](./README.md) - Índice de docs
- [.claude.md](../.claude.md) - Guías para Claude
- [WORKFLOW_CLAUDE_CODE_WEB.md](./WORKFLOW_CLAUDE_CODE_WEB.md) - Workflow completo

### Herramientas
- [GitHub CLI](https://cli.github.com/) - `gh` para PRs desde terminal
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Extensión para VS Code/Cursor

### Claude Code
- [Documentación Oficial](https://docs.anthropic.com/en/docs/claude-code)
- [claude.ai/code](https://claude.ai/code) - Interfaz web

---

## ✅ Checklist Pre-Producción

Antes de hacer merge a `main`:

- [ ] Todos los tests pasan
- [ ] Build funciona: `npm run build`
- [ ] Sin errores en consola
- [ ] Sin credenciales hardcodeadas
- [ ] Código revisado y aprobado
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas en Vercel

---

## 🎓 Próximos Pasos

1. ✅ Completa el setup inicial
2. ✅ Lee `.claude.md` y este documento
3. ✅ Prueba con tarea sencilla
4. ✅ Establece rutina diaria (morning/evening)
5. ✅ Asigna tareas reales a Claude
6. ✅ Revisa y aprende del código de Claude

---

## 🤝 Filosofía de Trabajo

> Claude Code on the Web no reemplaza al desarrollador,
> lo potencia. Tú sigues siendo el arquitecto, Claude
> es tu asistente que ejecuta tareas bien definidas.

**Tú decides:**
- Qué construir
- Cómo debe funcionar
- Qué es aceptable

**Claude ejecuta:**
- Implementaciones técnicas
- Código repetitivo
- Integraciones complejas

---

¡Listo! Ahora estás preparado para usar Claude Code on the Web con ComerECO. 🚀

---

_Última actualización: 2025-11-07_
_Creado por: Solver Center Team_
