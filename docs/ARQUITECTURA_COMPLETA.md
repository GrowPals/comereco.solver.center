# 🏗️ ARQUITECTURA COMPLETA: COMERECO WEBAPP

> ⚠️ **Estado 2025-11-02:** Este documento describe la arquitectura objetivo para la automatización con Bind ERP y n8n. Aún faltan migraciones y funciones clave (`bind_mappings`, `bind_sync_logs`, `format_requisition_for_bind_api`, trigger `enqueue_requisition_for_bind`, etc.).  
> Úsalo como blueprint hasta que se incorporen los cambios en Supabase.

**Fecha:** 2025-01-31  
**Versión:** 1.0  
**Propósito:** Documentar la arquitectura completa del sistema para facilitar automatización y producción

---

## 🎯 PROPÓSITO FINAL DEL SISTEMA

**Transformar el proceso manual de requisiciones en un flujo automático end-to-end:**

1. Usuario crea requisición → Sistema marca como `draft`
2. Usuario envía → Sistema marca como `submitted` y notifica supervisor
3. Supervisor aprueba → Sistema marca como `approved` y `pending_sync`
4. **n8n detecta** → Toma requisición de Supabase
5. **n8n procesa** → Formatea y envía a Bind ERP API
6. **Bind crea pedido** → Retorna folio
7. **n8n actualiza** → Marca como `synced` con `bind_folio`
8. **Sistema notifica** → Usuario recibe confirmación

**Resultado:** Cero intervención manual después de la aprobación.

---

## 📊 ARQUITECTURA DE DATOS: SUPABASE

### Capa 1: Entidades Core (Negocio)

```
companies (empresa)
├── id (UUID)
├── name
├── bind_location_id (ID en Bind ERP)
├── bind_price_list_id (ID en Bind ERP)
└── ──────────────────────────────────────
    │
    ├── profiles (usuarios)
    │   ├── id (UUID) → auth.users.id
    │   ├── company_id → companies.id
    │   ├── role_v2 (admin/supervisor/user)
    │   └── full_name, avatar_url
    │
    ├── products (catálogo)
    │   ├── id (UUID)
    │   ├── company_id → companies.id
    │   ├── bind_id (ID en Bind ERP) ⭐ CRÍTICO
    │   ├── sku, name, price, stock
    │   └── bind_sync_enabled, bind_last_synced_at
    │
    ├── projects (proyectos)
    │   ├── id (UUID)
    │   ├── company_id → companies.id
    │   ├── supervisor_id → profiles.id
    │   └── name, description, status
    │
    └── requisitions (requisiciones) ⭐ CORAZÓN DEL SISTEMA
        ├── id (UUID)
        ├── company_id → companies.id
        ├── project_id → projects.id
        ├── created_by → profiles.id
        ├── approved_by → profiles.id
        │
        ├── Estados de Negocio (business_status)
        │   ├── draft → Usuario creando
        │   ├── submitted → Enviado para aprobación
        │   ├── approved → Aprobado por supervisor
        │   ├── rejected → Rechazado
        │   └── ordered → Convertido en pedido
        │
        ├── Estados de Integración (integration_status) ⭐ CRÍTICO
        │   ├── draft → No listo para sincronizar
        │   ├── pending_sync → Listo para n8n ⭐
        │   ├── syncing → n8n está procesando
        │   ├── synced → Sincronizado exitosamente
        │   ├── sync_failed → Error en sincronización
        │   └── rejected/cancelled → Cancelado
        │
        └── Campos de Integración Bind ⭐ CRÍTICO
            ├── bind_folio → Folio retornado por Bind
            ├── bind_synced_at → Fecha de sincronización
            ├── bind_error_message → Error si falla
            ├── bind_sync_attempts → Contador de reintentos
            └── approved_at → Fecha de aprobación (trigger para n8n)
```

### Capa 2: Entidades de Soporte

```
requisition_items (items de requisición)
├── requisition_id → requisitions.id
├── product_id → products.id
├── quantity, unit_price, subtotal
└── [Calculado automáticamente por triggers]

requisition_templates (plantillas)
├── user_id → profiles.id
├── company_id → companies.id
├── project_id → projects.id
├── items (JSONB) → Array de {product_id, quantity}
└── is_favorite, usage_count, last_used_at

user_cart_items (carrito)
├── user_id → profiles.id
├── product_id → products.id
└── quantity

notifications (notificaciones)
├── user_id → profiles.id
├── company_id → companies.id
├── type, title, message, link
└── is_read, created_at
```

