# PROMPT PARA HORIZON AI - CORRECCIÓN INTEGRACIÓN SUPABASE

## CONTEXTO DEL PROYECTO

Estoy trabajando en una aplicación React (ComerECO WebApp) que usa Supabase como backend. La aplicación gestiona requisiciones de compra, carritos de compra, favoritos, plantillas y tiene un sistema de autenticación completo. He identificado varios problemas críticos y áreas de mejora en la integración con Supabase que necesito corregir.

## STACK TÉCNICO

- **Frontend**: React 18 con Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Forms**: React Hook Form
- **UI Components**: Radix UI + Tailwind CSS
- **Real-time**: Supabase Realtime Channels

## PROBLEMAS CRÍTICOS A CORREGIR

### 1. SEGURIDAD: Claves Hardcodeadas
**Archivo**: `src/lib/customSupabaseClient.js`

**Problema Actual**:
```javascript
const supabaseUrl = 'https://azjaehrdzdfgrumbqmuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Solicitud**: 
- Crear archivo `.env` y `.env.example` con las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Actualizar `customSupabaseClient.js` para usar variables de entorno
- Agregar validación que lance error si las variables no están definidas
- Actualizar `.gitignore` para excluir `.env`

### 2. TRANSACCIONES ATÓMICAS EN REQUISICIONES
**Archivo**: `src/context/RequisitionContext.jsx` (líneas 52-70)

**Problema Actual**:
```javascript
// 1. Crear requisición
const { data: requisitionId, error: rpcError } = await supabase.rpc('create_full_requisition', {...});

// 2. Actualizar estado (SEPARADO - puede fallar)
const { error: updateError } = await supabase
    .from('requisitions')
    .update({ business_status: 'submitted' })
    .eq('id', requisitionId);
```

**Solicitud**:
- La función RPC `create_full_requisition` debe crear la requisición directamente en estado 'submitted' en lugar de 'draft'
- O alternativamente, crear una nueva función RPC `create_and_submit_requisition` que haga ambas operaciones atómicamente
- Si no es posible modificar RPCs, implementar rollback: si el update falla, eliminar la requisición creada
- Agregar manejo de errores más robusto con mensajes específicos

### 3. AUTENTICACIÓN DIRECTA EN SERVICIOS
**Archivo**: `src/services/templateService.js` (líneas 10, 36-37)

**Problema Actual**:
```javascript
export async function getTemplates() {
  const { data: { user } } = await supabase.auth.getUser(); // ❌ Directo
  // ...
}

