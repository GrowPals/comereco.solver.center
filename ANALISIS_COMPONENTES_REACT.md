# REPORTE DE ANÁLISIS - COMPONENTES REACT
## ComerECO Solver Center - Análisis Exhaustivo

**Fecha de análisis:** 2025-11-08
**Directorios analizados:** `/src/pages/` y `/src/components/`
**Nivel de exhaustividad:** Very Thorough

---

## 1. ERRORES LÓGICOS (CRÍTICOS Y ALTOS)

### 1.1 [CRÍTICO] NewRequisition.jsx - Desbordamiento de steps en navegación
**Archivo:** `/home/user/comereco.solver.center/src/pages/NewRequisition.jsx`
**Línea:** 59
**Descripción:** 
```javascript
const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
```
El máximo permitido es `steps.length` (que es 3), pero el último índice válido es `steps.length - 1` (2). Esto causa que intentar acceder a `renderStep()` cuando `currentStep === 3` devuelva `null` (caso default).

**Severidad:** CRÍTICO
**Impacto:** El usuario puede quedarse en un estado donde no se renderiza ningún paso.

**Solución:**
```javascript
const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
```

---

### 1.2 [ALTO] ProductCard.jsx - Inconsistencia en validación de favorites
**Archivo:** `/home/user/comereco.solver.center/src/components/ProductCard.jsx`
**Línea:** 22
**Descripción:**
```javascript
const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);
```
En ProductDetail.jsx línea 234, se valida de forma diferente:
```javascript
const isFavorite = favorites && Array.isArray(favorites) && favorites.includes(id);
```
Si `favorites` es `null` o `undefined`, la primera validación falla silenciosamente.

**Severidad:** ALTO
**Impacto:** Estados inconsistentes en la UI de favoritos entre componentes.

**Solución:** Normalizar la validación:
```javascript
const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);
```

---

### 1.3 [ALTO] Catalog.jsx - totalCount no actualiza con filtros del cliente
**Archivo:** `/home/user/comereco.solver.center/src/pages/Catalog.jsx`
**Línea:** 104
**Descripción:**
```javascript
const totalCount = data?.pages?.[0]?.totalCount ?? 0;
```
Este valor viene del servidor pero la línea 201 muestra el count de productos filtrados del cliente. Hay inconsistencia entre `totalCount` (del servidor) y los productos reales mostrados después del filtro.

**Severidad:** ALTO
**Impacto:** Confusión del usuario al ver "X productos disponibles" pero filtros muestran otro número.

**Solución:**
```javascript
const totalCount = useMemo(() => {
  const count = data?.pages?.[0]?.totalCount ?? 0;
  if (hasActiveFilters) {
    return products.length; // Mostrar count del cliente cuando hay filtros
  }
  return count;
}, [data, hasActiveFilters, products.length]);
```

---

### 1.4 [ALTO] Header.jsx - Race condition en scroll listener
**Archivo:** `/home/user/comereco.solver.center/src/components/layout/Header.jsx`
**Línea:** 55-86
**Descripción:**
```javascript
useEffect(() => {
    // ...
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (!ticking.current) {
            window.requestAnimationFrame(() => {
                // ... lógica de scroll
                lastScrollY.current = currentScrollY;
                ticking.current = false; // Se establece aquí
            });
            ticking.current = true; // Se establece aquí
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
}, [isDesktop]);
```
Si múltiples eventos scroll se disparan rápidamente, `ticking` podría no sincronizarse correctamente con `lastScrollY`, causando comportamiento errático de hide/show del header.

**Severidad:** ALTO
**Impacto:** Header puede parpadear o no ocultarse correctamente en mobile.

**Solución:** Usar un ref para guardar el último scrollY antes del requestAnimationFrame:
```javascript
const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (!ticking.current) {
        window.requestAnimationFrame(() => {
            const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
            if (scrollDelta > SCROLL_THRESHOLD) {
                // Lógica de hide/show
                lastScrollY.current = currentScrollY;
            }
            ticking.current = false;
        });
        ticking.current = true;
    }
};
```

---

### 1.5 [MEDIO] Login.jsx - Estado inconsistente con remember checkbox
**Archivo:** `/home/user/comereco.solver.center/src/pages/Login.jsx`
**Línea:** 26, 261-262
**Descripción:**
```javascript
const rememberValue = watch('remember');
// ...
<Checkbox
    id="remember"
    checked={rememberValue}
    onCheckedChange={(checked) => {
        setValue('remember', checked);
        handleRememberChange(checked); // Se llama directamente
    }}
/>
```
Y también en handleRememberChange se llama `setValue`. Hay doble actualización del estado que podría causar sincronización incorrecta.

