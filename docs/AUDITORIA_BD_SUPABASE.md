# 🔍 AUDITORÍA BASE DE DATOS SUPABASE - COMERECO
## Prompts de Verificación para Alinear BD con Frontend

Este documento contiene prompts de auditoría basados en el análisis del código frontend. Identifica qué debe existir en la base de datos para que la aplicación funcione correctamente.

---

## 📋 METODOLOGÍA

Analiza el código frontend para identificar:
1. **Tablas** que se consultan
2. **Campos** que se esperan en cada tabla
3. **Relaciones** entre tablas (foreign keys)
4. **Funciones RPC** que se llaman
5. **Queries** específicas que se ejecutan
6. **Filtros** y **ordenamientos** que se aplican

---

## 🎯 PROMPT 1: AUDITORÍA DE TABLAS Y CAMPOS

### Instrucciones

Analiza el código frontend de ComerECO y verifica que la base de datos tenga todas las tablas y campos que el frontend espera. El frontend hace queries a las siguientes tablas:

**Tablas identificadas en el código**:
- `profiles` - Perfiles de usuario
- `companies` - Compañías
- `products` - Productos del catálogo
- `requisitions` - Requisiciones de compra
- `requisition_items` - Items individuales de requisiciones (tabla separada)
- `requisition_templates` - Plantillas de requisiciones
- `user_cart_items` - Items del carrito de usuario
- `user_favorites` - Productos favoritos del usuario
- `notifications` - Notificaciones del sistema
- `projects` - Proyectos (referenciados pero no consultados directamente)
- `project_members` - Miembros de proyectos (referenciados pero no consultados directamente)

**Verifica**:

1. **Tabla `profiles`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `email`, `full_name`, `role`, `avatar_url`, `company_id`?
   - ¿Tiene relación con `companies` (campo `company_id`)?
   - ¿El campo `role` permite valores: 'admin', 'supervisor', 'user'?
   - ¿El campo `id` es UUID y referencia `auth.users(id)`?

2. **Tabla `companies`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `name`, `bind_location_id`, `bind_price_list_id`?
   - ¿El frontend espera hacer join: `company:company_id ( name, bind_location_id, bind_price_list_id )`?

3. **Tabla `products`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `name`, `sku`, `category`, `price`, `stock`, `image_url`, `unit`, `is_active`, `company_id`?
   - ¿Se puede filtrar por `company_id` y `is_active`?
   - ¿Se puede buscar con `ilike` en `name` y `sku`?
   - ¿Se puede ordenar por `name` u otros campos?

4. **Tabla `requisitions`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `project_id`, `requester_id`, `business_status`, `integration_status`, `internal_folio`, `comments`, `company_id`, `created_at`?
   - ¿Tiene relación con `profiles` vía `requester_id`?
   - ¿El frontend espera hacer join: `requester:requester_id ( full_name, avatar_url, role )`?
   - ¿El frontend espera hacer join: `project:project_id ( name )`?
   - ¿El frontend espera hacer join: `items:requisition_items` con campos `id`, `quantity`, `unit_price`, `subtotal`, `product:product_id ( name, sku, image_url, unit )`?
   - ¿El campo `business_status` acepta valores: 'submitted', 'draft', 'pending_approval', 'approved', 'rejected', etc.?
   - ¿El campo `integration_status` existe y qué valores acepta?
   - ¿Se puede filtrar por `company_id`, `requester_id`, `business_status`?
   - ¿Se puede ordenar por `created_at` desc?
   - ¿El campo `internal_folio` se genera automáticamente o se inserta manualmente?

5. **Tabla `requisition_items`**:
   - ¿Existe la tabla separada (no JSONB en requisitions)?
   - ¿Tiene los campos: `id`, `requisition_id`, `product_id`, `quantity`, `unit_price`, `subtotal`?
   - ¿Tiene relación con `requisitions` vía `requisition_id`?
   - ¿Tiene relación con `products` vía `product_id`?
   - ¿El frontend espera hacer join: `product:product_id ( name, sku, image_url, unit )`?

6. **Tabla `requisition_templates`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `project_id`, `user_id`, `company_id`, `name`, `description`, `items`, `is_favorite`, `usage_count`, `last_used_at`, `created_at`?
   - ¿Se puede filtrar por `user_id`?
   - ¿Se puede ordenar por `is_favorite`, `last_used_at`, `created_at`?
   - ¿El campo `items` es JSONB?

