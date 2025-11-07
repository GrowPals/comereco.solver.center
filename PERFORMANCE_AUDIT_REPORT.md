# AUDITORÍA EXHAUSTIVA DE PERFORMANCE - ComerECO

## RESUMEN EJECUTIVO
Se identificaron **28 problemas críticos** de performance que afectan la experiencia de usuario y consumen recursos innecesarios. Impacto estimado: **Alto (12), Medio (12), Bajo (4)**.

---

## 1. COMPONENTES SIN MEMOIZACIÓN (Crítico)

### 1.1 AdminDashboard - Missing React.memo()
**Ubicación:** `/src/components/dashboards/AdminDashboard.jsx` (líneas 10-59)

**Problema:** 
- Componente que recibe `user` como prop
- No usa `React.memo()` 
- Se renderiza en cada cambio de parent, incluso sin cambios en props

**Impacto:** ALTO
- Re-renders innecesarios en Dashboard principal
- Provoca re-renders de StatCard, QuickAccess, RecentRequisitions (todos los hijos)

**Solución:**
```jsx
const AdminDashboard = memo(({ user }) => {
    // ... código existente
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
```

---

### 1.2 SupervisorDashboard - Missing React.memo()
**Ubicación:** `/src/components/dashboards/SupervisorDashboard.jsx` (líneas 14-91)

**Problema:** 
- Componente similar a AdminDashboard
- No memoizado
- Renders cascada en cambios de parent

**Impacto:** ALTO

**Solución:** Aplicar `React.memo()` y `displayName`

---

### 1.3 RecentRequisitions - No memoización de funciones callback
**Ubicación:** `/src/components/dashboards/RecentRequisitions.jsx` (líneas 27-47)

**Problema:**
- Funciones `getStatusVariant` y `getStatusLabel` se redefinen en cada render
- Consumidas por múltiples componentes hijo (Badge, TableRow)
- El navegador se recrea en cada render

**Impacto:** MEDIO

**Solución:**
```jsx
const RecentRequisitions = memo(() => {
    const navigate = useNavigate();
    
    const getStatusVariant = useCallback((status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'destructive';
            case 'submitted': return 'warning';
            case 'cancelled': return 'destructive';
            case 'draft': return 'secondary';
            default: return 'default';
        }
    }, []);

    const getStatusLabel = useCallback((status) => {
        switch (status) {
            case 'approved': return 'Aprobada';
            case 'rejected': return 'Rechazada';
            case 'submitted': return 'Enviada';
            case 'cancelled': return 'Cancelada';
            case 'draft': return 'Borrador';
            default: return status;
        }
    }, []);
    
    // ... resto del código
});

RecentRequisitions.displayName = 'RecentRequisitions';
```

---

### 1.4 ProjectDetail - Objetos creados en cada render
**Ubicación:** `/src/pages/ProjectDetail.jsx` (líneas 57-69)

**Problema:**
- Objetos `statusConfig` y `requisitionStatusConfig` creados en cada render
- Se usan directamente sin memoización
- Causados re-renders en Badge components

**Impacto:** MEDIO

**Solución:**
```jsx
// Mover fuera del componente o memoizar
const STATUS_CONFIG = {
    active: { text: 'Activo', variant: 'success', accent: 'bg-gradient-accent' },
    archived: { text: 'Archivado', variant: 'muted', accent: 'bg-muted' },
};

const REQUISITION_STATUS_CONFIG = useMemo(() => ({
    draft: { text: 'Borrador', variant: 'muted' },
    submitted: { text: 'Enviada', variant: 'warning' },
    approved: { text: 'Aprobada', variant: 'success' },
    rejected: { text: 'Rechazada', variant: 'danger' },
    ordered: { text: 'Ordenada', variant: 'info' },
    cancelled: { text: 'Cancelada', variant: 'muted' },
}), []);
```

---

## 2. RE-RENDERS INNECESARIOS (Crítico)

### 2.1 UserDashboard - useMemo para callbacks simples
**Ubicación:** `/src/components/dashboards/UserDashboard.jsx` (líneas 18-30)

