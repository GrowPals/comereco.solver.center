# 🏗️ Arquitectura y Fundamentación del Sistema ComerECO

**Fecha:** 2025-01-26  
**Proyecto:** ComerECO - Sistema de Requisiciones Grupo Solven

---

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Fundamentación de Tablas Supabase](#fundamentación-de-tablas-supabase)
3. [Fundamentación de Funciones de BD](#fundamentación-de-funciones-de-bd)
4. [Fundamentación de Servicios Webapp](#fundamentación-de-servicios-webapp)
5. [Fundamentación de Hooks](#fundamentación-de-hooks)
6. [Flujos de Datos](#flujos-de-datos)
7. [Decisiones de Diseño](#decisiones-de-diseño)

---

## 🏛️ Arquitectura General

### Propósito del Sistema
ComerECO es un sistema de gestión de requisiciones de compra que digitaliza y optimiza el proceso de compras dentro del Grupo Solven, permitiendo:
- **Usuarios:** Crear requisiciones desde un catálogo centralizado
- **Supervisores:** Revisar y aprobar/rechazar requisiciones de sus proyectos
- **Administradores:** Gestionar usuarios, proyectos y supervisar el sistema

### Arquitectura en Capas

```
┌─────────────────────────────────────────────────┐
│           CAPA DE PRESENTACIÓN (React)          │
│  - Páginas (Pages)                               │
│  - Componentes (Components)                     │
│  - Hooks (Custom Hooks)                         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         CAPA DE SERVICIOS (Services)            │
│  - Servicios de dominio                          │
│  - Servicios de funciones BD                    │
│  - Manejo de estado (React Query)                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      CAPA DE BACKEND (Supabase PostgreSQL)      │
│  - Tablas (Data Model)                           │
│  - Funciones (Business Logic)                   │
│  - Políticas RLS (Security)                      │
│  - Triggers (Automation)                         │
└─────────────────────────────────────────────────┘
```

---

## 📊 Fundamentación de Tablas Supabase

### 1. `companies` - Empresas

**¿Por qué existe?**
- **Propósito:** Multi-tenancy - Soporta múltiples empresas en el mismo sistema
- **Fundamentación:** Cada empresa tiene su propio catálogo de productos, usuarios, proyectos y requisiciones
- **Relaciones:** Es la tabla central que conecta todo el sistema (12 tablas referencian companies)

**Datos críticos:**
- `bind_location_id` - Integración con sistema externo (SAP/Oracle)
- `bind_price_list_id` - Lista de precios en sistema externo

**Uso en Webapp:**
- `companyService.js` - Gestión completa de empresas
- Contexto de autenticación - Usuario siempre tiene company_id

---

### 2. `profiles` - Perfiles de Usuario

**¿Por qué existe?**
- **Propósito:** Extender `auth.users` con datos específicos del dominio
- **Fundamentación:** Supabase Auth solo maneja autenticación, necesitamos datos de negocio:
  - `company_id` - A qué empresa pertenece
  - `role_v2` - Rol en el sistema (admin/supervisor/user)
  - `full_name`, `avatar_url` - Datos de perfil

**Evolución:**
- `role` (legacy) - Sistema antiguo (employee/admin_corp/super_admin)
- `role_v2` - Sistema nuevo (admin/supervisor/user) - **ACTUAL**

**Uso en Webapp:**
- `userService.js` - Gestión de usuarios
- `useUserPermissions.js` - Verificación de permisos
- Contexto de autenticación - Información del usuario actual

---

### 3. `products` - Catálogo de Productos

**¿Por qué existe?**
- **Propósito:** Catálogo centralizado de productos por empresa
- **Fundamentación:** 
  - Evita duplicación de datos
  - Permite reutilización de productos en múltiples requisiciones
  - Control de stock y precios centralizado
  - Integración con sistema externo (`bind_id`, `bind_last_synced_at`)

**Datos críticos:**
- `bind_id` - ID en sistema externo para sincronización
- `price`, `stock` - Datos operativos
- `is_active` - Control de disponibilidad

**Uso en Webapp:**
- `productService.js` - CRUD completo
- `useProducts.js` - Hook para listado y gestión
- `useCart.js` - Carrito de compras
- `useFavorites.js` - Productos favoritos

---

### 4. `projects` - Proyectos

**¿Por qué existe?**
- **Propósito:** Organizar requisiciones por proyecto
- **Fundamentación:**
  - Permite agrupar requisiciones por proyecto/obra/departamento
  - Asigna supervisores específicos por proyecto
  - Control presupuestario por proyecto
  - Permisos granulares (usuarios solo ven sus proyectos)

**Datos críticos:**
- `supervisor_id` - Supervisor responsable
- `company_id` - Empresa propietaria
- `status` - Estado del proyecto (active/archived)

**Uso en Webapp:**
- `projectService.js` - CRUD completo
- Dashboard - Filtrar requisiciones por proyecto
- `NewRequisition.jsx` - Seleccionar proyecto al crear requisición

---

### 5. `project_members` - Miembros de Proyecto

**¿Por qué existe?**
- **Propósito:** Relación muchos-a-muchos entre usuarios y proyectos
- **Fundamentación:**
  - Un usuario puede estar en múltiples proyectos
  - Un proyecto tiene múltiples usuarios
  - Permite roles específicos por proyecto (`role_in_project`)
  - Control de acceso granular

**Uso en Webapp:**
- `projectService.js` - Gestión de miembros
- Filtrado de requisiciones - Solo ver proyectos del usuario

---

### 6. `requisitions` - Requisiciones

**¿Por qué existe?**
- **Propósito:** Entidad principal del sistema - Solicitudes de compra
- **Fundamentación:**
  - Representa el ciclo de vida completo de una requisición
  - Estados de negocio (`business_status`) - draft/submitted/approved/rejected/ordered/cancelled
  - Estados de integración (`integration_status`) - draft/pending_sync/syncing/synced/rejected/cancelled
  - Generación automática de folios (`internal_folio`)
  - Integración bidireccional con sistema externo

**Campos críticos:**
- `internal_folio` - Folio único generado automáticamente
- `business_status` - Estado del flujo de aprobación
- `integration_status` - Estado de sincronización con sistema externo
- `items` (JSONB) - Items de la requisición (duplicado para eficiencia)
- `created_by`, `approved_by` - Auditoría de quién hizo qué

**Uso en Webapp:**
- `requisitionService.js` - CRUD completo
- `useRequisitions.js` - Hook para listado
- `useRequisitionActions.js` - Acciones (aprobar/rechazar/enviar)
- Múltiples páginas: Dashboard, Requisitions, Approvals, RequisitionDetail

---

### 7. `requisition_items` - Items de Requisición

**¿Por qué existe?**
- **Propósito:** Normalizar los items de una requisición
- **Fundamentación:**
  - Permite queries eficientes sobre items individuales
  - Facilita cálculos de totales (aunque también está en `items` JSONB)
  - Permite actualizar precios históricos sin afectar la requisición original
  - Facilita reportes y análisis

**Relación:**
- `requisition_id` → `requisitions.id`
- `product_id` → `products.id`

**Uso en Webapp:**
- `requisitionService.js` - Obtener items al cargar detalles
- `RequisitionDetail.jsx` - Mostrar items de la requisición

**Nota:** `requisitions.items` (JSONB) existe para eficiencia en creación, pero `requisition_items` es la fuente de verdad para queries.

---

### 8. `requisition_templates` - Plantillas de Requisición

**¿Por qué existe?**
- **Propósito:** Reutilizar combinaciones comunes de productos
- **Fundamentación:**
  - Usuarios frecuentemente compran los mismos productos
  - Reduce tiempo de creación de requisiciones
  - `usage_count` y `last_used_at` permiten identificar plantillas populares
  - `is_favorite` permite marcar favoritas
  - Puede ser por proyecto específico o general

**Uso en Webapp:**
- `templateService.js` - CRUD completo
- `Templates.jsx` - Gestión de plantillas
- `NewRequisition.jsx` - Usar plantilla para crear requisición
- `databaseFunctionsService.useRequisitionTemplate()` - Función BD

---

### 9. `notifications` - Notificaciones

**¿Por qué existe?**
- **Propósito:** Sistema de notificaciones in-app
- **Fundamentación:**
  - Notificar cambios de estado en requisiciones
  - Alertas del sistema
  - Comunicación entre usuarios
  - Historial de eventos importantes

**Tipos:**
- `success`, `warning`, `danger`, `info`

**Uso en Webapp:**
- `notificationService.js` - CRUD completo
- `NotificationCenter.jsx` - Componente de notificaciones
- `Notifications.jsx` - Página de notificaciones
- Auto-notificación cuando se aprueba/rechaza requisición

---

### 10. `user_cart_items` - Carrito de Compras

**¿Por qué existe?**
- **Propósito:** Carrito temporal antes de crear requisición
- **Fundamentación:**
  - Permite agregar productos antes de crear la requisición
  - Facilita creación de requisiciones con múltiples productos
  - Persistente entre sesiones (a diferencia de localStorage)
  - Permite gestión de cantidad antes de confirmar

**Uso en Webapp:**
- `useCart.js` - Hook completo de carrito
- `Cart.jsx` - Componente de carrito
- `Checkout.jsx` - Página de checkout
- `Catalog.jsx` - Agregar productos al carrito

---

### 11. `user_favorites` - Productos Favoritos

**¿Por qué existe?**
- **Propósito:** Marcar productos frecuentemente usados
- **Fundamentación:**
  - Permite acceso rápido a productos comunes
  - Mejora UX al crear requisiciones
  - No requiere búsqueda repetida

**Uso en Webapp:**
- `useFavorites.js` - Hook completo de favoritos
- `Favorites.jsx` - Página de favoritos
- `Catalog.jsx` - Marcar/desmarcar favoritos

---

### 12. `audit_log` - Log de Auditoría

**¿Por qué existe?**
- **Propósito:** Registrar todas las acciones importantes del sistema
- **Fundamentación:**
  - Cumplimiento y trazabilidad
  - Debugging y troubleshooting
  - Análisis de uso del sistema
  - Seguridad y detección de anomalías

**Eventos registrados:**
- `requisition.created` - Creación de requisición
- `requisition.business_status.changed` - Cambio de estado
- `requisition.enqueued_for_sync` - Envío a sistema externo

**Uso en Webapp:**
- `auditLogService.js` - Solo para administradores
- Dashboard admin - Ver actividad reciente

---

### 13. `folio_counters` - Contadores de Folios

**¿Por qué existe?**
- **Propósito:** Generar folios únicos secuenciales por año
- **Fundamentación:**
  - Folios en formato `REQ-YYYY-####` (ej: REQ-2025-0001)
  - Evita colisiones usando contadores por año
  - Transaccional para evitar condiciones de carrera
  - No necesita servicio frontend (se usa automáticamente en funciones BD)

**Uso en Webapp:**
- No se accede directamente desde frontend
- Se usa automáticamente por `create_full_requisition`

---

## ⚙️ Fundamentación de Funciones de BD

### Funciones de Negocio (SECURITY DEFINER)

#### 1. `approve_requisition(p_requisition_id, p_comments)`

**¿Por qué existe?**
- **Propósito:** Aprobar una requisición enviada
- **Fundamentación:**
  - **Validación de permisos:** Verifica que el usuario sea supervisor del proyecto o admin
  - **Validación de estado:** Solo permite aprobar requisiciones en estado 'submitted'
  - **Auditoría:** Registra quién aprobó y cuándo
  - **Integración:** Cambia `integration_status` a 'pending_sync' para sincronización
  - **Transaccional:** Todo o nada - si falla algo, rollback completo

**Lógica de negocio:**
```
1. Verificar que requisición existe y está en estado 'submitted'
2. Verificar que usuario tiene permisos (supervisor del proyecto o admin)
3. Si no tiene permisos → ERROR
4. Actualizar estado a 'approved'
5. Registrar approved_by y approved_at
6. Cambiar integration_status a 'pending_sync' (para sincronización)
7. Registrar en audit_log
8. Retornar éxito
```

**Uso en Webapp:**
- `databaseFunctionsService.approveRequisition()` - Wrapper
- `requisitionService.updateRequisitionStatus()` - Usa función BD
- `useRequisitionActions.js` - Hook que llama al servicio
- `Approvals.jsx` - Página de aprobaciones

---

#### 2. `reject_requisition(p_requisition_id, p_reason)`

**¿Por qué existe?**
- **Propósito:** Rechazar una requisición con razón
- **Fundamentación:**
  - Similar a `approve_requisition` pero con validación de razón
  - Guarda `rejection_reason` para auditoría
  - Permite que el usuario pueda volver a editar (cambiar a draft)

**Uso en Webapp:**
- `databaseFunctionsService.rejectRequisition()` - Wrapper
- `requisitionService.updateRequisitionStatus()` - Usa función BD
- `useRequisitionActions.js` - Hook que llama al servicio
- `Approvals.jsx` - Modal de rechazo con razón

---

#### 3. `submit_requisition(p_requisition_id)`

**¿Por qué existe?**
- **Propósito:** Enviar una requisición para aprobación
- **Fundamentación:**
  - Verifica que el usuario sea el creador
  - Verifica que esté en estado 'draft'
  - Determina si requiere aprobación o puede aprobarse automáticamente
  - Cambia estado a 'submitted' o 'approved' según configuración

**Lógica de negocio:**
```
1. Verificar que requisición existe y está en estado 'draft'
2. Verificar que usuario es el creador
3. Verificar si requiere aprobación (basado en project_members.requires_approval)
4. Si requiere aprobación → 'submitted'
5. Si no requiere → 'approved' directamente
6. Retornar estado final
```

**Uso en Webapp:**
- `databaseFunctionsService.submitRequisition()` - Wrapper
- `requisitionService.submitRequisition()` - Usa función BD
- `useRequisitionActions.js` - Hook que llama al servicio
- `RequisitionDetail.jsx` - Botón "Enviar para aprobación"

---

#### 4. `create_full_requisition(p_project_id?, p_comments, p_items)`

**¿Por qué existe?**
- **Propósito:** Crear una requisición completa con items en una transacción
- **Fundamentación:**
  - **Transaccional:** Todo o nada - si falla algo, rollback completo
  - **Generación de folio:** Usa `folio_counters` para generar folio único
  - **Validación de stock:** Verifica que haya stock suficiente
  - **Validación de productos:** Verifica que productos existan y pertenezcan a la empresa
  - **Cálculo de totales:** Calcula total_amount automáticamente
  - **Creación de items:** Crea registros en `requisition_items`
  - **Auditoría:** Registra creación en `audit_log`

**Lógica de negocio:**
```
1. Validar sesión y obtener company_id del usuario
2. Generar folio único usando folio_counters
3. Validar cada item:
   - Producto existe y pertenece a la empresa
   - Stock suficiente
4. Calcular total_amount
5. Crear requisición
6. Crear cada requisition_item con subtotal
7. Registrar en audit_log
8. Retornar requisition_id
```

**Uso en Webapp:**
- `requisitionService.createRequisition()` - Ya usa esta función
- `Checkout.jsx` - Crear requisición desde carrito
- `NewRequisition.jsx` - Crear requisición manualmente

---

#### 5. `use_requisition_template(p_template_id)`

**¿Por qué existe?**
- **Propósito:** Crear requisición desde una plantilla
- **Fundamentación:**
  - **Reutilización:** Usa items guardados en la plantilla
  - **Actualización de estadísticas:** Incrementa `usage_count` y `last_used_at`
  - **Bloqueo:** Usa `FOR UPDATE` para evitar condiciones de carrera
  - **Transaccional:** Todo o nada

**Lógica de negocio:**
```
1. Bloquear plantilla con FOR UPDATE (evita condiciones de carrera)
2. Verificar que plantilla pertenece al usuario
3. Crear requisición usando create_full_requisition con items de plantilla
4. Incrementar usage_count y actualizar last_used_at
5. Retornar requisition_id
```

**Uso en Webapp:**
- `databaseFunctionsService.useRequisitionTemplate()` - Wrapper
- `Templates.jsx` - Botón "Usar plantilla"
- `NewRequisition.jsx` - Opción de crear desde plantilla

---

#### 6. `clear_user_cart()`

**¿Por qué existe?**
- **Propósito:** Limpiar el carrito del usuario actual
- **Fundamentación:**
  - **SECURITY DEFINER:** Usa `auth.uid()` directamente, no requiere parámetro
  - **Transaccional:** Limpia todo el carrito en una operación
  - **Retorna conteo:** Informa cuántos items se eliminaron

**Uso en Webapp:**
- `databaseFunctionsService.clearUserCart()` - Wrapper
- `requisitionService.createRequisition()` - Limpia carrito después de crear requisición
- `useCart.js` - Hook de carrito (podría usar esta función)

---

#### 7. `get_unique_product_categories(company_id_param?)`

**¿Por qué existe?**
- **Propósito:** Obtener categorías únicas de productos activos
- **Fundamentación:**
  - **Filtrado:** Solo productos activos de la empresa
  - **Eficiencia:** Evita query complejo en frontend
  - **Ordenamiento:** Retorna categorías ordenadas

**Uso en Webapp:**
- `databaseFunctionsService.getUniqueProductCategories()` - Wrapper
- `Catalog.jsx` - Filtro por categorías
- `NewRequisition.jsx` - Mostrar categorías al agregar productos

---

#### 8. `broadcast_to_company(event_name, payload)`

**¿Por qué existe?**
- **Propósito:** Comunicación en tiempo real entre usuarios de la misma empresa
- **Fundamentación:**
  - **Supabase Realtime:** Usa `realtime.broadcast()` para enviar eventos
  - **Topic por empresa:** Formato `company:{company_id}:{event_name}`
  - **Casos de uso:** Notificaciones en tiempo real, actualizaciones de estado

**Uso en Webapp:**
- `databaseFunctionsService.broadcastToCompany()` - Wrapper
- Potencial para notificaciones en tiempo real (no implementado aún)

---

### Funciones Helper (SECURITY INVOKER/DEFINER)

#### `is_admin()`, `is_supervisor()`, `get_user_role_v2()`

**¿Por qué existen?**
- **Propósito:** Helpers para políticas RLS y funciones
- **Fundamentación:**
  - Evitan duplicación de código en políticas RLS
  - Centralizan lógica de verificación de roles
  - `SECURITY DEFINER` permite bypass RLS cuando es necesario

---

#### `calculate_item_subtotal()`

**¿Por qué existe?**
- **Propósito:** Calcular subtotal de items (función y trigger)
- **Fundamentación:**
  - **Trigger:** Calcula automáticamente al insertar/actualizar
  - **Función:** También disponible para uso manual
  - **Consistencia:** Garantiza que subtotal siempre sea quantity * unit_price

---

#### `update_requisition_total()`

**¿Por qué existe?**
- **Propósito:** Trigger que actualiza total_amount cuando cambian items
- **Fundamentación:**
  - Mantiene `total_amount` sincronizado con items
  - Evita tener que calcular manualmente
  - Se ejecuta automáticamente al cambiar requisition_items

---

#### `validate_requisition_status_transition()`

**¿Por qué existe?**
- **Propósito:** Validar transiciones de estado válidas
- **Fundamentación:**
  - **Estado machine:** Solo permite transiciones válidas
  - **Validación de permisos:** Verifica rol del usuario
  - **Auditoría:** Registra cada cambio de estado
  - **Lógica compleja:** Centralizada en BD para evitar inconsistencia

**Estados válidos:**
```
draft → submitted | cancelled
submitted → approved | rejected
approved → ordered | cancelled
rejected → draft
ordered → (final)
cancelled → (final)
```

---

#### `handle_new_user()`

**¿Por qué existe?**
- **Propósito:** Trigger que crea perfil automáticamente al registrar usuario
- **Fundamentación:**
  - **Automatización:** No requiere intervención manual
  - **Consistencia:** Garantiza que cada usuario tenga perfil
  - **Inicialización:** Establece valores por defecto (role_v2 = 'user')

---

#### `enqueue_requisition_for_bind()`

**¿Por qué existe?**
- **Propósito:** Enviar requisición a cola de sincronización con sistema externo
- **Fundamentación:**
  - **Integración asíncrona:** Usa pgmq (PostgreSQL Message Queue)
  - **Trigger:** Se ejecuta automáticamente cuando integration_status cambia a 'pending_sync'
  - **Payload:** Prepara datos en formato para sistema externo
  - **Auditoría:** Registra envío en audit_log

---

## 🔧 Fundamentación de Servicios Webapp

### 1. `companyService.js`

**¿Por qué existe?**
- **Propósito:** Gestión de empresas en el sistema
- **Fundamentación:**
  - **Multi-tenancy:** Necesario para gestión de múltiples empresas
  - **Configuración:** Permite actualizar bind_location_id y bind_price_list_id
  - **Permisos:** Solo admins pueden gestionar empresas
  - **Uso:** Dashboard admin, configuración de empresa

**Funciones:**
- `getAllCompanies()` - Listar empresas (filtrado por RLS)
- `getCompanyById()` - Obtener empresa específica
- `getMyCompany()` - Empresa del usuario actual (más común)
- `createCompany()` - Crear empresa (solo super_admins)
- `updateCompany()` - Actualizar empresa
- `deleteCompany()` - Eliminar empresa (solo super_admins)

---

### 2. `databaseFunctionsService.js`

**¿Por qué existe?**
- **Propósito:** Wrapper para funciones de BD que requieren lógica compleja
- **Fundamentación:**
  - **Abstracción:** Oculta detalles de llamadas RPC
  - **Validación:** Valida parámetros antes de llamar BD
  - **Manejo de errores:** Traduce errores de BD a errores entendibles
  - **Centralización:** Un solo lugar para funciones de BD

**Funciones:**
- `approveRequisition()` - Wrapper para `approve_requisition`
- `rejectRequisition()` - Wrapper para `reject_requisition`
- `submitRequisition()` - Wrapper para `submit_requisition`
- `useRequisitionTemplate()` - Wrapper para `use_requisition_template`
- `clearUserCart()` - Wrapper para `clear_user_cart`
- `getUniqueProductCategories()` - Wrapper para `get_unique_product_categories`
- `broadcastToCompany()` - Wrapper para `broadcast_to_company`

---

### 3. `auditLogService.js`

**¿Por qué existe?**
- **Propósito:** Acceso al log de auditoría para administradores
- **Fundamentación:**
  - **Cumplimiento:** Necesario para auditorías y compliance
  - **Troubleshooting:** Permite investigar problemas
  - **Análisis:** Permite analizar uso del sistema
  - **Permisos:** Solo admins pueden acceder

**Funciones:**
- `fetchAuditLog()` - Listar log con filtros y paginación
- `fetchAuditLogByEvent()` - Filtrar por tipo de evento
- `getAuditLogStats()` - Estadísticas del log

---

### 4. `requisitionService.js`

**¿Por qué existe?**
- **Propósito:** Servicio principal para gestión de requisiciones
- **Fundamentación:**
  - **Entidad principal:** Requisiciones son el core del sistema
  - **Operaciones complejas:** Enriquecimiento de datos con proyectos y usuarios
  - **Integración:** Usa funciones de BD cuando es apropiado
  - **Optimización:** Batch queries para evitar N+1

**Funciones:**
- `fetchRequisitions()` - Listar con paginación y sorting
- `fetchRequisitionDetails()` - Detalle completo con items
- `createRequisition()` - Crear usando `create_full_requisition`
- `updateRequisition()` - Actualizar requisición
- `submitRequisition()` - Enviar usando `submit_requisition` BD
- `updateRequisitionStatus()` - Aprobar/rechazar usando funciones BD
- `fetchPendingApprovals()` - Requisiciones pendientes

**Por qué usa funciones BD:**
- `submitRequisition()` - Lógica compleja de permisos y estados
- `updateRequisitionStatus()` - Validaciones y auditoría centralizadas
- `createRequisition()` - Transaccionalidad y generación de folio

---

### 5. `productService.js`

**¿Por qué existe?**
- **Propósito:** Gestión del catálogo de productos
- **Fundamentación:**
  - **CRUD completo:** Crear, leer, actualizar, eliminar productos
  - **Filtrado:** Por empresa, categoría, estado activo
  - **Validación:** Precios positivos, stock no negativo
  - **Integración:** Maneja bind_id para sincronización

**Funciones:**
- `fetchProducts()` - Listar con filtros y paginación
- `fetchProductById()` - Obtener producto específico
- `createProduct()` - Crear producto
- `updateProduct()` - Actualizar producto

---

### 6. `projectService.js`

**¿Por qué existe?**
- **Propósito:** Gestión de proyectos y miembros
- **Fundamentación:**
  - **Organización:** Proyectos agrupan requisiciones
  - **Permisos:** Control de acceso por proyecto
  - **Miembros:** Gestión de quién puede crear requisiciones en cada proyecto

**Funciones:**
- `getAllProjects()` - Listar proyectos (filtrado por RLS)
- `getMyProjects()` - Proyectos del usuario
- `createProject()` - Crear proyecto
- `updateProject()` - Actualizar proyecto
- `deleteProject()` - Eliminar proyecto
- `getProjectMembers()` - Miembros del proyecto
- `addProjectMember()` - Agregar miembro
- `removeProjectMember()` - Eliminar miembro
- `updateProjectMemberRole()` - Actualizar rol en proyecto

---

### 7. `templateService.js`

**¿Por qué existe?**
- **Propósito:** Gestión de plantillas de requisición
- **Fundamentación:**
  - **Productividad:** Reutilizar combinaciones comunes
  - **Estadísticas:** Tracking de uso (`usage_count`, `last_used_at`)
  - **Favoritos:** Marcar plantillas favoritas

**Funciones:**
- `fetchTemplates()` - Listar plantillas del usuario
- `createTemplate()` - Crear plantilla
- `updateTemplate()` - Actualizar plantilla
- `deleteTemplate()` - Eliminar plantilla

**Nota:** Para usar plantilla, se usa `databaseFunctionsService.useRequisitionTemplate()`

---

### 8. `notificationService.js`

**¿Por qué existe?**
- **Propósito:** Sistema de notificaciones in-app
- **Fundamentación:**
  - **UX:** Notificar cambios importantes sin requerir refresh
  - **Historial:** Mantener registro de eventos
  - **Tipos:** Diferentes tipos de notificación (success/warning/danger/info)

**Funciones:**
- `fetchNotifications()` - Listar notificaciones
- `getUnreadCount()` - Contar no leídas
- `markAsRead()` - Marcar como leída
- `markAllAsRead()` - Marcar todas como leídas
- `markAllAsUnread()` - Marcar todas como no leídas
- `deleteNotification()` - Eliminar notificación
- `createNotification()` - Crear notificación

---

### 9. `userService.js`

**¿Por qué existe?**
- **Propósito:** Gestión de usuarios de la empresa
- **Fundamentación:**
  - **Administración:** Gestionar usuarios del sistema
  - **Roles:** Asignar roles (admin/supervisor/user)
  - **Invitaciones:** Invitar nuevos usuarios

**Funciones:**
- `fetchUsersInCompany()` - Listar usuarios de la empresa
- `inviteUser()` - Invitar nuevo usuario (usa Supabase Auth Admin)
- `updateUserProfile()` - Actualizar perfil de usuario

---

### 10. `dashboardService.js`

**¿Por qué existe?**
- **Propósito:** Datos agregados para dashboards
- **Fundamentación:**
  - **Performance:** Pre-agregar datos para dashboards
  - **UX:** Cargar datos rápidamente sin queries complejas
  - **Estadísticas:** Conteos y totales por estado

**Funciones:**
- `fetchDashboardStats()` - Estadísticas del dashboard
- `fetchRecentRequisitions()` - Requisiciones recientes
- `fetchAvailableProjects()` - Proyectos disponibles

---

### 11. `searchService.js`

**¿Por qué existe?**
- **Propósito:** Búsqueda global en el sistema
- **Fundamentación:**
  - **UX:** Búsqueda rápida en productos, requisiciones, usuarios
  - **Eficiencia:** Búsqueda paralela en múltiples tablas
  - **Filtrado:** Solo resultados de la empresa del usuario

**Funciones:**
- `searchGlobal()` - Búsqueda en productos, requisiciones, usuarios

---

## 🎣 Fundamentación de Hooks

### 1. `useCart.js`

**¿Por qué existe?**
- **Propósito:** Estado y gestión del carrito de compras
- **Fundamentación:**
  - **Estado global:** Compartido entre componentes
  - **React Query:** Cache y sincronización automática
  - **Optimistic updates:** Actualización inmediata en UI
  - **Persistencia:** Carrito se guarda en BD, no solo localStorage

**Funciones:**
- `cart` - Estado del carrito
- `addToCart()` - Agregar producto
- `removeFromCart()` - Eliminar producto
- `updateQuantity()` - Actualizar cantidad
- `clearCart()` - Limpiar carrito

**Uso:**
- `Cart.jsx` - Componente de carrito
- `Catalog.jsx` - Agregar al carrito
- `Checkout.jsx` - Revisar carrito antes de crear requisición

---

### 2. `useFavorites.js`

**¿Por qué existe?**
- **Propósito:** Gestión de productos favoritos
- **Fundamentación:**
  - **Persistencia:** Guarda favoritos en BD
  - **UX:** Acceso rápido a productos comunes
  - **Sincronización:** Sincronizado entre dispositivos

**Funciones:**
- `favorites` - Set de IDs de productos favoritos
- `addFavorite()` - Agregar favorito
- `removeFavorite()` - Eliminar favorito
- `toggleFavorite()` - Alternar favorito

---

### 3. `useRequisitions.js`

**¿Por qué existe?**
- **Propósito:** Estado y gestión de requisiciones
- **Fundamentación:**
  - **React Query:** Cache y sincronización
  - **Refetch:** Invalidación automática cuando cambian datos
  - **Estado compartido:** Entre múltiples componentes

**Funciones:**
- `requisitions` - Lista de requisiciones
- `isLoading` - Estado de carga
- `refetch()` - Recargar datos
- `createRequisition()` - Crear nueva requisición
- `updateRequisition()` - Actualizar requisición

---

### 4. `useRequisitionActions.js`

**¿Por qué existe?**
- **Propósito:** Acciones específicas sobre requisiciones (aprobar/rechazar/enviar)
- **Fundamentación:**
  - **Separación de concerns:** Acciones separadas de queries
  - **Mutations:** Optimizado para operaciones de escritura
  - **Feedback:** Toast notifications automáticas
  - **Invalidación:** Limpia cache después de mutaciones

**Funciones:**
- `submit()` - Enviar requisición
- `approve()` - Aprobar requisición
- `reject()` - Rechazar requisición

**Uso:**
- `Approvals.jsx` - Página de aprobaciones
- `RequisitionDetail.jsx` - Detalle de requisición

---

### 5. `useProducts.js`

**¿Por qué existe?**
- **Propósito:** Estado y gestión de productos
- **Fundamentación:**
  - **React Query:** Cache de productos
  - **Filtrado:** Maneja filtros y paginación
  - **Refetch:** Actualización automática

---

### 6. `useUserPermissions.js`

**¿Por qué existe?**
- **Propósito:** Verificación de permisos del usuario
- **Fundamentación:**
  - **Centralización:** Lógica de permisos en un solo lugar
  - **Memoización:** Cache de permisos
  - **Helpers:** Funciones convenientes (`isAdmin()`, `isSupervisor()`)

**Funciones:**
- `hasPermission()` - Verificar permiso específico
- `isAdmin()` - Es admin?
- `isSupervisor()` - Es supervisor?
- `isUser()` - Es usuario normal?

---

### 7. `useSessionExpirationHandler.js`

**¿Por qué existe?**
- **Propósito:** Manejar expiración de sesión automáticamente
- **Fundamentación:**
  - **UX:** Redirigir automáticamente cuando expira sesión
  - **Interceptación:** Intercepta errores de autenticación
- **React Query:** Integrado con React Query para detectar errores de auth

---

### 8. `useDebounce.js`

**¿Por qué existe?**
- **Propósito:** Debounce de valores para búsquedas
- **Fundamentación:**
  - **Performance:** Evita queries excesivas durante typing
  - **UX:** Reduce carga en servidor

---

## 🔄 Flujos de Datos

### Flujo: Crear Requisición

```
1. Usuario navega a Catalog
   ↓
2. Agrega productos al carrito (useCart.js)
   ↓
3. Va a Checkout
   ↓
4. Selecciona proyecto y agrega comentarios
   ↓
5. Click en "Crear Requisición"
   ↓
6. requisitionService.createRequisition()
   ↓
7. Supabase RPC: create_full_requisition()
   ↓
8. BD ejecuta:
   - Genera folio (folio_counters)
   - Crea requisition
   - Crea requisition_items
   - Calcula total_amount
   - Registra en audit_log
   ↓
9. Limpia carrito (clear_user_cart)
   ↓
10. Retorna requisition_id
   ↓
11. React Query invalida cache
   ↓
12. UI se actualiza automáticamente
```

---

### Flujo: Aprobar Requisición

```
1. Supervisor ve requisición en Approvals.jsx
   ↓
2. Click en "Aprobar"
   ↓
3. useRequisitionActions.approve()
   ↓
4. requisitionService.updateRequisitionStatus('approved')
   ↓
5. Supabase RPC: approve_requisition()
   ↓
6. BD ejecuta:
   - Valida permisos (supervisor del proyecto o admin)
   - Valida estado ('submitted')
   - Actualiza a 'approved'
   - Establece approved_by y approved_at
   - Cambia integration_status a 'pending_sync'
   - Registra en audit_log
   ↓
7. Trigger: enqueue_requisition_for_bind()
   ↓
8. Envía a cola pgmq para sincronización externa
   ↓
9. Retorna éxito
   ↓
10. React Query invalida cache
   ↓
11. Toast notification
   ↓
12. UI se actualiza (requisición desaparece de pendientes)
```

---

## 🎯 Decisiones de Diseño

### 1. ¿Por qué funciones BD en lugar de queries directas?

**Fundamentación:**
- **Transaccionalidad:** Funciones garantizan atomicidad
- **Validación centralizada:** Lógica de negocio en un solo lugar
- **Seguridad:** SECURITY DEFINER permite bypass RLS cuando es necesario
- **Auditoría:** Funciones registran automáticamente en audit_log
- **Consistencia:** Evita que diferentes partes del código hagan validaciones diferentes

**Ejemplo:**
- `approve_requisition()` valida permisos, estado, y registra auditoría
- Si fuera query directa, cada componente tendría que hacer estas validaciones

---

### 2. ¿Por qué JSONB en `requisitions.items` además de `requisition_items`?

**Fundamentación:**
- **Eficiencia en creación:** `create_full_requisition` recibe items como JSONB
- **Lectura rápida:** Obtener items sin JOIN
- **Backup:** Si algo falla, items están en JSONB
- **Dual storage:** JSONB para eficiencia, tabla normalizada para queries

**Trade-off aceptado:**
- Duplicación de datos por performance
- La tabla normalizada es la fuente de verdad para queries complejas

---

### 3. ¿Por qué RLS en todas las tablas?

**Fundamentación:**
- **Seguridad por defecto:** Sin políticas explícitas, nada es accesible
- **Multi-tenancy:** Filtrado automático por company_id
- **Granularidad:** Permisos por rol y por recurso
- **Escalabilidad:** No requiere middleware adicional

**Ejemplo:**
- `profiles` tiene políticas para:
  - Ver propio perfil
  - Ver perfiles de la misma empresa (si eres admin)
  - Ver perfiles de proyectos donde eres supervisor

---

### 4. ¿Por qué servicios separados para funciones BD?

**Fundamentación:**
- **Separación de concerns:** Funciones BD vs queries directas
- **Reutilización:** Múltiples componentes pueden usar las mismas funciones
- **Mantenibilidad:** Cambios en BD solo requieren actualizar servicio
- **Testing:** Más fácil mockear servicios que llamadas RPC directas

---

### 5. ¿Por qué hooks personalizados?

**Fundamentación:**
- **React Query:** Cache y sincronización automática
- **Estado compartido:** Múltiples componentes comparten el mismo estado
- **Optimistic updates:** UI se actualiza inmediatamente
- **Invalidación:** Cache se limpia automáticamente cuando hay cambios

**Ejemplo:**
- `useCart()` mantiene estado sincronizado entre `Cart.jsx` y `Catalog.jsx`
- Cuando se agrega producto en Catalog, Cart se actualiza automáticamente

---

## ✅ Conclusión

Cada componente del sistema tiene un propósito claro y bien fundamentado:

### Supabase (Backend):
- **Tablas:** Modelan entidades del dominio con relaciones claras
- **Funciones:** Encapsulan lógica de negocio compleja y transaccional
- **Políticas RLS:** Garantizan seguridad y multi-tenancy
- **Triggers:** Automatizan procesos (auditoría, cálculos, sincronización)

### Webapp (Frontend):
- **Servicios:** Abstraen acceso a datos y funciones BD
- **Hooks:** Manejan estado y sincronización con React Query
- **Componentes:** Presentan datos y capturan interacciones del usuario
- **Páginas:** Organizan funcionalidades por contexto de uso

**Todo está conectado con un propósito claro y fundamentado en ambos lados.**

---

**Generado por:** Arquitectura y Fundamentación del Sistema  
**Última actualización:** 2025-01-26