7. **Tabla `user_cart_items`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `user_id`, `product_id`, `quantity`, `created_at`, `updated_at`?
   - ¿Tiene relación con `products` vía `product_id`?
   - ¿El frontend espera hacer join: `products:product_id ( * )`?
   - ¿Se puede hacer `upsert` con `user_id` y `product_id`?
   - ¿Se puede filtrar por `user_id`?

8. **Tabla `user_favorites`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `user_id`, `product_id`, `created_at`?
   - ¿Tiene relación con `products` vía `product_id`?
   - ¿Se puede filtrar por `user_id`?
   - ¿Se puede hacer INSERT y DELETE con `match({ user_id, product_id })`?

9. **Tabla `notifications`**:
   - ¿Existe la tabla?
   - ¿Tiene los campos: `id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`, `read_at`, `company_id`, `created_at`?
   - ¿Se puede filtrar por `user_id`?
   - ¿Se puede ordenar por `created_at` desc?
   - ¿Se puede actualizar `is_read`?

---

## 🎯 PROMPT 2: AUDITORÍA DE RELACIONES Y JOINS

### Instrucciones

Verifica que todas las relaciones que el frontend espera existan en la base de datos:

**Relaciones esperadas**:

1. **profiles → companies**:
   - ¿Existe foreign key `profiles.company_id → companies.id`?
   - ¿El frontend puede hacer: `company:company_id ( name, bind_location_id, bind_price_list_id )`?

2. **requisitions → profiles**:
   - ¿Existe foreign key `requisitions.requester_id → profiles.id` o `requisitions.created_by → profiles.id`?
   - ¿El frontend puede hacer: `requester:requester_id ( full_name, avatar_url, role )`?
   - ¿Hay conflicto entre `requester_id` y `created_by`?

3. **requisitions → projects**:
   - ¿Existe foreign key `requisitions.project_id → projects.id`?
   - ¿El frontend puede hacer: `project:project_id ( name )`?

4. **requisitions → requisition_items**:
   - ¿Existe tabla `requisition_items`?
   - ¿Existe foreign key `requisition_items.requisition_id → requisitions.id`?
   - ¿Existe foreign key `requisition_items.product_id → products.id`?
   - ¿El frontend puede hacer: `items:requisition_items ( id, quantity, unit_price, subtotal, product:product_id ( name, sku, image_url, unit ) )`?

5. **user_cart_items → products**:
   - ¿Existe foreign key `user_cart_items.product_id → products.id`?
   - ¿El frontend puede hacer: `products:product_id ( * )`?

6. **products → companies**:
   - ¿Existe foreign key `products.company_id → companies.id`?
   - ¿Se puede filtrar productos por `company_id`?

7. **requisition_templates → projects**:
   - ¿Existe foreign key `requisition_templates.project_id → projects.id`?
   - ¿Se puede filtrar plantillas por `project_id`?

8. **requisition_templates → profiles**:
   - ¿Existe foreign key `requisition_templates.user_id → profiles.id`?
   - ¿Se puede filtrar plantillas por `user_id`?

9. **notifications → profiles**:
   - ¿Existe foreign key `notifications.user_id → profiles.id`?
   - ¿Se puede filtrar notificaciones por `user_id`?

---

## 🎯 PROMPT 3: AUDITORÍA DE FUNCIONES RPC

### Instrucciones

Verifica que todas las funciones RPC que el frontend llama existan en la base de datos:

**Funciones RPC identificadas**:

1. **`use_requisition_template(p_template_id UUID)`**:
   - ¿Existe la función?
   - ¿Recibe parámetro `p_template_id` de tipo UUID?
   - ¿Retorna el ID de la nueva requisición creada (UUID o TEXT)?
   - ¿Incrementa `usage_count` y actualiza `last_used_at` en la plantilla?

2. **`broadcast_to_company(p_event_name TEXT, p_payload JSONB)`**:
   - ¿Existe la función?
   - ¿Recibe `p_event_name` (TEXT) y `p_payload` (JSONB)?
   - ¿Retorna JSONB con `success`, `company_id`, `event_name`, `payload`?

3. **`clear_user_cart()`**:
   - ¿Existe la función?
   - ¿Elimina todos los items del carrito del usuario autenticado?
   - ¿Retorna JSONB con `success`?