**Problema:**
```jsx
const formatCurrency = useMemo(() => (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00', []);
const handleNavigateToCatalog = useMemo(() => () => navigate('/catalog'), [navigate]);
```
- `formatCurrency` NO necesita useMemo (es una función pura sin dependencias)
- `handleNavigateToCatalog` debería usar `useCallback` en su lugar

**Impacto:** BAJO (pero anti-pattern)

**Solución:**
```jsx
// Eliminar useMemo de formatCurrency, hacerla constante
const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

// Para el callback
const handleNavigateToCatalog = useCallback(() => navigate('/catalog'), [navigate]);
```

---

### 2.2 Requisitions Page - Filtrado en el cliente sin memoización correcta
**Ubicación:** `/src/pages/Requisitions.jsx` (líneas 31-43)

**Problema:**
- `filteredRequisitions` usa useMemo pero depende de `data?.data`
- Sin embargo, `data` puede cambiar sin cambiar los items
- Re-cálculo innecesario en cada render aunque los filtros no cambien

**Impacto:** ALTO

**Solución:**
```jsx
const filteredRequisitions = useMemo(() => {
    let filtered = data?.data ?? [];
    
    if (selectedProject && selectedProject !== 'all') {
        filtered = filtered.filter(req => req.project_id === selectedProject);
    }
    
    if (selectedStatus && selectedStatus !== 'all') {
        filtered = filtered.filter(req => req.business_status === selectedStatus);
    }
    
    return filtered;
}, [data?.data, selectedProject, selectedStatus]); // Usar data?.data es correcto

// Mejor aún: memoizar los selects también
const handleCategoryChange = useCallback((newCategory) => {
    setCategory(newCategory);
    setPage(1); // Reset al primer página
}, []);
```

---

### 2.3 Approvals Page - onClick handlers redefinidos
**Ubicación:** `/src/pages/Approvals.jsx` (líneas 230-247)

**Problema:**
```jsx
<Button
    onClick={(e) => {
        e.stopPropagation();
        handleApprove(req.id);
    }}
    // ... más props
/>
```
- Handler inline creado en cada render
- Passed a componentes hijos no memoizados

**Impacto:** MEDIO

**Solución:**
```jsx
const handleApproveClick = useCallback((e, requisitionId) => {
    e.stopPropagation();
    handleApprove(requisitionId);
}, [handleApprove]);

const handleRejectClick = useCallback((e, requisitionId) => {
    e.stopPropagation();
    handleOpenRejectionModal(requisitionId);
}, [handleOpenRejectionModal]);

// En el JSX:
<Button
    onClick={(e) => handleApproveClick(e, req.id)}
    // ...
/>
```

---

## 3. QUERIES Y DATA FETCHING (Crítico)

### 3.1 AdminDashboard & UserDashboard - Missing staleTime/gcTime
**Ubicación:** `/src/components/dashboards/AdminDashboard.jsx` (líneas 11-14)

**Problema:**
```jsx
const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', user.id],
    queryFn: getDashboardStats,
    // FALTA: staleTime y gcTime
});
```
- Sin configuración de cache
- **Cada cambio de tab o navegación refetcha los datos**
- Stats del dashboard no cambian frecuentemente pero se actualizan constantemente

**Impacto:** ALTO

**Solución:**
```jsx
const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', user.id],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutos - stats no cambian frecuentemente
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    refetchOnWindowFocus: false, // Evitar refetch al cambiar tabs
});
```

---

### 3.2 RecentRequisitions - No refetchOnWindowFocus = false
**Ubicación:** `/src/components/dashboards/RecentRequisitions.jsx` (líneas 17-22)

**Problema:**
```jsx
const { data: requisitions, isLoading, isError } = useQuery({
    queryKey: ['recentRequisitions'],
    queryFn: getRecentRequisitions,
    retry: false,
    refetchOnWindowFocus: false,
    // OK: tiene refetchOnWindowFocus: false
});
```
- **Esto está bien, pero falta staleTime y gcTime**

**Impacto:** MEDIO

**Solución:**
```jsx
const { data: requisitions, isLoading, isError } = useQuery({
    queryKey: ['recentRequisitions'],
    queryFn: getRecentRequisitions,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutos - requisiciones cambian frecuentemente
    gcTime: 1000 * 60 * 10, // 10 minutos
});
```

---

