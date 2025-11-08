# ✅ CHECKLIST PARA PRODUCCIÓN Y AUTOMATIZACIÓN (Pendiente)

**Fecha original:** 2025-01-31  
**Actualización 2025-11-02:** Este checklist refleja el objetivo final; **muchos ítems siguen pendientes** (tablas Bind, triggers PGMQ, workflows n8n). Marca cada punto únicamente cuando se materialice en Supabase/n8n.

---

## 🎯 PROPÓSITO FINAL VERIFICADO

**El sistema está diseñado para:**
- Transformar proceso manual en automático
- Reducir intervención manual después de aprobación
- Integrarse con Bind ERP vía n8n
- Sincronizar productos en ambos sentidos
- Mantener auditoría completa de todas las operaciones

---

## 📊 CHECKLIST: ARQUITECTURA SUPABASE

### Estructura de Datos (por completar)

- [ ] **Tablas core** creadas con relaciones correctas
  - [ ] `companies` con `bind_location_id` y `bind_price_list_id`
  - [ ] `profiles` con `role_v2` (admin/supervisor/user)
  - [ ] `products` con `bind_id` y `bind_sync_enabled`
  - [ ] `requisitions` con estados de negocio e integración
  - [ ] `requisition_items` con cálculo automático

- [ ] **Tablas de integración** para Bind ERP
  - [ ] `bind_mappings` para mapeos Supabase → Bind
  - [ ] `bind_sync_logs` para auditoría completa

- [ ] **Vistas optimizadas** para n8n
  - [ ] `requisitions_pending_sync` - Requisiciones listas para procesar
  - [ ] `products_pending_sync` - Productos que necesitan sincronización

### Estados y Flujos (por completar)

- [ ] **Estados de negocio** (`business_status`)
  - [ ] `draft` → `submitted` → `approved` → `rejected`/`ordered`
  - [ ] Transiciones validadas por triggers

- [ ] **Estados de integración** (`integration_status`) ⭐ CRÍTICO
  - [ ] `draft` → `pending_sync` → `syncing` → `synced`/`sync_failed`
  - [ ] Flujo claro para n8n

- [ ] **Campos de integración** en `requisitions`
  - [ ] `bind_folio` - Folio retornado por Bind
  - [ ] `bind_synced_at` - Fecha de sincronización
  - [ ] `bind_error_message` - Mensaje de error
  - [ ] `bind_sync_attempts` - Contador de reintentos
  - [ ] `approved_at` - Trigger para n8n

### Funciones Críticas (por completar)

- [ ] **Flujo de negocio**
  - [ ] `create_full_requisition()` - Crear desde carrito
  - [ ] `submit_requisition()` - Enviar para aprobación
  - [ ] `approve_requisition()` - Aprobar y marcar `pending_sync` ⭐
  - [ ] `reject_requisition()` - Rechazar

- [ ] **Flujo de integración** ⭐ CRÍTICO PARA N8N
  - [ ] `get_requisition_for_bind()` - Obtener info completa
  - [ ] `format_requisition_for_bind_api()` - Formatear para Bind
  - [ ] `validate_requisition_for_bind()` - Validar antes de procesar
  - [ ] `update_bind_sync_status()` - Actualizar después de sincronizar
  - [ ] `log_bind_sync()` - Registrar en logs

- [ ] **Sincronización de productos**
  - [ ] `upsert_product_from_bind()` - Crear/actualizar producto
  - [ ] `batch_upsert_products_from_bind()` - Procesar múltiples
  - [ ] `get_products_pending_sync()` - Obtener pendientes
  - [ ] `mark_product_as_synced()` - Marcar como sincronizado

- [ ] **Diagnóstico y mantenimiento**
  - [ ] `get_integration_dashboard()` - Dashboard completo
  - [ ] `get_requisitions_with_issues()` - Identificar problemas
  - [ ] `retry_failed_syncs()` - Reintentar fallidos
  - [ ] `cleanup_old_sync_logs()` - Limpiar logs antiguos

