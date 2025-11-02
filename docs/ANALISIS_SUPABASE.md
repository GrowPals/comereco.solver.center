# ANÁLISIS DE INTEGRACIÓN SUPABASE - COMERECO WEBAPP

## RESUMEN EJECUTIVO

Este documento contiene un análisis completo de la integración con Supabase en la aplicación ComerECO WebApp, identificando problemas, vulnerabilidades, inconsistencias y áreas de mejora. El análisis se basa en la revisión de 24 archivos que interactúan con Supabase.

---

## ARQUITECTURA ACTUAL

### 1. CLIENTE SUPABASE

**Archivo**: `src/lib/customSupabaseClient.js`

- ✅ Cliente único centralizado
- ❌ **CRÍTICO**: Claves hardcodeadas en el código fuente
- ❌ No hay gestión de refresh tokens
- ❌ No hay manejo de conexión perdida/reconexión

### 2. AUTENTICACIÓN

**Archivo**: `src/contexts/SupabaseAuthContext.jsx`

- ✅ Context Provider bien estructurado
- ✅ Manejo de sesión inicial
- ✅ Subscripción a cambios de auth
- ⚠️ `fetchProfile` no maneja errores de permisos RLS
- ⚠️ `updateUser` no valida permisos antes de actualizar
- ⚠️ No hay manejo de expiración de sesión
- ⚠️ No hay refresh token automático

### 3. SERVICIOS

#### RequisitionService (`src/services/requisitionService.js`)

- ✅ Queries bien estructuradas
- ✅ Manejo de errores básico
- ⚠️ No valida permisos antes de operaciones
- ⚠️ `updateRequisitionBusinessStatus` no valida transiciones válidas
- ⚠️ Paginación básica sin cursor-based pagination

#### ProductService (`src/services/productService.js`)

- ✅ Búsqueda con filtros
- ✅ Manejo de errores con fallback
- ⚠️ Query de búsqueda puede ser ineficiente con muchos productos
- ⚠️ `getCategories` usa RPC que podría no existir

#### TemplateService (`src/services/templateService.js`)

- ⚠️ **CRÍTICO**: `getTemplates()` llama `supabase.auth.getUser()` directamente en lugar de usar contexto
- ⚠️ `saveTemplate()` hace dos queries separadas que podrían fallar entre sí
- ⚠️ No valida permisos antes de eliminar templates

#### SearchService (`src/services/searchService.js`)

- ✅ Búsqueda paralela eficiente
- ⚠️ No valida longitud mínima de query en servidor
- ⚠️ Logs errores pero continúa, podría enmascarar problemas

### 4. CONTEXTOS

#### CartContext (`src/context/CartContext.jsx`)

- ✅ Actualización optimista bien implementada
- ✅ Manejo de errores con rollback
- ⚠️ `broadcastCartUpdate()` no maneja errores silenciosamente
- ⚠️ No hay rate limiting en updates
- ⚠️ `upsert` puede fallar si hay conflictos de concurrencia

#### RequisitionContext (`src/context/RequisitionContext.jsx`)

- ⚠️ **CRÍTICO**: Dos operaciones separadas sin transacción:
  1. `create_full_requisition` RPC
  2. Update de `business_status` a 'submitted'
  Si la segunda falla, queda en estado inconsistente
- ⚠️ No valida stock antes de crear requisición
- ⚠️ Manejo de errores genérico

#### FavoritesContext (`src/context/FavoritesContext.jsx`)

- ✅ Actualización optimista
- ✅ Rollback en caso de error
- ⚠️ No valida que el producto exista antes de agregar a favoritos

### 5. REAL-TIME (BROADCASTING)

**Archivo**: `src/App.jsx` (líneas 68-98)

- ✅ Subscripción a canal de compañía
- ⚠️ No hay manejo de desconexión/reconexión
- ⚠️ No hay cleanup de canales múltiples si el usuario cambia de compañía
- ⚠️ No valida que `user.company_id` exista antes de subscribirse

---

## PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICOS

1. **SEGURIDAD: Claves Hardcodeadas**
   - Ubicación: `src/lib/customSupabaseClient.js`
   - Problema: Claves de API expuestas en código fuente
   - Impacto: Vulnerable a exposición en repositorios públicos
   - Solución: Usar variables de entorno

2. **TRANSACCIONES ATÓMICAS**
   - Ubicación: `src/context/RequisitionContext.jsx` (líneas 52-70)
   - Problema: Creación de requisición y actualización de estado son dos operaciones separadas
   - Impacto: Estado inconsistente si la segunda operación falla
   - Solución: Mover lógica a función RPC única o usar transacciones

