# 📚 Base de Datos – Estado Post Fase 1

> Actualizado: `Fase 1 – Foundation (Codex)`  
> Objetivo: dejar el modelo listo para datos reales y automatizaciones (N8N / BIND).

---

## 1. Inventario de Tablas Críticas

| Dominio | Tablas | Notas |
|---------|--------|-------|
| Catálogo | `products`, `inventory_restock_rules`, `inventory_restock_rule_logs` | `products` y `inventory_restock_rules` comparten `set_timestamps`; logs mantienen sólo `created_at` (histórico). |
| Operación | `projects`, `project_members`, `requisitions`, `requisition_items`, `requisition_templates` | Snapshot JSON en `requisitions.items` se refresca con trigger; plantilla tendrá normalización en Fase 2. |
| Integraciones | `bind_mappings`, `bind_sync_logs`, `folio_sequences`, `integration_queue` *(próx.)* | `bind_sync_logs` incluye `updated_at` para saber último estado y retries. |
| Auditoría / Alertas | `audit_log`, `notifications`, `user_cart_items`, `user_favorites` | Se mantienen ligeros; sólo `user_cart_items` requiere `updated_at`. |

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

---

## 5. Pendientes para Fase 2

1. Normalizar `requisition_template_items` + vista JSON para compatibilidad.
2. Materialized views (`mv_products_for_sync`, `mv_requisitions_for_bind`) con índices listos para N8N.
3. Tabla `integration_queue` + worker policy (rol `ops_automation`).
4. Reglas de soft delete / archivado para `projects`, `products`, `requisitions`.

---

### Uso recomendado para N8N / BIND (desde hoy)
- Leer catálogos directamente de `products` filtrando por `company_id` y `is_active`.
- Generar folios desde `get_next_folio` cuando se necesite crear entidades desde automatizaciones (evita race conditions).
- Consultar `bind_sync_logs` usando `updated_at` y `status` para detectar trabajos pendientes o errores.

> Mantén este documento actualizado cada vez que se toque la estructura base. Última revisión: Fase 1 completada ✅.
