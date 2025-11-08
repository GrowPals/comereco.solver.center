# 📚 Índice de Servicios de la Webapp

**Última actualización:** 2025-01-26

Este documento lista todos los servicios disponibles en la webapp que conectan con Supabase.

---

## 📋 Servicios Disponibles

### 1. **companyService.js**
Servicio para gestionar empresas (companies).

**Funciones:**
- `getAllCompanies()` - Obtiene todas las empresas accesibles
- `getCompanyById(companyId)` - Obtiene una empresa por ID
- `getMyCompany()` - Obtiene la empresa del usuario actual
- `createCompany(companyData)` - Crea una nueva empresa (solo super_admins)
- `updateCompany(companyId, updateData)` - Actualiza una empresa
- `deleteCompany(companyId)` - Elimina una empresa (solo super_admins)

**Tabla Supabase:** `companies`

---

### 2. **databaseFunctionsService.js**
Servicio para funciones de base de datos (SECURITY DEFINER functions).

**Funciones:**
- `approveRequisition(requisitionId, comments)` - Aprueba una requisición
- `rejectRequisition(requisitionId, reason)` - Rechaza una requisición
- `submitRequisition(requisitionId)` - Envía una requisición para aprobación
- `useRequisitionTemplate(templateId)` - Usa una plantilla para crear requisición
- `clearUserCart()` - Limpia el carrito del usuario
- `getUniqueProductCategories()` - Obtiene categorías únicas de productos
- `broadcastToCompany(eventName, payload)` - Transmite evento a toda la compañía

**Funciones BD utilizadas:**
- `approve_requisition`
- `reject_requisition`
- `submit_requisition`
- `use_requisition_template`
- `clear_user_cart`
- `get_unique_product_categories`
- `broadcast_to_company`

---

### 3. **auditLogService.js**
Servicio para el log de auditoría (audit_log). Solo para administradores.

**Funciones:**
- `fetchAuditLog(filters, page, pageSize)` - Obtiene log de auditoría con filtros
- `fetchAuditLogByEvent(eventName, limit)` - Obtiene eventos por tipo
- `getAuditLogStats(startDate, endDate)` - Obtiene estadísticas del log

**Tabla Supabase:** `audit_log`

---

### 4. **requisitionService.js**
Servicio para gestionar requisiciones.

**Funciones:**
- `fetchRequisitions(page, pageSize, sortBy, ascending)` - Lista requisiciones
- `fetchRequisitionDetails(id)` - Obtiene detalle de una requisición
- `createRequisition(projectId, comments, items)` - Crea una requisición
- `updateRequisition(id, updateData)` - Actualiza una requisición
- `fetchPendingApprovals()` - Obtiene requisiciones pendientes de aprobación

**Tablas Supabase:** `requisitions`, `requisition_items`

**Funciones BD utilizadas:**
- `create_full_requisition` (ya integrada)
- `clear_user_cart` (ya integrada)

---

### 5. **templateService.js**
Servicio para plantillas de requisiciones.

**Funciones:**
- `fetchTemplates()` - Lista plantillas del usuario
- `createTemplate(templateData)` - Crea una plantilla
- `updateTemplate(id, updateData)` - Actualiza una plantilla
- `deleteTemplate(id)` - Elimina una plantilla

**Tabla Supabase:** `requisition_templates`

**Funciones BD disponibles pero no usadas:**
- `use_requisition_template` (disponible en `databaseFunctionsService`)

---

### 6. **productService.js**
Servicio para gestionar productos.

**Funciones:**
- `fetchProducts(filters, page, pageSize)` - Lista productos
- `fetchProductById(id)` - Obtiene un producto por ID
- `createProduct(productData)` - Crea un producto
- `updateProduct(id, updateData)` - Actualiza un producto

**Tabla Supabase:** `products`

**Funciones BD disponibles pero no usadas:**
- `get_unique_product_categories` (disponible en `databaseFunctionsService`)

---

### 7. **projectService.js**
Servicio para gestionar proyectos.

**Funciones:**
- `getAllProjects()` - Lista todos los proyectos
- `getMyProjects()` - Obtiene proyectos del usuario
- `createProject(projectData)` - Crea un proyecto
- `updateProject(id, updateData)` - Actualiza un proyecto
- `deleteProject(id)` - Elimina un proyecto
- `getProjectMembers(projectId)` - Obtiene miembros de un proyecto
- `addProjectMember(projectId, userId, roleInProject)` - Agrega miembro
- `removeProjectMember(projectId, userId)` - Elimina miembro
- `updateProjectMemberRole(projectId, userId, roleInProject)` - Actualiza rol

**Tablas Supabase:** `projects`, `project_members`

---

### 8. **userService.js**
Servicio para gestionar usuarios.

**Funciones:**
- `fetchUsersInCompany()` - Lista usuarios de la compañía
- `inviteUser(email, role)` - Invita un nuevo usuario
- `updateUserProfile(userId, updateData)` - Actualiza perfil de usuario