4. **`get_unique_product_categories(p_company_id UUID)`**:
   - ¿Existe la función?
   - ¿Recibe parámetro `p_company_id` de tipo UUID?
   - ¿Retorna tabla con campo `category` (TEXT)?
   - ¿Filtra solo productos activos (`is_active = true`)?

5. **`create_full_requisition(p_comments TEXT, p_items JSONB)`**:
   - ¿Existe la función?
   - ¿Recibe `p_comments` (TEXT) y `p_items` (JSONB)?
   - ¿El parámetro `p_items` es array de objetos con `product_id` y `quantity`?
   - ¿Genera `internal_folio` automáticamente?
   - ¿Crea requisición y items en una transacción atómica?
   - ¿Retorna el ID de la requisición creada?
   - ¿Verifica que el usuario tenga permisos en el proyecto?

**Funciones RPC que el frontend DEBERÍA usar pero no están implementadas**:

Basado en el código, el frontend hace operaciones que deberían ser funciones RPC:

1. **`submit_requisition(p_requisition_id UUID)`**:
   - ¿Existe? El frontend llama `updateRequisitionBusinessStatus` pero debería usar RPC
   - ¿Verifica `requires_approval` del usuario en `project_members`?
   - ¿Cambia `business_status` a 'pending_approval' o 'approved' automáticamente?

2. **`approve_requisition(p_requisition_id UUID, p_comments TEXT)`**:
   - ¿Existe? El frontend actualiza directamente pero debería usar RPC
   - ¿Verifica permisos del supervisor?
   - ¿Crea notificación automáticamente?

3. **`reject_requisition(p_requisition_id UUID, p_rejection_reason TEXT)`**:
   - ¿Existe? El frontend actualiza directamente pero debería usar RPC
   - ¿Verifica permisos del supervisor?
   - ¿Crea notificación automáticamente?

---

## 🎯 PROMPT 4: AUDITORÍA DE CAMPOS CONFLICTIVOS

### Instrucciones

Identifica conflictos de nombres de campos que el frontend espera:

**Conflicto identificado**:

1. **requisitions.status vs requisitions.business_status**:
   - El código usa SOLO `business_status` en todos los lugares
   - ¿Existe campo `status` o solo `business_status`?
   - ¿Qué valores acepta `business_status`? (El código espera: 'submitted', 'draft', etc.)

2. **requisitions.requester_id vs requisitions.created_by**:
   - El código usa SOLO `requester_id` en todos los lugares
   - ¿Existe campo `created_by` o solo `requester_id`?
   - ¿El frontend hace join `requester:requester_id`?

3. **requisitions.integration_status**:
   - El código selecciona `integration_status` en RequisitionDetail
   - ¿Existe este campo?
   - ¿Qué valores acepta?
   - ¿Se muestra en la UI junto con `business_status`?

4. **requisitions.items JSONB vs requisition_items tabla**:
   - El código espera tabla `requisition_items` con joins
   - ¿Existe campo `items` JSONB en requisitions o solo tabla `requisition_items`?
   - ¿O existen ambos y hay conflicto?

---

## 🎯 PROMPT 5: AUDITORÍA DE ESTRUCTURA DE DATOS JSONB

### Instrucciones

Verifica que los campos JSONB tengan la estructura que el frontend espera:

**Campos JSONB identificados**:

1. **requisitions.items**:
   - ¿Existe campo `items` JSONB en requisitions?
   - ¿O solo existe tabla `requisition_items`?
   - Si existe JSONB, ¿el frontend lo usa o solo usa la tabla?

2. **requisition_templates.items**:
   - ¿Es JSONB?
   - ¿El frontend espera un array de objetos?
   - ¿Cada objeto tiene: `product_id`, `quantity`, `unit_price`, `product_name`?
   - ¿O debe ser tabla separada como `requisition_items`?

3. **profiles.metadata**:
   - ¿Es JSONB?
   - ¿El frontend lo usa o solo lo referencia?

4. **create_full_requisition.p_items**:
   - ¿El parámetro `p_items` es JSONB?
   - ¿Es array de objetos con estructura: `[{ product_id, quantity }]`?
   - ¿La función crea registros en `requisition_items` desde este JSONB?

---

## 🎯 PROMPT 6: AUDITORÍA DE ÍNDICES Y PERFORMANCE

### Instrucciones

Verifica que existan índices para las queries que el frontend hace frecuentemente:

**Queries frecuentes identificadas**:

