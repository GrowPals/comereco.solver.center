# 📚 Base de Datos – Estado Post Fases 1-4

> Última actualización: `Fase 4 – Retención & Ops (Codex)`  
> Objetivo: dejar el modelo listo para datos reales y automatizaciones (N8N / BIND).

---

## 1. Inventario de Tablas Críticas

| Dominio | Tablas / Vistas | Notas |
|---------|-----------------|-------|
| Catálogo | `products`, `inventory_restock_rules`, `inventory_restock_rule_logs` | `products` y `inventory_restock_rules` con `set_timestamps`; logs sólo `created_at`. |
| Operación | `projects`, `project_members`, `requisitions`, `requisition_items`, `requisition_templates`, `requisition_template_items` | Plantillas normalizadas; trigger mantiene JSON `items` para compatibilidad. |
| Integraciones | `bind_mappings`, `bind_sync_logs`, `bind_sync_logs_archive`, `folio_sequences`, `integration_queue`, `mv_products_for_sync`, `mv_requisitions_for_bind`, `mv_restock_alerts`, `mv_integration_dashboard` | Vistas + cron de refresh cada 5 min; `mv_integration_dashboard` entrega KPIs por status. |
| Auditoría / Alertas | `audit_log`, `audit_log_archive`, `notifications`, `user_cart_items`, `user_favorites` | `archive_audit_log()` mueve eventos >90 días; soft delete en favoritos/carritos. |

> Diccionario completo: ver `docs/guides/REFERENCIA_BD_SUPABASE.md` (actualizado tras cada migración).

---

## 2. Política de Timestamps

- Función única `public.set_timestamps()` (SECURITY DEFINER) normaliza `created_at/updated_at` en UTC.
- Triggers aplicados a: `bind_mappings`, `bind_sync_logs`, `companies`, `inventory_restock_rules`, `products`, `projects`, `requisition_templates`, `requisitions`, `user_cart_items`.
- Convenio: cualquier tabla mutable **debe** tener ambos campos y contar con el trigger. Logs o snapshots que no se actualizan (p. ej. `audit_log`, `inventory_restock_rule_logs`) se mantienen sólo con `created_at`.
- Para nuevas tablas, agregar `created_at/updated_at timestamptz default timezone('utc', now())` + trigger en la misma migración.

---

## 3. Sistema de Folios

### Tabla `folio_sequences`
```
company_id  uuid  -- FK companies.id
entity_type text  -- 'requisition', 'purchase_order', etc.
year        int
prefix      text  -- 'REQ-', 'PO-', ...
last_value  int   -- contador incremental
created_at  timestamptz
updated_at  timestamptz
PK: (company_id, entity_type, year)
```

- Reemplaza al legado `folio_counters`.
- RLS: admins solo ven/actualizan su compañía; `platform_admin` opera multi-tenant.
- Helper `get_next_folio(company_id, entity_type, prefix)` devuelve `PREFIXYYYY-####` y maneja concurrencia con `INSERT ... ON CONFLICT`.
- `create_full_requisition` ya consume `get_next_folio('requisition','REQ-')`.
- Para nuevas entidades (p. ej. órdenes de compra), basta con reutilizar la función cambiando `entity_type` y `prefix`.

---

## 4. Integridad y Validaciones

- Columnas críticas (`price`, `quantity`) ya tenían `CHECK` en capa de función; próximos pasos: agregar `CHECK (price >= 0)`/`CHECK (stock >= 0)` directamente en tabla.
- `profiles` sigue sincronizado con `auth.users` mediante trigger `create_profile_after_signup`.
- `bind_sync_logs` ahora dispone de `updated_at` → se puede detectar ejecuciones estancadas desde N8N.
- `companies` incluye `updated_at` para auditorías y despliegues multi-tenant.
- `requisition_template_items` asegura integridad referencial y se sincroniza automáticamente desde el JSON almacenado en `requisition_templates.items`.
- `integration_queue` maneja prioridad, reintentos y bloqueo optimista (`locked_at/locked_by`) para workers.
- Soft delete activo en `products`, `projects`, `requisitions`, `requisition_items`, `user_cart_items` y `user_favorites`; las políticas `SELECT` filtran `deleted_at IS NULL` y los `DELETE` sólo marcan el registro.
- `pg_cron` refresca `mv_products_for_sync`, `mv_requisitions_for_bind` y `mv_restock_alerts` cada 5 minutos (`cron.job` = `refresh_integration_views_job`).
- RPCs `dequeue_integration_jobs` y `complete_integration_job` encapsulan la cola con `FOR UPDATE SKIP LOCKED`.
- Funciones `archive_audit_log`, `archive_bind_sync_logs` + tablas `*_archive` permiten retención >90 días sin crecer la tabla caliente.
- `notify_restock_alert` inserta jobs `target_system = 'alert'` para alertas proactivas.
- Script `scripts/db/run_rls_checks.sql` permite validar las políticas clave antes de desplegar (ver `docs/tests/RLS_SMOKE.md`).
- Script `scripts/db/report_indexes.sql` exporta métricas de `pg_stat_user_indexes` y `pg_stat_statements` para auditorías de rendimiento.

---

## 5. Pendientes para Fase 5

1. Automatizar alertas cuando `mv_integration_dashboard.needs_sync` se mantenga elevado (webhooks o Edge Functions).
2. Suite de pruebas SQL/RLS integrada al pipeline CI (basada en `scripts/db/run_rls_checks.sql` + pgTAP).
3. Reporte automático mensual (`scripts/db/report_indexes.sql`) publicado en `docs/reports/`.
4. Estrategia de particionado (long term) para `audit_log_archive` / `bind_sync_logs_archive`.

---

## 6. Rol `ops_automation`

- Helper `is_ops_automation()` revisa el claim `request.jwt.claim.role` y otorga permisos limitados a workers (n8n, scripts).
- Operaciones adicionales: leer/gestionar `integration_queue`, refrescar vistas, consumir endpoints multi-tenant diseñados.
- Guía para generar tokens seguros: `docs/guides/OPS_AUTOMATION_TOKENS.md`.

---

### Uso recomendado para N8N / BIND (desde hoy)
- Leer catálogos directamente de `products` filtrando por `company_id` y `is_active`.
- Generar folios desde `get_next_folio` cuando se necesite crear entidades desde automatizaciones (evita race conditions).
- Consultar `bind_sync_logs` usando `updated_at` y `status` para detectar trabajos pendientes o errores.

> Mantén este documento actualizado cada vez que se toque la estructura base. Última revisión: Fases 1-4 completadas ✅.