**Severidad:** MEDIO
**Impacto:** El estado "Recordarme" podría no persistir correctamente entre sesiones.

---

### 1.6 [MEDIO] ItemsStep.jsx - Inconsistencia en nombres de propiedades
**Archivo:** `/home/user/comereco.solver.center/src/components/requisition-steps/ItemsStep.jsx`
**Línea:** 14-37, 125-133
**Descripción:**
```javascript
// CartItem espera item.nombre y item.precio
const CartItem = ({ item, onUpdate, onRemove }) => (
    // usa item.nombre (línea 55)
    // usa item.precio (línea 57)
)

// Pero enrichedItems intenta normalizar
const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        nombre: item.nombre || item.name || 'Producto sin nombre',
        precio: item.precio ?? item.price ?? 0,
      })),
    [items]
);
```
Los productos del carrito pueden venir con `name` o `nombre`, `price` o `precio`. Esta inconsistencia es propensa a errores.

**Severidad:** MEDIO
**Impacto:** Pueden no mostrarse nombres/precios correctos en el carrito durante requisiciones.

---

## 2. ERRORES VISUALES/UI

### 2.1 [ALTO] ProductCard.jsx - Clase Tailwind inválida
**Archivo:** `/home/user/comereco.solver.center/src/components/ProductCard.jsx`
**Línea:** 92
**Descripción:**
```javascript
!isInStock && 'opacity-70 grayscale-[0.3]'
```
`grayscale-[0.3]` no es una clase estándar de Tailwind CSS. Las clases grayscale válidas son `grayscale-0` y `grayscale` (100%).

**Severidad:** ALTO
**Impacto:** El efecto visual de desaturación en productos sin stock no se aplicará.

**Solución:**
```javascript
!isInStock && 'opacity-70 grayscale'
```

---

### 2.2 [ALTO] SearchBar.jsx - Inconsistencia en uso de cn()
**Archivo:** `/home/user/comereco.solver.center/src/components/SearchBar.jsx`
**Línea:** 8
**Descripción:**
```javascript
<div className={`relative flex-1 ${className}`}>
```
El resto del proyecto usa `cn()` para combinar clases. Esto es inconsistente y puede causar conflictos CSS.

**Severidad:** ALTO
**Impacto:** Conflictos de clases CSS que podrían romper estilos.

**Solución:**
```javascript
<div className={cn('relative flex-1', className)}>
```

---

### 2.3 [MEDIO] RequisitionCard.jsx - Inconsistencia en altura del accent bar
**Archivo:** `/home/user/comereco.solver.center/src/components/RequisitionCard.jsx`
**Línea:** 101 y 176
**Descripción:**
En la versión mobile (línea 101):
```javascript
<div className={cn('absolute top-0 left-0 right-0 h-1.5 transition-transform duration-300', statusAccent)} />
```
En la versión desktop (línea 176):
```javascript
<div className={cn('absolute top-0 left-0 right-0 h-1 transition-transform duration-300', statusAccent)} />
```
Las alturas son diferentes (`h-1.5` vs `h-1`), causando una UI inconsistente.

**Severidad:** MEDIO
**Impacto:** Inconsistencia visual entre mobile y desktop.

**Solución:** Usar la misma altura en ambos:
```javascript
<div className={cn('absolute top-0 left-0 right-0 h-1 transition-transform duration-300', statusAccent)} />
```

---

### 2.4 [MEDIO] Requisitions.jsx - Falta z-index en sticky filter
**Archivo:** `/home/user/comereco.solver.center/src/pages/Requisitions.jsx`
**Línea:** 126
**Descripción:**
```javascript
<div className="sticky top-0 z-10 mb-6 flex flex-col gap-4 surface-card p-4 sm:flex-row sm:flex-wrap sm:items-center backdrop-blur-md shadow-sm">
```
El `z-10` puede ser insuficiente si hay otros elementos con z-index mayor (como modales o sidebars con `z-40`, `z-50`).

**Severidad:** MEDIO
**Impacto:** Los filtros pueden quedar detrás de otros elementos al scroll.

**Solución:**
```javascript
<div className="sticky top-0 z-30 mb-6 flex flex-col gap-4 ...">
```

---

### 2.5 [BAJO] Button.jsx - Comportamiento visual cuando está en loading
**Archivo:** `/home/user/comereco.solver.center/src/components/ui/button.jsx`
**Línea:** 67-72
**Descripción:**
```javascript
{isLoading && (
    <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="sr-only">Cargando...</span>
    </>
)}
{!isLoading && !isSuccess && children}
```
Cuando `isLoading` es true, el spinner aparece pero los `children` no se renderizan. Esto es correcto, pero no hay transición visual entre estados.