1. **products**:
   - ¿Hay índice en `company_id`?
   - ¿Hay índice en `is_active`?
   - ¿Hay índice en `category`?
   - ¿Hay índices GIN para búsqueda de texto en `name` y `sku`?

2. **requisitions**:
   - ¿Hay índice en `company_id`?
   - ¿Hay índice en `requester_id` o `created_by`?
   - ¿Hay índice en `status` o `business_status`?
   - ¿Hay índice en `project_id`?
   - ¿Hay índice en `created_at` (para ordenamiento)?

3. **requisition_templates**:
   - ¿Hay índice en `user_id`?
   - ¿Hay índice en `project_id`?
   - ¿Hay índice en `company_id`?
   - ¿Hay índice en `is_favorite`?

4. **user_cart_items**:
   - ¿Hay índice en `user_id`?
   - ¿Hay índice único en `(user_id, product_id)`?

5. **notifications**:
   - ¿Hay índice en `user_id`?
   - ¿Hay índice en `is_read`?
   - ¿Hay índice en `created_at` (para ordenamiento)?

6. **profiles**:
   - ¿Hay índice en `company_id`?
   - ¿Hay índice en `role`?

---

## 🎯 PROMPT 7: AUDITORÍA DE POLÍTICAS RLS

### Instrucciones

Verifica que las políticas RLS permitan las operaciones que el frontend necesita:

**Operaciones que el frontend hace**:

1. **profiles**:
   - ¿Puede un usuario SELECT su propio perfil?
   - ¿Puede un usuario UPDATE su propio perfil?
   - ¿Puede un admin SELECT todos los perfiles?
   - ¿Puede un supervisor SELECT usuarios de sus proyectos?

2. **products**:
   - ¿Puede un usuario SELECT productos de su compañía?
   - ¿Puede filtrar por `company_id` y `is_active`?

3. **requisitions**:
   - ¿Puede un usuario SELECT sus propias requisiciones?
   - ¿Puede un usuario INSERT requisiciones en proyectos donde es miembro?
   - ¿Puede un usuario UPDATE solo sus borradores (`status = 'draft'`)?
   - ¿Puede un supervisor SELECT requisiciones de sus proyectos?
   - ¿Puede un supervisor UPDATE requisiciones pendientes de aprobación?
   - ¿Puede un admin SELECT todas las requisiciones?

4. **requisition_templates**:
   - ¿Puede un usuario SELECT plantillas de proyectos donde es miembro?
   - ¿Puede un supervisor INSERT/UPDATE/DELETE plantillas de sus proyectos?
   - ¿Puede un admin gestionar todas las plantillas?

5. **user_cart_items**:
   - ¿Puede un usuario SELECT/INSERT/UPDATE/DELETE solo sus propios items?

6. **notifications**:
   - ¿Puede un usuario SELECT solo sus propias notificaciones?
   - ¿Puede un usuario UPDATE solo sus propias notificaciones?
   - ¿Puede el sistema INSERT notificaciones para cualquier usuario?

---

## 🎯 PROMPT 8: AUDITORÍA DE REAL-TIME SUBSCRIPTIONS

### Instrucciones

Verifica que las tablas y campos necesarios para real-time existan:

**Subscriptions que el frontend hace**:

1. **notifications**:
   - ¿La tabla permite suscripciones INSERT?
   - ¿Se puede filtrar por `user_id` usando sintaxis segura `{ user_id: value }`?
   - ¿El campo `user_id` es UUID válido?

2. **user_cart_items**:
   - ¿La tabla permite suscripciones INSERT/UPDATE/DELETE?
   - ¿Se puede filtrar por `user_id`?

3. **requisitions**:
   - ¿La tabla permite suscripciones UPDATE?
   - ¿Se puede filtrar por `id` o `project_id`?

---

## 🎯 PROMPT 9: AUDITORÍA DE VALORES ESPERADOS

### Instrucciones

Verifica que los valores que el frontend espera sean válidos en la BD:

**Valores esperados**:

1. **profiles.role**:
   - ¿Acepta: 'admin', 'supervisor', 'user'?
   - ¿Es ENUM o CHECK constraint?

2. **requisitions.business_status**:
   - ¿Qué valores acepta?
   - ¿Incluye: 'draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'sent_to_erp', 'cancelled'?
   - ¿Es ENUM o CHECK constraint?
   - ¿El frontend filtra por 'submitted' para aprobaciones?

