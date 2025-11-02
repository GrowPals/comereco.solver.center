# RESUMEN DE PROBLEMAS ADICIONALES ENCONTRADOS

## NUEVOS PROBLEMAS CRÍTICOS IDENTIFICADOS (4-6)

### 4. VULNERABILIDAD: Interpolación de Strings en Queries
**Archivos afectados**:
- `src/services/searchService.js` (líneas 24, 31, 38)
- `src/services/productService.js` (línea 35)

**Código problemático**:
```javascript
// searchService.js
.or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
.or(`internal_folio.ilike.${searchTerm},comments.ilike.${searchTerm}`)

// productService.js  
query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
```

**Riesgo**: Aunque Supabase debería sanitizar, la interpolación directa puede ser vulnerable si hay bugs en la sanitización o si se permite pasar objetos complejos.

**Solución**: Validar y sanitizar inputs antes de usar en queries.

---

### 5. REAL-TIME: Filtros Inseguros
**Archivo**: `src/components/layout/NotificationCenter.jsx` (línea 106)

**Código problemático**:
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

**Riesgo**: Si `user.id` puede ser manipulado o contiene caracteres especiales, puede causar problemas.

**Solución**: Usar sintaxis segura de Supabase con objetos.

---

### 6. NOTIFICACIONES: Query Sin Filtro de Usuario
**Archivo**: `src/components/layout/NotificationCenter.jsx` (líneas 26-37)

**Código problemático**:
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

**Riesgo**: Si RLS no está configurado correctamente, puede exponer notificaciones de otros usuarios.

**Solución**: Agregar `.eq('user_id', user.id)` en la query.

---

## PROBLEMAS IMPORTANTES ADICIONALES (12-16)

### 12. REAL-TIME: Memory Leaks y Cleanup
**Archivos**: `src/components/layout/NotificationCenter.jsx`, `src/App.jsx`

**Problemas**:
- Los canales pueden no limpiarse correctamente si el componente se desmonta rápido
- No hay verificación de estado antes de crear nuevos canales
- Múltiples subscripciones pueden acumularse

**Solución**: Mejorar cleanup y gestión de estado de subscripciones.

---

### 13. PÁGINAS CON DATOS MOCK
**Archivos**: 
- `src/pages/Dashboard.jsx` - Usa datos hardcodeados
- `src/pages/Users.jsx` - Usa `mockdata.js` completamente  
- `src/pages/Profile.jsx` - Actividad reciente es mock

**Impacto**: Funcionalidad incompleta, datos no reales.

**Solución**: Implementar queries reales a Supabase.

---

### 14. HOOKS INCORRECTOS
**Archivo**: `src/pages/Profile.jsx` (línea 41)

**Problema**: 
```javascript
const { user, updateUser, logout } = useSupabaseAuth(); // ❌ logout no existe
```

**Solución**: Cambiar a `signOut()`.

---

### 15. CHECKOUT: Propiedades Faltantes
**Archivo**: `src/pages/Checkout.jsx` (línea 24)

**Problema**:
```javascript
const { items: cartItems, subtotal, vat, total, clearCart } = useCart();
// ❌ vat y total no están definidos en CartContext
```

**Solución**: Implementar cálculo de IVA y total en CartContext.

---

### 16. REQUISITION DETAIL: Sin Real-Time
**Archivo**: `src/pages/RequisitionDetail.jsx`

**Problema**: No hay subscripción a cambios en tiempo real.

**Solución**: Agregar subscripción a cambios de requisición.

---

## TOTAL DE PROBLEMAS IDENTIFICADOS

- **Críticos**: 6 problemas
- **Importantes**: 10 problemas  
- **Mejoras**: 6 problemas

**TOTAL: 22 problemas** a corregir

---

## PRIORIZACIÓN RECOMENDADA

### Fase 1 - Seguridad (Crítico - Urgente)
1. Variables de entorno
2. Interpolación de strings en queries
3. Filtros inseguros en real-time
4. Query de notificaciones sin filtro

### Fase 2 - Funcionalidad (Importante - Esta semana)
5. Transacciones atómicas
6. Autenticación directa en servicios
7. Corrección de hooks incorrectos
8. Propiedades faltantes en checkout

### Fase 3 - Optimización (Mejoras - Próximas semanas)
9. Real-time cleanup
10. Páginas con datos mock
11. Real-time en requisition detail
12. Caching y optimización

---

Este documento complementa el análisis principal y el prompt para Horizon AI.