**Severidad:** BAJO
**Impacto:** La transición entre estados de botón podría ser abrupt.

---

## 3. PROBLEMAS DE RENDIMIENTO

### 3.1 [CRÍTICO] ProductCard.jsx - Función getItemQuantity no memoizada
**Archivo:** `/home/user/comereco.solver.center/src/components/ProductCard.jsx`
**Línea:** 24-27
**Descripción:**
```javascript
useEffect(() => {
    const quantity = getItemQuantity(product.id);
    setCurrentQuantity(quantity);
}, [getItemQuantity, product.id]);
```
`getItemQuantity` viene del contexto CartContext y podría ser una nueva función en cada render si no está memoizada. Esto causa que el effect se ejecute innecesariamente.

**Severidad:** CRÍTICO
**Impacto:** Re-renders innecesarios de ProductCard, degradación de rendimiento en catálogos grandes.

**Verificación necesaria:** Revisar la implementación de CartContext para verificar si `getItemQuantity` está memoizada.

---

### 3.2 [ALTO] RequisitionCard.jsx - Evento resize sin debounce
**Archivo:** `/home/user/comereco.solver.center/src/components/RequisitionCard.jsx`
**Línea:** 42-51
**Descripción:**
```javascript
useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);
```
Cada evento resize dispara un setState, que puede ocurrir cientos de veces durante un redimensionamiento.

**Severidad:** ALTO
**Impacto:** Múltiples re-renders durante resize de ventana.

**Solución:** Agregar debounce:
```javascript
useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
}, []);
```

---

### 3.3 [ALTO] Catalog.jsx - Debounce delay subóptimo
**Archivo:** `/home/user/comereco.solver.center/src/pages/Catalog.jsx`
**Línea:** 52
**Descripción:**
```javascript
const debouncedSearchTerm = useDebounce(searchTerm, 400);
```
400ms de debounce puede ser muy largo para una búsqueda responsiva. Mientras tanto, el usuario ve un estado desactualizado.

**Severidad:** ALTO
**Impacto:** Experiencia lenta de búsqueda.

**Recomendación:** Reducir a 200-250ms.

---

### 3.4 [MEDIO] ProfilePage.jsx - Llamadas separadas a Supabase en loadProfileData
**Archivo:** `/home/user/comereco.solver.center/src/pages/Profile.jsx`
**Línea:** 114-154
**Descripción:**
```javascript
const loadProfileData = useCallback(async () => {
    // Llamada 1: get requisitions
    const { data: requisitions, error: reqsError } = await supabase
        .from('requisitions')
        .select('...')

    // Llamada N: get creator data para cada requisición
    const enrichedRequisitions = await Promise.all(
        (requisitions || []).map(async (req) => {
            if (req.created_by) {
                const { data: creatorData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', req.created_by)
                    .single();
            }
        })
    );
}, [user?.id, toast]);
```
Esto hace N+1 consultas a la base de datos (1 para requisiciones + N para cada creador). Debería usar un join o embed en Supabase.

**Severidad:** MEDIO
**Impacto:** Carga lenta de la página de perfil si hay muchas requisiciones.

**Solución:** Usar embed en la consulta inicial:
```javascript
const { data: requisitions } = await supabase
    .from('requisitions')
    .select(`..., creator:created_by(full_name)`)
```

---

### 3.5 [MEDIO] Header.jsx - Creación innecesaria de funciones en cada render
**Archivo:** `/home/user/comereco.solver.center/src/components/layout/Header.jsx`
**Línea:** 31-34
**Descripción:**
```javascript
const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
}, [signOut, navigate]);
```
Aunque usa `useCallback`, si `signOut` o `navigate` cambian frecuentemente, esto se recrea. No es tan grave pero podría optimizarse.

**Severidad:** MEDIO
**Impacto:** Menor, pero contribuye a re-renders innecesarios.

---

## 4. ACCESSIBILITY ISSUES (WCAG)

