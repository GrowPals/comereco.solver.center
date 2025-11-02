# 🎯 PROMPT PARA HORIZON AI - INTEGRACIÓN FRONTEND SUPABASE
## Implementación Completa del Frontend con Supabase

Este documento contiene las instrucciones para implementar y optimizar toda la integración frontend con Supabase, incluyendo servicios, hooks, contextos, real-time, y mejores prácticas.

---

## 📋 OBJETIVO

Implementar una integración frontend robusta, segura y optimizada con Supabase que:
- Maneje autenticación y sesiones correctamente
- Implemente servicios reutilizables y testables
- Use hooks personalizados para lógica de negocio
- Implemente contextos para estado global
- Maneje real-time subscriptions correctamente
- Gestione errores de forma consistente
- Optimice queries y cache
- Respete los roles y permisos del sistema

---

## 🏗️ ARQUITECTURA FRONTEND

### Estructura de Carpetas

```
src/
├── lib/
│   └── customSupabaseClient.js    # Cliente Supabase configurado
├── contexts/
│   ├── SupabaseAuthContext.jsx    # Contexto de autenticación
│   ├── CartContext.jsx            # Contexto del carrito
│   ├── RequisitionContext.jsx     # Contexto de requisiciones
│   └── FavoritesContext.jsx       # Contexto de favoritos
├── services/
│   ├── requisitionService.js      # Servicios de requisiciones
│   ├── productService.js          # Servicios de productos
│   ├── templateService.js         # Servicios de plantillas
│   ├── searchService.js           # Servicios de búsqueda
│   └── notificationService.js     # Servicios de notificaciones
├── hooks/
│   ├── useSupabaseAuth.js         # Hook de autenticación
│   ├── useProducts.js             # Hook de productos
│   ├── useRequisitions.js         # Hook de requisiciones
│   ├── useCart.js                 # Hook del carrito
│   └── useUserPermissions.js      # Hook de permisos
└── utils/
    ├── logger.js                   # Utilidad de logging
    └── roleHelpers.js             # Helpers de roles
```

---

## 🔐 1. CONFIGURACIÓN DEL CLIENTE SUPABASE

### customSupabaseClient.js

**Requisitos**:
- ✅ Usar variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- ✅ Validar que las variables existan
- ✅ Configurar opciones de cliente (autoRefreshToken, persistSession)
- ✅ Manejar errores de configuración

**Implementación esperada**:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

---

## 👤 2. CONTEXTO DE AUTENTICACIÓN

### SupabaseAuthContext.jsx

**Requisitos**:
- ✅ Manejar sesión inicial y cambios de estado
- ✅ Cargar perfil completo con información de compañía
- ✅ Exponer métodos: signIn, signOut, signUp, updateUser
- ✅ Manejar estados de loading
- ✅ Manejar errores con toast notifications
- ✅ Cleanup de subscriptions
- ✅ Exponer user, session, loading

**Estructura esperada**:
```javascript
const value = {
  user: profile,           // Perfil completo con company
  session,                 // Sesión de Supabase
  loading,                 // Estado de carga
  signIn,                  // Función de login
  signOut,                 // Función de logout
  logout: signOut,         // Alias para compatibilidad
  signUp,                  // Función de registro
  updateUser               // Actualizar perfil
};
```

**Características críticas**:
- ✅ Fetch profile con join a company
- ✅ Manejo de errores con try/catch y logging
- ✅ Cleanup de subscription en useEffect return
- ✅ Loading state correcto durante autenticación

---

## 🛒 3. CONTEXTO DEL CARRITO

### CartContext.jsx

**Requisitos**:
- ✅ Cargar carrito desde Supabase al iniciar
- ✅ Sincronizar con user_cart_items
- ✅ Calcular subtotal, vat (16%), total automáticamente
- ✅ Optimistic updates
- ✅ Rollback en caso de error
- ✅ Broadcast de cambios para real-time
- ✅ Cleanup de subscriptions

**Estructura esperada**:
```javascript
const value = {
  items,                   // Array de productos en carrito
  addToCart,               // Agregar producto
  removeFromCart,          // Eliminar producto
  updateQuantity,          // Actualizar cantidad
  clearCart,               // Vaciar carrito
  isCartOpen,              // Estado del modal
  setIsCartOpen,
  toggleCart,
  totalItems,              // Cantidad total de items
  subtotal,                // Subtotal sin IVA
  vat,                     // IVA (16%)
  total,                   // Total con IVA
  loading,                 // Estado de carga
  refetch                  // Refrescar carrito
};
```

**Características críticas**:
- ✅ Cálculos con useMemo para performance
- ✅ Optimistic updates con rollback
- ✅ Validación de stock antes de agregar
- ✅ Cleanup de real-time subscriptions

