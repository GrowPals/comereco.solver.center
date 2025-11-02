# 🎯 Fundamentación Completa del Sistema ComerECO

**Fecha:** 2025-01-26  
**Proyecto:** ComerECO - Sistema de Requisiciones Grupo Solven

---

## 📋 Resumen Ejecutivo

Este documento fundamenta **cada componente** del sistema, explicando el "por qué" de su existencia tanto en Supabase (backend) como en la webapp (frontend).

---

## 🏗️ Principios de Diseño

### 1. **Separación de Responsabilidades**
- **Backend (Supabase):** Lógica de negocio, validaciones, transaccionalidad, seguridad
- **Frontend (Webapp):** Presentación, interacción del usuario, estado de UI, feedback

### 2. **Seguridad por Defecto**
- RLS habilitado en todas las tablas
- Funciones SECURITY DEFINER para operaciones sensibles
- Validación de permisos en múltiples capas

### 3. **Performance y Escalabilidad**
- Índices estratégicos (aunque algunos no usados aún, preparados para crecimiento)
- Batch queries para evitar N+1
- React Query para cache y sincronización

### 4. **Mantenibilidad**
- Servicios centralizados
- Funciones reutilizables
- Documentación completa

---

## 📊 Fundamentación Detallada por Capa

### CAPA 1: Base de Datos (Supabase)

#### Tablas - Propósito y Fundamentación

**1. `companies` - Multi-tenancy**
- ✅ **Propósito:** Soporta múltiples empresas en el mismo sistema
- ✅ **Fundamentación:** 
  - Reducción de costos (una instancia para múltiples empresas)
  - Aislamiento de datos por empresa
  - Configuración independiente por empresa (`bind_location_id`, `bind_price_list_id`)
- ✅ **Uso:** Todas las tablas principales referencian companies

**2. `profiles` - Extensión de Auth**
- ✅ **Propósito:** Datos de negocio que no están en `auth.users`
- ✅ **Fundamentación:**
  - Supabase Auth solo maneja autenticación
  - Necesitamos `company_id` para multi-tenancy
  - Necesitamos `role_v2` para permisos de negocio
  - Necesitamos `full_name`, `avatar_url` para UX
- ✅ **Evolución:** `role` (legacy) → `role_v2` (actual)

**3. `products` - Catálogo Centralizado**
- ✅ **Propósito:** Catálogo único de productos por empresa
- ✅ **Fundamentación:**
  - Evita duplicación de productos en cada requisición
  - Control centralizado de precios y stock
  - Integración con sistema externo (`bind_id`)
  - Filtrado por categoría y estado activo
- ✅ **Uso:** Requisiciones, carrito, favoritos

**4. `projects` - Organización**
- ✅ **Propósito:** Agrupar requisiciones por proyecto/obra/departamento
- ✅ **Fundamentación:**
  - Control presupuestario por proyecto
  - Asignación de supervisores por proyecto
  - Permisos granulares (usuarios solo ven sus proyectos)
  - Trazabilidad y reporting por proyecto
- ✅ **Uso:** Requisiciones, dashboards, reportes

**5. `project_members` - Permisos Granulares**
- ✅ **Propósito:** Relación muchos-a-muchos usuarios-proyectos
- ✅ **Fundamentación:**
  - Usuarios pueden estar en múltiples proyectos
  - Control de acceso por proyecto
  - Roles específicos por proyecto (`role_in_project`)
- ✅ **Uso:** Filtrado de requisiciones, permisos

**6. `requisitions` - Entidad Principal**
- ✅ **Propósito:** Solicitudes de compra - core del sistema
- ✅ **Fundamentación:**
  - Representa el ciclo de vida completo (draft → submitted → approved → ordered)
  - Estados de negocio (`business_status`) y de integración (`integration_status`)
  - Generación automática de folios (`internal_folio`)
  - Integración bidireccional con sistema externo
  - Dual storage: `items` JSONB (eficiencia) + `requisition_items` (queries)
- ✅ **Uso:** Dashboard, aprobaciones, historial, detalle

