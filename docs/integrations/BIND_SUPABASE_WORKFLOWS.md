# 🔄 Plan Maestro: Bind ↔ Supabase

Documento arquitectónico para la fase previa a producción. Define cómo usaremos las tablas existentes en Supabase, qué necesita traer/enviar n8n y cómo mantendremos la sincronización real del grupo “Grupo Solven”.

## 1. Mapa de datos clave

| Dominio | Tabla / Vista | Propósito | Observaciones |
|---------|---------------|-----------|---------------|
| Catálogo | `products` | Catálogo interno por company | Columnas relevantes: `bind_id`, `bind_sync_enabled`, `bind_last_synced_at`, `stock` |
| Catálogo | `products_pending_sync` (vista) | Lista de productos activos que requieren refresco desde Bind | Usa `bind_last_synced_at`; n8n puede leerla directamente |
| Mappings | `bind_mappings` | Relaciona `company_id` + `mapping_type` con IDs de Bind | Tipos soportados: `client`, `product`, `location`, `warehouse`, `branch` |
| Operación | `requisitions`, `requisition_items` | Origen de requisiciones aprobadas | `integration_status` controla si ya fue enviada |
| Operación | `requisitions_pending_sync` (vista) | Requisiciones aprobadas listas para Bind | Incluye `bind_location_id`, `bind_price_list_id`, `requester/approver` |
| Integración | `integration_queue` | Cola de salida (payload, intentos, locks) | `entity_type` = `requisition`, `target_system` = `bind` |
| Auditoría | `bind_sync_logs` + `_archive` | Historial de sincronizaciones (productos/requisiciones) | Guardan payloads y errores para debugear |
| Stock | `inventory_restock_rules`, `inventory_restock_rule_logs`, `restock_alerts_dashboard` | Motor interno de alertas y reposición | Útil para n8n cuando refresque inventarios |

> Todos los objetos anteriores ya existen; no se crearán nuevas tablas para esta primera fase.

## 2. Flujo Bind → Supabase

### 2.1 Entradas Bind

- **Productos** (`GET /Products?updated_since=X`)
- **Listas de precio** (`GET /PriceLists/{GrupoSolven}`)
- **Stock** (`GET /Warehouses/{grupo-solven}/Inventory`)
- Opcional: **ordenes** para conciliación (`GET /Orders?client=GrupoSolven`)

### 2.2 Staging y transformaciones

1. **n8n** descarga catálogos y crea un JSON uniforme: `{bind_id, sku, name, price, stock, extra}`.
2. **Upsert**:
   - Busca `bind_mappings` (`mapping_type='product'`) para saber qué `product_id` corresponde; si no existe, crea el producto en Supabase (vía RPC) y registra mapping.
   - Actualiza `products` (`price`, `stock`, `category`, `bind_last_synced_at=now()`).
3. **Auditoría**: cada ejecución inserta una fila en `bind_sync_logs` (`sync_type='products'`, `status='success'`/`failed`).
4. **Vistas**: `products_pending_sync` queda vacía cuando todo está actualizado; usarla como monitor (si aparece `sync_status = stale/never`, disparar el workflow).

### 2.3 Inventario y precio especial

- El warehouse “Grupo Solven” se trata como **stock reservado**. Bind nos entrega las cantidades y nosotros las repartimos entre empresas mediante reglas (`inventory_restock_rules`).
- Para precios especiales, cualquier cambio en la lista “SOLUCIONES” se sincroniza hacia `products` y también se replica en `requisition_template_items` (si aplica).

### 2.4 Optimización propuesta

- **Batching**: agrupar productos por 100 al hacer upsert via RPC para minimizar latencia.
- **Checksum**: agregar en `bind_data` un hash del payload; si no cambia, saltamos la actualización.
- **Alertas**: si `bind_sync_logs.status='failed'` > 3 veces consecutivas para un producto, crear `restock_alert` o notificación.

## 3. Flujo Supabase → Bind

### 3.1 Trigger interno

