# 🚀 APLICAR CORRECCIONES CMD10 - GUÍA RÁPIDA
## Restaurar Funcionalidad de Carrito y Requisiciones

---

## ⚡ RESUMEN DE 30 SEGUNDOS

Tu app está rota porque **faltan 5 funciones en la base de datos**. Tengo las correcciones listas. Solo necesitas:

1. **Ejecutar 2 archivos SQL en Supabase** (5 min)
2. **Probar el flujo completo** (5 min)
3. **Decirme "continuar"** para la siguiente iteración

---

## 🎯 APLICACIÓN PASO A PASO

### ⚠️ IMPORTANTE: Hacer Backup
```bash
# Antes de aplicar cualquier cosa, backup de BD
# En Supabase Dashboard:
# Settings → Database → Create Backup
```

---

### PASO 1: Verificar Estado Actual (Opcional pero Recomendado)

#### 1.1 Abrir Supabase
```
1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto ComerECO
3. Ir a: SQL Editor (menú izquierdo)
```

#### 1.2 Ejecutar Script de Verificación
```
1. Click en "New Query"
2. Copiar TODO el contenido de:
   scripts/verify-db-structure.sql
3. Click "Run" (Ctrl/Cmd + Enter)
4. Revisar resultados:
   - ¿Aparecen las tablas user_cart_items, requisition_items, folio_counters?
   - ¿Aparecen las funciones clear_user_cart, create_full_requisition, etc?
```

**Interpretación de Resultados:**
```
SI las tablas/funciones YA EXISTEN:
  → Las migraciones no harán nada (CREATE IF NOT EXISTS)
  → Seguro continuar

SI las tablas/funciones NO EXISTEN:
  → Las migraciones las crearán
  → NECESARIO continuar
```

---

### PASO 2: Aplicar Migraciones (OBLIGATORIO)

#### 2.1 Primera Migración - Tablas
```
1. En Supabase SQL Editor, click "New Query"
2. Copiar TODO el contenido de:
   supabase/migrations/20250103_create_missing_tables.sql
3. Click "Run" (Ctrl/Cmd + Enter)
4. Verificar: Debe decir "Success" (o "already exists" si la tabla existe)
```

**Si hay error:**
```sql
-- Error típico: "table already exists"
-- SOLUCIÓN: Ignorar, la tabla ya existe (está bien)

-- Error típico: "relation does not exist"
-- SOLUCIÓN: Verificar que la tabla referenciada existe
-- Ejemplo: Si dice "products does not exist", primero crear tabla products
```

#### 2.2 Segunda Migración - Funciones RPC
```
1. En Supabase SQL Editor, click "New Query"  
2. Copiar TODO el contenido de:
   supabase/migrations/20250103_create_cart_and_requisition_rpcs.sql
3. Click "Run" (Ctrl/Cmd + Enter)
4. Verificar: Debe decir "Success"
```

**Si hay error:**
```sql
-- Error típico: "function already exists"
-- SOLUCIÓN: Las funciones se reemplazan con CREATE OR REPLACE, está bien

-- Error: "column does not exist"
-- SOLUCIÓN: Verificar que la primera migración se ejecutó correctamente
```

---

### PASO 3: Validar Que Todo Está Bien

#### 3.1 Validar Tablas
```sql
-- Ejecutar en SQL Editor:
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_cart_items', 'requisition_items', 'folio_counters');
```

**Resultado esperado:**
```
table_name         | column_count
-------------------|-------------
user_cart_items    | 5
requisition_items  | 6
folio_counters     | 3
```

#### 3.2 Validar Funciones RPC
```sql
-- Ejecutar en SQL Editor:
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'clear_user_cart',
    'create_full_requisition',
    'submit_requisition',
    'approve_requisition',
    'reject_requisition'
  )
ORDER BY routine_name;
```

**Resultado esperado:**
```
routine_name            | routine_type | return_type
------------------------|--------------|-------------
approve_requisition     | FUNCTION     | jsonb
clear_user_cart         | FUNCTION     | void
create_full_requisition | FUNCTION     | uuid
reject_requisition      | FUNCTION     | jsonb
submit_requisition      | FUNCTION     | jsonb
```

---

### PASO 4: Probar el Flujo Completo

#### 4.1 Preparación
```
1. Asegúrate de tener:
   - Al menos 1 usuario creado en el sistema
   - Al menos 1 proyecto creado
   - El usuario es MIEMBRO del proyecto (revisar en project_members)
   - Al menos 3 productos activos en el catálogo
```