**7. `requisition_items` - Normalización**
- ✅ **Propósito:** Items normalizados de requisiciones
- ✅ **Fundamentación:**
  - Permite queries eficientes sobre items individuales
  - Facilita cálculos de totales
  - Permite actualizar precios históricos
  - Facilita reportes y análisis
- ✅ **Uso:** Detalle de requisición, cálculos, reportes

**8. `requisition_templates` - Productividad**
- ✅ **Propósito:** Reutilizar combinaciones comunes de productos
- ✅ **Fundamentación:**
  - Usuarios frecuentemente compran los mismos productos
  - Reduce tiempo de creación (de minutos a segundos)
  - Estadísticas de uso (`usage_count`, `last_used_at`)
  - Favoritos (`is_favorite`)
- ✅ **Uso:** Templates.jsx, NewRequisition.jsx

**9. `notifications` - Comunicación**
- ✅ **Propósito:** Sistema de notificaciones in-app
- ✅ **Fundamentación:**
  - Notificar cambios de estado sin requerir refresh
  - Historial de eventos importantes
  - Diferentes tipos (success/warning/danger/info)
  - Mejora UX significativamente
- ✅ **Uso:** NotificationCenter.jsx, Notifications.jsx

**10. `user_cart_items` - Carrito Temporal**
- ✅ **Propósito:** Carrito antes de crear requisición
- ✅ **Fundamentación:**
  - Permite seleccionar múltiples productos antes de confirmar
  - Persistente entre sesiones (a diferencia de localStorage)
  - Facilita creación de requisiciones con múltiples productos
  - Gestión de cantidad antes de confirmar
- ✅ **Uso:** Cart.jsx, Catalog.jsx, Checkout.jsx

**11. `user_favorites` - Productos Favoritos**
- ✅ **Propósito:** Marcar productos frecuentemente usados
- ✅ **Fundamentación:**
  - Acceso rápido a productos comunes
  - Mejora UX al crear requisiciones
  - No requiere búsqueda repetida
  - Sincronizado entre dispositivos
- ✅ **Uso:** Favorites.jsx, Catalog.jsx

**12. `audit_log` - Trazabilidad**
- ✅ **Propósito:** Registrar todas las acciones importantes
- ✅ **Fundamentación:**
  - Compliance y cumplimiento normativo
  - Debugging y troubleshooting
  - Análisis de uso del sistema
  - Seguridad y detección de anomalías
- ✅ **Uso:** AdminDashboard.jsx (potencial), reportes

**13. `folio_counters` - Generación de Folios**
- ✅ **Propósito:** Generar folios únicos secuenciales por año
- ✅ **Fundamentación:**
  - Formato estándar `REQ-YYYY-####`
  - Evita colisiones usando contadores por año
  - Transaccional para evitar condiciones de carrera
  - No necesita servicio frontend (se usa automáticamente)
- ✅ **Uso:** Automático en `create_full_requisition`

---

#### Funciones BD - Propósito y Fundamentación

**Funciones de Negocio (SECURITY DEFINER):**

**1. `approve_requisition(p_requisition_id, p_comments)`**
- ✅ **Propósito:** Aprobar requisición con validaciones completas
- ✅ **Por qué función BD:**
  - Validación de permisos compleja (supervisor del proyecto O admin)
  - Validación de estado (solo 'submitted')
  - Actualización transaccional (estado + approved_by + approved_at)
  - Cambio automático de integration_status
  - Auditoría automática
  - **Si fuera query directa:** Cada componente tendría que hacer estas validaciones

**2. `reject_requisition(p_requisition_id, p_reason)`**
- ✅ **Propósito:** Rechazar requisición con razón
- ✅ **Por qué función BD:**
  - Similar a approve pero con validación de razón requerida
  - Guarda `rejection_reason` para auditoría
  - Permite que usuario pueda volver a editar (cambiar a draft)
  - **Centraliza lógica de rechazo**

**3. `submit_requisition(p_requisition_id)`**
- ✅ **Propósito:** Enviar requisición para aprobación
- ✅ **Por qué función BD:**
  - Verifica que usuario sea el creador
  - Verifica que esté en estado 'draft'
  - Determina si requiere aprobación o puede aprobarse automáticamente
  - Basado en `project_members.requires_approval`
  - **Lógica compleja que requiere queries múltiples**