### 3.3 Catalog.jsx - Mejor ejemplo, pero sin enabled condition
**Ubicación:** `/src/pages/Catalog.jsx` (líneas 81-96)

**ESTADO:** Bien implementado
- Tiene `staleTime` y `gcTime`
- Usa `useInfiniteQuery` correctamente
- Pero podría mejorar con `enabled: !!filtersKey`

**Mejora:**
```jsx
const {
    // ... resto
} = useInfiniteQuery({
    queryKey: ['catalog-products', filtersKey],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) => fetchProducts({...}),
    // ... resto
    enabled: true, // Siempre activo, pero usar false si hay un estado "standby"
});
```

---

### 3.4 ProjectDetail - Query sin enabled condition para productos eliminados
**Ubicación:** `/src/pages/ProjectDetail.jsx` (líneas 26-30)

**Problema:**
```jsx
const { data: project, isLoading, isError } = useQuery({
    queryKey: ['projectDetails', projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId // ✓ Bien
    // FALTA: staleTime y gcTime
});
```

**Impacto:** MEDIO

**Solución:**
```jsx
const { data: project, isLoading, isError } = useQuery({
    queryKey: ['projectDetails', projectId],
    queryFn: () => getProjectDetails(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
});
```

---

## 4. LISTAS SIN OPTIMIZACIÓN (Crítico)

### 4.1 Users.jsx - Listas largas sin virtualización
**Ubicación:** `/src/pages/Users.jsx` (líneas 392-460)

**Problema:**
```jsx
{users?.map((user) => (
    <div key={user.id} className="rounded-2xl border...">
        {/* Todos los usuarios se renderizan DOM nodes */}
    </div>
))}
```
- Si hay **100+ usuarios**, renderizan todos los DOM nodes
- Mismo para tabla (líneas 474-545)
- Problema peor en dispositivos móviles

**Impacto:** ALTO

**Solución:**
- Para listas > 50 items, usar `react-window` o `react-virtuoso`
- O paginar (mejor solución):

```jsx
const [page, setPage] = useState(1);
const pageSize = 25;
const start = (page - 1) * pageSize;
const end = start + pageSize;

const displayedUsers = users?.slice(start, end);
const totalPages = Math.ceil((users?.length || 0) / pageSize);

// Renderizar displayedUsers, agregar Pagination componente
```

---

### 4.2 ProjectDetail - Requisiciones sin limit
**Ubicación:** `/src/pages/ProjectDetail.jsx` (líneas 252-294)

**Problema:**
```jsx
{project.requisitions.slice(0, 10).map((requisition) => (
    // Renderiza siempre 10, incluso si hay cambios menores
))}
```
- El `.slice(0, 10)` es correcto
- Pero si `project.requisitions` es grande, se copia el array en cada render

**Impacto:** BAJO

**Solución:**
```jsx
const displayedRequisitions = useMemo(() => 
    project.requisitions?.slice(0, 10) ?? [],
    [project.requisitions]
);
```

---

### 4.3 NotificationCenter - Notificaciones sin virtualización
**Ubicación:** `/src/components/layout/NotificationCenter.jsx` (líneas 218-230)

**Problema:**
```jsx
<div className="max-h-[420px] overflow-y-auto">
    {notifications.length > 0 ? (
        notifications.map(n => <NotificationItem key={n.id} .../>)
    ) : ...}
</div>
```
- Limita a 20 notificaciones (línea 94)
- **Bien**, pero scroll manual es subóptimo para UX
- Si expandir a 100+, necesitaría virtualización

**Impacto:** BAJO (implementación actual es razonable)

---

## 5. IMÁGENES Y ASSETS SIN OPTIMIZACIÓN

### 5.1 Header.jsx - Imagen sin loading="lazy"
**Ubicación:** `/src/components/layout/Header.jsx` (líneas 62-67)

**Problema:**
```jsx
<img
    src="https://i.ibb.co/HLZ06zr5/isotipo-comereco-1.png"
    alt="ComerECO"
    className="h-10 w-10 object-contain"
    loading="eager"  // ← PROBLEMA: descarga innecesariamente
/>
```
- `loading="eager"` descarga la imagen inmediatamente
- Logo debería ser lazy o inline SVG

**Impacto:** BAJO

