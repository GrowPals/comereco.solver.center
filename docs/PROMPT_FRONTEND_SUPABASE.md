# PROMPT ESPECÍFICO: CORRECCIÓN FRONTEND CON SUPABASE

## CONTEXTO DEL PROYECTO

Estoy trabajando en una aplicación React (ComerECO WebApp) que usa Supabase como backend. Necesito corregir **SOLO los problemas del código frontend** relacionados con Supabase. Los problemas de la base de datos, RLS, triggers y funciones RPC son responsabilidad del backend y NO deben modificarse desde aquí.

## STACK TÉCNICO FRONTEND

- **Frontend**: React 18 con Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime) - **NO MODIFICAR**
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Forms**: React Hook Form
- **UI Components**: Radix UI + Tailwind CSS
- **Real-time**: Supabase Realtime Channels

## REGLAS IMPORTANTES

⚠️ **NO MODIFICAR**:
- Estructura de tablas en Supabase
- Funciones RPC (puedes llamarlas, pero no crearlas/modificarlas)
- Políticas RLS (Row Level Security)
- Triggers de base de datos
- Configuración del servidor Supabase

✅ **SÍ CORREGIR**:
- Código JavaScript/React del frontend
- Manejo de errores en el cliente
- Validaciones del lado del cliente
- Optimización de queries desde el frontend
- Manejo de estado y contexto
- Real-time subscriptions y cleanup
- Variables de entorno del frontend

---

## PROBLEMAS CRÍTICOS DEL FRONTEND A CORREGIR

### 1. SEGURIDAD: Claves Hardcodeadas en Código Fuente
**Archivo**: `src/lib/customSupabaseClient.js`

**Problema Actual**:
```javascript
const supabaseUrl = 'https://azjaehrdzdfgrumbqmuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Tarea**:
1. Crear archivo `.env` con variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
2. Crear archivo `.env.example` con valores de ejemplo (sin claves reales)
3. Actualizar `customSupabaseClient.js` para usar `import.meta.env.VITE_SUPABASE_URL` y `import.meta.env.VITE_SUPABASE_ANON_KEY`
4. Agregar validación que lance error claro si las variables no están definidas
5. Verificar que `.gitignore` incluya `.env` (si no existe, crearlo)

**Resultado esperado**:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### 2. AUTENTICACIÓN DIRECTA EN SERVICIOS (Patrón Incorrecto)
**Archivo**: `src/services/templateService.js` (líneas 10, 36-37)

**Problema Actual**:
```javascript
export async function getTemplates() {
  const { data: { user } } = await supabase.auth.getUser(); // ❌ Directo
  if (!user) return [];
  // ...
}

export async function saveTemplate(name, items, description = '') {
  const { data: { user: authUser } } = await supabase.auth.getUser(); // ❌ Directo
  const { data: profile } = await supabase.from('profiles')...
}
```

**Tarea**:
1. Refactorizar `getTemplates()` para recibir `userId` como parámetro
2. Refactorizar `saveTemplate()` para recibir `userId` y `companyId` como parámetros
3. Eliminar todas las llamadas a `supabase.auth.getUser()` en servicios
4. Actualizar los componentes que llaman estos servicios para pasar el usuario desde el contexto

**Resultado esperado**:
```javascript
// Servicio recibe datos, no los obtiene
export async function getTemplates(userId) {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('requisition_templates')
    .select('*')
    .eq('user_id', userId)
    // ...
}

export async function saveTemplate(userId, companyId, name, items, description = '') {
  if (!userId || !companyId) return null;
  
  const newTemplate = {
    user_id: userId,
    company_id: companyId,
    name,
    description,
    items,
  };
  // ...
}
```

---

### 3. VULNERABILIDAD: Interpolación de Strings en Queries Sin Sanitización
**Archivos**: 
- `src/services/searchService.js` (líneas 24, 31, 38)
- `src/services/productService.js` (línea 35)

**Problema Actual**:
```javascript
// searchService.js
.or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
.or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)

