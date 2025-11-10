# 🔧 Troubleshooting: n8n API Key

## Problema: "unauthorized" o "'X-N8N-API-KEY' header required"

Si recibes estos errores al intentar usar la API de n8n, sigue estos pasos:

---

## ✅ Verificación Paso a Paso

### 1. Verificar que el API Key esté activo

1. Abre n8n: `https://n8n-n8n.jpayvn.easypanel.host/settings/api`
2. Verifica que el API Key esté en la lista
3. Asegúrate de que el estado sea **"Active"** (no "Revoked" o "Expired")
4. Si está inactivo, haz click en **"Activate"** o genera uno nuevo

### 2. Verificar el formato del API Key

El API Key debe ser un JWT completo que empiece con `eyJ`:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**NO debe incluir:**
- ❌ Prefijos como `n8n_api_`
- ❌ Espacios o saltos de línea
- ❌ Comillas alrededor

### 3. Verificar el header HTTP

El header debe ser exactamente:
```
X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con curl:**
```bash
curl -H "X-N8N-API-KEY: TU_API_KEY_AQUI" \
  https://n8n-n8n.jpayvn.easypanel.host/api/v1/workflows
```

### 4. Verificar permisos del API Key

En n8n Settings → API:
- Verifica que el API Key tenga los **scopes** necesarios
- Si estás en plan Enterprise, asegúrate de que tenga acceso a `workflows:read`

---

## 🔄 Solución: Generar Nuevo API Key

Si el API Key no funciona, genera uno nuevo:

1. **Ve a:** `https://n8n-n8n.jpayvn.easypanel.host/settings/api`
2. **Click en:** "Create API Key"
3. **Configura:**
   - Label: `MCP Integration` (o el nombre que prefieras)
   - Expiration: `Never` (o la fecha que necesites)
   - Scopes: Selecciona los permisos necesarios
4. **Copia el nuevo API Key** inmediatamente (solo se muestra una vez)
5. **Guarda el API Key** de forma segura

---

## 🧪 Prueba Rápida

Una vez que tengas el nuevo API Key, prueba con:

```bash
curl -H "X-N8N-API-KEY: TU_NUEVO_API_KEY" \
  -H "Accept: application/json" \
  https://n8n-n8n.jpayvn.easypanel.host/api/v1/workflows
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      "active": true
    }
  ]
}
```

---

## 📝 Configuración del MCP

Una vez que el API Key funcione, configura el MCP en Cursor:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server",
        "--url", "https://n8n-n8n.jpayvn.easypanel.host",
        "--api-key", "TU_API_KEY_AQUI"
      ]
    }
  }
}
```

---

## 🔍 Verificación Adicional

### Verificar que n8n esté corriendo:
```bash
curl https://n8n-n8n.jpayvn.easypanel.host/healthz
```
Debería retornar: `OK` o código HTTP 200

### Verificar versión de n8n:
Algunas versiones antiguas de n8n pueden tener problemas con la API. Verifica en:
- Settings → About
- O en la respuesta del health check

---

## 💡 Notas Importantes

1. **El API Key solo se muestra una vez** al generarlo
2. **Si lo pierdes**, tendrás que generar uno nuevo
3. **Los API Keys pueden expirar** si configuraste una fecha de expiración
4. **Los API Keys pueden ser revocados** desde Settings → API

---

**Última actualización:** 2025-01-26