**4. `create_full_requisition(p_project_id?, p_comments, p_items)`**
- ✅ **Propósito:** Crear requisición completa transaccionalmente
- ✅ **Por qué función BD:**
  - **Transaccionalidad:** Todo o nada (requisition + items + folio)
  - Genera folio único usando `folio_counters`
  - Valida stock suficiente para cada producto
  - Valida que productos existan y pertenezcan a la empresa
  - Calcula `total_amount` automáticamente
  - Crea registros en `requisition_items`
  - Registra en `audit_log`
  - **Si fuera múltiples queries:** Posible inconsistencia si falla algo

**5. `use_requisition_template(p_template_id)`**
- ✅ **Propósito:** Crear requisición desde plantilla
- ✅ **Por qué función BD:**
  - **Bloqueo:** Usa `FOR UPDATE` para evitar condiciones de carrera
  - Verifica que plantilla pertenece al usuario
  - Crea requisición usando `create_full_requisition`
  - Actualiza estadísticas (`usage_count`, `last_used_at`)
  - **Transaccional:** Todo o nada

**6. `clear_user_cart()`**
- ✅ **Propósito:** Limpiar carrito del usuario actual
- ✅ **Por qué función BD:**
  - **SECURITY DEFINER:** Usa `auth.uid()` directamente, no requiere parámetro
  - Transaccional: Limpia todo en una operación
  - Retorna conteo de items eliminados
  - **Seguridad:** Solo limpia carrito del usuario autenticado

**7. `get_unique_product_categories(company_id_param?)`**
- ✅ **Propósito:** Obtener categorías únicas de productos activos
- ✅ **Por qué función BD:**
  - Filtrado eficiente (solo activos, solo de la empresa)
  - Ordenamiento automático
  - Evita query complejo en frontend
  - **Optimización:** Puede usar índices específicos

**8. `broadcast_to_company(event_name, payload)`**
- ✅ **Propósito:** Comunicación en tiempo real entre usuarios
- ✅ **Por qué función BD:**
  - Usa Supabase Realtime (`realtime.broadcast`)
  - Topic por empresa: `company:{company_id}:{event_name}`
  - **Caso de uso:** Notificaciones en tiempo real (no implementado aún pero preparado)

**Triggers y Helpers:**

**9. `calculate_item_subtotal()` (trigger)**
- ✅ **Propósito:** Calcular subtotal automáticamente
- ✅ **Por qué trigger:**
  - Garantiza que `subtotal = quantity * unit_price` siempre
  - Evita inconsistencias manuales
  - Se ejecuta automáticamente al insertar/actualizar

**10. `update_requisition_total()` (trigger)**
- ✅ **Propósito:** Actualizar total_amount cuando cambian items
- ✅ **Por qué trigger:**
  - Mantiene `total_amount` sincronizado con items
  - Evita tener que calcular manualmente
  - Se ejecuta automáticamente cuando cambian requisition_items

**11. `validate_requisition_status_transition()` (trigger)**
- ✅ **Propósito:** Validar transiciones de estado válidas
- ✅ **Por qué trigger:**
  - Estado machine: Solo permite transiciones válidas
  - Validación de permisos por rol
  - Auditoría automática de cambios
  - **Centraliza lógica compleja de estados**

**12. `enqueue_requisition_for_bind()` (trigger)**
- ✅ **Propósito:** Enviar a cola de sincronización con sistema externo
- ✅ **Por qué trigger:**
  - Integración asíncrona con sistema externo (SAP/Oracle)
  - Se ejecuta automáticamente cuando `integration_status` cambia a 'pending_sync'
  - Usa pgmq (PostgreSQL Message Queue)
  - Prepara payload en formato para sistema externo
  - **Automatización:** No requiere intervención manual

**13. `handle_new_user()` (trigger)**
- ✅ **Propósito:** Crear perfil automáticamente al registrar usuario
- ✅ **Por qué trigger:**
  - Garantiza que cada usuario tenga perfil
  - No requiere intervención manual
  - Inicializa valores por defecto (role_v2 = 'user')
  - **Consistencia:** Evita usuarios sin perfil