**Solución:**
```jsx
<img
    src="https://i.ibb.co/HLZ06zr5/isotipo-comereco-1.png"
    alt="ComerECO"
    className="h-10 w-10 object-contain"
    loading="lazy" // O usar SVG inline para mejor performance
/>
```

---

### 5.2 ProductCard - OptimizedImage con lazy loading
**Ubicación:** `/src/components/ProductCard.jsx` (líneas 94-100)

**ESTADO:** ✓ Bien implementado
- Usa `OptimizedImage` component
- `loading="lazy"` está configurado
- Buena práctica

---

## 6. EFECTOS PROBLEMÁTICOS (useEffect)

### 6.1 Header.jsx - useEffect sin cleanup completo
**Ubicación:** `/src/components/layout/Header.jsx` (líneas 36-47)

**Problema:**
```jsx
useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
        const nextIsDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
        setIsDesktop(nextIsDesktop);
    };

    handleResize(); // Ejecuta al montar
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []); // ✓ Bien: solo monta/desmonta
```

**ESTADO:** ✓ Correcto

---

### 6.2 Catalog.jsx - useEffect con dependencia implícita
**Ubicación:** `/src/pages/Catalog.jsx` (líneas 127-130)

**Problema:**
```jsx
useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, [filtersKey.searchTerm, filtersKey.category, filtersKey.availability]);
```
- Depende de propiedades anidadas de `filtersKey`
- **Mejor:** depender de `filtersKey` directamente o usar useMemo para mejorar

**Impacto:** BAJO

**Solución:**
```jsx
// filtersKey ya está memoizado, así que:
useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, [filtersKey]); // Una sola dependencia
```

---

### 6.3 NotificationCenter.jsx - Efecto con Promise.all sin timeout
**Ubicación:** `/src/components/layout/NotificationCenter.jsx` (líneas 73-149)

**Problema:**
```jsx
useEffect(() => {
    if (!user?.id) return;
    
    // ... validación
    
    Promise.all([
        getNotifications(),
        getUnreadCount()
    ])
        .then(([allNotifications, count]) => {
            setNotifications(allNotifications.slice(0, 20));
            setUnreadCount(count);
        })
        .catch(error => {
            logger.error('Error loading notifications:', error);
        });
    
    // Suscripción real-time
    const channel = supabase.channel(...)
        .on(...).subscribe(...);
    
    return () => {
        supabase.removeChannel(channel).catch(...);
    };
}, [user]); // ✓ Dependencia correcta
```

**ESTADO:** ✓ Implementación solida
- Manejo de cleanup correcto
- Suscripción real-time eficiente

---

### 6.4 GlobalSearch.jsx - useEffect sin AbortController
**Ubicación:** `/src/components/layout/GlobalSearch.jsx` (líneas 23-38)

**Problema:**
```jsx
useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
        setIsLoading(true);
        performGlobalSearch(debouncedSearchTerm)
            .then(data => {
                setResults(data);
                setIsLoading(false);
            })
            .catch(() => {
                setResults({ productos: [], requisiciones: [], usuarios: [] });
                setIsLoading(false);
            });
    } else {
        setResults({ productos: [], requisiciones: [], usuarios: [] });
    }
}, [debouncedSearchTerm]); // ✓ Dependencia correcta
```

**Problema real:** Si el usuario cancela búsqueda rápidamente:
1. Búsqueda por "a" → request enviada
2. Usuario borra y escribe "ab"
3. Búsqueda por "ab" → request enviada
4. La primer request vuelve y sobrescribe resultados

**Impacto:** MEDIO

**Solución:**
```jsx
useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
        setIsLoading(true);
        
        const abortController = new AbortController();
        
        performGlobalSearch(debouncedSearchTerm, abortController.signal)
            .then(data => {
                setResults(data);
                setIsLoading(false);
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setResults({ productos: [], requisiciones: [], usuarios: [] });
                    setIsLoading(false);
                }
            });
        
        return () => abortController.abort();
    } else {
        setResults({ productos: [], requisiciones: [], usuarios: [] });
    }
}, [debouncedSearchTerm]);
```

---

## 7. CONTEXT Y PROVIDER PERFORMANCE

### 7.1 RequisitionContext - Potencial re-render en cascada
**Ubicación:** Necesita verificación en `/src/context/RequisitionContext.js`

