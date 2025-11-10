# 📋 Plan de Ejecución - Supabase ⇄ n8n ⇄ BIND

> Objetivo: dejar en producción el flujo completo de requisiciones y catálogo entre Supabase y BIND ERP, orquestado con n8n, asegurando observabilidad y tolerancia a fallos.

## 1. Fases y entregables

| Fase | Objetivo | Entregables principales | Estado |
|------|----------|-------------------------|--------|
| 🅰️ Supabase Outbox | Garantizar que toda requisición aprobada llegue a la cola `integration_queue/pgmq` | Trigger `trigger_enqueue_for_bind`, funciones RPC para dequeue/complete, métricas básicas | ✅ Trigger creado (`20251112040000_phase6_bind_enqueue_trigger.sql`)
| 🅱️ n8n Requisition Sync | Consumir `integration_queue` y crear órdenes en BIND con manejo de errores y logging | WF-02 (cron 15 min) con steps: `dequeue → transform → POST BIND → update queue/logs` | 🔄 En progreso (wf importado pero falta conexión real)
| 🅲 Bind → Supabase (Catálogo/Stock) | Refrescar productos, precios y stock en Supabase | WF-03 (GET BIND products/stock) + RPC `upsert_product_from_bind` + auditoría `bind_sync_logs` | ⏳ Pendiente
| 🅳 Observabilidad & Retry | Dashboards + alertas para `integration_queue`, `bind_sync_logs` y colas pgmq | Queries listas + n8n notifier → Slack/email | ⏳ Pendiente

## 2. Supabase: acciones inmediatas

1. **Trigger de encolado** (completado)  
   - Archivo: `supabase/migrations/20251112040000_phase6_bind_enqueue_trigger.sql`  
   - Asegura que cada cambio a `integration_status = 'pending_sync'` ejecute `enqueue_requisition_for_bind()`.

2. **Verificaciones pendientes**  
   - [ ] Ejecutar `supabase db push` y validar `trigger_enqueue_for_bind` en `pg_trigger`.  
   - [ ] Crear tests SQL para `dequeue_integration_jobs` y `complete_integration_job` (simular locking).  
   - [ ] Script `scripts/check-integration-queue.sql` para monitorear colas (programado en fase D).
3. **RPC `log_bind_sync_event`** *(nuevo, 2025-11-10)*  
   - ✅ Migration `20251112043000_phase7_bind_logging.sql` agrega el helper `log_bind_sync_event(...)` para que n8n registre éxitos/errores de forma consistente.  
   - Uso esperado desde n8n: `call log_bind_sync_event(company_id, 'requisition', 'requisition', requisition_id, 'success', bind_id, payload, response, null)` o variante con `p_status='failed'` + mensaje de error.

## 3. n8n: plan de trabajo

1. **WF-02 Requisition Sync**  
   - Conectar credenciales `Supabase Production` (Postgres) y `BIND API` (HTTP).  
   - Ajustar nodos `Transform Payload` usando IDs reales (`bind_mappings`, `companies`).  
   - Reemplazar paso “PGMQ delete” por llamadas RPC `complete_integration_job`.  
   - Añadir branch de error con `complete_integration_job(..., p_status='pending', p_reschedule_at=now()+interval '15 minutes')` cuando BIND falle temporalmente.  
   - Loggear cada intento en `bind_sync_logs` via `INSERT` Postgres node.

2. **WF-03 Products Sync**  
   - Crear credencial `BIND Products API`.  
   - Leer `mv_products_for_sync` desde Supabase, pedir `GET /Products`.  
   - Llamar RPC `upsert_product_from_bind(product_payload jsonb)` (to-do en Supabase).  
   - Registrar resultados en `bind_sync_logs`.

3. **WF-01 Stock Monitoring**  
   - Consumir `inventory_restock_rules_view`, generar alertas (email/Slack) cuando `needs_attention = true`.

## 4. BIND ERP: preparativos

- 📄 Archivo `integrations/n8n/BIND_REAL_IDS.sql` con IDs confirmados (client, warehouse, location, price list, currency).  
- [ ] Crear Postman collection/monitor para `/Orders`, `/Products`, `/Inventory` (sección `integrations/n8n/api-docs`).  
- [ ] Definir tabla de equivalencias SKU ↔ `bind_product_id` (cargar en `bind_mappings`).

## 5. Observabilidad y alertas

- Query programada (pg_cron) `SELECT status, count(*) FROM integration_queue GROUP BY 1`.  
- n8n notifier si `pending > 10` o `bind_sync_logs.status='failed'` consecutivos ≥ 3.  
- Dashboard en Supabase Studio + panel en la webapp (widget `bind_sync_logs` ya disponible en `/dashboard`).

## 6. Próximos pasos inmediatos

1. **Aplicar migration del trigger** en Supabase (pendiente de `supabase db push`).
2. **Configurar credenciales n8n** (Supabase + BIND) y probar WF-02 en entorno de staging con mock BIND.
3. **Agregar RPC `log_bind_sync_event(requisition_id uuid, status text, payload jsonb, error text)`** para invocarlo desde n8n.
4. **Documentar runbook** en `docs/integrations/RUNBOOK_BIND_SYNC.md` con pasos para reintentos manuales.

> Cualquier cambio en IDs de BIND debe actualizarse en `bind_mappings` y en los defaults del nodo “Transform Payload” de WF-02.