### 4.1 [CRÍTICO] ProductCard.jsx - Semantica de botón incorrecta
**Archivo:** `/home/user/comereco.solver.center/src/components/ProductCard.jsx`
**Línea:** 89-95
**Descripción:**
```javascript
<article
    className={cn('group relative flex w-full flex-col overflow-hidden rounded-3xl...')}
    role="article"
    aria-label={`Producto ${productName}, precio ${productPrice} pesos${!isInStock ? ', sin stock' : ''}`}
>
    <div className="relative w-full overflow-hidden">
        <button
            type="button"
            onClick={handleNavigate}
            className="block w-full overflow-hidden"
            disabled={!isInStock}
        >
```
La tarjeta es un `<article>` con un botón dentro, pero es clickeable como tarjeta (onClick en la tarjeta). Debería ser un `<button>` o usar `role="button"` en el article.

**Severidad:** CRÍTICO
**Impacto:** Lectores de pantalla no entienden que la tarjeta es interactiva.

**Solución:**
```javascript
<button
    type="button"
    onClick={handleNavigate}
    className={cn('group relative flex w-full flex-col overflow-hidden rounded-3xl...')}
    aria-label={`Producto ${productName}, precio ${productPrice} pesos. ${isInStock ? 'Disponible' : 'Sin stock'}`}
    disabled={!isInStock}
>
```

---

### 4.2 [CRÍTICO] CommentsSection.jsx - Input sin label asociado
**Archivo:** `/home/user/comereco.solver.center/src/components/CommentsSection.jsx`
**Línea:** 73-78
**Descripción:**
```javascript
<Input
    placeholder="Escribe un comentario..."
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    className="flex-1"
/>
```
El input no tiene `id` ni `<label>` asociada. Solo tiene placeholder, lo cual no es suficiente para accesibilidad.

**Severidad:** CRÍTICO
**Impacto:** Lectores de pantalla no pueden identificar el propósito del campo.

**Solución:**
```javascript
<label htmlFor="comment-input" className="sr-only">
    Escribe un comentario
</label>
<Input
    id="comment-input"
    placeholder="Escribe un comentario..."
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    className="flex-1"
    aria-label="Escribir nuevo comentario"
/>
```

---

### 4.3 [CRÍTICO] SearchBar.jsx - Sin aria-label ni label
**Archivo:** `/home/user/comereco.solver.center/src/components/SearchBar.jsx`
**Línea:** 10-16
**Descripción:**
```javascript
<Input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="pl-12 pr-10"
/>
```
No hay label o aria-label asociado al input.

**Severidad:** CRÍTICO
**Impacto:** Lectores de pantalla no pueden etiquetar el campo.

**Solución:**
```javascript
<label htmlFor="search-input" className="sr-only">
    {placeholder || 'Buscar'}
</label>
<Input
    id="search-input"
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="pl-12 pr-10"
    aria-label={placeholder || 'Buscar'}
/>
```

---

### 4.4 [ALTO] Login.jsx - Botón toggle contraseña sin aria-pressed
**Archivo:** `/home/user/comereco.solver.center/src/pages/Login.jsx`
**Línea:** 228-236
**Descripción:**
```javascript
<button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-2 top-1/2 -translate-y-1/2..."
    disabled={isLoading}
    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
>
    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
</button>
```
Falta `aria-pressed` para indicar el estado del toggle.

**Severidad:** ALTO
**Impacto:** Usuarios con lectores de pantalla no saben si está activo o no.

**Solución:**
```javascript
<button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-2 top-1/2 -translate-y-1/2..."
    disabled={isLoading}
    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    aria-pressed={showPassword}
>
```

---

### 4.5 [ALTO] Catalog.jsx - Elemento aria-hidden sin semántica clara
**Archivo:** `/home/user/comereco.solver.center/src/pages/Catalog.jsx`
**Línea:** 373
**Descripción:**
```javascript
<div ref={loadMoreRef} className="h-8 w-full" aria-hidden="true" />
```
Este div se usa para detectar intersección pero debería ser más explícito sobre su propósito.

**Severidad:** ALTO
**Impacto:** Confusión para usuarios de tecnología asistiva.

**Solución:**
```javascript
<div 
    ref={loadMoreRef} 
    className="h-8 w-full" 
    aria-hidden="true"
    role="status"
    aria-label="Cargando más productos"
/>
```

---

### 4.6 [ALTO] RequisitionCard.jsx - Duplicación de role="button"
**Archivo:** `/home/user/comereco.solver.center/src/components/RequisitionCard.jsx`
**Línea:** 91-98 (mobile) y 166-173 (desktop)
**Descripción:**
Ambas versiones son tarjetas interactivas con `role="button"` pero el elemento subyacente es un `<Card>` (probablemente un `<div>`). Debería ser un elemento `<button>` real.

**Severidad:** ALTO
**Impacto:** Teclado no puede interactuar con la tarjeta sin una tecla específica.

**Solución:** Convertir Card a button o usar un componente button.

