# GUÍA DE PRUEBAS END-TO-END - COMERECO WEBAPP
**Fecha:** 3 de Noviembre, 2025
**Versión:** 1.0.0

---

## RESUMEN DE CAMBIOS APLICADOS

### 1. Optimización de Políticas RLS ✅

**Migración aplicada:** `optimize_rls_policies_performance`

**Cambios:**
- ✅ 16 políticas RLS optimizadas
- ✅ Reemplazado `auth.uid()` con `(select auth.uid())` en todas las políticas críticas
- ✅ Mejora de performance esperada: 30-50% en queries con RLS
- ✅ Soluciona todos los warnings de "Auth RLS Initialization Plan"

**Tablas afectadas:**
- `profiles`
- `notifications`
- `requisitions`
- `requisition_items`
- `project_members`
- `projects`
- `audit_log`

### 2. Editor de Items en Plantillas ✅

**Nuevo componente:** `src/components/TemplateItemsEditor.jsx`

**Funcionalidades agregadas:**
- ✅ Ver items actuales de la plantilla con imágenes y precios
- ✅ Agregar nuevos productos con buscador
- ✅ Editar cantidades de productos existentes
- ✅ Eliminar productos de la plantilla
- ✅ Vista previa del subtotal por producto
- ✅ Crear plantillas desde cero (sin carrito)

**Página actualizada:** `src/pages/Templates.jsx`
- ✅ Modal de edición ampliado con editor de items
- ✅ Botón "Nueva Plantilla" para crear sin carrito
- ✅ Validaciones mejoradas

### 3. Página de Favoritos ✅

**Estado:** Ya estaba completamente implementada
- ✅ Lista de productos favoritos
- ✅ Filtrado automático de productos activos
- ✅ Agregar al carrito desde favoritos
- ✅ Estados de loading y error bien manejados

---

## FLUJOS A PROBAR

### FLUJO 1: Usuario Normal - Catálogo → Carrito → Requisición

**Prerrequisitos:**
- Usuario con rol `user` autenticado
- Al menos 1 proyecto al que pertenezca
- Productos activos en el catálogo

**Pasos:**

1. **Ir al Catálogo** (`/catalog`)
   - ✅ Ver lista de productos activos
   - ✅ Usar búsqueda y filtros
   - ✅ Paginación funcional

2. **Agregar Productos al Carrito**
   - ✅ Click en "Agregar al Carrito" en ProductCard
   - ✅ Ver toast de confirmación "¡Producto agregado!"
   - ✅ Ver contador del carrito incrementarse
   - ✅ Abrir carrito lateral (drawer) con icono

3. **Revisar Carrito**
   - ✅ Ver productos agregados con cantidades
   - ✅ Editar cantidades (input number)
   - ✅ Eliminar productos (icono de basura)
   - ✅ Ver subtotal, IVA (16%) y total calculados correctamente

4. **Ir a Checkout** (`/checkout`)
   - ✅ Ver resumen completo del pedido
   - ✅ Calcular totales: subtotal + IVA = total

5. **Seleccionar Proyecto**
   - ✅ Dropdown con proyectos a los que pertenece el usuario
   - ✅ Validación: mostrar error si no selecciona proyecto

6. **Agregar Comentarios** (Opcional)
   - ✅ Textarea para instrucciones especiales

7. **Crear Requisición**
   - ✅ Click en "Crear Requisición"
   - ✅ Ver spinner de loading
   - ✅ Ver toast "¡Requisición Creada! Tu requisición REQ-2025-XXXX ha sido creada como borrador."
   - ✅ **CRÍTICO:** Carrito debe vaciarse automáticamente
   - ✅ Redirigir a `/requisitions/{id}`

8. **Verificar Requisición Creada**
   - ✅ Ver detalle de la requisición
   - ✅ Estado: `draft` (borrador)
   - ✅ Ver todos los items con cantidades correctas
   - ✅ Total calculado correctamente

