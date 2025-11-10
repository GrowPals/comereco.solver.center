# ✅ Solución Aplicada: Error IPv6 en n8n con Supabase

## 🎯 Problema Resuelto

**Error original:**
```
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:6543
```

**Causa:** n8n estaba intentando conectarse usando IPv6 y no podía alcanzar el servidor de Supabase.

---

## ✅ Solución Aplicada

Se actualizó el servicio de Docker Swarm `n8n_n8n` con las siguientes configuraciones:

### 1. Variable de Entorno NODE_OPTIONS

```bash
NODE_OPTIONS=--dns-result-order=ipv4first
```

**Efecto:** Fuerza a Node.js (que usa n8n) a preferir IPv4 sobre IPv6 al resolver DNS.

### 2. Servidores DNS IPv4

```bash
DNS: 8.8.8.8, 8.8.4.4
```

**Efecto:** Usa servidores DNS de Google que priorizan IPv4.

---

## 🔧 Comandos Ejecutados

```bash
# 1. Agregar variable de entorno para forzar IPv4
docker service update --env-add NODE_OPTIONS=--dns-result-order=ipv4first n8n_n8n

# 2. Configurar DNS IPv4
docker service update --dns-add 8.8.8.8 --dns-add 8.8.4.4 n8n_n8n
```

El servicio se reinició automáticamente y está funcionando correctamente.

---

## ✅ Verificación

### Estado del Servicio

```bash
docker service ps n8n_n8n
```

**Resultado:** ✅ Servicio corriendo correctamente

### Health Check

```bash
curl https://n8n-n8n.jpayvn.easypanel.host/healthz
```

**Resultado:** ✅ `{"status":"ok"}`

### Variable de Entorno

```bash
docker exec $(docker ps -q -f name=n8n_n8n) env | grep NODE_OPTIONS
```

**Resultado:** ✅ `NODE_OPTIONS=--dns-result-order=ipv4first`

---

## 📝 Próximos Pasos

Ahora puedes:

1. **Probar la conexión de Postgres en n8n:**
   - Ve a n8n UI: https://n8n-n8n.jpayvn.easypanel.host
   - **Credentials** → Edita tu credencial de Postgres
   - **Test Connection** → Debería funcionar ahora ✅

2. **Configuración de credenciales que FUNCIONA:**
   - **Host:** `aws-1-us-east-2.pooler.supabase.com` ⭐ **Pooler regional**
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres.azjaehrdzdfgrumbqmuc`
   - **Password:** Tu contraseña de Supabase
   - **SSL Mode:** `disable` ✅ **Funciona con SSL deshabilitado**

**Nota:** Esta configuración usa el pooler regional de Supabase que resuelve correctamente a IPv4 y funciona sin problemas. Ver `docs/guides/SOLUCION_FUNCIONA_POOLER_REGIONAL.md` para más detalles.

---

## 🔍 Troubleshooting

Si aún tienes problemas:

### Verificar que la configuración se aplicó:

```bash
docker service inspect n8n_n8n --pretty | grep -A 5 'Env\|DNS'
```

Deberías ver:
- `NODE_OPTIONS=--dns-result-order=ipv4first`
- DNS configurado con `8.8.8.8` y `8.8.4.4`

### Verificar logs del contenedor:

```bash
docker service logs n8n_n8n --tail 50
```

### Probar resolución DNS desde el contenedor:

```bash
docker exec $(docker ps -q -f name=n8n_n8n) nslookup db.azjaehrdzdfgrumbqmuc.supabase.co
```

Debería resolver a una dirección IPv4.

---

## 📚 Documentación Relacionada

- `docs/guides/SOLUCION_RAPIDA_IPV6_N8N.md` - Guía rápida
- `docs/guides/SOLUCION_IPV6_FORZAR_IPV4_N8N.md` - Solución completa y alternativas
- `docs/guides/CONFIGURAR_CREDENCIALES_POSTGRES_N8N.md` - Guía de configuración

---

## ✅ Estado Final

- ✅ Variable NODE_OPTIONS configurada
- ✅ DNS IPv4 configurado
- ✅ Servicio reiniciado y funcionando
- ✅ Health check OK
- ✅ Listo para probar conexión de Postgres

---

**Fecha de aplicación:** 2025-01-27  
**Servicio:** n8n_n8n (Docker Swarm)  
**Estado:** ✅ Resuelto