**14. `is_admin()`, `is_supervisor()`, `get_user_role_v2()`**
- ✅ **Propósito:** Helpers para políticas RLS y funciones
- ✅ **Por qué funciones:**
  - Evitan duplicación de código en políticas RLS
  - Centralizan lógica de verificación de roles
  - `SECURITY DEFINER` permite bypass RLS cuando es necesario
  - **Mantenibilidad:** Cambio en un solo lugar

---

### CAPA 2: Servicios Webapp

**1. `companyService.js`**
- ✅ **Propósito:** Gestión de empresas
- ✅ **Por qué servicio separado:**
  - Multi-tenancy requiere gestión de empresas
  - Configuración de bind_location_id y bind_price_list_id
  - Solo admins pueden gestionar empresas
  - **Separación:** Lógica específica de empresas

**2. `databaseFunctionsService.js`**
- ✅ **Propósito:** Wrapper para funciones de BD
- ✅ **Por qué servicio separado:**
  - **Abstracción:** Oculta detalles de llamadas RPC
  - **Validación:** Valida parámetros antes de llamar BD
  - **Manejo de errores:** Traduce errores de BD a errores entendibles
  - **Centralización:** Un solo lugar para funciones de BD
  - **Reutilización:** Múltiples componentes pueden usar las mismas funciones

**3. `auditLogService.js`**
- ✅ **Propósito:** Acceso al log de auditoría
- ✅ **Por qué servicio separado:**
  - Solo para administradores
  - Consultas complejas con filtros y paginación
  - Enriquecimiento de datos (usuarios, empresas)
  - **Separación:** Lógica específica de auditoría

**4. `requisitionService.js`**
- ✅ **Propósito:** Servicio principal para requisiciones
- ✅ **Por qué servicio principal:**
  - Requisiciones son el core del sistema
  - Operaciones complejas (enriquecimiento con proyectos y usuarios)
  - Integración con funciones BD cuando es apropiado
  - Batch queries para evitar N+1
  - **Centralización:** Toda la lógica de requisiciones en un lugar

**5. `productService.js`**
- ✅ **Propósito:** Gestión del catálogo
- ✅ **Por qué servicio separado:**
  - CRUD completo de productos
  - Filtrado por empresa, categoría, estado
  - Validación de precios y stock
  - **Separación:** Lógica específica de productos

**6. `projectService.js`**
- ✅ **Propósito:** Gestión de proyectos y miembros
- ✅ **Por qué servicio separado:**
  - CRUD completo de proyectos
  - Gestión de miembros de proyecto
  - Permisos granulares
  - **Separación:** Lógica específica de proyectos

**7. `templateService.js`**
- ✅ **Propósito:** Gestión de plantillas
- ✅ **Por qué servicio separado:**
  - CRUD completo de plantillas
  - Estadísticas de uso
  - Favoritos
  - **Separación:** Lógica específica de plantillas

**8. `notificationService.js`**
- ✅ **Propósito:** Sistema de notificaciones
- ✅ **Por qué servicio separado:**
  - CRUD completo de notificaciones
  - Conteo de no leídas
  - Marcado como leída/no leída
  - **Separación:** Lógica específica de notificaciones

**9. `userService.js`**
- ✅ **Propósito:** Gestión de usuarios
- ✅ **Por qué servicio separado:**
  - Listar usuarios de la empresa
  - Invitar nuevos usuarios (integración con Supabase Auth Admin)
  - Actualizar perfiles
  - **Separación:** Lógica específica de usuarios

**10. `dashboardService.js`**
- ✅ **Propósito:** Datos agregados para dashboards
- ✅ **Por qué servicio separado:**
  - Pre-agregación de datos para performance
  - Estadísticas del dashboard
  - Requisiciones recientes
  - **Optimización:** Evita queries complejas en componentes

**11. `searchService.js`**
- ✅ **Propósito:** Búsqueda global
- ✅ **Por qué servicio separado:**
  - Búsqueda paralela en múltiples tablas
  - Filtrado por empresa automático
  - Límite de resultados para performance
  - **Separación:** Lógica específica de búsqueda

---

### CAPA 3: Hooks Webapp

