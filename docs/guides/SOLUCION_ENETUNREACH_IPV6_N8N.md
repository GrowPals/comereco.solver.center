# 🔧 Solución: Error ENETUNREACH IPv6 en n8n con Supabase

## 🐛 Problema

Al intentar conectar n8n con Supabase Postgres, recibes este error:

```
Couldn't connect with these settings
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:5432 - Local (:::0)
```

**Causa:** n8n está intentando conectarse usando IPv6 y no puede alcanzar el servidor de Supabase.

---

## ✅ Solución: Usar Connection Pooler de Supabase

El **Connection Pooler** de Supabase generalmente solo usa IPv4, lo que resuelve el problema de IPv6.

### Configuración Correcta

En n8n, configura la credencial de Postgres con estos valores:

| Campo | Valor |
|-------|-------|
| **Name** | `Supabase Database (Pooler)` |
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` |
| **Port** | `6543` ⚠️ **IMPORTANTE: Usar puerto 6543** |
| **Database** | `postgres` |
| **User** | `postgres.azjaehrdzdfgrumbqmuc` ⚠️ **Con prefijo del proyecto** |
| **Password** | Tu contraseña de Supabase |
| **SSL Mode** | `require` |
| **Maximum Number of Connections** | `1000` |

### Diferencias Clave

1. **Puerto:** `6543` en lugar de `5432`
2. **Usuario:** `postgres.azjaehrdzdfgrumbqmuc` en lugar de solo `postgres`
   - El formato es: `postgres.[PROJECT_ID]`
   - En tu caso: `postgres.azjaehrdzdfgrumbqmuc`

---

## 📝 Pasos Detallados

### Paso 1: Obtener el Project ID

Tu Project ID es: `azjaehrdzdfgrumbqmuc`

Puedes verificarlo en:
- Supabase Dashboard → Settings → General → Reference ID

### Paso 2: Configurar en n8n

1. **Ir a Credentials:**
   - Click en **Credentials** → **New** → **Postgres**

2. **Llenar los campos:**
   ```
   Name: Supabase Database (Pooler)
   Host: db.azjaehrdzdfgrumbqmuc.supabase.co
   Port: 6543
   Database: postgres
   User: postgres.azjaehrdzdfgrumbqmuc
   Password: [tu-contraseña-de-supabase]
   SSL Mode: require
   ```

3. **Test Connection:**
   - Click en **Test Connection**
   - Deberías ver: ✅ **Connection successful**

4. **Save:**
   - Click en **Save**

---

## 🔍 Verificar que Funciona

### Test 1: Desde n8n UI

1. Crear un nuevo workflow
2. Agregar nodo **Postgres**
3. Seleccionar credencial **Supabase Database (Pooler)**
4. Ejecutar query de prueba:
   ```sql
   SELECT NOW() as current_time, version() as postgres_version;
   ```
5. Debería retornar la hora actual y la versión de PostgreSQL

### Test 2: Desde Terminal (opcional)

```bash
# Probar conexión directa con pooler
psql "postgresql://postgres.azjaehrdzdfgrumbqmuc:TU_PASSWORD@db.azjaehrdzdfgrumbqmuc.supabase.co:6543/postgres?sslmode=require" -c "SELECT NOW();"
```

---

## 🔄 Alternativa: Direct Connection (si pooler no funciona)

Si el pooler no funciona por alguna razón, puedes intentar la conexión directa pero asegúrate de que tu servidor tenga IPv4 habilitado:

| Campo | Valor |
|-------|-------|
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` |
| **Port** | `5432` |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | Tu contraseña de Supabase |
| **SSL Mode** | `require` |

**Nota:** Esta opción puede seguir fallando si tu servidor/n8n no tiene IPv4 habilitado correctamente.

---

## 🌐 Entender los Puertos de Supabase

Supabase ofrece dos tipos de conexión:

### 1. Direct Connection (Puerto 5432)
- Conexión directa a PostgreSQL
- Puede resolver a IPv6
- Usuario: `postgres`
- Más rápido pero puede tener problemas con IPv6

### 2. Transaction Pooler (Puerto 6543) ⭐ RECOMENDADO
- Connection pooler de Supabase
- Generalmente solo IPv4
- Usuario: `postgres.[PROJECT_ID]`
- Más estable para aplicaciones como n8n

---

## 🆘 Si Aún No Funciona

### Verificar Configuración de Red

1. **Verificar que tu servidor tenga IPv4:**
   ```bash
   curl -4 ifconfig.me
   ```

2. **Verificar resolución DNS:**
   ```bash
   nslookup db.azjaehrdzdfgrumbqmuc.supabase.co
   ```

3. **Probar conexión directa:**
   ```bash
   telnet db.azjaehrdzdfgrumbqmuc.supabase.co 6543
   ```

### Verificar Firewall

Asegúrate de que el puerto 6543 (o 5432) no esté bloqueado por firewall.

### Contactar Soporte

Si nada funciona:
1. Verificar logs de n8n
2. Verificar configuración de red del servidor
3. Contactar soporte de Supabase con detalles del error

---

## 📚 Referencias

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [n8n Postgres Credential Docs](https://docs.n8n.io/integrations/builtin/credentials/postgres/)
- [Supabase Connection String Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-string)

---

**Última actualización:** 2025-01-27