### Capa 3: Entidades de Integración ⭐ CRÍTICO PARA AUTOMATIZACIÓN

```
bind_mappings (mapeos Supabase → Bind)
├── company_id → companies.id
├── mapping_type (client/product/location/warehouse/branch)
├── supabase_id → ID de entidad en Supabase
├── bind_id → ID correspondiente en Bind ERP
├── bind_data (JSONB) → Datos adicionales
└── is_active → Control de mappings activos

bind_sync_logs (logs de sincronización) ⭐ AUDITORÍA
├── company_id → companies.id
├── sync_type (products/requisition/manual)
├── entity_type → Tipo de entidad sincronizada
├── entity_id → ID de la entidad
├── bind_id → ID en Bind ERP
├── status (success/failed/pending)
├── request_payload (JSONB) → Datos enviados
├── response_payload (JSONB) → Respuesta recibida
└── error_message → Mensaje de error si falla
```

### Capa 4: Vistas Optimizadas ⭐ PARA N8N

```
requisitions_pending_sync (vista)
└── Requisiciones con:
    - business_status = 'approved'
    - integration_status = 'pending_sync'
    - Optimizada con índices para webhooks

products_pending_sync (vista)
└── Productos que necesitan sincronización:
    - bind_sync_enabled = true
    - bind_last_synced_at es NULL o antiguo
```

---

## 🔧 FUNCIONES CRÍTICAS: SUPABASE

### Flujo de Negocio

```sql
-- 1. Crear requisición completa desde carrito
create_full_requisition(
    p_project_id UUID,
    p_comments TEXT,
    p_items JSONB
) → requisition_id

-- 2. Enviar requisición para aprobación
submit_requisition(p_requisition_id UUID) → JSONB
-- Cambia: business_status = 'submitted'
-- Crea notificación para supervisor

-- 3. Aprobar requisición ⭐ CRÍTICO
approve_requisition(
    p_requisition_id UUID,
    p_comments TEXT
) → JSONB
-- Cambia: business_status = 'approved'
-- Cambia: integration_status = 'pending_sync' ⭐
-- Actualiza: approved_at = NOW() ⭐
-- Crea notificación para usuario
-- TRIGGER: enqueue_requisition_for_bind() ⭐

-- 4. Rechazar requisición
reject_requisition(
    p_requisition_id UUID,
    p_reason TEXT
) → JSONB
```

### Flujo de Integración ⭐ CRÍTICO PARA N8N

```sql
-- 1. Obtener requisición completa para Bind
get_requisition_for_bind(p_requisition_id UUID) → JSONB
-- Retorna: Requisición + Empresa + Proyecto + Usuarios + Items completos
-- Incluye: bind_id de productos, bind_location_id de empresa
-- Incluye: Validación automática

-- 2. Formatear para API de Bind
format_requisition_for_bind_api(p_requisition_id UUID) → JSONB
-- Formato específico esperado por Bind ERP
-- Filtra automáticamente items sin bind_id

-- 3. Validar antes de procesar
validate_requisition_for_bind(p_requisition_id UUID) → JSONB
-- Retorna: valid, items_count, missing_bind_ids, warnings

-- 4. Actualizar estado después de sincronizar
update_bind_sync_status(
    p_requisition_id UUID,
    p_bind_folio TEXT,
    p_success BOOLEAN,
    p_error_message TEXT
) → VOID
-- Actualiza: integration_status, bind_folio, bind_synced_at
-- Incrementa: bind_sync_attempts si falla
-- Crea log en: bind_sync_logs

-- 5. Sincronizar productos desde Bind
upsert_product_from_bind(
    p_company_id UUID,
    p_product_data JSONB
) → product_id

batch_upsert_products_from_bind(
    p_company_id UUID,
    p_products_array JSONB
) → JSONB

-- 6. Obtener productos pendientes
get_products_pending_sync(p_company_id UUID, p_limit INTEGER) → TABLE
```

### Flujo de Diagnóstico y Mantenimiento

