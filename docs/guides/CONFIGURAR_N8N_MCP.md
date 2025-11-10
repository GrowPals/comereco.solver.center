# 🔧 Configurar MCP de n8n con EasyPanel

Guía para configurar y probar el MCP de n8n cuando está corriendo en un VPS de Hostinger usando EasyPanel.

---

## 📋 Prerequisitos

1. ✅ n8n corriendo en EasyPanel
2. ✅ Acceso a la interfaz web de n8n
3. ✅ API Key generada en n8n

---

## 🔑 Paso 1: Obtener API Key de n8n

1. **Abre n8n** en tu navegador (URL de EasyPanel)
2. **Inicia sesión** con tus credenciales
3. Ve a **Settings** (⚙️) → **API**
4. Click en **Create API Key**
5. **Copia el API Key** generado (guárdalo de forma segura)

**Nota:** El API Key se muestra solo una vez. Si lo pierdes, tendrás que generar uno nuevo.

---

## 🌐 Paso 2: Identificar la URL de n8n

En EasyPanel, n8n puede estar accesible de dos formas:

### Opción A: Dominio personalizado
Si configuraste un dominio para n8n:
```
https://n8n.tudominio.com
https://automations.tudominio.com
```

### Opción B: Subdominio de EasyPanel
Si usas el subdominio automático de EasyPanel:
```
https://n8n-tuproyecto.easypanel.host
```

**Para verificar:**
1. Abre EasyPanel
2. Ve a tu proyecto de n8n
3. Revisa la sección **Domains** o **URLs**
4. Copia la URL pública

---

## 🧪 Paso 3: Probar la Conexión

### Método 1: Script de prueba (Recomendado)

```bash
cd integrations/n8n/scripts
./test-n8n-api.sh
```

El script te pedirá:
- URL de n8n
- API Key

Y probará:
- ✅ Health check
- ✅ Autenticación API
- ✅ Listar workflows
- ✅ Ver ejecuciones recientes

### Método 2: Prueba manual con curl

```bash
# Health check
curl https://tu-n8n-url.com/healthz

# Listar workflows (requiere API key)
curl -H "X-N8N-API-KEY: tu-api-key" \
  https://tu-n8n-url.com/api/v1/workflows
```

---

## ⚙️ Paso 4: Configurar MCP en Cursor

Edita tu archivo de configuración MCP (usualmente `~/.cursor/mcp.json` o en la configuración de Cursor):

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server",
        "--url", "https://tu-n8n-url.com",
        "--api-key", "tu-api-key-aqui"
      ]
    }
  }
}
```

**Reemplaza:**
- `https://tu-n8n-url.com` → Tu URL real de n8n
- `tu-api-key-aqui` → Tu API key real

---

## 🔒 Paso 5: Variables de Entorno (Alternativa)

Si prefieres usar variables de entorno en lugar de hardcodear el API key:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server",
        "--url", "https://tu-n8n-url.com"
      ],
      "env": {
        "N8N_API_KEY": "tu-api-key-aqui"
      }
    }
  }
}
```

---

## ✅ Paso 6: Verificar que Funciona

Después de configurar, reinicia Cursor y prueba:

```
@n8n list workflows
```

Deberías ver una lista de tus workflows.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to n8n"
- ✅ Verifica que la URL sea correcta
- ✅ Verifica que n8n esté corriendo en EasyPanel
- ✅ Prueba abrir la URL en el navegador

### Error: "Unauthorized" o "403"
- ✅ Verifica que el API key sea correcto
- ✅ Regenera el API key en n8n si es necesario
- ✅ Verifica que el API key no haya expirado

### Error: "npx: command not found"
- ✅ Instala Node.js en tu sistema
- ✅ O usa la ruta completa a npx: `/usr/bin/npx` o `/usr/local/bin/npx`

### n8n no responde
- ✅ Verifica en EasyPanel que el contenedor esté corriendo
- ✅ Revisa los logs en EasyPanel
- ✅ Verifica que el puerto esté correctamente mapeado

---

## 📚 Comandos Útiles del MCP

Una vez configurado, puedes usar:

```
@n8n list workflows          # Listar todos los workflows
@n8n get workflow <id>       # Ver detalles de un workflow
@n8n activate workflow <id>  # Activar un workflow
@n8n deactivate workflow <id> # Desactivar un workflow
@n8n execute workflow <id>  # Ejecutar un workflow manualmente
@n8n list executions        # Ver ejecuciones recientes
```

---

## 🔐 Seguridad

- ⚠️ **Nunca** commitees el API key al repositorio
- ✅ Usa variables de entorno cuando sea posible
- ✅ Rota el API key periódicamente (cada 90 días)
- ✅ Usa un usuario técnico con permisos mínimos en n8n

---

## 📝 Notas sobre EasyPanel

- EasyPanel puede usar SSL automático (Let's Encrypt)
- La URL puede cambiar si cambias el dominio en EasyPanel
- Los logs de n8n están disponibles en EasyPanel → Logs
- Puedes reiniciar n8n desde EasyPanel si es necesario

---

**Última actualización:** 2025-01-26