#### 4.2 Test del Carrito
```
1. Abrir la app: http://localhost:5173 (o tu URL)
2. Login con usuario normal (no admin)
3. Ir a: /catalog
4. Buscar un producto
5. Click en botón "+" (agregar al carrito)
6. Verificar: 
   ✓ Toast "¡Producto añadido!"
   ✓ Badge en ícono de carrito muestra "1"
7. Agregar 2 productos más
8. Click en ícono de carrito (esquina superior derecha)
9. Verificar:
   ✓ Panel lateral se abre
   ✓ Se muestran 3 productos
   ✓ Puedes aumentar/disminuir cantidad con +/-
   ✓ Puedes eliminar productos con ícono de basurero
   ✓ Subtotal, IVA y Total se calculan correctamente
```

**Si el carrito NO se abre:**
```javascript
// Revisar consola del navegador (F12)
// Error común: "Cannot read property 'toggleCart' of undefined"
// SOLUCIÓN: Verificar que CartProvider está montado en AppProviders
```

#### 4.3 Test del Checkout
```
1. Con 2-3 productos en el carrito
2. Click "Finalizar Compra" (en el panel del carrito)
3. Ir a: /checkout
4. Verificar:
   ✓ Se muestran los productos del carrito
   ✓ Aparece dropdown "Proyecto"
5. Seleccionar un proyecto del dropdown
6. (Opcional) Agregar comentarios
7. Click "Crear Requisición"
8. Verificar:
   ✓ Botón muestra loading state
   ✓ Después de 1-2 segundos, toast "¡Requisición Creada!"
   ✓ Redirect automático a /requisitions/{id}
```

**Si falla en "Crear Requisición":**
```javascript
// Revisar consola del navegador (F12)
// Error común: "Error calling RPC create_full_requisition"
// SOLUCIÓN: Verificar que la segunda migración se aplicó correctamente

// Error común: "Usuario no es miembro del proyecto"
// SOLUCIÓN: Agregar el usuario a project_members:
INSERT INTO project_members (project_id, user_id, added_by)
VALUES ('{project_id}', '{user_id}', '{admin_user_id}');
```

#### 4.4 Verificar Requisición Creada
```
1. En la página de detalle de requisición (/requisitions/{id})
2. Verificar:
   ✓ Folio generado: REQ-2025-0001 (o siguiente número)
   ✓ Estado: "Borrador" (draft)
   ✓ Proyecto correcto
   ✓ Productos listados con cantidades correctas
   ✓ Total coincide con lo que estaba en checkout
3. Verificar que el carrito está vacío:
   - Click en ícono de carrito
   - Debe mostrar "Tu carrito está vacío"
```

#### 4.5 Test de Aprobación (Opcional)
```
1. En la requisición recién creada
2. Click "Enviar para Aprobación"
3. Verificar: Estado cambia a "Enviado"
4. Logout
5. Login como supervisor del proyecto
6. Ir a: /approvals
7. Verificar: La requisición aparece en la lista
8. Click "Aprobar"
9. Verificar: 
   ✓ Estado cambia a "Aprobado"
   ✓ Aparece nombre del aprobador
   ✓ Aparece fecha de aprobación
```

---

### PASO 5: Validar en Base de Datos (Opcional)

#### 5.1 Verificar que el Carrito se Guardó
```sql
-- Ver items en carritos de todos los usuarios
SELECT 
  u.user_id,
  pr.full_name,
  p.name as product_name,
  u.quantity,
  p.price,
  (u.quantity * p.price) as subtotal
FROM user_cart_items u
JOIN profiles pr ON pr.id = u.user_id
JOIN products p ON p.id = u.product_id;
```

#### 5.2 Verificar Requisición Creada
```sql
-- Ver última requisición creada
SELECT 
  r.id,
  r.internal_folio,
  r.business_status,
  r.total_amount,
  pr.full_name as creator,
  pj.name as project
FROM requisitions r
JOIN profiles pr ON pr.id = r.created_by
JOIN projects pj ON pj.id = r.project_id
ORDER BY r.created_at DESC
LIMIT 1;
```

#### 5.3 Verificar Items de Requisición
```sql
-- Ver items de la última requisición
SELECT 
  ri.requisition_id,
  r.internal_folio,
  p.name as product_name,
  ri.quantity,
  ri.unit_price,
  ri.subtotal
FROM requisition_items ri
JOIN requisitions r ON r.id = ri.requisition_id
JOIN products p ON p.id = ri.product_id
WHERE ri.requisition_id = (
  SELECT id FROM requisitions ORDER BY created_at DESC LIMIT 1
);
```