### Triggers Automáticos (por completar)

- [ ] **Trigger crítico** ⭐ CRÍTICO PARA AUTOMATIZACIÓN
  - [ ] `enqueue_requisition_for_bind_trigger` - Marca automáticamente `pending_sync` al aprobar
  - [ ] Asegura que TODA aprobación se marque para procesamiento

- [ ] **Triggers de cálculo**
  - [ ] `calculate_item_subtotal` - Calcula subtotal automáticamente
  - [ ] `update_requisition_total` - Actualiza total de requisición

- [ ] **Triggers de auditoría**
  - [ ] `validate_requisition_status_transition` - Valida transiciones
  - [ ] `set_updated_at` - Actualiza timestamps

### Seguridad: RLS (por completar)

- [ ] **RLS habilitado** en todas las tablas críticas
- [ ] **Políticas optimizadas** usando `(SELECT auth.uid())`
- [ ] **Funciones SECURITY DEFINER** con `SET search_path`
- [ ] **Multi-tenancy** garantizado por `company_id`

### Performance (por completar)

- [ ] **Índices optimizados** para consultas críticas
  - [ ] `idx_requisitions_pending_sync` - Para webhooks/polling
  - [ ] `idx_requisitions_approved_at` - Para ordenamiento
  - [ ] `idx_products_company_bind_id` - Único por empresa y bind_id
  - [ ] `idx_bind_sync_logs_company_type` - Para auditoría

---

## 🔄 CHECKLIST: FLUJO DE AUTOMATIZACIÓN

### Flujo Completo (por completar)

- [ ] **Usuario crea requisición**
  - [ ] `create_full_requisition()` funciona correctamente
  - [ ] Estado inicial: `draft`

- [ ] **Usuario envía requisición**
  - [ ] `submit_requisition()` funciona correctamente
  - [ ] Estado: `submitted`
  - [ ] Notificación creada para supervisor

- [ ] **Supervisor aprueba** ⭐ CRÍTICO
  - [ ] `approve_requisition()` funciona correctamente
  - [ ] Estado: `approved` + `pending_sync`
  - [ ] `approved_at` establecido
  - [ ] **TRIGGER automático** marca `pending_sync` ⭐
  - [ ] Notificación creada para usuario

- [ ] **n8n detecta requisición** ⭐ LISTO PARA CONFIGURAR
  - [ ] Vista `requisitions_pending_sync` disponible
  - [ ] Función `get_requisition_for_bind()` disponible
  - [ ] Webhook o polling puede configurarse

- [ ] **n8n procesa requisición** ⭐ LISTO PARA CONFIGURAR
  - [ ] `validate_requisition_for_bind()` disponible
  - [ ] `format_requisition_for_bind_api()` disponible
  - [ ] Estructura JSON clara y completa

- [ ] **n8n envía a Bind ERP** ⭐ LISTO PARA CONFIGURAR
  - [ ] Datos formateados correctamente
  - [ ] `bind_id` de productos incluido
  - [ ] `bind_location_id` de empresa incluido

- [ ] **n8n actualiza estado** ⭐ LISTO PARA CONFIGURAR
  - [ ] `update_bind_sync_status()` disponible
  - [ ] Logs automáticos en `bind_sync_logs`
  - [ ] Notificaciones automáticas al usuario

---

## 🚀 CHECKLIST: PREPARACIÓN PARA PRODUCCIÓN

### Configuración de Supabase (verificar)

- [ ] **Migraciones aplicadas** correctamente
- [ ] **Funciones creadas** y probadas
- [ ] **Triggers configurados** correctamente
- [ ] **RLS policies** optimizadas
- [ ] **Índices creados** para performance

### Configuración de n8n ⏭️ PENDIENTE

- [ ] **Webhook configurado** en Supabase
  - [ ] Filtro: `business_status = 'approved' AND integration_status = 'pending_sync'`
  - [ ] Endpoint n8n configurado

