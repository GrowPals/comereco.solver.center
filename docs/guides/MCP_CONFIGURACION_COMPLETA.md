# 🔧 Configuración Completa de MCP Servers

## 📋 Resumen de MCPs Configurados

Tu archivo `~/.cursor/mcp.json` tiene **8 MCP Servers** configurados:

---

## 1. 🔍 chrome-devtools
**Propósito:** Herramientas de desarrollo del navegador Chrome  
**Tipo:** stdio  
**Paquete:** `chrome-devtools-mcp@latest`

---

## 2. 🗄️ supabaseLocal
**Propósito:** Acceso a Supabase (comereco.solver.center)  
**Tipo:** stdio  
**Paquete:** `@supabase/mcp-server-supabase@latest`  
**Variables de entorno:**
- `SUPABASE_URL`: https://azjaehrdzdfgrumbqmuc.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: Configurado
- `SUPABASE_ACCESS_TOKEN`: Configurado

**Uso:**
```
@supabaseLocal list tables
@supabaseLocal execute sql "SELECT * FROM products LIMIT 10"
```

---

## 3. 🖥️ hostinger-ssh
**Propósito:** Acceso SSH al VPS de Hostinger  
**Tipo:** stdio  
**Script:** `/home/bigez/COMERECO-WEBAPP/tools/mcp/hostinger-ssh.sh`  
**Variables de entorno:**
- `SSH_HOST`: 217.21.78.11
- `SSH_USER`: root
- `SSH_KEY_PATH`: /home/bigez/.ssh/mcp-access

**Uso:**
```
@hostinger-ssh uptime
@hostinger-ssh docker ps
```

---

## 4. 🌐 hostinger-api
**Propósito:** API de Hostinger (dominios, hosting, VPS)  
**Tipo:** stdio  
**Paquete:** `hostinger-api-mcp@latest`  
**Variables de entorno:**
- `API_TOKEN`: Configurado
- `HOSTINGER_API_URL`: https://hpanel.hostinger.com/api
- `NETWORK_INTERFACE`: tailscale0
- `LOG_LEVEL`: debug

**Uso:**
```
@hostinger-api list domains
@hostinger-api list orders
```

---

## 5. 🔄 n8n ⭐
**Propósito:** Automatización y workflows  
**Tipo:** stdio  
**Paquete:** `@n8n/mcp-server`  
**Configuración:**
- URL: `https://n8n-n8n.jpayvn.easypanel.host`
- API Key: Configurado ✅

**Estado:** ✅ Conectado - 37 workflows disponibles

**Uso:**
```
@n8n list workflows
@n8n get workflow <id>
@n8n activate workflow <id>
@n8n execute workflow <id>
@n8n list executions
```

**Workflows Activos (12):**
1. obtener datos del ticket para levantamiento
2. Tickets Manny
3. movimientos ia
4. Cotizaciones Manny
5. COTIZACIONES PDF MANNY
6. Balance Movimientos
7. Balance Movimientos soluciones
8. imagen IA cotización
9. Supabase → Notion (Manny VIP)
10. Cotización Maker MANNY
11. (y 2 más)

---

## 6. 🎭 playwright
**Propósito:** Automatización de navegador  
**Tipo:** stdio  
**Paquete:** `@executeautomation/playwright-mcp-server`

---

## 7. 🎨 figma
**Propósito:** Diseño y prototipado  
**Tipo:** http  
**URL:** https://mcp.figma.com/mcp

---

## 8. 📦 GitKraken
**Propósito:** Control de versiones  
**Tipo:** stdio  
**Command:** GitKraken CLI desde GitLens

---

## ✅ Verificación de Estado

### n8n
- ✅ Conexión: OK
- ✅ API Key: Válido
- 📊 Workflows: 37 total (12 activos, 25 inactivos)

### Supabase
- ✅ URL configurada
- ✅ Credenciales configuradas

### Hostinger
- ✅ SSH: Configurado (217.21.78.11)
- ✅ API: Token configurado

---

## 🚀 Comandos Útiles

### n8n
```bash
# Listar workflows
@n8n list workflows

# Ver detalles de un workflow
@n8n get workflow <workflow-id>

# Activar/desactivar
@n8n activate workflow <id>
@n8n deactivate workflow <id>

# Ejecutar manualmente
@n8n execute workflow <id>

# Ver ejecuciones
@n8n list executions
```

### Supabase
```bash
# Listar tablas
@supabaseLocal list tables

# Ejecutar SQL
@supabaseLocal execute sql "SELECT COUNT(*) FROM products"

# Ver proyectos
@supabaseLocal list projects
```

### Hostinger
```bash
# SSH - Comandos del servidor
@hostinger-ssh uptime
@hostinger-ssh docker ps
@hostinger-ssh docker logs n8n

# API - Dominios
@hostinger-api list domains
@hostinger-api get domain details solver.center

# API - Hosting
@hostinger-api list orders
@hostinger-api list websites
```

---

## 📝 Notas Importantes

1. **Seguridad:**
   - ⚠️ El archivo `mcp.json` contiene credenciales sensibles
   - ✅ NO debe committearse al repositorio
   - ✅ Está en `~/.cursor/mcp.json` (fuera del workspace)

2. **Reinicio:**
   - Después de cambios en `mcp.json`, reinicia Cursor completamente
   - Los MCPs se cargan al inicio de Cursor

3. **Troubleshooting:**
   - Si un MCP no funciona, verifica los logs en Cursor
   - Revisa que los paquetes npm estén disponibles (`npx` debe funcionar)
   - Para SSH, verifica que la llave exista y tenga permisos correctos

---

**Última actualización:** 2025-01-26  
**Estado:** ✅ Todos los MCPs configurados y verificados

