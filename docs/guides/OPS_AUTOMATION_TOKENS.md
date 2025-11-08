# 🔐 Rol `ops_automation` – Tokens para Workers (n8n / Integraciones)

El objetivo de este rol es dar a los procesos automáticos (n8n, scripts en servidores internos, etc.) un acceso **seguro y limitado** a la base de datos sin tener que usar la `service_role`. El rol respeta todas las políticas RLS excepto aquellas que explícitamente permiten `is_ops_automation()`.

---

## 1. ¿Qué puede hacer este rol?
- Leer/escribir en `integration_queue` sin importar la compañía (ideal para despachar trabajos multi-tenant).
- Consultar las materialized views (`mv_products_for_sync`, `mv_requisitions_for_bind`, `mv_restock_alerts`) vía REST/PostgREST.
- No puede saltarse RLS en otras tablas: por ejemplo, no puede leer `products` directamente de otra compañía a menos que exista una política explícita.

---

## 2. Generar un token JWT

1. **Obtén el JWT secret**  
   - Supabase Dashboard → Settings → API → `JWT Secret`.

2. **Genera el token** (reemplaza `YOUR_JWT_SECRET`):
   ```bash
   npx supabase gen jwt --secret YOUR_JWT_SECRET \
     --payload '{"role":"ops_automation","iss":"n8n","sub":"ops-worker"}'
   ```
   Guarda el token resultante (es similar a `eyJh...`).

3. **Configura el worker**  
   - En n8n (~/.env o credencial) define `SUPABASE_OPS_AUTOMATION_JWT=<token>`.
   - Las requests al PostgREST deben incluir el header:
     ```
     apikey: <token>
     Authorization: Bearer <token>
     ```

> Puedes revocar el acceso simplemente regenerando el JWT secret (Dashboard) o girando un token nuevo y actualizando las instancias autorizadas.

---

## 3. Operaciones comunes con este rol

### Obtener lotes de integración pendientes
```http
POST /rest/v1/rpc/dequeue_integration_jobs
Content-Type: application/json
apikey: {{OPS_TOKEN}}
Authorization: Bearer {{OPS_TOKEN}}

{
  "p_target": "bind",
  "p_limit": 20,
  "p_worker": "33333333-3333-3333-3333-333333333333"
}
```
Devuelve los jobs bloqueados (`status = processing`) y suma `attempts`. Usa `p_worker` para identificar al worker actual.

### Actualizar estado de un job
```http
POST /rest/v1/rpc/complete_integration_job
Content-Type: application/json
apikey: {{OPS_TOKEN}}

{
  "p_job_id": "99999999-9999-9999-9999-999999999999",
  "p_status": "success",
  "p_error": null
}
```
Usa `p_status="error"` y `p_error` para registrar el mensaje y liberar el job. Para reintentos programados, manda `p_status="pending"` junto con `p_reschedule_at`.

### Refrescar materialized views antes de sincronizar
```http
POST /rest/v1/rpc/refresh_integration_views
```

---

## 4. Buenas prácticas
- **Existe un solo token por entorno** (dev/staging/prod). Regenerar cuando alguien deje el equipo o al rotar contraseñas.
- **Nunca uses este token en frontend/web**: no respeta “company filtering” salvo lo definido en políticas y está pensado para servidores.
- **Loguea todas las acciones** en n8n (qué job tomó, error devuelto, etc.) para facilitar auditoría.
- **Monitorea `integration_queue`**: si muchos jobs quedan en `error` o `processing` por más de X minutos, dispara alertas.
- **Los snapshots se actualizan cada 5 minutos** mediante `pg_cron`. Aun así, refresca manualmente (`refresh_integration_views`) si necesitas datos en caliente durante un job largo.

---

Si necesitas ampliar permisos para un flujo específico, actualiza las políticas RLS correspondientes incluyendo `OR is_ops_automation()` siempre que sea seguro.
