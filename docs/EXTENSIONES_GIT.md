# Extensiones de Git/GitHub para Cursor/VS Code

## 🔧 Extensiones Recomendadas para Git/GitHub

### 1. **GitLens** (Más Popular)
**ID:** `eamodio.gitlens`

**Funciones:**
- ✅ Historial completo de Git
- ✅ Blame annotations en línea
- ✅ Comparación de archivos
- ✅ Push/Pull desde la interfaz
- ✅ Visualización de ramas

**Cómo hacer push:**
1. Abre el panel Source Control (Ctrl+Shift+G)
2. Verás tus cambios staged
3. Haz clic en el botón "..." (más opciones)
4. Selecciona "Push" o "Push to..."

### 2. **GitHub** (Oficial)
**ID:** `GitHub.vscode-pull-request-github`

**Funciones:**
- ✅ Autenticación con GitHub
- ✅ Crear Pull Requests
- ✅ Revisar PRs
- ✅ Push/Pull integrado

**Cómo autenticarse:**
1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Escribe: `GitHub: Sign in`
3. Sigue las instrucciones

### 3. **Git Graph** (Visualización)
**ID:** `mhutchie.git-graph`

**Funciones:**
- ✅ Visualización gráfica del historial
- ✅ Push/Pull desde el gráfico
- ✅ Gestión de ramas visual

### 4. **Git History** (Alternativa)
**ID:** `donjayamanne.githistory`

## 🚀 Cómo Hacer Push desde Cursor/VS Code

### Método 1: Usando Source Control Panel (Más Fácil)

1. **Abre Source Control:**
   - Presiona `Ctrl+Shift+G` (o Cmd+Shift+G en Mac)
   - O haz clic en el icono de Git en la barra lateral

2. **Verifica tus cambios:**
   - Verás "Changes" con tus archivos modificados
   - Ya están staged (agregados) porque hicimos `git add -A`

3. **Haz commit (si falta):**
   - Ya está hecho ✅ (commit `79aca30`)

4. **Haz Push:**
   - Haz clic en el botón "..." (tres puntos) en la parte superior
   - Selecciona "Push" o "Push to..."
   - Si pide autenticación, usa tu Personal Access Token

### Método 2: Usando Command Palette

1. Presiona `Ctrl+Shift+P` (o Cmd+Shift+P)
2. Escribe: `Git: Push`
3. Selecciona la opción
4. Confirma el push

### Método 3: Usando GitLens (si lo tienes)

1. Abre GitLens en la barra lateral
2. Ve a "Repositories"
3. Expande tu repositorio
4. Haz clic derecho en "origin/main"
5. Selecciona "Push"

## 🔐 Autenticación con GitHub

### Opción A: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Cuando Git pida credenciales:
   - Username: `GrowPals` (o tu usuario)
   - Password: pega el token generado

### Opción B: GitHub CLI

Si tienes `gh` instalado:
```bash
gh auth login
```

## 📋 Verificar Extensiones Instaladas

En Cursor/VS Code:
1. Presiona `Ctrl+Shift+X` (extensions)
2. Busca: "GitLens" o "GitHub"
3. Si están instaladas, aparecerán como "Installed"

## ✅ Verificación Rápida

**Para ver si tienes GitLens:**
- Abre la paleta de comandos (`Ctrl+Shift+P`)
- Escribe: `GitLens`
- Si aparece, está instalado

**Para ver si tienes la extensión de GitHub:**
- Abre la paleta de comandos (`Ctrl+Shift+P`)
- Escribe: `GitHub: Sign in`
- Si aparece, está instalado

## 🎯 Recomendación

**La forma más fácil es usar el Source Control Panel integrado:**
1. `Ctrl+Shift+G` → Abre Git
2. Verás un botón "Sync" o "..." con opciones
3. Haz clic en "Push"

Si necesitas autenticarte por primera vez, Cursor te pedirá credenciales y puedes usar un Personal Access Token.