**Resultado Esperado:**
- ✅ Requisición creada con estado `draft`
- ✅ Items guardados correctamente en `requisition_items`
- ✅ Carrito vaciado en la BD (`user_cart_items` vacío)
- ✅ Usuario redirigido a página de detalle

**Posibles Errores a Verificar:**
- ❌ "El proyecto es requerido" → Seleccionar proyecto
- ❌ "No se puede crear una requisición sin productos" → Agregar productos
- ❌ "Sesión no válida" → Reloguear
- ❌ "Uno o más productos ya no están disponibles" → Productos desactivados, refrescar carrito

---

### FLUJO 2: Usuario - Crear Plantilla desde Carrito

**Prerrequisitos:**
- Carrito con al menos 2-3 productos

**Pasos:**

1. **Ir a Checkout** (`/checkout`)
   - ✅ Ver carrito con productos

2. **Click en "Guardar como Plantilla"**
   - ✅ Abre modal

3. **Llenar Formulario**
   - ✅ Nombre: "Suministros Mensuales"
   - ✅ Descripción: "Productos que pedimos cada mes"

4. **Guardar Plantilla**
   - ✅ Click en "Guardar Plantilla"
   - ✅ Ver toast "Plantilla guardada"
   - ✅ Modal se cierra

5. **Verificar en Página de Plantillas** (`/templates`)
   - ✅ Ver plantilla creada
   - ✅ Ver cantidad de productos correcta
   - ✅ Ver nombre y descripción

**Resultado Esperado:**
- ✅ Plantilla creada en BD
- ✅ Items guardados en formato JSONB: `[{product_id, quantity}, ...]`
- ✅ `usage_count` = 0
- ✅ `is_favorite` = false

---

### FLUJO 3: Usuario - Crear Plantilla Desde Cero (NUEVO)

**Prerrequisitos:**
- Ninguno (puede tener carrito vacío)

**Pasos:**

1. **Ir a Plantillas** (`/templates`)
   - ✅ Ver lista de plantillas existentes (o vacío)

2. **Click en "Nueva Plantilla"**
   - ✅ Abre modal grande

3. **Llenar Información Básica**
   - ✅ Nombre: "Papelería Básica"
   - ✅ Descripción: "Papelería de uso diario"

4. **Agregar Productos**
   - ✅ Click en "Agregar Producto"
   - ✅ Usar buscador para encontrar productos
   - ✅ Seleccionar producto del dropdown
   - ✅ Establecer cantidad
   - ✅ Ver vista previa con subtotal
   - ✅ Click en "Agregar"
   - ✅ Ver producto en la lista

5. **Agregar Más Productos**
   - ✅ Repetir para 2-3 productos más

6. **Editar Cantidades**
   - ✅ Cambiar cantidad de un producto con input number
   - ✅ Ver subtotal actualizado

7. **Eliminar un Producto**
   - ✅ Click en icono de basura
   - ✅ Producto desaparece de la lista

8. **Guardar Plantilla**
   - ✅ Click en "Crear Plantilla"
   - ✅ Ver toast "Plantilla creada"
   - ✅ Modal se cierra
   - ✅ Ver plantilla en la lista

**Resultado Esperado:**
- ✅ Plantilla creada con items correctos
- ✅ Se puede crear plantilla sin tener carrito
- ✅ Editor funcional con todas las operaciones

---

### FLUJO 4: Usuario - Editar Plantilla Existente (NUEVO)

**Prerrequisitos:**
- Al menos 1 plantilla existente

**Pasos:**

1. **Ir a Plantillas** (`/templates`)
   - ✅ Ver plantillas

2. **Click en Menú de Plantilla (3 puntos)**
   - ✅ Ver opciones: Usar Plantilla, Editar, Eliminar

3. **Click en "Editar"**
   - ✅ Abre modal con datos precargados

