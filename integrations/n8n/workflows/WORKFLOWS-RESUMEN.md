# 📦 Resumen de Workflows - COMERECO n8n

**Fecha:** 2025-11-10  
**Estado:** 8 workflows listos (WF-01 → WF-08)

---

## 📚 Tabla rápida

| ID | Nombre | Tipo | Trigger | Estado |
|----|--------|------|---------|--------|
| WF-01 | Restock Alerts Monitor | Supabase → Logs | `*/30 * * * *` | 🟢 Activo |
| WF-02 | Bind Catalog Reset (manual) | Bind → Supabase | Manual | 🟢 Listo |
| WF-03 | Bind Catalog Sync | Bind → Supabase | `0 2 * * *` | 🟢 Listo |
| WF-04 | Integration Queue to BIND | Supabase → Bind | `*/5 * * * *` | 🟢 Activo |
| WF-05 | Queue & Bind Monitor | Supabase → Logs | `*/15 * * * *` | 🟡 Desactivado |
| WF-06 | Bind Stock Sync | Bind → Supabase | `30 2 * * *` | 🟢 Listo |
| WF-07 | Bind Alerts Notifier | Logs → Slack | `*/15 * * * *` | 🟡 Falta Slack |
| WF-08 | Bind Maintenance | Supabase | `0 3 * * 0` | 🟢 Listo |

> **Credenciales comunes**  
> - `supabase manny puntos` (HTTP Header Auth) → envía `apikey`  
> - `Supabase REST Ops` (Custom Auth) → `Authorization: Bearer <service_role>`  
> - `BIND ERP` (HTTP Header Auth) → token premium de Bind  
> - `SLACK_WEBHOOK_URL` (env var) → sólo WF‑07

---

### WF-01 · Restock Alerts Monitor
- Consulta `restock_alerts_dashboard`, detecta alertas ≠ `ok` y registra cada evento con `p_sync_type = restock_alert`.
- Si no hay alertas deja heartbeat (`p_entity_type = restock_monitor`).
- **Credenciales:** `supabase manny puntos` + `Supabase REST Ops`.

### WF-02 · Bind Catalog Reset
- Flujo manual para “barrer” el catálogo completo y reimportar desde Bind.
- Pasos: desactivar productos → descargar Bind con **BIND ERP** → `batch_upsert_products_from_bind` → `log_bind_sync_event` (`catalog_full`).
- Úsalo antes de activar WF‑03 si necesitas comenzar desde cero.

### WF-03 · Bind Catalog Sync
- Cron 02:00. Descarga lotes (`$top=100`) de Bind, transforma y ejecuta `batch_upsert_products_from_bind`.
- Deja log por lote (`p_sync_type = catalog`). Preparado para paginar (`$skip`) si se necesitan más de 100 productos.

### WF-04 · Integration Queue to BIND
- Workflow principal de requisiciones: `dequeue → Build Bind Order Payload → Payload Ready?`
  - Rama TRUE: `POST Create Order` (credencial **BIND ERP**) → `GET Order Initial` (opcional) → Logs → `complete_integration_job(p_status='success')`.
  - Rama FALSE: `Prepare Failure (Validation)` → log → `complete_integration_job` con `next_status` (`pending|error`).
  - Errores de Bind reutilizan `Prepare Failure (BIND)`.
- Toda la actividad se conserva en `bind_sync_logs` mediante `log_bind_sync_event`.

### WF-05 · Queue & Bind Monitor
- Calcula métricas (`pending`, `processing`, `maxAttempts`, `oldestPending`) y registra un snapshot (`p_sync_type = monitoring`).
- Se deja desactivado por defecto; no necesita credenciales adicionales.

### WF-06 · Bind Stock Sync
- Descarga inventario (`/api/Inventory`) con **BIND ERP**, agrupa en lotes de 100 y llama a `sync_bind_inventory_batch`.
- Cada lote queda registrado (`p_sync_type = inventory`).

### WF-07 · Bind Alerts Notifier
- Busca `log_bind_sync_event` con `status in (pending,error)`, arma mensaje y (si existe `SLACK_WEBHOOK_URL`) manda Slack.
- `Send Slack Alert` tiene `continueOnFail` para no romper la ejecución si el webhook no está configurado; de cualquier manera se registra `alert_dispatch`.

### WF-08 · Bind Maintenance
- Domingos 03:00: `refresh_integration_views()` + `purge_bind_logs(p_before := now() - 30 días)`.
- Cada tarea exitosa se apila en `tasks` y se registra (`p_sync_type = maintenance`).

---

## 📂 Archivos de exportación
Todos los workflows se guardan en `integrations/n8n/workflows/exported/` con el nombre `WF-0X-<Slug>.json`.  
Cada export conserva el ID de n8n (`workflow.id`) para rastrear cambios.

## 🔐 Variables / credenciales
```
BIND_API_TOKEN=<token premium>
SLACK_WEBHOOK_URL=<url opcional>
```

## ▶️ Activación recomendada
1. WF‑04 (ya activo)  
2. WF‑01 (logs continuos)  
3. WF‑03 y WF‑06 (cuando definas `BIND_API_TOKEN`)  
4. WF‑05 / WF‑07 (observabilidad y Slack)  
5. WF‑08 (mantenimiento semanal)

Con esto el repositorio refleja el estado real del entorno n8n: 8 workflows funcionales, credenciales homogéneas y documentación alineada.