3. **notifications.type**:
   - ¿Acepta: 'success', 'warning', 'danger', 'info'?
   - ¿Es ENUM o CHECK constraint?

---

## 🎯 PROMPT 10: AUDITORÍA DE INTEGRIDAD REFERENCIAL

### Instrucciones

Verifica que todas las foreign keys tengan la configuración correcta:

**Foreign keys críticas**:

1. **CASCADE vs RESTRICT**:
   - ¿`profiles.company_id → companies.id` debe ser RESTRICT o CASCADE?
   - ¿`requisitions.project_id → projects.id` debe ser RESTRICT o CASCADE?
   - ¿`requisitions.requester_id → profiles.id` debe ser RESTRICT o CASCADE?
   - ¿`requisition_items.requisition_id → requisitions.id` debe ser CASCADE?
   - ¿`requisition_items.product_id → products.id` debe ser RESTRICT o CASCADE?
   - ¿`user_cart_items.product_id → products.id` debe ser RESTRICT o CASCADE?
   - ¿`user_cart_items.user_id → profiles.id` debe ser CASCADE?
   - ¿`user_favorites.user_id → profiles.id` debe ser CASCADE?
   - ¿`user_favorites.product_id → products.id` debe ser CASCADE?

2. **ON DELETE**:
   - ¿Qué pasa si se elimina un producto que está en un carrito?
   - ¿Qué pasa si se elimina un producto que está en favoritos?
   - ¿Qué pasa si se elimina un producto que está en requisition_items?
   - ¿Qué pasa si se elimina un proyecto que tiene requisiciones?
   - ¿Qué pasa si se elimina un usuario que tiene requisiciones?
   - ¿Qué pasa si se elimina una requisición que tiene items?

---

## ✅ RESULTADO ESPERADO

Al ejecutar estos prompts, debes obtener:

1. ✅ Lista de tablas que faltan
2. ✅ Lista de campos que faltan en cada tabla
3. ✅ Lista de relaciones que faltan
4. ✅ Lista de funciones RPC que faltan
5. ✅ Conflictos de nombres de campos
6. ✅ Estructura incorrecta de campos JSONB
7. ✅ Índices faltantes
8. ✅ Políticas RLS que bloquean operaciones necesarias
9. ✅ Problemas con real-time subscriptions
10. ✅ Valores incorrectos en ENUMs/CHECKs
11. ✅ Problemas de integridad referencial

---

## 📝 NOTAS FINALES

- Estos prompts se basan en el análisis del código frontend REAL de ComerECO
- No presuponen estructura específica, solo identifican qué necesita existir
- Los prompts son de AUDITORÍA, no de implementación
- La IA de Supabase debe verificar cada punto y reportar discrepancias
- El objetivo es que la BD refleje al 100% lo que el frontend espera

---

## 🎯 RESUMEN DE TABLAS Y CAMPOS CRÍTICOS

**Tablas que DEBEN existir**:
- `profiles` (con `company_id`, `role`)
- `companies` (con `name`, `bind_location_id`, `bind_price_list_id`)
- `products` (con `company_id`, `is_active`, `category`, `price`, `stock`, `unit`)
- `requisitions` (con `requester_id`, `business_status`, `integration_status`, `internal_folio`, `project_id`, `company_id`)
- `requisition_items` (tabla separada con `requisition_id`, `product_id`, `quantity`, `unit_price`, `subtotal`)
- `requisition_templates` (con `user_id`, `company_id`, `project_id`, `items` JSONB)
- `user_cart_items` (con `user_id`, `product_id`, `quantity`)
- `user_favorites` (con `user_id`, `product_id`)
- `notifications` (con `user_id`, `type`, `is_read`, `company_id`)

**Relaciones críticas**:
- `profiles.company_id → companies.id`
- `requisitions.requester_id → profiles.id`
- `requisitions.project_id → projects.id`
- `requisition_items.requisition_id → requisitions.id`
- `requisition_items.product_id → products.id`
- `user_cart_items.product_id → products.id`
- `user_cart_items.user_id → profiles.id`

**Funciones RPC que DEBEN existir**:
- `create_full_requisition(p_comments TEXT, p_items JSONB)` → UUID
- `use_requisition_template(p_template_id UUID)` → UUID
- `broadcast_to_company(p_event_name TEXT, p_payload JSONB)` → JSONB
- `clear_user_cart()` → JSONB
- `get_unique_product_categories(p_company_id UUID)` → TABLE(category TEXT)