export async function saveTemplate(name, items, description = '') {
  const { data: { user: authUser } } = await supabase.auth.getUser(); // ❌ Directo
  const { data: profile } = await supabase.from('profiles')...
}
```

**Solicitud**:
- Refactorizar para que estos servicios reciban el usuario como parámetro desde el contexto
- O crear hooks personalizados que usen `useSupabaseAuth` y luego llamen a los servicios
- Eliminar llamadas directas a `supabase.auth.getUser()` en servicios
- Mantener el patrón de separación de responsabilidades: servicios reciben datos, no los obtienen

### 4. VULNERABILIDAD: Interpolación de Strings en Queries
**Archivos**: `src/services/searchService.js`, `src/services/productService.js`

**Problema Actual**:
```javascript
// ❌ Interpolación directa sin sanitización
query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
.or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)
```

**Solicitud**:
- Validar y sanitizar todos los inputs antes de usar en queries
- Usar parámetros seguros de Supabase cuando sea posible
- Limitar longitud de searchTerm (ej: máximo 100 caracteres)
- Escapar caracteres especiales que puedan causar problemas
- Agregar validación de tipos (solo strings, no objetos)

### 5. REAL-TIME: Filtros Inseguros
**Archivo**: `src/components/layout/NotificationCenter.jsx` (línea 106)

**Problema Actual**:
```javascript
// ❌ Interpolación directa en filter
.on('postgres_changes', { 
  filter: `user_id=eq.${user.id}` 
}, ...)
```

**Solicitud**:
- Usar sintaxis segura de Supabase con objetos: `{ user_id: user.id }`
- Validar que `user.id` existe y es un UUID válido antes de subscribirse
- Agregar manejo de errores en la subscripción

### 6. NOTIFICACIONES: Query Sin Filtro
**Archivo**: `src/components/layout/NotificationCenter.jsx` (líneas 26-37)

**Problema Actual**:
```javascript
const getNotifications = async () => {
    // ❌ No filtra por user_id
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    // ...
}
```

**Solicitud**:
- Agregar `.eq('user_id', user.id)` en la query
- Asegurar que solo se llamen notificaciones cuando hay usuario autenticado
- Agregar validación de RLS en la base de datos como segunda capa de seguridad

## PROBLEMAS IMPORTANTES A CORREGIR

### 7. MANEJO DE ERRORES ESTANDARIZADO

**Solicitud**:
- Crear función helper `handleSupabaseError(error)` que:
  - Categorice errores (permisos, red, validación, servidor)
  - Retorne mensajes de error amigables al usuario
  - Loguee errores con contexto completo
  - Maneje casos especiales como `PGRST116` (no rows found)
- Actualizar todos los servicios para usar esta función
- Agregar tipos de error específicos para mejor UX

### 8. REFRESH AUTOMÁTICO DE TOKENS

**Archivo**: `src/contexts/SupabaseAuthContext.jsx`

**Solicitud**:
- Implementar refresh automático de tokens antes de que expiren
- Agregar listener para detectar expiración de sesión
- Mostrar modal de "sesión expirando" antes de hacer refresh
- Redirigir a login si el refresh falla
- Manejar casos de múltiples pestañas abiertas

### 9. VALIDACIÓN DE PERMISOS EN CLIENTE

**Solicitud**:
- Crear función `validateUserPermission(requiredRole, resourceOwnerId)` 
- Agregar validaciones antes de operaciones críticas:
  - Crear/editar/eliminar requisiciones
  - Aprobar/rechazar requisiciones (solo admins)
  - Modificar templates de otros usuarios
- Mostrar errores claros si no hay permisos antes de intentar la operación

### 10. OPTIMIZACIÓN DE QUERIES

**Archivos**: `src/services/productService.js`, `src/services/searchService.js`

**Solicitud**:
- Agregar índices sugeridos en comentarios para queries frecuentes
- Implementar debouncing en búsquedas (300ms mínimo)
- Limitar resultados máximos (ej: 100 productos, 50 requisiciones)
- Agregar cursor-based pagination como alternativa a offset-based
- Optimizar query de búsqueda global para evitar N+1 queries

### 11. REAL-TIME: Memory Leaks y Cleanup
**Archivo**: `src/components/layout/NotificationCenter.jsx`, `src/App.jsx`

**Solicitud**:
- Agregar verificación de estado de subscripción antes de crear nuevos canales
- Limpiar canales correctamente en cleanup de useEffect
- Agregar manejo de errores en subscribe/unsubscribe
- Implementar reconexión automática si se pierde conexión
- Validar que los canales existen antes de removerlos

### 12. PÁGINAS CON DATOS MOCK
**Archivos**: `src/pages/Dashboard.jsx`, `src/pages/Users.jsx`, `src/pages/Profile.jsx`

**Solicitud**:
- Implementar queries reales a Supabase para obtener estadísticas del dashboard
- Reemplazar `mockdata.js` en Users.jsx con queries a tabla `profiles`
- Implementar queries para actividad reciente en Profile.jsx
- Agregar loading states mientras se cargan datos reales

### 13. CORRECCIÓN DE HOOKS INCORRECTOS
**Archivo**: `src/pages/Profile.jsx` (línea 41)

**Solicitud**:
- Cambiar `logout()` por `signOut()` del contexto
- Verificar que todos los métodos del contexto estén correctamente exportados

### 14. CHECKOUT: Propiedades Faltantes
**Archivo**: `src/pages/Checkout.jsx` (línea 24), `src/context/CartContext.jsx`

**Solicitud**:
- Implementar cálculo de IVA (`vat`) en CartContext
- Implementar cálculo de total (`total`) en CartContext
- Agregar estas propiedades al value del contexto

### 15. REQUISITION DETAIL: Sin Real-Time
**Archivo**: `src/pages/RequisitionDetail.jsx`

**Solicitud**:
- Agregar subscripción a cambios en tiempo real de la requisición
- Actualizar UI cuando cambie el estado de la requisición
- Mostrar notificación cuando alguien más modifique la requisición

### 16. MEJORA DE REAL-TIME GENERAL

**Archivo**: `src/App.jsx` (líneas 68-98)

**Solicitud**:
- Agregar manejo de desconexión/reconexión:
  - Mostrar notificación cuando se pierde conexión
  - Reintentar subscripción automáticamente
  - Sincronizar estado cuando se reconecta
- Limpiar subscripciones anteriores si el usuario cambia de compañía
- Validar que `user.company_id` exista antes de subscribirse
- Agregar heartbeat para detectar conexiones muertas

## MEJORAS ADICIONALES SOLICITADAS

### 9. CACHING Y OPTIMIZACIÓN

**Solicitud**:
- Implementar caché en memoria para:
  - Productos (TTL: 5 minutos)
  - Categorías (TTL: 1 hora)
  - Perfil de usuario (TTL: hasta logout)
- Usar React Query o SWR para gestión de caché
- Invalidar caché cuando hay mutaciones
- Implementar stale-while-revalidate para mejor UX

### 10. MEJORA DE LOADING STATES

**Solicitud**:
- Agregar skeletons en lugar de spinners genéricos
- Mostrar estados de carga específicos:
  - "Cargando productos..."
  - "Guardando requisición..."
  - "Eliminando favorito..."
- Implementar loading progresivo para operaciones largas
- Agregar timeouts (ej: 30 segundos) con mensaje de error

### 11. INTEGRACIÓN DE LOGGING

**Archivo**: `src/utils/logger.js`

**Solicitud**:
- Configurar integración con Sentry (opcional, solo en producción)
- Agregar breadcrumbs para rastrear flujo de usuario
- Capturar contexto adicional en errores (usuario, acción, datos)
- Implementar rate limiting en logs para evitar spam
- Agregar métricas de performance (tiempo de queries)

## ARCHIVOS ESPECÍFICOS A MODIFICAR

1. `src/lib/customSupabaseClient.js` - Variables de entorno
2. `src/contexts/SupabaseAuthContext.jsx` - Refresh tokens, manejo de sesión
3. `src/context/RequisitionContext.jsx` - Transacciones atómicas
4. `src/services/templateService.js` - Eliminar auth directa
5. `src/services/requisitionService.js` - Manejo de errores mejorado
6. `src/services/productService.js` - Optimización de queries
7. `src/services/searchService.js` - Debouncing y límites
8. `src/context/CartContext.jsx` - Manejo de concurrencia
9. `src/App.jsx` - Mejora de real-time
10. `src/utils/logger.js` - Integración con Sentry
11. Crear `src/utils/supabaseHelpers.js` - Funciones helper nuevas
12. Crear `.env.example` - Template de variables de entorno

## ESTRUCTURA DE DATOS SUPABASE

**Nota**: No necesitas modificar la base de datos, pero aquí está la estructura esperada:

- **profiles**: usuarios con roles y company_id
- **companies**: compañías con bindings
- **requisitions**: requisiciones con estados de negocio e integración
- **requisition_items**: items de requisiciones
- **products**: catálogo de productos
- **user_cart_items**: carrito de usuario
- **user_favorites**: favoritos de usuario
- **requisition_templates**: plantillas de requisiciones

**Funciones RPC existentes**:
- `create_full_requisition(p_comments, p_items)`
- `clear_user_cart()`
- `broadcast_to_company(event_name, payload)`
- `get_unique_product_categories()`
- `use_requisition_template(p_template_id)`

## CRITERIOS DE ÉXITO

1. ✅ Todas las claves están en variables de entorno
2. ✅ Las operaciones críticas son atómicas
3. ✅ No hay llamadas directas a `supabase.auth.getUser()` en servicios
4. ✅ Manejo de errores consistente en toda la app
5. ✅ Los tokens se refrescan automáticamente
6. ✅ Las validaciones de permisos están implementadas
7. ✅ Las queries están optimizadas
8. ✅ El real-time maneja desconexiones correctamente
9. ✅ Hay caching implementado
10. ✅ Los loading states son informativos

## INSTRUCCIONES ESPECÍFICAS

- **NO modifiques** la estructura de la base de datos
- **NO cambies** los nombres de funciones RPC existentes
- **MANTÉN** la compatibilidad con el código existente
- **USA** TypeScript/JSDoc para documentar tipos cuando sea posible
- **AGREGA** comentarios explicativos en código complejo
- **TESTEA** cada cambio manualmente antes de confirmar
- **PRESERVA** la funcionalidad existente mientras mejoras

## FORMATO DE RESPUESTA ESPERADO

Por favor, proporciona:
1. **Lista de archivos modificados** con breve descripción
2. **Código completo** de cada archivo modificado
3. **Instrucciones de configuración** para variables de entorno
4. **Notas de migración** si hay cambios breaking
5. **Testing checklist** para validar cambios

---

¿Puedes ayudarme a corregir estos problemas de manera sistemática y profesional?

