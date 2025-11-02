# PROMPT CORRECCIONES PUNTUALES PARA HORIZON AI

## CONTEXTO

La aplicación ComerECO tiene integración con Supabase. Se han identificado problemas críticos de seguridad y funcionalidad que deben corregirse urgentemente.

---

## CORRECCIONES CRÍTICAS REQUERIDAS

### 1. 🔴 NotificationCenter.jsx - Filtro inseguro y query sin usuario

**Archivo**: `src/components/layout/NotificationCenter.jsx`

**Problema 1**: `getNotifications()` no filtra por `user_id`, expone todas las notificaciones.
**Problema 2**: El filtro real-time usa interpolación de string insegura: `filter: \`user_id=eq.${user.id}\``

**Solución**:

```javascript
// Línea 26-38: Modificar getNotifications para recibir userId
const getNotifications = async (userId) => {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)  // FILTRO POR USUARIO
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        logger.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
};

// Línea 100-115: Modificar useEffect para usar filtro seguro
useEffect(() => {
    if (!user?.id) return;
    
    // Validar UUID antes de usar
    const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    if (!isValidUUID(user.id)) {
        logger.error('Invalid user ID format for notifications');
        return;
    }

    getNotifications(user.id).then(setNotifications);

    const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: { user_id: user.id }  // SINTaxis SEGURA, no interpolación
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

---

### 2. 🟡 Dashboard.jsx - Reemplazar datos mock con queries reales

**Archivo**: `src/pages/Dashboard.jsx`

**Problema**: Si usa datos mock o hardcodeados, reemplazar con queries reales de Supabase.

**Solución**: Crear queries que obtengan:

- Requisiciones recientes del usuario usando `requisitionService`
- Estadísticas reales desde Supabase
- Usar hooks como `useRequisitions` si existen

**Ejemplo**:

```javascript
import { useRequisitions } from '@/hooks/useRequisitions';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const DashboardPage = () => {
    const { user } = useSupabaseAuth();
    const { requisitions, loading } = useRequisitions(user?.id, user?.company_id);
    
    // Calcular estadísticas desde datos reales
    const stats = useMemo(() => {
        if (!requisitions) return { created: 0, approved: 0, pending: 0, rejected: 0 };
        return {
            created: requisitions.filter(r => r.status === 'created').length,
            approved: requisitions.filter(r => r.status === 'approved').length,
            pending: requisitions.filter(r => r.status === 'pending').length,
            rejected: requisitions.filter(r => r.status === 'rejected').length,
        };
    }, [requisitions]);
    
    // ... resto del componente
};
```

---

### 3. 🟡 Users.jsx - Reemplazar datos mock con queries reales

**Archivo**: `src/pages/Users.jsx`

**Problema**: Si usa datos mock, reemplazar con query real de Supabase.

**Solución**: Crear query que obtenga usuarios de la compañía:

```javascript
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useEffect, useState } from 'react';

const UsersPage = () => {
    const { user } = useSupabaseAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.company_id) return;
        
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', user.company_id)
                .order('full_name', { ascending: true });
            
            if (error) {
                logger.error('Error fetching users:', error);
                return;
            }
            
            setUsers(data || []);
            setLoading(false);
        };
        
        fetchUsers();
    }, [user?.company_id]);
    
    // ... resto del componente
};
```

---

### 4. 🟡 Profile.jsx - Reemplazar datos mock de actividad reciente

**Archivo**: `src/pages/Profile.jsx`

**Problema**: Si `recentActivity` o `stats` son mock, reemplazar con queries reales.

**Solución**: Usar `useRequisitions` o crear query específica:

```javascript
import { useRequisitions } from '@/hooks/useRequisitions';

const ProfilePage = () => {
    const { user } = useSupabaseAuth();
    const { requisitions } = useRequisitions(user?.id, user?.company_id);
    
    // Calcular stats desde datos reales
    const stats = useMemo(() => {
        if (!requisitions) return { created: 0, approved: 0, pending: 0, rejected: 0, drafts: 0 };
        return {
            created: requisitions.filter(r => r.status === 'created').length,
            approved: requisitions.filter(r => r.status === 'approved').length,
            pending: requisitions.filter(r => r.status === 'pending').length,
            rejected: requisitions.filter(r => r.status === 'rejected').length,
            drafts: requisitions.filter(r => r.status === 'draft').length,
        };
    }, [requisitions]);
    
    // Actividad reciente desde datos reales
    const recentActivity = useMemo(() => {
        if (!requisitions) return [];
        return requisitions
            .slice(0, 5)
            .map(req => ({
                id: req.internal_folio || req.id,
                action: req.status,
                date: format(new Date(req.created_at), 'dd MMM, h:mm a', { locale: es })
            }));
    }, [requisitions]);
    
    // ... resto del componente
};
```

---

### 5. 🟡 RequisitionDetail.jsx - Agregar real-time updates

**Archivo**: `src/pages/RequisitionDetail.jsx` (si existe)

**Problema**: Si existe, agregar suscripción real-time para actualizar cuando cambie el estado.

**Solución**:

```javascript
useEffect(() => {
    if (!requisitionId) return;
    
    const channel = supabase
        .channel(`requisition:${requisitionId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'requisitions',
            filter: { id: requisitionId }
        }, (payload) => {
            setRequisition(payload.new);
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
}, [requisitionId]);
```

---

## INSTRUCCIONES ESPECÍFICAS

1. **NotificationCenter.jsx**: PRIORIDAD ALTA - Corregir filtros inseguros inmediatamente
2. **Dashboard.jsx**: Reemplazar datos mock con queries reales de Supabase
3. **Users.jsx**: Reemplazar datos mock con query de usuarios de la compañía
4. **Profile.jsx**: Reemplazar datos mock con cálculos desde datos reales
5. **RequisitionDetail.jsx**: Agregar real-time updates si existe

## VALIDACIONES REQUERIDAS

- ✅ Todos los queries filtran por `user_id` o `company_id`
- ✅ Filtros real-time usan sintaxis segura `{ field: value }` no interpolación
- ✅ Validación de UUID antes de usar en filtros
- ✅ Manejo de errores con try/catch y logging
- ✅ Cleanup de suscripciones real-time en useEffect return
- ✅ Loading states mientras cargan datos reales

## NOTAS IMPORTANTES

- **NUNCA** usar interpolación de strings en filtros real-time: `filter: \`user_id=eq.${id}\``
- **SIEMPRE** usar sintaxis segura: `filter: { user_id: id }`
- **SIEMPRE** filtrar por usuario o compañía para seguridad
- **SIEMPRE** validar UUID antes de usar en queries
- **SIEMPRE** hacer cleanup de suscripciones real-time