- [ ] **Workflow n8n creado**
  - [ ] Nodo: Recibir requisición
  - [ ] Nodo: Validar con `validate_requisition_for_bind()`
  - [ ] Nodo: Formatear con `format_requisition_for_bind_api()`
  - [ ] Nodo: Llamar API Bind ERP
  - [ ] Nodo: Actualizar estado con `update_bind_sync_status()`
  - [ ] Nodo: Manejo de errores y reintentos

- [ ] **Autenticación configurada**
  - [ ] Supabase API key configurada en n8n
  - [ ] Bind ERP API credentials configuradas

- [ ] **Manejo de errores**
  - [ ] Reintentos automáticos configurados
  - [ ] Alertas para errores críticos
  - [ ] Logs en `bind_sync_logs`

### Configuración de Bind ERP ⏭️ PENDIENTE

- [ ] **API Bind ERP** documentada
- [ ] **Endpoints** identificados
  - [ ] Crear pedido: `POST /api/orders`
  - [ ] Obtener productos: `GET /api/products`
- [ ] **Autenticación** configurada
- [ ] **Mapeos** configurados en `bind_mappings`
  - [ ] Clientes (companies → Bind clients)
  - [ ] Productos (products → Bind products)
  - [ ] Ubicaciones (projects → Bind locations)

### Monitoreo y Alertas ⏭️ PENDIENTE

- [ ] **Dashboard de integración** configurado
  - [ ] `get_integration_dashboard()` disponible
  - [ ] Visualización de métricas

- [ ] **Alertas configuradas**
  - [ ] Requisiciones fallidas múltiples veces
  - [ ] Productos sin `bind_id`
  - [ ] Errores de sincronización

- [ ] **Logs de auditoría** revisados regularmente
  - [ ] `bind_sync_logs` consultados
  - [ ] Patrones de error identificados

---

## 🚧 Verificación pendiente

### Arquitectura (verificar)

- [ ] **Estructura de datos** completa y bien relacionada
- [ ] **Estados y flujos** claramente definidos
- [ ] **Funciones críticas** implementadas y probadas
- [ ] **Triggers automáticos** configurados
- [ ] **Vistas optimizadas** para n8n
- [ ] **Logs de auditoría** completos

### Código Frontend (verificar)

- [ ] **Servicios optimizados** con helpers cacheados
- [ ] **Queries optimizadas** sin duplicaciones
- [ ] **Manejo de errores** robusto
- [ ] **Performance mejorada** significativamente

### Integración (verificar)

- [ ] **Estructura lista** para n8n
- [ ] **Funciones disponibles** para consumo
- [ ] **Validaciones** antes de procesar
- [ ] **Actualización de estados** después de procesar

### Seguridad (verificar)

- [ ] **RLS habilitado** en todas las tablas
- [ ] **Políticas optimizadas** para performance
- [ ] **Funciones seguras** con SECURITY DEFINER
- [ ] **Multi-tenancy** garantizado

---

## 🎯 RESULTADO FINAL

### Objetivo de la checklist

**El sistema busca:**
1. Automatizar el flujo de requisiciones end-to-end
2. Facilitar integración con n8n y Bind ERP
3. Escalar sin problemas
4. Mantener auditoría completa
5. Monitorear y diagnosticar problemas fácilmente

**Próximos pasos:**
1. ⏭️ Configurar workflows en n8n usando las funciones disponibles
2. ⏭️ Configurar webhooks o polling según preferencia
3. ⏭️ Configurar mapeos en `bind_mappings`
4. ⏭️ Probar flujo completo end-to-end
5. ⏭️ Configurar monitoreo y alertas

---

**Estado actual:** 🟡 En progreso — completar migraciones y workflows antes del go-live  
**Arquitectura:** 🧭 Referencia objetivo — consolidar en Supabase antes de validar  
**Documentación:** 📝 Actualizada a noviembre 2025 con notas de pendientes