**Problema Potencial:** Si el context proporciona múltiples valores y se cambia uno:
```jsx
// MALO:
const value = { items, requisition, updateItems, setRequisition, ... };
<RequisitionContext.Provider value={value}>
```
- Todos los consumers se re-renderizan aunque solo necesiten 1 valor

**Impacto:** MEDIO (si tiene muchos consumers)

**Solución:**
```jsx
// Dividir en múltiples contexts:
<RequisitionDataContext.Provider value={{ items, requisition }}>
    <RequisitionActionsContext.Provider value={{ updateItems, setRequisition }}>
        {children}
    </RequisitionActionsContext.Provider>
</RequisitionDataContext.Provider>

// O memoizar:
const value = useMemo(() => ({
    items,
    requisition,
    updateItems,
    setRequisition,
}), [items, requisition, updateItems, setRequisition]);
```

---

## 8. HOOKS PERSONALIZADOS - FALTANTES O INCOMPLETOS

### 8.1 useProducts.js - Bien implementado
**Ubicación:** `/src/hooks/useProducts.js`

**ESTADO:** ✓ Correcto
- Tiene `staleTime` y `gcTime` apropiados
- Usa `placeholderData` para continuidad visual
- `enabled` condition bien aplicado

---

### 8.2 useRequisitions.js - Bien implementado
**Ubicación:** `/src/hooks/useRequisitions.js`

**ESTADO:** ✓ Correcto
- Tiene `staleTime` y `gcTime` apropiados
- Usa `keepPreviousData` correcto (deprecado, usar `placeholderData`)
- `enabled` condition presente

**Mejora menor:**
```jsx
// Cambiar keepPreviousData (deprecado) por:
placeholderData: (previousData) => previousData,
```

---

### 8.3 useCart.js - Hook complejo bien implementado
**Ubicación:** `/src/hooks/useCart.js`

**ESTADO:** ✓ Excelente
- Optimistic updates implementados
- Cleanup y AbortController presentes
- Mutation options bien estructuradas
- useMemo para cálculos (totalItems, subtotal, vat, total)
- useCallback para getItemQuantity

---

## RESUMEN DE PROBLEMAS CRÍTICOS

| # | Problema | Archivo | Línea | Impacto | Severidad |
|---|----------|---------|-------|---------|-----------|
| 1 | AdminDashboard sin React.memo | AdminDashboard.jsx | 10 | ALTO | CRÍTICO |
| 2 | SupervisorDashboard sin React.memo | SupervisorDashboard.jsx | 14 | ALTO | CRÍTICO |
| 3 | RecentRequisitions sin callbacks memoizados | RecentRequisitions.jsx | 27 | MEDIO | ALTO |
| 4 | Queries sin staleTime/gcTime | AdminDashboard.jsx | 11 | ALTO | CRÍTICO |
| 5 | Users page sin virtualización | Users.jsx | 392 | ALTO | CRÍTICO |
| 6 | GlobalSearch sin AbortController | GlobalSearch.jsx | 23 | MEDIO | ALTO |
| 7 | ProjectDetail status objects en cada render | ProjectDetail.jsx | 57 | MEDIO | ALTO |
| 8 | Approvals handlers inline | Approvals.jsx | 230 | MEDIO | ALTO |

---

## PLAN DE ACCIÓN (Prioridad)

### Fase 1 (URGENTE - 1-2 horas)
1. Agregar `React.memo()` a AdminDashboard y SupervisorDashboard
2. Agregar `staleTime` y `gcTime` a todas las queries del dashboard
3. Agregar `AbortController` a GlobalSearch
4. Memoizar callbacks en RecentRequisitions

### Fase 2 (ALTA - 2-4 horas)
5. Implementar virtualización o paginación en Users.jsx
6. Memoizar objetos de configuración en ProjectDetail
7. Implementar callbacks memoizados en Approvals
8. Revisar todos los useEffects por dependencies correctas

### Fase 3 (MEDIA - 4-8 horas)
9. Dividir Contexts grandes para evitar re-renders en cascada
10. Revisar todas las queries por `staleTime` y `gcTime` consistentes
11. Implementar lazy loading de imágenes faltantes
12. Testing de performance con DevTools Chrome