1. Requisición pasa a `business_status='approved'` → `integration_status='pending_sync'`.
2. Trigger (`requisition_enqueue_for_bind`, definido en migraciones) inserta en `integration_queue` con payload base:
   ```json
   {
     "requisition_id": "...",
     "company_id": "...",
     "bind_price_list_id": "...",
     "items": [ {"product_id": "...", "quantity": 5, "bind_product_id": "..."} ],
     "metadata": {"empresa": "Soluciones", "folio": "REQ-2025-001"}
   }
   ```
3. `integration_queue.status='pending'`, `priority=5`, `scheduled_at=now()`.

### 3.2 Workflow n8n

1. **Fetch**: selecciona filas `status='pending'` ordenadas por `scheduled_at`, bloquea la fila (`locked_at` + `locked_by`).
2. **Transform**: enriquece con datos de `bind_mappings` (`client`, `warehouse`, `product`).
3. **POST** a Bind `/Orders` con campos fijos:
   - `ClientID = bind_mappings` (todos “Grupo Solven”).
   - `WarehouseID` único para el grupo.
   - `ExternalReference` = `empresa=Soluciones;req=REQ-...`.
4. **Respuesta**:
   - Éxito → `integration_queue.status='sent'`, `requisitions.integration_status='synced'`, log en `bind_sync_logs` (`sync_type='requisition'`).
   - Error → incrementa `attempts`, guarda `last_error`, reprograma `scheduled_at = now() + interval '15 minutes'`. Después de 5 intentos, marca `status='failed'` y alerta.

### 3.3 Confirmaciones opcionales

- Si Bind devuelve folio/fecha, guardarlo en `requisitions.bind_last_sent_at` (columna ya existe) y `requisition_items.bind_order_line`. Usar `bind_sync_logs` para rastrear.

## 4. Estrategia de stock reservado

1. **Warehouse único**: Bind administra un solo almacén “Grupo Solven”. Nosotros no dividimos stock allí; solo anotamos consumos.
2. **Reservas internas**: en Supabase cada empresa tiene `inventory_restock_rules` con mínimos/máximos. Cuando el stock global baja, se generan alertas específicas.
3. **Conciliación semanal**:
   - n8n trae `GET /Inventory`.
   - Compara contra sumatoria de existencias en `products` (filtradas por `company_id`).
   - Si hay diferencias > X%, se inserta un registro en `bind_sync_logs` (`status='failed'`) y se notifica a operaciones para revisión.

## 5. Roadmap de implementación

1. **Infra**
   - Validar que `integration_queue` tenga índices suficientes (ya existen `idx_integration_queue_status_schedule`).
   - Confirmar que `supabase/limpieza_total.sql` se ejecute antes de nuevas cargas (script `scripts/reset-supabase.sh`).

2. **Workflows Bind → Supabase**
   1. Productos + Precios (n8n cron cada noche).
   2. Inventario (cada hora o evento manual).
   3. Conciliación semanal (genera reporte CSV y adjunta a Notion/Correo).

3. **Workflows Supabase → Bind**
   1. `integration_queue` poller (cada minuto, máximo 5 órdenes por ejecución para no saturar Bind).
   2. Reintentos con backoff.
   3. Dashboard en nuestra app usando `bind_sync_logs` para status en tiempo real.

4. **Monitoreo**
   - Añadir panel en `docs/reports` con query `SELECT status, count(*) FROM integration_queue GROUP BY 1`.
   - Alertas Slack/email cuando `integration_queue` tenga >10 pendientes o `bind_sync_logs` registre 3 errores consecutivos.

5. **Próxima iteración**
   - Implementar `storageState` en Playwright para probar los flujos autenticados.
   - Explorar replicar este patrón para otros proveedores creando nuevos `bind_group_id`.

---

> Este plan asume que Supabase sigue siendo la fuente de verdad y Bind solo refleja el estado consolidado del grupo. Cualquier cambio operativo (p. ej. múltiples warehouses) debe venir acompañado de ajustes en `bind_mappings` y en los workflows descritos.