// productService.js
query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
```

**Tarea**:
1. Crear función `sanitizeSearchTerm(term)` que:
   - Elimine caracteres especiales peligrosos
   - Limite longitud máxima (100 caracteres)
   - Valide que sea string (no objeto/null)
   - Escape comillas simples y caracteres especiales de SQL
2. Aplicar sanitización en todos los lugares donde se usa `searchTerm`
3. Agregar validación de longitud mínima (2 caracteres) antes de hacer query
4. Mostrar mensaje de error si el término no es válido

**Resultado esperado**:
```javascript
// utils/sanitize.js
export function sanitizeSearchTerm(term) {
  if (typeof term !== 'string') return '';
  if (term.length < 2) return '';
  if (term.length > 100) return term.substring(0, 100);
  
  // Escapar caracteres especiales
  return term
    .replace(/'/g, "''")  // Escape comillas simples
    .replace(/[%;\\]/g, '') // Eliminar caracteres peligrosos
    .trim();
}

// En servicios
const sanitizedTerm = sanitizeSearchTerm(searchTerm);
if (!sanitizedTerm) return { productos: [], requisiciones: [], usuarios: [] };
```

---

### 4. REAL-TIME: Filtros Inseguros con Interpolación Directa
**Archivo**: `src/components/layout/NotificationCenter.jsx` (línea 106)

**Problema Actual**:
```javascript
.on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'notifications', 
  filter: `user_id=eq.${user.id}`  // ❌ Interpolación directa
}, (payload) => {
  setNotifications(prev => [payload.new, ...prev]);
})
```

**Tarea**:
1. Cambiar a sintaxis segura de Supabase usando objetos
2. Validar que `user.id` existe y es un UUID válido antes de subscribirse
3. Agregar manejo de errores en la subscripción

**Resultado esperado**:
```javascript
// Validar UUID antes de usar
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

if (!user?.id || !isValidUUID(user.id)) {
  return; // No subscribirse si no hay usuario válido
}

const channel = supabase
  .channel('public:notifications')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications', 
    filter: { user_id: user.id }  // ✅ Sintaxis segura
  }, (payload) => {
    setNotifications(prev => [payload.new, ...prev]);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logger.info('Subscribed to notifications');
    } else if (status === 'CHANNEL_ERROR') {
      logger.error('Error subscribing to notifications');
    }
  });
```

---

### 5. NOTIFICACIONES: Query Sin Filtro de Usuario
**Archivo**: `src/components/layout/NotificationCenter.jsx` (líneas 26-37)

**Problema Actual**:
```javascript
const getNotifications = async () => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')  // ❌ No filtra por user_id
        .order('created_at', { ascending: false })
        .limit(20);
    // ...
}
```

**Tarea**:
1. Agregar parámetro `userId` a la función `getNotifications`
2. Agregar filtro `.eq('user_id', userId)` antes de ordenar
3. Validar que `userId` existe antes de hacer la query
4. Actualizar el componente para pasar `user.id` cuando llame la función

**Resultado esperado**:
```javascript
const getNotifications = async (userId) => {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)  // ✅ Filtro agregado
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (error) {
        logger.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
};

