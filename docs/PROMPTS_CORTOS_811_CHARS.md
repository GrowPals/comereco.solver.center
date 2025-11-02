# PROMPTS CORTOS PARA HORIZON AI (MÁXIMO 811 CARACTERES)

## PROMPT CRÍTICO #1: Variables de Entorno (280 chars)
```
Mover claves hardcodeadas de Supabase a variables de entorno. Archivo: src/lib/customSupabaseClient.js. Crear .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Usar import.meta.env. Agregar validación si faltan. Crear .env.example. Actualizar .gitignore.
```

## PROMPT CRÍTICO #2: Autenticación en Servicios (272 chars)
```
Eliminar llamadas directas a supabase.auth.getUser() en servicios. Archivo: src/services/templateService.js. Refactorizar getTemplates() y saveTemplate() para recibir userId y companyId como parámetros. Actualizar componentes que los llaman para pasar usuario desde useSupabaseAuth.
```

## PROMPT CRÍTICO #3: Sanitización de Queries (260 chars)
```
Sanitizar inputs en queries de Supabase. Archivos: src/services/searchService.js y productService.js. Crear función sanitizeSearchTerm() que elimine caracteres especiales, limite longitud (100 chars), valide tipo string. Aplicar antes de usar en .or() y .ilike().
```

## PROMPT CRÍTICO #4: Filtros Real-Time Seguros (240 chars)
```
Cambiar filtros de real-time de interpolación directa a sintaxis segura. Archivo: src/components/layout/NotificationCenter.jsx línea 106. Cambiar filter: `user_id=eq.${user.id}` por filter: { user_id: user.id }. Validar UUID antes de subscribirse.
```

## PROMPT CRÍTICO #5: Query Notificaciones Sin Filtro (215 chars)
```
Agregar filtro de usuario en getNotifications(). Archivo: src/components/layout/NotificationCenter.jsx línea 26. Agregar .eq('user_id', userId) antes de order(). Recibir userId como parámetro. Validar que existe antes de query.
```

## PROMPT CRÍTICO #6: Rollback en Transacciones (240 chars)
```
Implementar rollback en RequisitionContext. Archivo: src/context/RequisitionContext.jsx líneas 52-70. Si update de business_status falla después de crear requisición, eliminar requisición creada con delete(). Agregar manejo de errores robusto.
```

## PROMPT IMPORTANTE #7: Manejo de Errores Estandarizado (265 chars)
```
Crear handleSupabaseError() en src/utils/supabaseErrorHandler.js. Categorizar errores PGRST116, 23505, 23503, 42501, red. Retornar mensajes amigables. Loguear con contexto. Actualizar todos los servicios para usar esta función.
```

## PROMPT IMPORTANTE #8: Refresh Automático Tokens (240 chars)
```
Implementar refresh automático de tokens en SupabaseAuthContext.jsx. Verificar expiración cada minuto. Refresh 5 min antes de expirar. Mostrar notificación discreta. Redirigir a login si falla. Manejar múltiples pestañas.
```

## PROMPT IMPORTANTE #9: Validación Permisos Cliente (245 chars)
```
Crear validateUserPermission() en src/utils/permissions.js. Validar rol (super_admin > admin_corp > supervisor > usuario). Validar propiedad de recurso. Usar antes de operaciones críticas. Mostrar errores claros si no hay permisos.
```

## PROMPT IMPORTANTE #10: Real-Time Cleanup (250 chars)
```
Mejorar cleanup de canales real-time. Archivos: NotificationCenter.jsx y App.jsx. Verificar estado antes de crear canales. Limpiar en cleanup de useEffect. Manejar errores en subscribe. Reconexión automática si se pierde conexión. Validar que canales existen antes de remover.
```

## PROMPT IMPORTANTE #11: Hook Incorrecto (205 chars)
```
Corregir logout() en Profile.jsx línea 41. Cambiar por signOut() del contexto SupabaseAuthContext. Verificar que método existe en contexto. Actualizar todos los lugares donde se use logout.
```

## PROMPT IMPORTANTE #12: Propiedades Faltantes Checkout (225 chars)
```
Implementar cálculo de IVA y total en CartContext.jsx. Agregar vat = subtotal * 0.16. Agregar total = subtotal + vat. Incluir en value del contexto. Actualizar Checkout.jsx para usar estas propiedades.
```

## PROMPT IMPORTANTE #13: Real-Time RequisitionDetail (235 chars)
```
Agregar subscripción real-time en RequisitionDetail.jsx. Subscribirse a cambios de requisición con postgres_changes. Actualizar estado cuando cambie. Mostrar notificación si otro usuario modifica. Limpiar subscripción en cleanup.
```