```sql
-- Dashboard de integración
get_integration_dashboard(p_company_id UUID) → JSONB
-- Estadísticas completas de sincronización

-- Identificar problemas
get_requisitions_with_issues(p_company_id UUID) → TABLE
-- Requisiciones con problemas para sincronizar

-- Reintentar sincronizaciones fallidas
retry_failed_syncs(
    p_company_id UUID,
    p_max_attempts INTEGER,
    p_limit INTEGER
) → JSONB

-- Limpiar logs antiguos
cleanup_old_sync_logs(
    p_days_to_keep INTEGER,
    p_company_id UUID
) → JSONB
```

---

## 🔄 FLUJO COMPLETO: DE USUARIO A BIND ERP

### Diagrama de Flujo

```
┌─────────────────┐
│   USUARIO       │
│   (Trabajador)  │
└────────┬────────┘
         │
         │ 1. Crea requisición
         ▼
┌─────────────────┐
│   React App     │
│   Frontend      │
└────────┬────────┘
         │
         │ 2. create_full_requisition()
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│                 │
│   requisitions  │
│   business_status = 'draft'
│   integration_status = 'draft'
└────────┬────────┘
         │
         │ 3. submit_requisition()
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│                 │
│   requisitions  │
│   business_status = 'submitted'
│   ─────────────────────
│   notifications  │
│   (supervisor)  │
└────────┬────────┘
         │
         │ 4. Supervisor aprueba
         │    approve_requisition()
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│                 │
│   requisitions  │
│   business_status = 'approved'
│   integration_status = 'pending_sync' ⭐
│   approved_at = NOW() ⭐
│   ─────────────────────
│   TRIGGER:      │
│   enqueue_requisition_for_bind() ⭐
│   ─────────────────────
│   notifications │
│   (usuario)     │
└────────┬────────┘
         │
         │ 5. Webhook Supabase → n8n
         │    O Polling cada 5 min
         ▼
┌─────────────────┐
│   n8n           │
│   Workflow      │
│                 │
│   1. Detecta requisición
│      pending_sync
│   2. get_requisition_for_bind()
│   3. validate_requisition_for_bind()
│   4. format_requisition_for_bind_api()
│   5. Llama API Bind ERP
└────────┬────────┘
         │
         │ 6. POST /api/orders
         ▼
┌─────────────────┐
│   Bind ERP      │
│   API           │
│                 │
│   Crea pedido
│   Retorna folio
└────────┬────────┘
         │
         │ 7. Retorna respuesta
         ▼
┌─────────────────┐
│   n8n           │
│   Workflow      │
│                 │
│   Si éxito:
│   update_bind_sync_status(
│     success=true,
│     bind_folio=...
│   )
│   ────────────────────
│   Si error:
│   update_bind_sync_status(
│     success=false,
│     error_message=...
│   )
│   ────────────────────
│   log_bind_sync()
└────────┬────────┘
         │
         │ 8. Actualiza estado
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│                 │
│   requisitions  │
│   integration_status = 'synced'
│   bind_folio = 'PO-2025-1234'
│   bind_synced_at = NOW()
│   ─────────────────────
│   bind_sync_logs │
│   (auditoría)    │
│   ─────────────────────
│   notifications  │
│   (usuario)      │
└─────────────────┘
```

---

## 🎯 PUNTOS CRÍTICOS PARA AUTOMATIZACIÓN

### 1. Trigger Automático ⭐

```sql
-- Cuando se aprueba una requisición:
CREATE TRIGGER enqueue_requisition_for_bind
AFTER UPDATE ON requisitions
FOR EACH ROW
WHEN (
    NEW.business_status = 'approved'
    AND NEW.integration_status = 'pending_sync'
    AND OLD.business_status != 'approved'
)
EXECUTE FUNCTION enqueue_requisition_for_bind();

-- Esto asegura que TODA aprobación se marca automáticamente
-- como pendiente de sincronización
```

### 2. Vista Optimizada para n8n ⭐

```sql
CREATE VIEW requisitions_pending_sync AS
SELECT 
    r.id,
    r.internal_folio,
    r.company_id,
    r.project_id,
    r.total_amount,
    r.approved_at,
    c.name as company_name,
    c.bind_location_id,
    u.full_name as requester_name,
    a.full_name as approver_name
FROM requisitions r
INNER JOIN companies c ON r.company_id = c.id
LEFT JOIN profiles u ON r.created_by = u.id
LEFT JOIN profiles a ON r.approved_by = a.id
WHERE r.business_status = 'approved'
  AND r.integration_status = 'pending_sync'
ORDER BY r.approved_at ASC;

-- n8n puede consultar esta vista para obtener
-- todas las requisiciones pendientes de procesar
```