---

## 📝 4. SERVICIOS SUPABASE

### Principios de Diseño

**Todos los servicios deben**:
- ✅ Recibir userId y companyId explícitamente (no usar auth directo)
- ✅ Manejar errores con try/catch y logging
- ✅ Lanzar errores con mensajes descriptivos
- ✅ Usar tipos de retorno consistentes
- ✅ Validar parámetros de entrada
- ✅ Documentar con JSDoc

### requisitionService.js

**Funciones requeridas**:
```javascript
// Obtener requisiciones paginadas
getRequisitions({ page, limit, userId, companyId, forApprovals })

// Obtener detalles de una requisición
getRequisitionDetails(id)

// Crear requisición completa (usar RPC create_full_requisition)
createRequisition(projectId, items, comments)

// Enviar requisición (usar RPC submit_requisition)
submitRequisition(requisitionId)

// Aprobar requisición (usar RPC approve_requisition)
approveRequisition(requisitionId, comments)

// Rechazar requisición (usar RPC reject_requisition)
rejectRequisition(requisitionId, reason)

// Actualizar estado de requisición
updateRequisitionStatus(requisitionId, newStatus)
```

**Características críticas**:
- ✅ Usar funciones RPC para operaciones complejas
- ✅ Incluir relaciones (requester, project, items) en selects
- ✅ Manejar paginación correctamente
- ✅ Validar permisos antes de operaciones críticas

### productService.js

**Funciones requeridas**:
```javascript
// Obtener productos paginados y filtrados
getProducts({ companyId, searchTerm, category, sortBy, sortAsc, page, limit })

// Obtener categorías únicas (usar RPC get_unique_product_categories)
getCategories(companyId)

// Obtener producto por ID
getProductById(productId)
```

**Características críticas**:
- ✅ Filtrar siempre por companyId
- ✅ Usar búsqueda con ilike para texto
- ✅ Manejar paginación con count
- ✅ Retornar estructura consistente { data, count }

### templateService.js

**Funciones requeridas**:
```javascript
// Obtener plantillas del usuario
getTemplates(userId)

// Guardar plantilla (usar formato de objeto)
saveTemplate({ userId, companyId, name, items, description })

// Eliminar plantilla
deleteTemplate(templateId)

// Toggle favorito
toggleFavorite(templateId, isFavorite)

// Usar plantilla (usar RPC use_requisition_template)
createRequisitionFromTemplate(templateId)
```

**Características críticas**:
- ✅ Validar userId y companyId antes de guardar
- ✅ Usar formato de objeto para saveTemplate
- ✅ Manejar errores con throw para que el frontend los capture

### searchService.js

**Funciones requeridas**:
```javascript
// Búsqueda global (productos, requisiciones, usuarios)
performGlobalSearch(query, companyId)
```

**Características críticas**:
- ✅ Filtrar usuarios por companyId explícitamente
- ✅ Usar Promise.all para búsquedas paralelas
- ✅ Manejar errores por cada búsqueda individualmente
- ✅ Retornar estructura consistente

---

## 🎣 5. HOOKS PERSONALIZADOS

### useProducts.js

**Funcionalidad**:
- ✅ Obtener productos paginados
- ✅ Obtener categorías
- ✅ Manejar filtros (searchTerm, category, sortBy)
- ✅ Manejar paginación
- ✅ Loading y error states
- ✅ Refetch automático cuando cambian filtros

**Estructura esperada**:
```javascript
const {
  products,        // Array de productos
  categories,      // Array de categorías
  loading,         // Estado de carga
  error,           // Mensaje de error
  pagination,      // { page, limit, total }
  filters,         // { searchTerm, category, sortBy, sortAsc }
  updateFilter,    // Actualizar filtro
  setPage,         // Cambiar página
  refetch          // Refrescar datos
} = useProducts();
```

### useRequisitions.js

**Funcionalidad**:
- ✅ Obtener requisiciones paginadas
- ✅ Filtrar por estado
- ✅ Manejar paginación
- ✅ Loading y error states
- ✅ Real-time updates opcional

**Estructura esperada**:
```javascript
const {
  requisitions,    // Array de requisiciones
  loading,         // Estado de carga
  error,           // Mensaje de error
  pagination,      // { page, limit, total }
  filters,         // { status, searchTerm }
  updateFilter,    // Actualizar filtro
  setPage,         // Cambiar página
  refetch,         // Refrescar datos
  submitRequisition,
  approveRequisition,
  rejectRequisition
} = useRequisitions(userId, companyId);
```

### useUserPermissions.js