**1. `useCart.js`**
- ✅ **Propósito:** Estado y gestión del carrito
- ✅ **Por qué hook:**
  - Estado compartido entre múltiples componentes (Cart, Catalog, Checkout)
  - React Query cache y sincronización automática
  - Optimistic updates para mejor UX
  - Cálculos automáticos (subtotal, IVA, total)
  - **Reutilización:** Un solo hook para todo el carrito

**2. `useFavorites.js`**
- ✅ **Propósito:** Gestión de productos favoritos
- ✅ **Por qué hook:**
  - Estado compartido entre Catalog y Favorites
  - Persistencia en BD (sincronizado entre dispositivos)
  - React Query cache
  - **Reutilización:** Un solo hook para favoritos

**3. `useRequisitions.js`**
- ✅ **Propósito:** Estado y gestión de requisiciones
- ✅ **Por qué hook:**
  - Estado compartido entre múltiples componentes
  - React Query cache y refetch automático
  - Invalidación automática cuando hay cambios
  - **Reutilización:** Un solo hook para requisiciones

**4. `useRequisitionActions.js`**
- ✅ **Propósito:** Acciones específicas (aprobar/rechazar/enviar)
- ✅ **Por qué hook separado:**
  - Separación de concerns: queries vs mutations
  - Optimizado para operaciones de escritura
  - Toast notifications automáticas
  - Invalidación automática de cache
  - **Separación:** Acciones separadas de queries

**5. `useProducts.js`**
- ✅ **Propósito:** Estado y gestión de productos
- ✅ **Por qué hook:**
  - React Query cache
  - Filtrado y paginación
  - Refetch automático
  - **Reutilización:** Un solo hook para productos

**6. `useUserPermissions.js`**
- ✅ **Propósito:** Verificación de permisos
- ✅ **Por qué hook:**
  - Centralización de lógica de permisos
  - Memoización para performance
  - Helpers convenientes (isAdmin, isSupervisor, isUser)
  - **Reutilización:** Usado en múltiples componentes para verificar permisos

**7. `useSessionExpirationHandler.js`**
- ✅ **Propósito:** Manejar expiración de sesión automáticamente
- ✅ **Por qué hook:**
  - UX: Redirigir automáticamente cuando expira sesión
  - Integración con React Query para detectar errores de auth
  - Interceptación de errores de autenticación
  - **Automatización:** No requiere intervención manual del usuario

**8. `useDebounce.js`**
- ✅ **Propósito:** Debounce de valores para búsquedas
- ✅ **Por qué hook:**
  - Performance: Evita queries excesivas durante typing
  - UX: Reduce carga en servidor
  - **Optimización:** Mejora experiencia de búsqueda

---

## 🔄 Flujos Fundamentados

### Flujo 1: Crear Requisición desde Carrito

**Cada paso tiene propósito:**

1. **Usuario agrega productos al carrito**
   - ✅ **Propósito:** Seleccionar productos antes de crear requisición
   - ✅ **Fundamentación:** Carrito permite agregar múltiples productos sin crear requisición inmediatamente

2. **Usuario va a Checkout**
   - ✅ **Propósito:** Revisar y confirmar antes de crear requisición
   - ✅ **Fundamentación:** UX - permite revisar antes de confirmar, evitar errores

3. **Usuario selecciona proyecto y agrega comentarios**
   - ✅ **Propósito:** Contexto de la requisición
   - ✅ **Fundamentación:** Requisiciones deben estar asociadas a un proyecto para aprobación

4. **Click en "Crear Requisición"**
   - ✅ **Propósito:** Crear requisición desde carrito
   - ✅ **Fundamentación:** Flujo optimizado para usuarios frecuentes

5. **requisitionService.createRequisition()**
   - ✅ **Propósito:** Abstraer creación de requisición
   - ✅ **Fundamentación:** Reutilizable desde múltiples lugares (Checkout, NewRequisition)

6. **Supabase RPC: create_full_requisition()**
   - ✅ **Propósito:** Crear requisición transaccionalmente
   - ✅ **Fundamentación:** Garantiza atomicidad, validaciones, generación de folio