---

## ✅ CRITERIOS DE ÉXITO

### ¿Cómo saber si TODO está bien?

#### Backend ✅
- [ ] 5 funciones RPC existen en Supabase
- [ ] 3 tablas existen (user_cart_items, requisition_items, folio_counters)
- [ ] Políticas RLS activas

#### Frontend ✅
- [ ] Puedes agregar productos al carrito
- [ ] Puedes modificar cantidades en el carrito
- [ ] Puedes eliminar productos del carrito
- [ ] Puedes ir a checkout
- [ ] Puedes crear una requisición
- [ ] El carrito se vacía después de crear requisición
- [ ] La requisición tiene folio único (REQ-2025-####)

#### Base de Datos ✅
- [ ] Existe registro en `user_cart_items` cuando agregas al carrito
- [ ] Existe registro en `requisitions` cuando creas requisición
- [ ] Existen registros en `requisition_items` con los productos
- [ ] El carrito se vació (no hay registros para ese usuario en `user_cart_items`)

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Error 404 al llamar RPC"
**Causa:** La función RPC no existe en Supabase  
**Solución:**
```
1. Verificar que ejecutaste la segunda migración
2. Ejecutar query de validación de funciones (Paso 3.2)
3. Si no aparece, re-ejecutar la segunda migración
```

### Problema 2: "Usuario no autenticado"
**Causa:** No hay sesión activa  
**Solución:**
```
1. Logout y volver a login
2. Verificar en DevTools → Application → Local Storage
3. Debe existir key "supabase.auth.token"
```

### Problema 3: "No perteneces a ningún proyecto"
**Causa:** El usuario no está en project_members  
**Solución:**
```sql
-- Agregar usuario al proyecto en SQL Editor:
INSERT INTO project_members (project_id, user_id, added_by, requires_approval)
VALUES (
  '{project_id}',  -- ID del proyecto
  '{user_id}',     -- ID del usuario (auth.uid)
  '{admin_id}',    -- ID de un admin
  false
);
```

### Problema 4: "El carrito no se abre"
**Causa:** CartProvider no está montado correctamente  
**Solución:**
```javascript
// Verificar src/context/AppProviders.jsx
// Debe tener:
<CartProvider>
  {children}
</CartProvider>
```

### Problema 5: "Folio duplicado"
**Causa:** Race condition en generación de folio (muy raro)  
**Solución:**
```sql
-- Resetear contador de folios para el año actual:
UPDATE folio_counters 
SET last_folio_number = (
  SELECT COALESCE(MAX(CAST(SUBSTRING(internal_folio FROM 10) AS INTEGER)), 0)
  FROM requisitions
  WHERE internal_folio LIKE 'REQ-2025-%'
)
WHERE year = 2025;
```

---

## 📞 NECESITAS AYUDA?

### Logs de Errores
```
1. Frontend: Abrir DevTools (F12) → Console
2. Backend: Supabase Dashboard → Database → Logs
3. RPC: Supabase Dashboard → Database → Functions → View Logs
```

### Rollback (Si algo salió mal)
```sql
-- Eliminar funciones creadas
DROP FUNCTION IF EXISTS clear_user_cart();
DROP FUNCTION IF EXISTS create_full_requisition(uuid, text, jsonb);
DROP FUNCTION IF EXISTS submit_requisition(uuid);
DROP FUNCTION IF EXISTS approve_requisition(uuid, text);
DROP FUNCTION IF EXISTS reject_requisition(uuid, text);

-- Eliminar tablas (CUIDADO: Perderás datos)
-- DROP TABLE IF EXISTS user_cart_items CASCADE;
-- DROP TABLE IF EXISTS requisition_items CASCADE;
-- DROP TABLE IF EXISTS folio_counters CASCADE;
```

---

## 🎉 TODO LISTO?

Si llegaste aquí y todo funciona:

1. ✅ Marca como completado este checklist
2. ✅ Guarda los scripts de migración aplicados
3. ✅ Documenta cualquier problema encontrado
4. ✅ Escribe "continuar" para proceder con **Iteración 2**

---

**Próxima Iteración:**
- Auditoría de imágenes de productos
- Revisión de barra de búsqueda
- Validación de plantillas
- Verificación de favoritos
- Auditoría de UX/UI visual

---

**Tiempo total estimado:** 15-20 minutos  
**Dificultad:** Baja (solo copy/paste SQL)  
**Riesgo:** Muy bajo (migraciones idempotentes)  

🚀 **¡Adelante!**