4. **Editar Nombre**
   - ✅ Cambiar nombre de la plantilla

5. **Editar Items**
   - ✅ Ver items actuales con imágenes
   - ✅ Cambiar cantidad de un item
   - ✅ Agregar nuevo producto
   - ✅ Eliminar un producto existente

6. **Guardar Cambios**
   - ✅ Click en "Actualizar Plantilla"
   - ✅ Ver toast "Plantilla actualizada"

7. **Verificar Cambios**
   - ✅ Plantilla muestra nuevo nombre
   - ✅ Cantidad de productos actualizada

**Resultado Esperado:**
- ✅ Plantilla actualizada en BD
- ✅ Items modificados correctamente
- ✅ No se pierden datos al editar

---

### FLUJO 5: Usuario - Usar Plantilla para Crear Requisición

**Prerrequisitos:**
- Plantilla con al menos 2 productos

**Pasos:**

1. **Ir a Plantillas** (`/templates`)
   - ✅ Ver plantillas

2. **Click en "Usar Plantilla"** (menú de 3 puntos)
   - ✅ Ver spinner de loading
   - ✅ Ver toast "Requisición creada - Se ha creado un borrador desde la plantilla"

3. **Redirigir a Requisición**
   - ✅ Navegar a `/requisitions/{id}`

4. **Verificar Requisición**
   - ✅ Estado: `draft`
   - ✅ Items coinciden con la plantilla
   - ✅ Cantidades correctas

5. **Verificar Plantilla Actualizada**
   - ✅ `usage_count` incrementado en 1
   - ✅ `last_used_at` actualizado

**Resultado Esperado:**
- ✅ Requisición borrador creada vía RPC `use_requisition_template`
- ✅ Plantilla tracking actualizado
- ✅ Usuario puede editar la requisición creada

---

### FLUJO 6: Usuario - Gestionar Favoritos

**Prerrequisitos:**
- Productos activos en catálogo

**Pasos:**

1. **Ir al Catálogo** (`/catalog`)

2. **Marcar Productos como Favoritos**
   - ✅ Click en icono de estrella en ProductCard
   - ✅ Estrella cambia a relleno (filled)
   - ✅ Ver toast (opcional)
   - ✅ Repetir con 3-4 productos

3. **Ir a Favoritos** (`/favorites`)
   - ✅ Ver header "Mis Favoritos (X productos guardados)"
   - ✅ Ver grid con productos favoritos
   - ✅ Ver imágenes, nombres, precios

4. **Agregar al Carrito desde Favoritos**
   - ✅ Click en "Agregar al Carrito"
   - ✅ Ver toast de confirmación
   - ✅ Contador de carrito incrementa

5. **Quitar de Favoritos**
   - ✅ Click en estrella filled
   - ✅ Producto desaparece de la lista
   - ✅ Contador de favoritos decrementa

**Resultado Esperado:**
- ✅ Favoritos persisten en BD (`user_favorites`)
- ✅ Al recargar página, favoritos se mantienen
- ✅ Productos desactivados no aparecen en favoritos

---

### FLUJO 7: Supervisor - Aprobar Requisición

**Prerrequisitos:**
- Usuario con rol `supervisor`
- Proyecto con `supervisor_id` = usuario actual
- Requisición con estado `submitted` en ese proyecto

**Pasos:**

1. **Ir a Aprobaciones** (`/approvals`)
   - ✅ Ver lista de requisiciones pendientes

2. **Click en Requisición Pendiente**
   - ✅ Navegar a `/requisitions/{id}`

3. **Revisar Detalle**
   - ✅ Ver items, total, comentarios
   - ✅ Ver botón "Aprobar" (verde)
   - ✅ Ver botón "Rechazar" (rojo)

4. **Aprobar Requisición**
   - ✅ Click en "Aprobar"
   - ✅ Opcional: Agregar comentario
   - ✅ Confirmar

