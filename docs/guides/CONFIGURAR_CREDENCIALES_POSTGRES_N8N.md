# 🔑 Configurar Credenciales de Postgres en n8n

## 📋 Valores Correctos para Supabase

Basado en tu proyecto Supabase (`azjaehrdzdfgrumbqmuc`), estos son los valores que debes usar:

### ✅ Configuración Correcta (Solución que Funciona)

**Opción 1: Pooler Regional (RECOMENDADA - Funciona sin problemas IPv6)**

| Campo | Valor Correcto |
|-------|----------------|
| **Name** | `Supabase Database (Pooler)` |
| **Host** | `aws-1-us-east-2.pooler.supabase.com` ⭐ **Pooler regional** |
| **Database** | `postgres` |
| **User** | `postgres.azjaehrdzdfgrumbqmuc` ⚠️ **Con prefijo del proyecto** |
| **Password** | `<Tu contraseña de Supabase>` |
| **Port** | `5432` |
| **SSL Mode** | `disable` ✅ **Funciona con SSL deshabilitado** |
| **Maximum Number of Connections** | `1000` (o el valor que prefieras) |

**Ventajas:**
- ✅ Resuelve correctamente a IPv4
- ✅ No tiene problemas de conectividad IPv6
- ✅ Optimizado para conexiones desde aplicaciones
- ✅ Pooler gestionado por Supabase

**Opción 2: Conexión Directa (Alternativa)**

| Campo | Valor Correcto |
|-------|----------------|
| **Name** | `Supabase Database` |
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` ⚠️ **Con prefijo `db.`** |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | `<Tu contraseña de Supabase>` |
| **Port** | `5432` |
| **SSL Mode** | `allow` o `require` |
| **Maximum Number of Connections** | `1000` |
| **Ignore SSL Issues** | ❌ **NO activar** |

---

## 🔍 Cómo Obtener la Contraseña de Supabase

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc
2. Ve a **Settings** → **Database**
3. Busca la sección **Connection string** o **Database password**
4. Si no la recuerdas, puedes:
   - **Reset password** (si tienes permisos)
   - O buscar en tu archivo `.env` local

### Opción 2: Desde Variables de Entorno

Si tienes n8n corriendo con Docker, la contraseña debería estar en:

```bash
# Verificar en el archivo .env de n8n
cat integrations/n8n/.env | grep SUPABASE_DB_PASSWORD
```

---

## ⚠️ Errores Comunes

### Error 1: Host Incorrecto

#### ❌ INCORRECTO:
```
Host: https://azjaehrdzdfgrumbqmuc.supabase.co
```

#### ✅ CORRECTO:
```
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
```

**Diferencia:** 
- ❌ No usar `https://` (eso es para la API REST)
- ✅ Usar el prefijo `db.` antes del dominio
- ✅ No incluir protocolo (`https://`)

### Error 2: ENETUNREACH IPv6 (Error de Conexión)

Si ves este error:
```
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:5432
```

**Causa:** n8n está intentando conectarse usando IPv6 y no puede alcanzar el servidor.

**Solución:** Usar el **Connection Pooler** de Supabase que solo usa IPv4.

---

## 📝 Pasos Detallados en n8n UI

### ✅ Solución que Funciona (Recomendada)

**Configuración que funciona con el pooler regional de Supabase:**

1. **Ir a Credentials:**
   - Click en el menú lateral → **Credentials**
   - O si estás editando un workflow → Click en el nodo Postgres → **Credentials** → **New**

2. **Seleccionar Tipo:**
   - Click en **New** → Buscar y seleccionar **Postgres**

3. **Llenar los Campos:**
   ```
   Name: Supabase Database (Pooler)
   Host: aws-1-us-east-2.pooler.supabase.com
   Database: postgres
   User: postgres.azjaehrdzdfgrumbqmuc
   Password: [tu-contraseña-aquí]
   Port: 5432
   SSL Mode: disable
   ```

4. **Probar Conexión:**
   - Click en **Test Connection** (botón al final del formulario)
   - Deberías ver: ✅ **Connection successful**

5. **Guardar:**
   - Click en **Save**