// En el componente
useEffect(() => {
    if (user?.id) {
        getNotifications(user.id).then(setNotifications);
    }
}, [user]);
```

---

### 6. TRANSACCIONES: Manejo de Rollback en Frontend
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

**Tarea**:
1. Implementar rollback en el frontend: si el update falla, eliminar la requisición creada
2. Agregar manejo de errores más robusto con mensajes específicos
3. Mostrar estado de carga mientras se ejecutan ambas operaciones
4. Agregar timeout para evitar operaciones colgadas

**Resultado esperado**:
```javascript
try {
    // 1. Crear requisición
    const { data: requisitionId, error: rpcError } = await supabase.rpc('create_full_requisition', {
        p_comments: requisitionData.comments,
        p_items: itemsForDb
    });

    if (rpcError) throw rpcError;
    if (!requisitionId) throw new Error('No se recibió ID de requisición');

    // 2. Actualizar estado
    const { error: updateError } = await supabase
        .from('requisitions')
        .update({ business_status: 'submitted' })
        .eq('id', requisitionId);

    if (updateError) {
        // ✅ Rollback: eliminar requisición creada
        logger.warn(`Rollback: eliminando requisición ${requisitionId} debido a error en update`);
        await supabase
            .from('requisitions')
            .delete()
            .eq('id', requisitionId);
        
        throw new Error(`La requisición se creó pero no se pudo enviar: ${updateError.message}`);
    }

    // Éxito
    logger.info(`Requisición ${requisitionId} creada y enviada exitosamente.`);
    return { id: requisitionId };
    
} catch (err) {
    logger.error("Error en createRequisition:", err);
    throw err;
}
```

---

## PROBLEMAS IMPORTANTES DEL FRONTEND A CORREGIR

### 7. MANEJO DE ERRORES ESTANDARIZADO

**Tarea**:
1. Crear archivo `src/utils/supabaseErrorHandler.js` con función `handleSupabaseError(error)`
2. Categorizar errores:
   - `PGRST116`: No se encontraron filas (normal, no es error)
   - `23505`: Violación de clave única
   - `23503`: Violación de clave foránea
   - `42501`: Sin permisos (RLS)
   - Errores de red: timeout, sin conexión
   - Errores de validación: datos inválidos
3. Retornar mensajes amigables al usuario
4. Loguear errores con contexto completo
5. Actualizar todos los servicios para usar esta función

**Resultado esperado**:
```javascript
// utils/supabaseErrorHandler.js
export function handleSupabaseError(error) {
  if (!error) return null;
  
  // Códigos conocidos de Supabase/PostgREST
  const errorMap = {
    'PGRST116': {
      message: 'No se encontraron resultados',
      type: 'not_found',
      userFriendly: 'No se encontraron resultados para tu búsqueda.'
    },
    '23505': {
      message: 'Dato duplicado',
      type: 'duplicate',
      userFriendly: 'Este elemento ya existe.'
    },
    '23503': {
      message: 'Referencia inválida',
      type: 'foreign_key',
      userFriendly: 'No se puede completar la operación. Verifica los datos.'
    },
    '42501': {
      message: 'Sin permisos',
      type: 'permission',
      userFriendly: 'No tienes permisos para realizar esta acción.'
    }
  };
  
  // Error de red
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      message: 'Error de conexión',
      type: 'network',
      userFriendly: 'No se pudo conectar al servidor. Verifica tu conexión.'
    };
  }
  
  // Error conocido
  const errorCode = error.code || error.hint;
  if (errorMap[errorCode]) {
    logger.error('Supabase error:', errorCode, error);
    return errorMap[errorCode];
  }
  
  // Error desconocido
  logger.error('Supabase error desconocido:', error);
  return {
    message: error.message || 'Error desconocido',
    type: 'unknown',
    userFriendly: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
  };
}
```

---

### 8. REFRESH AUTOMÁTICO DE TOKENS

**Archivo**: `src/contexts/SupabaseAuthContext.jsx`

**Tarea**:
1. Implementar refresh automático de tokens antes de que expiren
2. Agregar listener para detectar expiración de sesión
3. Mostrar notificación discreta antes de hacer refresh
4. Redirigir a login si el refresh falla
5. Manejar casos de múltiples pestañas abiertas (usar localStorage para sincronizar)

**Resultado esperado**:
```javascript
useEffect(() => {
  const refreshToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const expiresAt = session.expires_at * 1000; // Convertir a ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh 5 minutos antes de que expire
    if (timeUntilExpiry < 5 * 60 * 1000) {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        logger.error('Error refreshing session:', error);
        // Redirigir a login si falla
        navigate('/login');
      }
    }
  };
  
  // Verificar cada minuto
  const interval = setInterval(refreshToken, 60 * 1000);
  refreshToken(); // Verificar inmediatamente
  
  return () => clearInterval(interval);
}, [navigate]);
```

---

### 9. VALIDACIÓN DE PERMISOS EN CLIENTE

**Tarea**:
1. Crear función `validateUserPermission(user, requiredRole, resourceOwnerId)` en `src/utils/permissions.js`
2. Validar antes de operaciones críticas:
   - Crear/editar/eliminar requisiciones
   - Aprobar/rechazar requisiciones (solo admins)
   - Modificar templates de otros usuarios
3. Mostrar errores claros si no hay permisos antes de intentar la operación

**Resultado esperado**:
```javascript
// utils/permissions.js
export function validateUserPermission(user, requiredRole, resourceOwnerId = null) {
  if (!user) {
    return { allowed: false, reason: 'Usuario no autenticado' };
  }
  
  // Validar rol
  const userRoles = {
    'super_admin': 3,
    'admin_corp': 2,
    'supervisor': 1,
    'usuario': 0
  };
  
  const userLevel = userRoles[user.role] || 0;
  const requiredLevel = userRoles[requiredRole] || 0;
  
  if (userLevel < requiredLevel) {
    return { 
      allowed: false, 
      reason: `Se requiere rol ${requiredRole} o superior` 
    };
  }
  
  // Validar propiedad de recurso
  if (resourceOwnerId && user.id !== resourceOwnerId && userLevel < 2) {
    return { 
      allowed: false, 
      reason: 'No tienes permisos para modificar este recurso' 
    };
  }
  
  return { allowed: true };
}
```

---

### 10. REAL-TIME: Memory Leaks y Cleanup

**Archivos**: `src/components/layout/NotificationCenter.jsx`, `src/App.jsx`

**Tarea**:
1. Agregar verificación de estado de subscripción antes de crear nuevos canales
2. Limpiar canales correctamente en cleanup de useEffect
3. Agregar manejo de errores en subscribe/unsubscribe
4. Implementar reconexión automática si se pierde conexión
5. Validar que los canales existen antes de removerlos

**Resultado esperado**:
```javascript
useEffect(() => {
  if (!user?.id) return;
  
  let channel = null;
  
  const setupChannel = () => {
    // Remover canal anterior si existe
    if (channel) {
      supabase.removeChannel(channel);
    }
    
    channel = supabase.channel(`company:${user.company_id}`);
    
    channel
      .on('broadcast', { event: 'cart_updated' }, (payload) => {
        // Manejar evento
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to company channel');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Channel error, reconnecting...');
          setTimeout(setupChannel, 2000); // Reintentar después de 2s
        } else if (status === 'TIMED_OUT') {
          logger.warn('Channel timeout, reconnecting...');
          setTimeout(setupChannel, 2000);
        }
      });
  };
  
  setupChannel();
  
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}, [user]);
```

---

### 11. CORRECCIÓN DE HOOKS INCORRECTOS

**Archivo**: `src/pages/Profile.jsx` (línea 41)

**Tarea**:
1. Cambiar `logout()` por `signOut()` del contexto
2. Verificar que el método existe en `SupabaseAuthContext`
3. Actualizar todos los lugares donde se use `logout`

**Resultado esperado**:
```javascript
const { user, updateUser, signOut } = useSupabaseAuth(); // ✅ signOut en lugar de logout