3. **AUTENTICACIÓN DIRECTA EN SERVICIOS**
   - Ubicación: `src/services/templateService.js` (líneas 10, 36-37)
   - Problema: Llama `supabase.auth.getUser()` directamente en lugar de usar contexto
   - Impacto: Puede causar inconsistencias si el contexto no está sincronizado
   - Solución: Usar `useSupabaseAuth` hook o pasar usuario como parámetro

4. **VULNERABILIDAD: Interpolación de Strings en Queries**
   - Ubicación: `src/services/searchService.js` (líneas 24, 31, 38), `src/services/productService.js` (línea 35)
   - Problema: Interpolación directa de strings en `.or()` y `.ilike()` sin sanitización explícita
   - Impacto: Potencial SQL injection si Supabase no sanitiza correctamente
   - Solución: Usar parámetros seguros o validar/sanitizar inputs antes de usar

5. **REAL-TIME: Filtros Inseguros**
   - Ubicación: `src/components/layout/NotificationCenter.jsx` (línea 106)
   - Problema: Filter usa interpolación directa `filter: \`user_id=eq.${user.id}\``
   - Impacto: Vulnerable a inyección si user.id puede ser manipulado
   - Solución: Usar sintaxis segura de Supabase con objetos

6. **NOTIFICACIONES: Query Sin Filtro de Usuario**
   - Ubicación: `src/components/layout/NotificationCenter.jsx` (líneas 26-37)
   - Problema: `getNotifications()` no filtra por `user_id`, trae todas las notificaciones
   - Impacto: Exposición de datos de otros usuarios si RLS no está configurado
   - Solución: Agregar filtro `.eq('user_id', user.id)` en la query

### 🟡 IMPORTANTES

7. **MANEJO DE ERRORES INCONSISTENTE**
   - Algunos archivos usan try-catch, otros solo verifican `error`
   - Algunos errores se loguean pero no se muestran al usuario
   - Solución: Estandarizar manejo de errores

8. **VALIDACIÓN DE PERMISOS**
   - No hay validación explícita de permisos antes de operaciones sensibles
   - Se confía completamente en RLS (Row Level Security)
   - Solución: Agregar validaciones adicionales en el cliente

9. **GESTIÓN DE SESIÓN**
   - No hay refresh automático de tokens
   - No hay manejo de expiración de sesión
   - Solución: Implementar refresh automático y redirección al login

10. **QUERIES INEFICIENTES**

- `getProducts` puede ser lenta con muchos productos
- Búsqueda global sin límites adecuados
- Solución: Implementar índices y optimizar queries

11. **CONCURRENCIA**

- `CartContext` puede tener race conditions en updates rápidos
- No hay locking para operaciones críticas
- Solución: Implementar debouncing o locking

12. **REAL-TIME: Memory Leaks y Cleanup**

- Ubicación: `src/components/layout/NotificationCenter.jsx`, `src/App.jsx`
- Problema: Los canales de real-time pueden no limpiarse correctamente si el componente se desmonta rápido
- Impacto: Memory leaks y múltiples subscripciones activas
- Solución: Mejorar cleanup y verificar estado de subscripción antes de subscribirse

13. **PÁGINAS CON DATOS MOCK**

- Ubicación: `src/pages/Dashboard.jsx`, `src/pages/Users.jsx`, `src/pages/Profile.jsx`
- Problema: Usan datos hardcodeados en lugar de queries a Supabase
- Impacto: Datos no reales, funcionalidad incompleta
- Solución: Implementar queries reales a Supabase

14. **HOOKS INCORRECTOS**

- Ubicación: `src/pages/Profile.jsx` (línea 41)
- Problema: Llama `logout()` que no existe, debería ser `signOut()`
- Impacto: Error en runtime al intentar cerrar sesión
- Solución: Corregir nombre del método

15. **CHECKOUT: Propiedades Faltantes**

- Ubicación: `src/pages/Checkout.jsx` (línea 24)
- Problema: Usa `vat` y `total` del hook `useCart` que no están definidos
- Impacto: Errores en runtime o valores undefined
- Solución: Implementar cálculo de IVA y total en CartContext

16. **REQUISITION DETAIL: Sin Real-Time**

- Ubicación: `src/pages/RequisitionDetail.jsx`
- Problema: No hay subscripción a cambios en tiempo real de la requisición
- Impacto: Usuario no ve actualizaciones hasta recargar página
- Solución: Agregar subscripción a cambios de requisición

### 🟢 MEJORAS

17. **CACHING**

- No hay caché de queries frecuentes
- Productos, categorías, perfiles se recargan constantemente
- Solución: Implementar React Query o SWR

18. **LOADING STATES**