5. **Verificar Cambios**
   - ✅ Estado cambia a `approved`
   - ✅ Ver toast "Requisición aprobada"
   - ✅ Comentario aparece en historial
   - ✅ `approved_at` timestamp actualizado
   - ✅ `approved_by` = ID del supervisor

**Resultado Esperado:**
- ✅ RPC `approve_requisition` ejecutado correctamente
- ✅ Estado en BD: `business_status` = 'approved'
- ✅ Notificación creada para el creador (opcional)

---

### FLUJO 8: Supervisor - Rechazar Requisición

**Pasos:**

1. **Ir a Requisición Pendiente**
   - ✅ Ver detalle

2. **Click en "Rechazar"**
   - ✅ Abre modal

3. **Ingresar Motivo del Rechazo** (REQUERIDO)
   - ✅ Textarea con placeholder
   - ✅ Validación: no puede estar vacío

4. **Confirmar Rechazo**
   - ✅ Click en "Rechazar Requisición"

5. **Verificar Cambios**
   - ✅ Estado cambia a `rejected`
   - ✅ Ver toast "Requisición rechazada"
   - ✅ Motivo visible en UI
   - ✅ `rejected_at` timestamp actualizado

**Resultado Esperado:**
- ✅ RPC `reject_requisition` ejecutado
- ✅ `rejection_reason` guardado
- ✅ Creador puede ver el motivo

---

### FLUJO 9: Admin - Gestionar Proyectos y Miembros

**Prerrequisitos:**
- Usuario con rol `admin`

**Pasos:**

1. **Ir a Proyectos** (`/projects`)
   - ✅ Ver lista de proyectos de la compañía

2. **Crear Nuevo Proyecto**
   - ✅ Click en "Nuevo Proyecto"
   - ✅ Llenar formulario: nombre, descripción
   - ✅ Seleccionar supervisor
   - ✅ Guardar

3. **Agregar Miembros al Proyecto**
   - ✅ Click en proyecto
   - ✅ Click en "Agregar Miembro"
   - ✅ Seleccionar usuario
   - ✅ Establecer `requires_approval` (checkbox)
   - ✅ Guardar

4. **Editar Proyecto**
   - ✅ Cambiar nombre o descripción
   - ✅ Cambiar supervisor
   - ✅ Guardar cambios

5. **Archivar Proyecto**
   - ✅ Cambiar status a `archived`
   - ✅ Proyecto ya no aparece en listas activas

**Resultado Esperado:**
- ✅ Proyectos CRUD funcional
- ✅ Miembros con `requires_approval` correctamente configurado
- ✅ Supervisores asignados correctamente

---

### FLUJO 10: Admin - Gestionar Productos

**Prerrequisitos:**
- Usuario con rol `admin`

**Pasos:**

1. **Ir a Gestión de Productos** (`/products/manage`)
   - ✅ Ver lista de productos

2. **Crear Nuevo Producto**
   - ✅ Click en "Nuevo Producto"
   - ✅ Llenar: nombre, SKU, precio, stock, categoría
   - ✅ Subir imagen (opcional)
   - ✅ Guardar

3. **Editar Producto Existente**
   - ✅ Cambiar precio o stock
   - ✅ Guardar cambios
   - ✅ Ver cambios reflejados

4. **Desactivar Producto**
   - ✅ Toggle `is_active` a `false`
   - ✅ Producto ya no aparece en catálogo
   - ✅ Producto aún aparece en requisiciones históricas

5. **Reactivar Producto**
   - ✅ Toggle `is_active` a `true`
   - ✅ Producto vuelve a aparecer en catálogo

**Resultado Esperado:**
- ✅ Productos CRUD funcional
- ✅ Validaciones: precio >= 0, stock >= 0
- ✅ Productos inactivos automáticamente removidos de carritos

---

## VALIDACIONES AUTOMÁTICAS EN BACKEND

### RLS Policies

