# ✅ Configuración Completa del MCP de n8n

## 📋 Información de Conexión

- **URL Pública:** `https://n8n-n8n.jpayvn.easypanel.host/`
- **URL Interna (Docker):** `http://n8n_n8n:5678/`
- **API Key:** Configurado ✅

---

## 🔧 Configuración del MCP en Cursor

### Paso 1: Abrir Configuración MCP

En Cursor:
1. Ve a **Settings** → **MCP** (o edita `~/.cursor/mcp.json` directamente)
2. Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server",
        "--url", "https://n8n-n8n.jpayvn.easypanel.host",
        "--api-key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3OTFkNTE0NC1kYzZlLTRhNDUtOTFjYy1hMTI2Mzk3ODAxOGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyNzM1NTI2fQ.TbwXblqdhEonSiF8qQr_xd8M3a0ZlIHGCEX2kd61Ojo"
      ]
    }
  }
}
```

### Paso 2: Reiniciar Cursor

Después de agregar la configuración, reinicia Cursor completamente.

### Paso 3: Verificar que Funciona

En el chat de Cursor, prueba:

```
@n8n list workflows
```

Deberías ver una lista de tus 37 workflows.

---

## 🎯 Comandos Disponibles del MCP

Una vez configurado, puedes usar estos comandos:

### Listar y Ver Workflows
```
@n8n list workflows
@n8n get workflow <workflow-id>
```

### Activar/Desactivar Workflows
```
@n8n activate workflow <workflow-id>
@n8n deactivate workflow <workflow-id>
```

### Ejecutar Workflows
```
@n8n execute workflow <workflow-id>
```

### Ver Ejecuciones
```
@n8n list executions
@n8n get execution <execution-id>
```

---

## 📊 Estado Actual de n8n

- ✅ **Conexión:** Funcional
- ✅ **Autenticación:** OK
- 📈 **Total Workflows:** 37
- 🟢 **Workflows Activos:** Varios (incluyendo "Tickets Manny", "Cotizaciones Manny")
- ⚪ **Workflows Inactivos:** Varios (incluyendo "BIND - Create Order")

---

## 🔐 Notas de Seguridad

- ⚠️ El API key está en este archivo de configuración
- ✅ **NO** commitees este archivo al repositorio
- ✅ El API key tiene acceso completo a la API de n8n
- 🔄 Considera rotar el API key periódicamente

---

## 🐛 Troubleshooting

### Si el MCP no funciona:

1. **Verifica que npx esté instalado:**
   ```bash
   which npx
   ```

2. **Verifica la conexión manualmente:**
   ```bash
   curl -H "X-N8N-API-KEY: TU_API_KEY" \
     https://n8n-n8n.jpayvn.easypanel.host/api/v1/workflows
   ```

3. **Revisa los logs de Cursor** para ver errores del MCP

4. **Verifica que el paquete @n8n/mcp-server exista:**
   ```bash
   npx -y @n8n/mcp-server --help
   ```

---

## 📝 URLs Importantes

- **n8n UI:** https://n8n-n8n.jpayvn.easypanel.host/
- **API Base:** https://n8n-n8n.jpayvn.easypanel.host/api/v1/
- **Health Check:** https://n8n-n8n.jpayvn.easypanel.host/healthz
- **Settings API:** https://n8n-n8n.jpayvn.easypanel.host/settings/api

---

**Última actualización:** 2025-01-26
**Estado:** ✅ Configuración completa y probada