7. **BD genera folio automáticamente**
   - ✅ **Propósito:** Folio único y secuencial
   - ✅ **Fundamentación:** Trazabilidad y formato estándar (REQ-YYYY-####)

8. **BD limpia carrito automáticamente**
   - ✅ **Propósito:** Carrito se usa solo una vez
   - ✅ **Fundamentación:** Evita crear requisiciones duplicadas

9. **UI se actualiza automáticamente**
   - ✅ **Propósito:** Feedback inmediato al usuario
   - ✅ **Fundamentación:** React Query invalida cache automáticamente

---

### Flujo 2: Aprobar Requisición

**Cada paso tiene propósito:**

1. **Supervisor ve requisición en Approvals.jsx**
   - ✅ **Propósito:** Listar requisiciones pendientes
   - ✅ **Fundamentación:** Dashboard específico para supervisores

2. **Click en "Aprobar"**
   - ✅ **Propósito:** Acción rápida de aprobación
   - ✅ **Fundamentación:** UX - acción común necesita ser rápida

3. **useRequisitionActions.approve()**
   - ✅ **Propósito:** Encapsular lógica de aprobación
   - ✅ **Fundamentación:** Reutilizable, maneja mutations y feedback

4. **requisitionService.updateRequisitionStatus('approved')**
   - ✅ **Propósito:** Wrapper para función BD
   - ✅ **Fundamentación:** Validación de parámetros, manejo de errores

5. **Supabase RPC: approve_requisition()**
   - ✅ **Propósito:** Validar y aprobar con lógica de negocio
   - ✅ **Fundamentación:** Centraliza validaciones, permisos, auditoría

6. **BD valida permisos**
   - ✅ **Propósito:** Seguridad y control de acceso
   - ✅ **Fundamentación:** Solo quien debe aprobar puede aprobar

7. **BD actualiza estado y registra auditoría**
   - ✅ **Propósito:** Trazabilidad completa
   - ✅ **Fundamentación:** Compliance y debugging

8. **BD trigger enqueue_requisition_for_bind()**
   - ✅ **Propósito:** Integración automática con sistema externo
   - ✅ **Fundamentación:** Sincronización asíncrona sin intervención manual

9. **UI se actualiza automáticamente**
   - ✅ **Propósito:** Feedback inmediato
   - ✅ **Fundamentación:** React Query invalida cache, requisición desaparece de pendientes

---

## ✅ Verificación Final

### ✅ Todas las Tablas:
- ✅ **13 tablas** - Todas tienen propósito claro y fundamentado
- ✅ **Todas conectadas** - Relaciones bien definidas
- ✅ **Todas tienen RLS** - Seguridad por defecto

### ✅ Todas las Funciones BD:
- ✅ **14+ funciones** - Todas tienen propósito claro y fundamentado
- ✅ **Todas tienen SET search_path** - Seguridad garantizada
- ✅ **Todas disponibles en servicios** - Acceso desde webapp

### ✅ Todos los Servicios:
- ✅ **11 servicios** - Todos tienen propósito claro y fundamentado
- ✅ **Todos bien organizados** - Separación de concerns
- ✅ **Todos documentados** - Propósito claro

### ✅ Todos los Hooks:
- ✅ **8 hooks** - Todos tienen propósito claro y fundamentado
- ✅ **Todos bien diseñados** - React Query integrado
- ✅ **Todos reutilizables** - Estado compartido

### ✅ Todos los Componentes:
- ✅ **16+ páginas** - Todas tienen propósito claro y fundamentado
- ✅ **Todas conectadas** - Usan servicios/hooks apropiados
- ✅ **Todas documentadas** - Flujos claros

---

## 🎯 Conclusión

**Estado:** ✅ **SISTEMA COMPLETAMENTE FUNDAMENTADO**

**Cada componente tiene:**
- ✅ Un propósito claro
- ✅ Fundamentación técnica sólida
- ✅ Justificación de diseño
- ✅ Conexión apropiada con otros componentes
- ✅ Documentación completa

**No hay código sin propósito. Todo está conectado con fundamentación clara en ambos lados (Supabase y Webapp).**

---

**Generado por:** Fundamentación Completa del Sistema  
**Última actualización:** 2025-01-26