**Tabla Supabase:** `profiles`

---

### 9. **notificationService.js**
Servicio para notificaciones.

**Funciones:**
- `fetchNotifications()` - Lista notificaciones del usuario
- `getUnreadCount()` - Obtiene conteo de no leídas
- `markAsRead(id)` - Marca notificación como leída
- `markAllAsRead()` - Marca todas como leídas
- `markAllAsUnread()` - Marca todas como no leídas
- `deleteNotification(id)` - Elimina una notificación
- `createNotification(notificationData)` - Crea una notificación

**Tabla Supabase:** `notifications`

---

### 10. **dashboardService.js**
Servicio para datos del dashboard.

**Funciones:**
- `fetchDashboardStats()` - Obtiene estadísticas del dashboard
- `fetchRecentRequisitions(limit)` - Obtiene requisiciones recientes
- `fetchAvailableProjects()` - Obtiene proyectos disponibles

**Tablas Supabase:** `requisitions`, `projects`

---

### 11. **searchService.js**
Servicio para búsqueda global.

**Funciones:**
- `searchGlobal(searchTerm, companyId)` - Búsqueda global en productos, requisiciones y usuarios

**Tablas Supabase:** `products`, `requisitions`, `profiles`

---

### 12. **authService.js**
Servicio para autenticación.

**Funciones:**
- Funciones de autenticación (login, logout, etc.)

**Tabla Supabase:** `auth.users` (manejado por Supabase Auth)

---

## 🎯 Hooks Disponibles

### useCart.js
Hook para gestionar el carrito de compras.

**Funciones:**
- `cart`, `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`

**Tabla Supabase:** `user_cart_items`

**Funciones BD disponibles pero no usadas:**
- `clear_user_cart` (disponible en `databaseFunctionsService`)

---

### useFavorites.js
Hook para favoritos.

**Funciones:**
- `favorites`, `addFavorite()`, `removeFavorite()`, `toggleFavorite()`

**Tabla Supabase:** `user_favorites`

---

### useRequisitions.js
Hook para requisiciones.

**Funciones:**
- `requisitions`, `isLoading`, `refetch()`, `createRequisition()`, `updateRequisition()`

**Usa:** `requisitionService`

---

### useRequisitionActions.js
Hook para acciones de requisiciones.

**Funciones:**
- `approveRequisition()`, `rejectRequisition()`, `submitRequisition()`

**Usa:** `requisitionService` (debería usar `databaseFunctionsService`)

---

### useProducts.js
Hook para productos.

**Funciones:**
- `products`, `isLoading`, `refetch()`, `createProduct()`, `updateProduct()`

**Usa:** `productService`

---

### useUserPermissions.js
Hook para permisos de usuario.

**Funciones:**
- `hasPermission()`, `isAdmin()`, `isSupervisor()`, `isUser()`

**Tabla Supabase:** `profiles` (campo `role_v2`)

---

## 📊 Resumen de Cobertura

### ✅ Tablas con Servicios Completos:
- ✅ `companies` - `companyService.js`
- ✅ `profiles` - `userService.js`
- ✅ `products` - `productService.js`
- ✅ `projects` - `projectService.js`
- ✅ `project_members` - `projectService.js`
- ✅ `requisitions` - `requisitionService.js`
- ✅ `requisition_items` - `requisitionService.js`
- ✅ `requisition_templates` - `templateService.js`
- ✅ `notifications` - `notificationService.js`
- ✅ `user_cart_items` - `useCart.js` hook
- ✅ `user_favorites` - `useFavorites.js` hook
- ✅ `audit_log` - `auditLogService.js`

### ✅ Funciones de BD Disponibles:
- ✅ `approve_requisition` - `databaseFunctionsService.js`
- ✅ `reject_requisition` - `databaseFunctionsService.js`
- ✅ `submit_requisition` - `databaseFunctionsService.js`
- ✅ `create_full_requisition` - `requisitionService.js` (ya integrada)
- ✅ `use_requisition_template` - `databaseFunctionsService.js`
- ✅ `clear_user_cart` - `databaseFunctionsService.js`
- ✅ `get_unique_product_categories` - `databaseFunctionsService.js`
- ✅ `broadcast_to_company` - `databaseFunctionsService.js`

### ⚠️ Pendiente de Integración:
- `folio_sequences` - Tabla de backend, no necesita servicio frontend (se usa automáticamente)

---

## 🔄 Mejoras Recomendadas

1. **Actualizar `useRequisitionActions.js`** para usar `databaseFunctionsService` en lugar de hacer queries directas
2. **Actualizar `useCart.js`** para usar `clear_user_cart` de `databaseFunctionsService` cuando sea apropiado
3. **Actualizar `templateService.js`** para usar `use_requisition_template` cuando sea apropiado
4. **Actualizar `productService.js`** para usar `get_unique_product_categories` cuando sea apropiado

---

**Estado:** ✅ **Todas las tablas y funciones de Supabase están disponibles en la webapp**
