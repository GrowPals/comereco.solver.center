# EJEMPLOS DE CÓDIGO - SOLUCIONES DE PERFORMANCE

## FIX 1: React.memo() para AdminDashboard

### ANTES:
```jsx
const AdminDashboard = ({ user }) => {
    // ... código
};

export default AdminDashboard;
```

### DESPUÉS:
```jsx
import React, { memo } from 'react';

const AdminDashboard = memo(({ user }) => {
    // ... código exacto igual
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
```

---

## FIX 2: Agregar staleTime y gcTime a Dashboard Queries

### ANTES (AdminDashboard.jsx, líneas 11-14):
```jsx
const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', user.id],
    queryFn: getDashboardStats,
});
```

### DESPUÉS:
```jsx
const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', user.id],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30,   // 30 minutos en cache
    refetchOnWindowFocus: false,
});
```

---

## FIX 3: Memoizar Callbacks en RecentRequisitions

### ANTES (RecentRequisitions.jsx):
```jsx
const RecentRequisitions = () => {
    const navigate = useNavigate();
    const { data: requisitions, isLoading, isError } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'destructive';
            case 'submitted': return 'warning';
            case 'cancelled': return 'destructive';
            case 'draft': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return 'Aprobada';
            case 'rejected': return 'Rechazada';
            case 'submitted': return 'Enviada';
            case 'cancelled': return 'Cancelada';
            case 'draft': return 'Borrador';
            default: return status;
        }
    };
    
    // ... resto
};

export default RecentRequisitions;
```

### DESPUÉS:
```jsx
import React, { memo, useCallback } from 'react';

const RecentRequisitions = memo(() => {
    const navigate = useNavigate();
    const { data: requisitions, isLoading, isError } = useQuery({
        queryKey: ['recentRequisitions'],
        queryFn: getRecentRequisitions,
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
    });

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
    
    // ... resto
});

RecentRequisitions.displayName = 'RecentRequisitions';

export default RecentRequisitions;
```

---

## FIX 4: AbortController en GlobalSearch

### ANTES (GlobalSearch.jsx, líneas 23-38):
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
}, [debouncedSearchTerm]);
```

### DESPUÉS:
```jsx
useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
        setIsLoading(true);
        
        const abortController = new AbortController();
        
        performGlobalSearch(debouncedSearchTerm, abortController.signal)
            .then(data => {
                // Verificar que el componente aún está montado
                if (!abortController.signal.aborted) {
                    setResults(data);
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                // Solo actualizar estado si no fue abortado
                if (!abortController.signal.aborted && error.name !== 'AbortError') {
                    setResults({ productos: [], requisiciones: [], usuarios: [] });
                    setIsLoading(false);
                }
            });
        
        // Cleanup: abortar búsqueda anterior si cambian términos
        return () => abortController.abort();
    } else {
        setResults({ productos: [], requisiciones: [], usuarios: [] });
    }
}, [debouncedSearchTerm]);
```

### También actualizar performGlobalSearch en services/searchService.js:
```jsx
export const performGlobalSearch = async (term, signal) => {
    try {
        const response = await fetch(`/api/search?q=${term}`, { signal });
        // o con axios:
        // const response = await axios.get(`/api/search?q=${term}`, { signal });
        
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Search cancelled');
        }
        throw error;
    }
};
```

---

## FIX 5: Memoizar objetos de configuración en ProjectDetail

### ANTES (ProjectDetail.jsx, líneas 57-69):
```jsx
const ProjectDetail = () => {
    // ... hooks
    
    const statusConfig = {
        active: { text: 'Activo', variant: 'success', accent: 'bg-gradient-accent' },
        archived: { text: 'Archivado', variant: 'muted', accent: 'bg-muted' },
    };

    const requisitionStatusConfig = {
        draft: { text: 'Borrador', variant: 'muted' },
        submitted: { text: 'Enviada', variant: 'warning' },
        approved: { text: 'Aprobada', variant: 'success' },
        rejected: { text: 'Rechazada', variant: 'danger' },
        ordered: { text: 'Ordenada', variant: 'info' },
        cancelled: { text: 'Cancelada', variant: 'muted' },
    };
    
    // ... resto
};
```

### DESPUÉS:
```jsx
// Opción 1: Constantes fuera del componente (MEJOR)
const STATUS_CONFIG = {
    active: { text: 'Activo', variant: 'success', accent: 'bg-gradient-accent' },
    archived: { text: 'Archivado', variant: 'muted', accent: 'bg-muted' },
};

const REQUISITION_STATUS_CONFIG = {
    draft: { text: 'Borrador', variant: 'muted' },
    submitted: { text: 'Enviada', variant: 'warning' },
    approved: { text: 'Aprobada', variant: 'success' },
    rejected: { text: 'Rechazada', variant: 'danger' },
    ordered: { text: 'Ordenada', variant: 'info' },
    cancelled: { text: 'Cancelada', variant: 'muted' },
};