**Todas las operaciones deben respetar RLS:**

1. **Usuarios solo ven/editan sus propios datos:**
   - ✅ Carrito (`user_cart_items`)
   - ✅ Favoritos (`user_favorites`)
   - ✅ Plantillas (`requisition_templates`)

2. **Usuarios solo ven requisiciones relevantes:**
   - ✅ Propias (created_by = user)
   - ✅ De proyectos donde es supervisor
   - ✅ Todas (si es admin)

3. **Solo supervisores/admins pueden aprobar:**
   - ✅ RPC `approve_requisition` valida permisos
   - ✅ RPC `reject_requisition` valida permisos

4. **Datos aislados por compañía:**
   - ✅ Todos los datos filtrados por `company_id`
   - ✅ Usuarios de una compañía NO ven datos de otra

### Validaciones en RPC Functions

**`create_full_requisition`:**
- ✅ Usuario autenticado
- ✅ Proyecto existe y pertenece a la compañía
- ✅ Productos existen y están activos
- ✅ Stock suficiente
- ✅ Genera folio único: `REQ-YYYY-XXXX`

**`approve_requisition`:**
- ✅ Usuario es admin o supervisor del proyecto
- ✅ Requisición en estado `submitted`
- ✅ Actualiza `approved_by` y `approved_at`

**`reject_requisition`:**
- ✅ Usuario es admin o supervisor
- ✅ Requisición en estado `submitted`
- ✅ `reason` es requerido y no vacío

**`use_requisition_template`:**
- ✅ Plantilla existe y pertenece al usuario
- ✅ Plantilla tiene items válidos
- ✅ Incrementa `usage_count`
- ✅ Actualiza `last_used_at`

**`clear_user_cart`:**
- ✅ Solo vacía carrito del usuario autenticado
- ✅ Retorna cantidad de items eliminados

---

## CASOS EDGE A VERIFICAR

### 1. Producto Eliminado del Catálogo

**Escenario:**
- Usuario tiene producto en carrito
- Admin desactiva producto (`is_active = false`)

**Comportamiento Esperado:**
- ✅ Al cargar carrito, producto desactivado se elimina automáticamente
- ✅ Usuario ve toast informativo (opcional)
- ✅ Carrito se actualiza sin ese producto

### 2. Sesión Expirada

**Escenario:**
- Usuario deja la app abierta por > 1 hora
- Token JWT expira

**Comportamiento Esperado:**
- ✅ Al hacer cualquier acción, detecta sesión expirada
- ✅ Muestra error "Sesión no válida. Por favor, inicia sesión nuevamente."
- ✅ Redirige a `/login`
- ✅ Después de login, redirige a página original

### 3. Requisición Sin Items

**Escenario:**
- Usuario intenta crear requisición con carrito vacío

**Comportamiento Esperado:**
- ✅ Botón "Crear Requisición" deshabilitado
- ✅ O muestra error: "No se puede crear una requisición sin productos"

### 4. Plantilla Sin Items

**Escenario:**
- Usuario intenta guardar plantilla sin agregar productos

**Comportamiento Esperado:**
- ✅ Se permite (puede agregar items después)
- ✅ O mostrar warning: "Esta plantilla no tiene productos"

### 5. Usuario Sin Proyectos

**Escenario:**
- Usuario nuevo, no pertenece a ningún proyecto

**Comportamiento Esperado:**
- ✅ En checkout, dropdown muestra: "No perteneces a ningún proyecto"
- ✅ Botón "Crear Requisición" deshabilitado
- ✅ Mensaje: "Contacta a tu administrador para unirte a un proyecto"

### 6. Carrito con Productos de Otra Compañía

**Escenario:**
- Usuario cambia de compañía (edge case extremo)

**Comportamiento Esperado:**
- ✅ RLS filtra automáticamente productos de otra compañía
- ✅ Carrito aparece vacío para la nueva compañía