## PROMPT MEJORA #14: Optimización Queries (215 chars)
```
Implementar debouncing en búsquedas (300ms). Limitar resultados máximos (100 productos, 50 requisiciones). Agregar comentarios con sugerencias de índices. Optimizar búsqueda global para evitar N+1 queries.
```

## PROMPT MEJORA #15: Caching React Query (195 chars)
```
Instalar @tanstack/react-query. Configurar QueryClient y Provider. Crear queries para productos, categorías, perfiles con TTL. Invalidar caché en mutaciones.
```

## PROMPT MEJORA #16: Error Boundaries (180 chars)
```
Crear SupabaseErrorBoundary component. Capturar errores no manejados de Supabase. Mostrar UI de error amigable. Permitir reintentar operación.
```

## PROMPT MEJORA #17: Validación Zod (165 chars)
```
Instalar zod. Crear schemas para crear requisición, actualizar perfil, guardar template. Validar antes de enviar a Supabase.
```

---

## USO

Cada prompt está diseñado para copiarse y pegarse directamente en Horizon AI. Todos están bajo el límite de 811 caracteres. Los prompts están ordenados por prioridad (Críticos primero, luego Importantes, luego Mejoras).

---

## VERSIÓN ULTRA CONDENSADA (Para sistemas con límites muy estrictos)

Si necesitas aún más corto, aquí están versiones de 200 caracteres máximo:

### #1 Variables de Entorno (120 chars)
```
Mover claves Supabase a .env. Archivo: customSupabaseClient.js. Usar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Validar si faltan. Crear .env.example.
```

### #2 Auth en Servicios (115 chars)
```
Eliminar supabase.auth.getUser() en templateService.js. Refactorizar getTemplates() y saveTemplate() para recibir userId/companyId como parámetros.
```

### #3 Sanitización (105 chars)
```
Sanitizar inputs en searchService.js y productService.js. Crear sanitizeSearchTerm() que elimine caracteres especiales, limite 100 chars.
```

### #4 Real-Time Seguro (100 chars)
```
NotificationCenter.jsx línea 106: Cambiar filter: `user_id=eq.${user.id}` por filter: { user_id: user.id }. Validar UUID.
```

### #5 Notificaciones Filtro (95 chars)
```
getNotifications() en NotificationCenter.jsx línea 26: Agregar .eq('user_id', userId) antes de order(). Recibir userId como parámetro.
```

### #6 Rollback (100 chars)
```
RequisitionContext.jsx líneas 52-70: Si update falla después de crear requisición, eliminar con delete(). Manejo de errores robusto.
```

### #7 Errores Estandarizado (110 chars)
```
Crear handleSupabaseError() en utils/supabaseErrorHandler.js. Categorizar PGRST116, 23505, 23503, 42501. Mensajes amigables.
```

### #8 Refresh Tokens (95 chars)
```
SupabaseAuthContext.jsx: Refresh automático. Verificar cada minuto. Refresh 5 min antes de expirar. Redirigir si falla.
```

### #9 Permisos (105 chars)
```
Crear validateUserPermission() en utils/permissions.js. Validar rol y propiedad de recurso. Usar antes de operaciones críticas.
```

### #10 Real-Time Cleanup (100 chars)
```
Mejorar cleanup en NotificationCenter.jsx y App.jsx. Verificar estado antes de crear. Limpiar en useEffect. Reconexión automática.
```

### #11 Hook (75 chars)
```
Profile.jsx línea 41: Cambiar logout() por signOut() del contexto. Verificar que existe.
```

### #12 Checkout (90 chars)
```
CartContext.jsx: Agregar vat = subtotal * 0.16 y total = subtotal + vat. Incluir en value.
```

### #13 Real-Time Detail (95 chars)
```
RequisitionDetail.jsx: Subscribirse a cambios con postgres_changes. Actualizar estado. Limpiar en cleanup.
```

### #14 Optimización (85 chars)
```
Debouncing 300ms en búsquedas. Limitar resultados (100 productos, 50 requisiciones). Sugerir índices.
```

### #15 Caching (75 chars)
```
Instalar @tanstack/react-query. Configurar QueryClient. Queries con TTL. Invalidar en mutaciones.
```

### #16 Error Boundaries (70 chars)
```
Crear SupabaseErrorBoundary. Capturar errores no manejados. UI amigable. Reintentar.
```

### #17 Zod (65 chars)
```
Instalar zod. Schemas para requisición, perfil, template. Validar antes de Supabase.
```
