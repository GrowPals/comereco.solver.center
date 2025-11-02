# 🔑 n8n Credentials

Esta carpeta contiene plantillas para configurar las credenciales de n8n.

**IMPORTANTE:** Las credenciales reales se configuran directamente en n8n UI y NO se commitean al repositorio.

---

## 🔐 Credenciales Requeridas

### 1. Supabase Database (Postgres)

**Tipo:** Postgres

**Cómo configurar:**
1. En n8n UI: **Credentials** → **New** → **Postgres**
2. Llenar datos:

```yaml
Name: Supabase Database
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres
Password: <ver-en-.env>
Port: 5432
SSL Mode: allow
```

3. **Test Connection**
4. **Save**

**Usado en workflows:**
- ✅ bind-create-order.json
- ✅ bind-sync-products.json

---

### 2. BIND API Token (HTTP Header Auth)

**Tipo:** Header Auth

**Cómo configurar:**
1. En n8n UI: **Credentials** → **New** → **Header Auth**
2. Llenar datos:

```yaml
Name: BIND API Token
Header Name: Authorization
Header Value: Bearer <tu-token-de-bind>
```

**Nota:** El token debe incluir el prefijo "Bearer "

3. **Save**

**Usado en workflows:**
- ✅ bind-create-order.json
- ✅ bind-sync-products.json

---

## 🧪 Test de Credenciales

### Test Supabase Database

```sql
-- Ejecutar en nodo Postgres de n8n
SELECT NOW() as current_time;

-- Debería retornar timestamp actual
```

### Test BIND API

```bash
# Ejecutar en nodo HTTP Request de n8n
GET {{ $env.BIND_API_URL }}/api/health

# Debería retornar:
# { "status": "ok" }
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **Nunca commitear credenciales reales**
   - No exportar workflows con credenciales embebidas
   - Usar variables de entorno cuando sea posible

2. **Rotar tokens periódicamente**
   - Cambiar `BIND_API_TOKEN` cada 90 días
   - Actualizar en n8n inmediatamente

3. **Usar passwords fuertes**
   - Mínimo 16 caracteres
   - Incluir mayúsculas, minúsculas, números, símbolos

4. **Principio de mínimo privilegio**
   - Usuario de DB solo con permisos necesarios
   - No usar usuario `postgres` root si es posible

### ❌ Nunca Hacer

```bash
# ❌ NO hardcodear credenciales en código
const password = 'mi-password-123';

# ❌ NO commitear archivos con credenciales
git add credentials.json

# ❌ NO compartir tokens por email/Slack
# Usar herramienta segura como 1Password
```

---

## 🔄 Actualizar Credenciales

Si cambias una credencial (ej: nuevo token de BIND):

1. **En n8n UI:** Credentials → [nombre] → Edit
2. **Actualizar valor**
3. **Save**
4. **Re-activar workflows afectados**
5. **Test:** Ejecutar workflow manualmente

---

## 📚 Referencia

- [n8n Credentials Docs](https://docs.n8n.io/credentials/)
- [Postgres Credential](https://docs.n8n.io/integrations/builtin/credentials/postgres/)
- [Header Auth Credential](https://docs.n8n.io/integrations/builtin/credentials/httpheaderauth/)

---

**Última actualización:** 2025-11-02