### 3. Función Todo-en-Uno ⭐

```sql
-- Una sola llamada obtiene TODO lo necesario:
SELECT get_requisition_for_bind('[requisition_id]');

-- Retorna JSON completo con:
{
  "requisition": {...},
  "company": {
    "bind_location_id": "...",
    "bind_price_list_id": "..."
  },
  "project": {...},
  "requester": {...},
  "approver": {...},
  "items": [
    {
      "bind_product_id": "...",
      "product_name": "...",
      "quantity": 10,
      "unit_price": 100,
      "has_bind_id": true
    }
  ],
  "validation": {
    "valid": true,
    "missing_bind_ids": 0
  }
}
```

---

## 🔐 SEGURIDAD Y PERMISOS: RLS

### Principio Fundamental

**Todo está protegido por RLS (Row Level Security):**

- Usuarios solo ven datos de su empresa (`company_id`)
- Roles determinan permisos (admin/supervisor/user)
- Funciones críticas son `SECURITY DEFINER`
- Triggers automáticos aseguran integridad

### Políticas Críticas

```sql
-- Requisiciones: Usuarios ven solo las de su empresa
-- Requisiciones: Solo supervisores pueden aprobar/rechazar
-- Requisiciones: Solo creador puede editar en draft

-- Productos: Usuarios ven solo productos de su empresa
-- Productos: Solo admins pueden crear/editar

-- Projects: Usuarios ven solo proyectos donde son miembros
-- Projects: Solo supervisores pueden aprobar requisiciones
```

---

## 📡 INTEGRACIÓN CON N8N: FLUJO DETALLADO

### Opción 1: Webhook (Recomendado para Producción)

```javascript
// n8n configura webhook en Supabase
// Supabase → n8n cuando requisition cambia

// Filtro en Supabase:
WHERE business_status = 'approved'
  AND integration_status = 'pending_sync'
  AND approved_at > NOW() - INTERVAL '1 hour'

// n8n recibe evento con requisition_id
// n8n llama: get_requisition_for_bind(requisition_id)
```

### Opción 2: Polling (Alternativa)

```javascript
// n8n ejecuta cada 5 minutos:

// 1. Consultar pendientes
SELECT * FROM requisitions_pending_sync LIMIT 10;

// 2. Para cada una:
SELECT get_requisition_for_bind(id);

// 3. Validar:
SELECT validate_requisition_for_bind(id);

// 4. Si válida, procesar:
// - Formatear con format_requisition_for_bind_api()
// - Enviar a Bind API
// - Actualizar con update_bind_sync_status()
```

---

## 🚀 PREPARACIÓN PARA PRODUCCIÓN

### Checklist de Arquitectura

- [x] **Tablas core creadas** con relaciones correctas
- [x] **Estados de integración** claramente definidos
- [x] **Funciones críticas** implementadas y probadas
- [x] **Vistas optimizadas** para n8n
- [x] **Triggers automáticos** para marcar pending_sync
- [x] **Logs de auditoría** completos (bind_sync_logs)
- [x] **Validaciones** antes de procesar
- [x] **Manejo de errores** con reintentos
- [x] **RLS policies** configuradas correctamente
- [x] **Índices optimizados** para performance

### Checklist de n8n

- [ ] Configurar webhook o polling
- [ ] Crear workflow para procesar requisiciones
- [ ] Configurar autenticación con Supabase
- [ ] Configurar autenticación con Bind API
- [ ] Implementar manejo de errores
- [ ] Implementar reintentos automáticos
- [ ] Configurar notificaciones de errores

### Checklist de Monitoreo

- [ ] Dashboard de integración (`get_integration_dashboard`)
- [ ] Alertas para requisiciones fallidas múltiples veces
- [ ] Alertas para productos sin bind_id
- [ ] Alertas para errores de sincronización

---

## 📚 DOCUMENTACIÓN RELACIONADA

1. `../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md` - Plan operativo para habilitar la integración.
2. `CHECKLIST_PRODUCCION_AUTOMATIZACION.md` - Lista de verificación de pendientes.
3. `INSTRUCCIONES_FIX_RLS_RECURSION.md` - Pasos para sanear las políticas RLS antes de automatizar.

---

**Estado objetivo:** Documento de referencia; implementar migraciones y validaciones antes de marcar la automatización como completada.