**Funcionalidad**:
- ✅ Verificar rol del usuario
- ✅ Verificar permisos específicos
- ✅ Usar useMemo para optimización

**Estructura esperada**:
```javascript
const {
  isAdmin,
  isSupervisor,
  isUser,
  canViewAllProjects,
  canManageUsers,
  canApproveRequisitions,
  canCreateProjects,
  canCreateTemplates
} = useUserPermissions();
```

---

## 🔔 6. REAL-TIME SUBSCRIPTIONS

### Principios de Diseño

**Todas las suscripciones deben**:
- ✅ Validar que el usuario esté autenticado
- ✅ Usar filtros seguros (no interpolación de strings)
- ✅ Cleanup en useEffect return
- ✅ Manejar estados de conexión
- ✅ Evitar memory leaks

### Ejemplo: Notificaciones Real-Time

```javascript
useEffect(() => {
  if (!user?.id) return;
  
  // Validar UUID antes de usar
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  if (!isValidUUID(user.id)) {
    logger.error('Invalid user ID format');
    return;
  }

  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: { user_id: user.id }  // Sintaxis segura
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

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [user]);
```

### Ejemplo: Carrito Real-Time

```javascript
useEffect(() => {
  if (!user?.id) return;

  const channel = supabase
    .channel('cart-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_cart_items',
      filter: { user_id: user.id }
    }, () => {
      fetchCartItems(); // Refrescar carrito
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

---

## ⚠️ 7. MANEJO DE ERRORES

### Estrategia de Manejo de Errores

**Niveles de manejo**:
1. **Servicios**: Loggear y lanzar error con mensaje descriptivo
2. **Hooks**: Capturar error y setear estado de error
3. **Componentes**: Mostrar toast/alert con mensaje amigable

### Ejemplo en Servicio

```javascript
export async function getRequisitions(options) {
  try {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*');
    
    if (error) {
      logger.error('Error fetching requisitions:', error);
      throw new Error(`No se pudieron cargar las requisiciones: ${error.message}`);
    }
    
    return { data, count: data?.length || 0 };
  } catch (error) {
    logger.error('Error in getRequisitions:', error);
    throw error; // Re-lanzar para que el hook lo capture
  }
}
```

### Ejemplo en Hook

```javascript
const fetchProducts = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await getProducts({ companyId: user.company_id, ...filters });
    setProducts(result.data);
  } catch (e) {
    setError('No se pudieron cargar los productos. Intenta de nuevo más tarde.');
    logger.error('Failed to fetch products:', e);
  } finally {
    setLoading(false);
  }
}, [user, filters]);
```

### Ejemplo en Componente

```javascript
const handleSubmit = async () => {
  try {
    await submitRequisition(requisitionId);
    toast({
      title: '✅ Requisición Enviada',
      description: 'Tu requisición ha sido enviada correctamente.'
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message || 'No se pudo enviar la requisición.'
    });
  }
};
```

---

## 🚀 8. OPTIMIZACIONES

### Caching y Memoización

**Usar useMemo para cálculos costosos**:
```javascript
const { totalItems, subtotal, vat, total } = useMemo(() => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  return { totalItems, subtotal, vat, total };
}, [items]);
```

**Usar useCallback para funciones**:
```javascript
const addToCart = useCallback(async (product, quantity = 1) => {
  // ... lógica
}, [user, items, toast]);
```

### Debouncing en Búsquedas

**Usar hook useDebounce**:
```javascript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    fetchProducts();
  }
}, [debouncedSearchTerm]);
```

### Paginación Eficiente

**Usar range() de Supabase**:
```javascript
const startIndex = (page - 1) * limit;
query = query.range(startIndex, startIndex + limit - 1);
```

---

## 🔒 9. SEGURIDAD FRONTEND

### Validaciones de Permisos

**Siempre verificar permisos antes de mostrar/ejecutar**:
```javascript
const { canApproveRequisitions } = useUserPermissions();

if (!canApproveRequisitions) {
  return null; // No mostrar botón
}

// O en el handler
const handleApprove = async () => {
  if (!canApproveRequisitions) {
    toast({ variant: 'destructive', title: 'Sin permisos' });
    return;
  }
  // ... lógica
};
```

### Validación de UUID

**Validar UUIDs antes de usar en queries**:
```javascript
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