const handleLogout = async () => {
  await signOut();
  navigate('/login');
};
```

---

### 12. CHECKOUT: Propiedades Faltantes en CartContext

**Archivos**: `src/pages/Checkout.jsx` (línea 24), `src/context/CartContext.jsx`

**Tarea**:
1. Implementar cálculo de IVA (`vat`) en CartContext
2. Implementar cálculo de total (`total`) en CartContext
3. Agregar estas propiedades al value del contexto
4. Usar tasa de IVA configurable (por defecto 16% para México)

**Resultado esperado**:
```javascript
// En CartContext.jsx
const IVA_RATE = 0.16; // 16% para México

const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const vat = subtotal * IVA_RATE;
const total = subtotal + vat;

const value = {
  items,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  isCartOpen,
  setIsCartOpen,
  toggleCart,
  totalItems,
  subtotal,
  vat,        // ✅ Agregado
  total,      // ✅ Agregado
  loading,
  refetch: fetchCartItems,
};
```

---

### 13. REQUISITION DETAIL: Real-Time Updates

**Archivo**: `src/pages/RequisitionDetail.jsx`

**Tarea**:
1. Agregar subscripción a cambios en tiempo real de la requisición
2. Actualizar UI cuando cambie el estado de la requisición
3. Mostrar notificación cuando alguien más modifique la requisición
4. Limpiar subscripción cuando el componente se desmonte

**Resultado esperado**:
```javascript
useEffect(() => {
  if (!id) return;
  
  const channel = supabase
    .channel(`requisition:${id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'requisitions',
      filter: { id: id }
    }, (payload) => {
      const updatedRequisition = payload.new;
      setRequisition(updatedRequisition);
      
      toast({
        title: 'Requisición Actualizada',
        description: 'La requisición ha sido modificada por otro usuario.',
      });
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [id, toast]);
```

---

### 14. OPTIMIZACIÓN DE QUERIES DESDE FRONTEND

**Archivos**: `src/services/productService.js`, `src/services/searchService.js`

**Tarea**:
1. Implementar debouncing en búsquedas (300ms mínimo)
2. Limitar resultados máximos (ej: 100 productos, 50 requisiciones)
3. Agregar comentarios con sugerencias de índices para el backend
4. Optimizar query de búsqueda global para evitar N+1 queries

**Resultado esperado**:
```javascript
// Usar debounce hook
import { useDebounce } from '@/hooks/useDebounce';

// En componente que usa búsqueda
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm.length >= 2) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);

// En servicios, agregar límites
export const getProducts = async ({
  searchTerm = '',
  limit = 12, // Límite por defecto
  // ...
}) => {
  // Limitar máximo
  const safeLimit = Math.min(limit, 100); // Máximo 100 productos
  
  // Agregar comentario para backend
  // NOTA: Se recomienda crear índice en (name, sku) para mejorar performance
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .limit(safeLimit);
  // ...
};
```

---

## MEJORAS ADICIONALES DEL FRONTEND

### 15. CACHING CON REACT QUERY

**Tarea**:
1. Instalar `@tanstack/react-query`
2. Crear QueryClient y QueryClientProvider
3. Configurar queries para productos, categorías, perfiles con TTL
4. Invalidar caché cuando hay mutaciones

### 16. ERROR BOUNDARIES

**Tarea**:
1. Crear componente `SupabaseErrorBoundary`
2. Capturar errores de Supabase no manejados
3. Mostrar UI de error amigable
4. Permitir reintentar operación

### 17. VALIDACIÓN DE DATOS CON ZOD

**Tarea**:
1. Instalar `zod`
2. Crear schemas de validación para:
   - Crear requisición
   - Actualizar perfil
   - Guardar template
3. Validar antes de enviar a Supabase

---

## ARCHIVOS ESPECÍFICOS A MODIFICAR

1. `src/lib/customSupabaseClient.js` - Variables de entorno
2. `src/contexts/SupabaseAuthContext.jsx` - Refresh tokens
3. `src/context/RequisitionContext.jsx` - Rollback
4. `src/services/templateService.js` - Eliminar auth directa
5. `src/services/searchService.js` - Sanitización
6. `src/services/productService.js` - Sanitización y límites
7. `src/components/layout/NotificationCenter.jsx` - Filtros y cleanup
8. `src/context/CartContext.jsx` - IVA y total
9. `src/pages/Profile.jsx` - Corregir signOut
10. `src/pages/Checkout.jsx` - Usar vat y total
11. `src/pages/RequisitionDetail.jsx` - Real-time
12. `src/App.jsx` - Mejora de real-time
13. Crear `src/utils/supabaseErrorHandler.js` - Manejo de errores
14. Crear `src/utils/sanitize.js` - Sanitización
15. Crear `src/utils/permissions.js` - Validación de permisos
16. Crear `.env.example` - Template de variables

---

## CRITERIOS DE ÉXITO

✅ Todas las claves están en variables de entorno  
✅ No hay llamadas directas a `supabase.auth.getUser()` en servicios  
✅ Todas las queries usan sanitización de inputs  
✅ Los filtros de real-time usan sintaxis segura  
✅ Las queries filtran por usuario cuando corresponde  
✅ Hay rollback en operaciones críticas  
✅ Manejo de errores consistente en toda la app  
✅ Los tokens se refrescan automáticamente  
✅ Las validaciones de permisos están implementadas  
✅ El real-time maneja desconexiones correctamente  
✅ No hay memory leaks en subscripciones  
✅ Propiedades faltantes están implementadas  

---

## INSTRUCCIONES ESPECÍFICAS

- **NO modifiques** la estructura de la base de datos
- **NO cambies** los nombres de funciones RPC existentes (solo cómo se llaman)
- **NO modifiques** políticas RLS
- **MANTÉN** la compatibilidad con el código existente
- **USA** TypeScript/JSDoc para documentar tipos cuando sea posible
- **AGREGA** comentarios explicativos en código complejo
- **TESTEA** cada cambio manualmente antes de confirmar
- **PRESERVA** la funcionalidad existente mientras mejoras

---

## FORMATO DE RESPUESTA ESPERADO

Por favor, proporciona:
1. **Lista de archivos modificados** con breve descripción
2. **Código completo** de cada archivo modificado
3. **Instrucciones de configuración** para variables de entorno
4. **Notas de migración** si hay cambios breaking
5. **Testing checklist** para validar cambios

---

¿Puedes ayudarme a corregir estos problemas del frontend de manera sistemática y profesional?