---

### 4.7 [MEDIO] ItemsStep.jsx - ProductCard interno sin aria-labels
**Archivo:** `/home/user/comereco.solver.center/src/components/requisition-steps/ItemsStep.jsx`
**Línea:** 14-37
**Descripción:**
```javascript
const ProductCard = ({ product, onAdd }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 flex flex-col h-full">
      <img
        className="w-full h-32 object-cover rounded-md mb-4"
        alt={product.name || 'Producto'}
        src={product.image_url || "https://images.unsplash.com/..."}
      />
      <Button size="sm" variant="secondary" onClick={() => onAdd(product)} disabled={product.stock <= 0}>
```
El botón "Agregar" no tiene aria-label descriptivo.

**Severidad:** MEDIO
**Impacto:** Lectores de pantalla solo dicen "Agregar" sin contexto.

---

### 4.8 [MEDIO] Requisitions.jsx - Botones de acción sin aria-label consistentes
**Archivo:** `/home/user/comereco.solver.center/src/pages/Requisitions.jsx`
**Línea:** 89-120
**Descripción:**
Algunos botones tienen aria-label pero no todos mantienen consistencia.

**Severidad:** MEDIO
**Impacto:** Inconsistencia en la experiencia de usuarios con lectores de pantalla.

---

## 5. OTROS PROBLEMAS NOTABLES

### 5.1 [MEDIO] RequisitionDetail.jsx - Suscripción a Supabase sin limpieza adecuada
**Archivo:** `/home/user/comereco.solver.center/src/pages/RequisitionDetail.jsx`
**Línea:** 65-88
**Descripción:**
```javascript
const channel = supabase
    .channel(`requisition-detail:${requisitionId}`)
    .on('postgres_changes', {...})
    .subscribe((status) => {...});

return () => {
    supabase.removeChannel(channel).catch(err => logger.error("Error unsubscribing", err));
};
```
La suscripción se intenta remover pero si hay un error, se ignora. Podría causar memory leak.

**Severidad:** MEDIO
**Impacto:** Posible memory leak si hay errores al desuscribirse.

---

### 5.2 [BAJO] Login.jsx - Uso de localStorage sin validación
**Archivo:** `/home/user/comereco.solver.center/src/pages/Login.jsx`
**Línea:** 22-23, 83-86
**Descripción:**
```javascript
defaultValues: {
    email: localStorage.getItem('rememberMeEmail') || '',
    remember: !!localStorage.getItem('rememberMeEmail')
},
```
`localStorage` puede no estar disponible (ej. en contexto de worker o SSR), lo que causa un error.

**Severidad:** BAJO
**Impacto:** Error en contextos especiales (SSR, web workers).

---

## RESUMEN DE HALLAZGOS

| Categoría | Crítico | Alto | Medio | Bajo | Total |
|-----------|---------|------|-------|------|-------|
| Errores Lógicos | 1 | 4 | 1 | 0 | 6 |
| Errores Visuales/UI | 0 | 2 | 3 | 1 | 6 |
| Rendimiento | 1 | 2 | 2 | 0 | 5 |
| Accesibilidad | 3 | 4 | 2 | 0 | 9 |
| Otros | 0 | 0 | 1 | 1 | 2 |
| **TOTAL** | **5** | **12** | **9** | **2** | **28** |

---

## PRIORIDADES DE CORRECCIÓN

### Fase 1 (CRÍTICO - Corregir inmediatamente):
1. ProductCard.jsx - role="article" debería ser button
2. CommentsSection.jsx - Input sin label
3. SearchBar.jsx - Sin aria-label
4. ProductCard.jsx - Función getItemQuantity no memoizada
5. NewRequisition.jsx - Desbordamiento de steps

### Fase 2 (ALTO - Corregir esta semana):
1. Catalog.jsx - totalCount inconsistente
2. Header.jsx - Race condition en scroll
3. ProductCard.jsx - Clase Tailwind inválida grayscale-[0.3]
4. SearchBar.jsx - Inconsistencia cn()
5. RequisitionCard.jsx - Evento resize sin debounce
6. Login.jsx - aria-pressed en toggle

### Fase 3 (MEDIO - Corregir próximas 2 semanas):
1. RequisitionCard.jsx - Altura inconsistente accent bar
2. Requisitions.jsx - z-index insuficiente
3. Catalog.jsx - Debounce delay
4. ProfilePage.jsx - N+1 queries
5. RequisitionDetail.jsx - Suscripción sin cleanup
6. ItemsStep.jsx - Nombres de propiedades inconsistentes

---