if (!isValidUUID(userId)) {
  logger.error('Invalid UUID');
  return;
}
```

### No Confiar en el Frontend

**Recordar**: El frontend puede ser manipulado. RLS en Supabase es la seguridad real. El frontend solo mejora UX.

---

## 📱 10. COMPONENTES ESPECÍFICOS

### Login.jsx

**Requisitos**:
- ✅ Usar useSupabaseAuth para signIn
- ✅ Manejar estados de loading
- ✅ Manejar errores con toast
- ✅ Redirigir después de login exitoso
- ✅ Recordar email si el usuario lo desea

### Dashboard.jsx

**Requisitos**:
- ✅ Usar hooks para obtener datos reales (no mock)
- ✅ Calcular estadísticas desde datos reales
- ✅ Mostrar métricas según rol del usuario
- ✅ Loading states mientras cargan datos

### Users.jsx

**Requisitos**:
- ✅ Obtener usuarios desde Supabase (no mock)
- ✅ Filtrar por companyId
- ✅ Mostrar solo usuarios que el usuario puede ver según su rol
- ✅ Permitir crear/editar/eliminar según permisos

### Profile.jsx

**Requisitos**:
- ✅ Usar useSupabaseAuth para obtener user
- ✅ Calcular estadísticas desde datos reales
- ✅ Mostrar actividad reciente desde requisiciones reales
- ✅ Usar logout (no signOut directamente)

### NotificationCenter.jsx

**Requisitos**:
- ✅ Filtrar notificaciones por user_id
- ✅ Usar filtros seguros en real-time (no interpolación)
- ✅ Cleanup de subscriptions
- ✅ Marcar como leídas al hacer click

---

## ✅ 11. CHECKLIST DE IMPLEMENTACIÓN

### Configuración
- [ ] customSupabaseClient.js usa variables de entorno
- [ ] Variables de entorno validadas
- [ ] Cliente configurado con opciones correctas

### Autenticación
- [ ] SupabaseAuthContext maneja sesión correctamente
- [ ] Fetch profile con información de compañía
- [ ] Cleanup de subscriptions
- [ ] Manejo de errores con toast

### Servicios
- [ ] Todos los servicios reciben userId y companyId explícitamente
- [ ] Manejo de errores consistente
- [ ] Documentación JSDoc completa
- [ ] Uso de funciones RPC donde corresponde

### Hooks
- [ ] useProducts implementado correctamente
- [ ] useRequisitions implementado correctamente
- [ ] useUserPermissions implementado correctamente
- [ ] Todos los hooks manejan loading y error states

### Contextos
- [ ] CartContext implementado con cálculos automáticos
- [ ] Optimistic updates con rollback
- [ ] Real-time subscriptions con cleanup

### Real-Time
- [ ] Todas las suscripciones usan filtros seguros
- [ ] Cleanup en useEffect return
- [ ] Validación de UUID antes de suscribirse
- [ ] Manejo de estados de conexión

### Componentes
- [ ] Login usa useSupabaseAuth correctamente
- [ ] Dashboard usa datos reales (no mock)
- [ ] Users obtiene datos desde Supabase
- [ ] Profile calcula estadísticas desde datos reales
- [ ] NotificationCenter filtra por user_id

### Optimizaciones
- [ ] useMemo para cálculos costosos
- [ ] useCallback para funciones pasadas como props
- [ ] Debouncing en búsquedas
- [ ] Paginación eficiente

### Seguridad
- [ ] Validaciones de permisos antes de operaciones
- [ ] Validación de UUIDs antes de queries
- [ ] Filtros seguros en real-time
- [ ] No confiar solo en validaciones frontend

---

## 🎯 RESULTADO ESPERADO

Al finalizar, el frontend debe tener:

1. ✅ Integración completa y robusta con Supabase
2. ✅ Servicios reutilizables y testables
3. ✅ Hooks personalizados para lógica de negocio
4. ✅ Contextos optimizados con real-time
5. ✅ Manejo de errores consistente
6. ✅ Optimizaciones de performance
7. ✅ Seguridad frontend implementada
8. ✅ Componentes usando datos reales
9. ✅ Real-time subscriptions funcionando correctamente
10. ✅ Código limpio, documentado y mantenible

---

## 📚 RECURSOS Y REFERENCIAS

- **Supabase Docs**: https://supabase.com/docs
- **React Hooks**: https://react.dev/reference/react
- **React Context**: https://react.dev/reference/react/useContext
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime

---

## ⚠️ NOTAS IMPORTANTES

1. **NUNCA** usar interpolación de strings en filtros real-time
2. **SIEMPRE** hacer cleanup de subscriptions
3. **SIEMPRE** validar UUIDs antes de usar en queries
4. **SIEMPRE** verificar permisos antes de operaciones críticas
5. **SIEMPRE** usar funciones RPC para operaciones complejas
6. **SIEMPRE** manejar errores con try/catch y logging
7. **SIEMPRE** usar useMemo/useCallback para optimización
8. **RECORDAR**: RLS es la seguridad real, frontend solo mejora UX

