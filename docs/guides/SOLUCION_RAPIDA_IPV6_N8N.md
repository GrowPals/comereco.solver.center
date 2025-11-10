# ⚡ Solución Rápida: Error IPv6 en n8n con Supabase

## 🐛 Problema

```
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:6543
```

El DNS solo resuelve a IPv6 y n8n no puede conectarse.

---

## ✅ Solución Aplicada

He actualizado el `docker-compose.yml` para forzar IPv4. **Solo necesitas reiniciar n8n:**

### Paso 1: Reiniciar n8n

```bash
cd integrations/n8n
docker-compose down
docker-compose up -d
```

### Paso 2: Probar la Conexión

1. Ve a n8n UI: https://n8n-n8n.jpayvn.easypanel.host
2. **Credentials** → Edita tu credencial de Postgres
3. **Test Connection**

Debería funcionar ahora.

---

## 🔧 Cambios Aplicados

Se agregaron estas configuraciones al `docker-compose.yml`:

1. **Variable de entorno para Node.js:**
   ```yaml
   - NODE_OPTIONS=--dns-result-order=ipv4first
   ```
   Esto fuerza a Node.js (que usa n8n) a preferir IPv4 sobre IPv6.

2. **DNS IPv4:**
   ```yaml
   dns:
     - 8.8.8.8
     - 8.8.4.4
   ```
   Usa servidores DNS que priorizan IPv4.

3. **Deshabilitar IPv6 en la red:**
   ```yaml
   enable_ipv6: false
   ```
   Evita que Docker intente usar IPv6.

---

## 📝 Configuración de Credenciales (Recordatorio)

Asegúrate de que tu credencial de Postgres tenga:

| Campo | Valor |
|-------|-------|
| **Host** | `db.azjaehrdzdfgrumbqmuc.supabase.co` |
| **Port** | `6543` (Transaction Pooler) |
| **Database** | `postgres` |
| **User** | `postgres.azjaehrdzdfgrumbqmuc` |
| **Password** | Tu contraseña de Supabase |
| **SSL Mode** | `require` |

---

## 🆘 Si Aún No Funciona

### Verificar que los cambios se aplicaron:

```bash
cd integrations/n8n
docker-compose config | grep -A 2 "NODE_OPTIONS"
docker-compose config | grep -A 2 "dns:"
```

Deberías ver:
- `NODE_OPTIONS=--dns-result-order=ipv4first`
- `dns:` con `8.8.8.8` y `8.8.4.4`

### Verificar logs de n8n:

```bash
docker logs n8n | tail -50
```

### Probar conexión desde el contenedor:

```bash
docker exec -it n8n sh
# Dentro del contenedor:
nslookup db.azjaehrdzdfgrumbqmuc.supabase.co
```

---

## 📚 Documentación Completa

Para más detalles, ver:
- `docs/guides/SOLUCION_IPV6_FORZAR_IPV4_N8N.md` - Solución completa y alternativas
- `docs/guides/CONFIGURAR_CREDENCIALES_POSTGRES_N8N.md` - Guía de configuración

---

**Última actualización:** 2025-01-27