---

## MÉTRICAS DE ÉXITO

**Después de probar todos los flujos:**

```
✅ Todos los flujos principales funcionan de inicio a fin
✅ No hay errores en consola de browser durante uso normal
✅ Carrito persiste correctamente entre sesiones
✅ Requisiciones se crean con todos los datos correctos
✅ Plantillas se pueden crear, editar y usar sin problemas
✅ Favoritos persisten y se muestran correctamente
✅ Aprobaciones funcionan con permisos correctos
✅ RLS policies bloquean accesos no autorizados
✅ Performance aceptable (< 2s por acción)
✅ Errores se muestran de forma clara al usuario
```

---

## COMANDOS ÚTILES PARA TESTING

### Verificar Datos en Supabase

```sql
-- Ver carrito del usuario actual
SELECT * FROM user_cart_items WHERE user_id = auth.uid();

-- Ver favoritos del usuario actual
SELECT * FROM user_favorites WHERE user_id = auth.uid();

-- Ver requisiciones propias
SELECT id, internal_folio, business_status, created_at
FROM requisitions
WHERE created_by = auth.uid()
ORDER BY created_at DESC;

-- Ver plantillas propias
SELECT id, name, items, usage_count, last_used_at
FROM requisition_templates
WHERE user_id = auth.uid();

-- Ver proyectos donde soy miembro
SELECT p.name, pm.role_in_project, pm.requires_approval
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.user_id = auth.uid();
```

### Limpiar Datos de Testing

```sql
-- CUIDADO: Solo en ambiente de desarrollo

-- Limpiar carrito
DELETE FROM user_cart_items WHERE user_id = auth.uid();

-- Limpiar favoritos
DELETE FROM user_favorites WHERE user_id = auth.uid();

-- Eliminar plantillas de testing
DELETE FROM requisition_templates
WHERE user_id = auth.uid()
AND name LIKE '%Test%';

-- Eliminar requisiciones borrador
DELETE FROM requisitions
WHERE created_by = auth.uid()
AND business_status = 'draft';
```

---

## TROUBLESHOOTING

### Error: "Sesión no válida"

**Causa:** Token JWT expirado
**Solución:**
1. Hacer logout
2. Hacer login nuevamente
3. Verificar que `.env` tenga las credenciales correctas

### Error: "Producto no encontrado"

**Causa:** Producto desactivado o eliminado
**Solución:**
1. Refrescar carrito con `refetch()`
2. Productos inactivos se eliminan automáticamente

### Error: "No tienes permisos"

**Causa:** RLS policy bloqueando acción
**Solución:**
1. Verificar rol del usuario: `SELECT role_v2 FROM profiles WHERE id = auth.uid()`
2. Verificar que usuario pertenece a proyecto/compañía correcta

### Carrito No Se Vacía Después de Crear Requisición

**Causa:** RPC `clear_user_cart` falla silenciosamente
**Solución:**
1. Verificar logs en consola
2. Verificar en BD: `SELECT * FROM user_cart_items WHERE user_id = auth.uid()`
3. Si hay datos, ejecutar manualmente: `SELECT clear_user_cart()`

### Plantilla No Se Puede Usar

**Causa:** Items JSONB mal formateados
**Solución:**
1. Ver items: `SELECT items FROM requisition_templates WHERE id = '<id>'`
2. Verificar formato: `[{"product_id": "uuid", "quantity": number}, ...]`
3. Re-editar plantilla para corregir

---

## CONCLUSIÓN

Si todos los flujos anteriores funcionan correctamente, el sistema está **completamente funcional** y listo para producción.

**Próximos pasos recomendados:**
1. Testing con datos reales de producción
2. Testing de carga (múltiples usuarios simultáneos)
3. Monitoreo de performance en producción
4. Configurar alertas para errores críticos
5. Documentación de usuario final

---

**¡Fin de la Guía de Pruebas!**