- Algunos componentes no muestran estados de carga
- Transiciones entre estados no son suaves
- Solución: Mejorar UX con skeletons y loading states

19. **LOGGING**

- Logger básico sin integración con servicios externos
- No se capturan errores de producción
- Solución: Integrar Sentry o similar

20. **VALIDACIÓN DE DATOS**

- No hay validación de formato antes de insertar/actualizar
- No se validan tipos de datos, rangos, etc.
- Solución: Agregar validación con Zod o Yup

21. **RATE LIMITING**

- No hay límite de rate en operaciones frecuentes (carrito, favoritos)
- Puede causar spam de requests
- Solución: Implementar debouncing y throttling

22. **ERROR BOUNDARIES**

- No hay Error Boundaries para capturar errores de Supabase
- Errores no manejados pueden romper toda la app
- Solución: Implementar Error Boundaries en componentes críticos

---

## PATRONES IDENTIFICADOS

### ✅ BUENOS PATRONES

1. **Actualización Optimista**: Implementada correctamente en `CartContext` y `FavoritesContext`
2. **Context Providers**: Bien estructurados y separados por responsabilidad
3. **Error Boundaries**: Uso de logger centralizado
4. **Type Safety**: Uso de JSDoc para documentación

### ⚠️ PATRONES A MEJORAR

1. **Manejo de Errores**: Inconsistente entre archivos
2. **Validación**: Falta validación en cliente antes de operaciones
3. **Loading States**: No siempre se muestran
4. **Cleanup**: Algunos efectos no limpian subscriptions correctamente

---

## ESTRUCTURA DE DATOS ESPERADA

### Tablas Supabase (inferidas del código)

1. **profiles**
   - `id` (UUID, FK a auth.users)
   - `full_name` (text)
   - `role` (text)
   - `company_id` (UUID, FK)
   - `avatar_url` (text, nullable)

2. **companies**
   - `id` (UUID)
   - `name` (text)
   - `bind_location_id` (UUID, nullable)
   - `bind_price_list_id` (UUID, nullable)

3. **requisitions**
   - `id` (UUID)
   - `internal_folio` (text)
   - `requester_id` (UUID, FK a profiles)
   - `company_id` (UUID, FK)
   - `business_status` (text: 'draft', 'submitted', 'approved', 'rejected', etc.)
   - `integration_status` (text)
   - `total_amount` (numeric)
   - `created_at` (timestamp)
   - `comments` (text, nullable)

4. **requisition_items**
   - `id` (UUID)
   - `requisition_id` (UUID, FK)
   - `product_id` (UUID, FK)
   - `quantity` (integer)

5. **products**
   - `id` (UUID)
   - `name` (text)
   - `sku` (text)
   - `price` (numeric)
   - `stock` (integer)
   - `category` (text)
   - `image_url` (text, nullable)
   - `unit` (text)
   - `is_active` (boolean)

6. **user_cart_items**
   - `user_id` (UUID, FK a profiles)
   - `product_id` (UUID, FK)
   - `quantity` (integer)
   - `updated_at` (timestamp)

7. **user_favorites**
   - `user_id` (UUID, FK)
   - `product_id` (UUID, FK)

8. **requisition_templates**
   - `id` (UUID)
   - `user_id` (UUID, FK)
   - `company_id` (UUID, FK)
   - `name` (text)
   - `description` (text, nullable)
   - `items` (jsonb)
   - `is_favorite` (boolean)
   - `last_used_at` (timestamp, nullable)
   - `created_at` (timestamp)

### Funciones RPC (inferidas)

1. `create_full_requisition(p_comments text, p_items jsonb) -> uuid`
2. `clear_user_cart() -> void`
3. `broadcast_to_company(event_name text, payload jsonb) -> void`
4. `get_unique_product_categories() -> table(category text)`
5. `use_requisition_template(p_template_id uuid) -> uuid`

---

## RECOMENDACIONES DE IMPLEMENTACIÓN

### Prioridad ALTA (Crítico)

1. **Mover claves a variables de entorno**
2. **Corregir transacciones atómicas en creación de requisiciones**
3. **Unificar autenticación en servicios**

### Prioridad MEDIA (Importante)

4. **Estandarizar manejo de errores**
5. **Implementar refresh automático de tokens**
6. **Agregar validaciones de permisos**
7. **Optimizar queries lentas**

### Prioridad BAJA (Mejoras)

8. **Implementar caching**
9. **Mejorar loading states**
10. **Integrar logging externo**

---

## PROMPT PARA HORIZON AI

Este prompt está diseñado para ser usado con Horizon AI o cualquier asistente de IA para corregir y mejorar la integración con Supabase.