const ProjectDetail = () => {
    // ... hooks
    
    const statusConfig = STATUS_CONFIG;
    const requisitionStatusConfig = REQUISITION_STATUS_CONFIG;
    
    // ... resto
};
```

### O Opción 2: useMemo
```jsx
const ProjectDetail = () => {
    // ... hooks
    
    const statusConfig = useMemo(() => ({
        active: { text: 'Activo', variant: 'success', accent: 'bg-gradient-accent' },
        archived: { text: 'Archivado', variant: 'muted', accent: 'bg-muted' },
    }), []);

    const requisitionStatusConfig = useMemo(() => ({
        draft: { text: 'Borrador', variant: 'muted' },
        submitted: { text: 'Enviada', variant: 'warning' },
        approved: { text: 'Aprobada', variant: 'success' },
        rejected: { text: 'Rechazada', variant: 'danger' },
        ordered: { text: 'Ordenada', variant: 'info' },
        cancelled: { text: 'Cancelada', variant: 'muted' },
    }), []);
    
    // ... resto
};
```

---

## FIX 6: Corregir useMemo/useCallback en UserDashboard

### ANTES (UserDashboard.jsx, líneas 18-30):
```jsx
const formatCurrency = useMemo(() => (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00', []);

const firstName = useMemo(() => {
    return user?.full_name?.split(' ')[0] || 'Usuario';
}, [user?.full_name]);

const quickActions = useMemo(() => [
    { label: 'Nueva Requisición', icon: ShoppingCart, path: '/catalog' },
    { label: 'Mis Plantillas', icon: LayoutTemplate, path: '/templates' },
    { label: 'Mi Historial', icon: History, path: '/requisitions', variant: 'outline' },
], []);

const handleNavigateToCatalog = useMemo(() => () => navigate('/catalog'), [navigate]);
```

### DESPUÉS:
```jsx
// formatCurrency es función pura, no necesita useMemo
const formatCurrency = (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00';

// firstName está bien, pero podría optimizarse
const firstName = useMemo(() => {
    return user?.full_name?.split(' ')[0] || 'Usuario';
}, [user?.full_name]);

// quickActions es constantemente igual, mover fuera si es posible
const quickActions = useMemo(() => [
    { label: 'Nueva Requisición', icon: ShoppingCart, path: '/catalog' },
    { label: 'Mis Plantillas', icon: LayoutTemplate, path: '/templates' },
    { label: 'Mi Historial', icon: History, path: '/requisitions', variant: 'outline' },
], []);

// handleNavigateToCatalog debería usar useCallback
const handleNavigateToCatalog = useCallback(() => navigate('/catalog'), [navigate]);
```

---

## FIX 7: Callbacks memoizados en Approvals

### ANTES (Approvals.jsx, líneas 228-256):
```jsx
<Button
    onClick={(e) => {
        e.stopPropagation();
        handleApprove(req.id);
    }}
    disabled={mutation.isPending}
    variant="success"
    size="lg"
    className="flex-1 rounded-xl shadow-button hover:shadow-button-hover"
    isLoading={mutation.isPending}
>
    <Check className="h-5 w-5" />
    <span>Aprobar</span>
</Button>
<Button
    onClick={(e) => {
        e.stopPropagation();
        handleOpenRejectionModal(req.id);
    }}
    disabled={mutation.isPending}
    variant="destructive"
    size="icon"
    className="rounded-xl shadow-xs hover:shadow-sm"
>
    <X className="h-5 w-5" />
</Button>
```

### DESPUÉS:
```jsx
import { useCallback } from 'react';

// En el componente:
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
    disabled={mutation.isPending}
    variant="success"
    size="lg"
    className="flex-1 rounded-xl shadow-button hover:shadow-button-hover"
    isLoading={mutation.isPending}
>
    <Check className="h-5 w-5" />
    <span>Aprobar</span>
</Button>
<Button
    onClick={(e) => handleRejectClick(e, req.id)}
    disabled={mutation.isPending}
    variant="destructive"
    size="icon"
    className="rounded-xl shadow-xs hover:shadow-sm"
>
    <X className="h-5 w-5" />
</Button>
```

---

## FIX 8: Virtualización en Users.jsx

### OPCIÓN A: Paginación simple (RECOMENDADO)

```jsx
import { useState } from 'react';

const Users = () => {
    // ... hooks existentes
    const [page, setPage] = useState(1);
    const pageSize = 25;
    
    // Datos paginados
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    const displayedUsers = users?.slice(start, end) ?? [];
    const totalPages = Math.ceil((users?.length || 0) / pageSize);

    return (
        <>
            {/* ... header y form ... */}
            
            {/* Mobile List */}
            <div className="space-y-4 md:hidden">
                {displayedUsers.map((user) => (
                    // ... user card JSX
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl...">
                <Table>
                    <TableHeader>
                        {/* ... headers */}
                    </TableHeader>
                    <TableBody>
                        {displayedUsers.map((user) => (
                            // ... table rows
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </>
    );
};
```

### OPCIÓN B: react-virtuoso para listas grandes

```jsx
import { VirtualizerFixed } from 'react-virtuoso';

// Para listas > 100 items
const displayedUsers = users?.slice(start, end) ?? [];

<VirtualizerFixed
    style={{ height: '600px' }}
    data={displayedUsers}
    itemContent={(index, user) => (
        <div key={user.id} className="rounded-2xl border...">
            {/* User card JSX */}
        </div>
    )}
/>
```

---

## FIX 9: Memoizar displayedRequisitions en ProjectDetail

### ANTES (ProjectDetail.jsx, líneas 252-294):
```jsx
{project.requisitions.slice(0, 10).map((requisition) => {
    const status = requisitionStatusConfig[requisition.business_status];
    return (
        // ... JSX
    );
})}
```

### DESPUÉS:
```jsx
import { useMemo } from 'react';

const displayedRequisitions = useMemo(() => 
    project.requisitions?.slice(0, 10) ?? [],
    [project.requisitions]
);

{displayedRequisitions.map((requisition) => {
    const status = requisitionStatusConfig[requisition.business_status];
    return (
        // ... JSX
    );
})}
```

---

## FIX 10: Header lazy loading

### ANTES:
```jsx
<img
    src="https://i.ibb.co/HLZ06zr5/isotipo-comereco-1.png"
    alt="ComerECO"
    className="h-10 w-10 object-contain"
    loading="eager"
/>
```

### DESPUÉS (Opción 1: lazy loading):
```jsx
<img
    src="https://i.ibb.co/HLZ06zr5/isotipo-comereco-1.png"
    alt="ComerECO"
    className="h-10 w-10 object-contain"
    loading="lazy"
/>
```

### DESPUÉS (Opción 2: SVG inline para mejor perf):
```jsx
<svg
    className="h-10 w-10"
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
>
    {/* SVG content */}
</svg>
```

---

## FIX 11: Corregir dependencias useEffect en Catalog

### ANTES:
```jsx
useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, [filtersKey.searchTerm, filtersKey.category, filtersKey.availability]);
```

### DESPUÉS:
```jsx
useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, [filtersKey]); // filtersKey ya está memoizado
```

---

## FIX 12: Context Splitting para evitar re-renders

### ANTES (RequisitionContext):
```jsx
const RequisitionContext = createContext();

export function RequisitionProvider({ children }) {
    const [items, setItems] = useState([]);
    const [requisition, setRequisition] = useState({});
    
    const value = {
        items,
        setItems,
        requisition,
        setRequisition,
        updateItems: (newItems) => setItems(newItems),
    };
    
    return (
        <RequisitionContext.Provider value={value}>
            {children}
        </RequisitionContext.Provider>
    );
}
```

### DESPUÉS (Context Splitting):
```jsx
const RequisitionDataContext = createContext();
const RequisitionActionsContext = createContext();

export function RequisitionProvider({ children }) {
    const [items, setItems] = useState([]);
    const [requisition, setRequisition] = useState({});
    
    const dataValue = useMemo(() => ({
        items,
        requisition,
    }), [items, requisition]);
    
    const actionsValue = useMemo(() => ({
        setItems,
        setRequisition,
        updateItems: (newItems) => setItems(newItems),
    }), []);
    
    return (
        <RequisitionDataContext.Provider value={dataValue}>
            <RequisitionActionsContext.Provider value={actionsValue}>
                {children}
            </RequisitionActionsContext.Provider>
        </RequisitionDataContext.Provider>
    );
}

// Crear hooks para cada context
export function useRequisitionData() {
    return useContext(RequisitionDataContext);
}

export function useRequisitionActions() {
    return useContext(RequisitionActionsContext);
}
```

### Uso en componentes:
```jsx
// Componentes que solo necesitan leer datos
const { items, requisition } = useRequisitionData();

// Componentes que solo necesitan acciones
const { updateItems } = useRequisitionActions();

// Ambos
const data = useRequisitionData();
const actions = useRequisitionActions();
```

---

## CHECKLIST DE IMPLEMENTACIÓN

- [ ] Agregar React.memo() a AdminDashboard
- [ ] Agregar React.memo() a SupervisorDashboard  
- [ ] Agregar staleTime/gcTime a todas las queries del dashboard
- [ ] Memoizar callbacks en RecentRequisitions
- [ ] Implementar AbortController en GlobalSearch
- [ ] Memoizar objetos en ProjectDetail
- [ ] Corregir useMemo/useCallback en UserDashboard
- [ ] Implementar paginación en Users.jsx
- [ ] Memoizar callbacks en Approvals
- [ ] Cambiar lazy loading en Header
- [ ] Revisar dependencias useEffect en Catalog
- [ ] Revisar y optimizar RequisitionContext si es necesario