**Nota:** Esta configuración usa el pooler regional de Supabase (`aws-1-us-east-2.pooler.supabase.com`) que resuelve correctamente a IPv4 y funciona sin problemas de conectividad.

### Alternativa: Conexión Directa

Si prefieres usar la conexión directa:

```
Name: Supabase Database
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres
Password: [tu-contraseña-aquí]
Port: 5432
SSL Mode: allow
```

---

## 🧪 Verificar que Funciona

### Test 1: Desde n8n UI

1. Crear un nuevo workflow
2. Agregar nodo **Postgres**
3. Seleccionar credencial **Supabase Database**
4. Ejecutar query de prueba:
   ```sql
   SELECT NOW() as current_time, version() as postgres_version;
   ```
5. Debería retornar la hora actual y la versión de PostgreSQL

### Test 2: Desde Terminal (opcional)

```bash
# Probar conexión directa desde tu máquina
psql "postgresql://postgres:TU_PASSWORD@db.azjaehrdzdfgrumbqmuc.supabase.co:5432/postgres?sslmode=require" -c "SELECT NOW();"
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **No compartir credenciales:**
   - Las credenciales se guardan encriptadas en n8n
   - No las compartas por email/Slack

2. **Usar SSL:**
   - Siempre usar `SSL Mode: allow` o `require`
   - Nunca activar "Ignore SSL Issues" en producción

3. **Rotar contraseñas:**
   - Cambiar la contraseña de Supabase periódicamente
   - Actualizar en n8n inmediatamente después

### ❌ Nunca Hacer

- ❌ No usar `https://` en el Host
- ❌ No usar la URL de la API REST (`azjaehrdzdfgrumbqmuc.supabase.co`)
- ❌ No activar "Ignore SSL Issues" en producción
- ❌ No hardcodear credenciales en workflows exportados

---

## 🆘 Troubleshooting

### Error: "ENETUNREACH" con dirección IPv6

**Síntoma:**
```
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:5432
```

**Causa:** n8n está intentando conectarse usando IPv6 y no puede alcanzar el servidor.

**Solución 1: Usar Connection Pooler (RECOMENDADO)**

El Connection Pooler de Supabase generalmente solo usa IPv4. Usa estos valores:

| Campo | Valor |
|-------|-------|
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` |
| **Port** | `6543` ⚠️ **Cambiar a 6543** (Transaction Pooler) |
| **Database** | `postgres` |
| **User** | `postgres.azjaehrdzdfgrumbqmuc` ⚠️ **Con prefijo del proyecto** |
| **Password** | Tu contraseña de Supabase |
| **SSL Mode** | `require` |

**Nota:** El usuario debe incluir el ID del proyecto: `postgres.azjaehrdzdfgrumbqmuc`

**Solución 2: Usar Direct Connection con IPv4 forzado**

Si el pooler no funciona, intenta usar la conexión directa pero asegúrate de que tu servidor/n8n tenga IPv4 habilitado:

| Campo | Valor |
|-------|-------|
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | Tu contraseña de Supabase |
| **SSL Mode** | `require` |

### Error: "Connection refused" o "Timeout"

**Causa:** Host incorrecto o puerto bloqueado

**Solución:**
- Verificar que el Host sea: `db.azjaehrdzdfgrumbqmuc.supabase.co`
- Verificar que el Port sea: `5432` (direct) o `6543` (pooler)
- Verificar que tu IP esté en la whitelist de Supabase (Settings → Database → Connection Pooling)

### Error: "Password authentication failed"

**Causa:** Contraseña incorrecta

**Solución:**
- Verificar la contraseña en Supabase Dashboard
- Resetear la contraseña si es necesario
- Asegurarse de copiar/pegar correctamente (sin espacios extra)

### Error: "SSL connection required"

**Causa:** SSL no está habilitado

**Solución:**
- Cambiar **SSL Mode** a `allow` o `require`
- No activar "Ignore SSL Issues"

---

## 📚 Referencias

- [n8n Postgres Credential Docs](https://docs.n8n.io/integrations/builtin/credentials/postgres/)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Documentación de Credenciales en este repo](../n8n/credentials/README.md)

---

**Última actualización:** 2025-01-27

