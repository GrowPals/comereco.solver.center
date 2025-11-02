# 📚 Documentación Técnica Base de Datos Supabase - COMERECO

**Objetivo**: Este documento describe con precisión el esquema actual, nombres de tablas/campos, claves, tipos, y reglas de acceso (RLS/políticas) para que una IA o un desarrollador pueda reconstruir y corregir la integración del frontend con Supabase (PostgREST y supabase-js) sin inconsistencias.

---

## 🔐 Principios Fundamentales

- **Todas las tablas están en el esquema `public`** y tienen RLS habilitado
- **Autenticación**: Los usuarios existen en `auth.users` (UUID) y su perfil en `public.profiles` con el mismo `id`
- **Multi-empresa**: Casi todas las entidades referencian `companies.id` mediante `company_id`
- **Roles**: Usar `profiles.role_v2` para control de permisos en frontend. Valores: `admin` | `supervisor` | `user`
- **Evitar embeds ambiguos en PostgREST**: Preferir consultas con relaciones claras o vistas dedicadas

---

## 📊 Esquema de Base de Datos

### Tabla: `companies`

**Propósito**: Entidad empresa/tenant. La mayoría de registros están vinculados a una company.

**Campos**:
- `id` uuid PK, default `extensions.uuid_generate_v4()`
- `name` text UNIQUE
- `bind_location_id` text UNIQUE NULL (ID externo opcional)
- `bind_price_list_id` text NULL (ID externo opcional)
- `created_at` timestamptz default `now()`

**Relaciones entrantes** (FK existentes en otras tablas):
- `profiles.company_id`
- `products.company_id`
- `projects.company_id`
- `requisitions.company_id`
- `requisition_templates.company_id`
- `notifications.company_id`
- `folio_counters.company_id`
- `audit_log.company_id`

**RLS/Pólíticas relevantes**:
- "Users can view their own company" y variantes: el usuario sólo puede ver su empresa (`id = get_my_company_id()`)
- "Admins manage companies": admins pueden ALL sobre su empresa
- "Super Admins can do anything on companies": super_admin global
- Además hay políticas redundantes de SELECT por pertenencia

---

### Tabla: `profiles`

**Propósito**: Perfil de usuario enlazado a `auth.users`. Controla rol y empresa.

**Campos**:
- `id` uuid PK (FK a `auth.users.id`)
- `company_id` uuid (FK a `companies.id`)
- `full_name` text NULL
- `avatar_url` text NULL
- `role` app_role DEPRECATED (`employee` | `admin_corp` | `super_admin`) — **no usar en frontend nuevo**
- `updated_at` timestamptz default `now()`
- `role_v2` app_role_v2 default `'user'` (`admin` | `supervisor` | `user`) — **usar este**

**Relaciones salientes**: 
- Pertenece a `companies` (`company_id`)
- Es referenciado por múltiples tablas

**RLS/Pólíticas relevantes**:
- "Users see themselves" y "profiles_self_select": pueden verse a sí mismos por `id = auth.uid()`
- "profiles_company_select": SELECT por usuarios de la misma company
- "Users can update their own profile": UPDATE por `id = auth.uid()`
- Existen políticas `admin_*` para vistas amplias si `is_admin()` evalúa true (ver helpers más abajo)

---

### Tabla: `products`

**Propósito**: Catálogo de productos de una company.

**Campos**:
- `id` uuid PK default `extensions.uuid_generate_v4()`
- `company_id` uuid FK `companies.id`
- `bind_id` text (ID externo)
- `sku` text
- `name` text
- `description` text NULL
- `price` numeric default 0 (check `price >= 0`)
- `stock` int default 0 (check `stock >= 0`)
- `unit` text NULL
- `category` text NULL
- `image_url` text NULL
- `is_active` boolean default true
- `bind_last_synced_at` timestamptz NULL

**RLS/Pólíticas**:
- "Users can view products from their own company": `company_id = get_my_company_id()`

**Usos relacionados**: 
- `user_favorites`, `user_cart_items` y `requisition_items` referencian `products.id`

---

### Tabla: `projects`

**Propósito**: Proyectos de una company. Base para membresías y requisiciones.

**Campos**:
- `id` uuid PK default `gen_random_uuid()`
- `company_id` uuid FK `companies.id`
- `name` text
- `description` text NULL
- `status` project_status default `'active'` (`'active'` | `'archived'`)
- `created_by` uuid FK `profiles.id`
- `created_at` timestamptz default `now()`
- `updated_at` timestamptz default `now()`
- `supervisor_id` uuid FK `profiles.id` NULL
- `active` boolean default true

**RLS/Pólíticas típicas**:
- "proj_company_select": SELECT por company del usuario
- "admin_select_all_projects" & "admin_modify_all_projects": admins amplio acceso
- "supervisor_select_own_projects": supervisor o admin
- "supervisor_update_own_projects": supervisor o admin
- "user_select_member_projects": miembros del proyecto (via `project_members`) pueden ver

---

### Tabla: `project_members`

**Propósito**: Membresía de usuarios a proyectos, relación N:N.

**Campos**:
- `project_id` uuid FK `projects.id`, compone PK
- `user_id` uuid FK `profiles.id`, compone PK
- `role_in_project` text default `'member'`
- `added_at` timestamptz default `now()`

**RLS/Pólíticas**:
- "admin_all_project_members" y "admin_manage_all_members": admin amplio acceso
- "supervisor_manage_own_members": si es supervisor del proyecto o admin
- "user_select_own_membership": un usuario puede ver su propia membresía
- "user_view_members_of_own_projects": ver miembros de proyectos donde participa

---

### Tabla: `requisitions`

**Propósito**: Requisiciones/órdenes internas por proyecto y company.

**Campos**:
- `id` uuid PK default `extensions.uuid_generate_v4()`
- `company_id` uuid FK `companies.id`
- `internal_folio` text
- `total_amount` numeric default 0
- `comments` text NULL
- `bind_order_id` text NULL
- `bind_status` text NULL
- `bind_rejection_reason` text NULL
- `created_at` timestamptz default `now()`
- `updated_at` timestamptz default `now()`
- `integration_status` integration_status default `'draft'` (`'draft'`,`'pending_sync'`,`'syncing'`,`'synced'`,`'rejected'`,`'cancelled'`)
- `business_status` business_status default `'draft'` (`'draft'`,`'submitted'`,`'approved'`,`'rejected'`,`'ordered'`,`'cancelled'`)
- `project_id` uuid FK `projects.id` NULL
- `created_by` uuid FK `profiles.id` NULL
- `approved_by` uuid FK `profiles.id` NULL
- `items` jsonb default `'[]'`
- `rejected_at` timestamptz NULL
- `rejection_reason` text NULL

**RLS/Pólíticas**:
- "user_insert_own_project_requisitions": INSERT si es miembro del proyecto y `created_by = auth.uid()`
- "user_select_own_requisitions": SELECT de las que creó
- "user_update_own_draft": UPDATE si es el creador y `business_status = 'draft'`
- "supervisor_approve_own_projects": UPDATE para aprobar si supervisor del proyecto o admin

---

### Tabla: `requisition_items`

**Propósito**: Líneas de productos de cada requisición.

**Campos**:
- `id` uuid PK default `extensions.uuid_generate_v4()`
- `requisition_id` uuid FK `requisitions.id`
- `product_id` uuid FK `products.id`
- `quantity` int (check `quantity > 0`)
- `unit_price` numeric
- `subtotal` numeric

**RLS/Pólíticas**:
- "Users can view items of requisitions they are allowed to see": existe un EXISTS sobre `requisitions r` donde `r.id = requisition_items.requisition_id` (hereda las reglas de visibilidad de requisitions)

---

### Tabla: `requisition_templates`

**Propósito**: Plantillas de requisición reutilizables por usuario/proyecto.

**Campos**:
- `id` uuid PK default `gen_random_uuid()`
- `user_id` uuid FK `profiles.id`
- `company_id` uuid FK `companies.id`
- `name` text
- `description` text NULL
- `items` jsonb
- `is_favorite` boolean default false
- `usage_count` int default 0
- `last_used_at` timestamptz NULL
- `created_at` timestamptz default `now()`
- `updated_at` timestamptz default `now()`
- `project_id` uuid FK `projects.id` NULL

**RLS/Pólíticas**:
- "Users can manage their own templates": `auth.uid() = user_id AND company_id = get_my_company_id()`
- "admin_manage_all_templates": `is_admin()`
- "supervisor_manage_own_templates": supervisor del proyecto o admin
- "user_select_member_templates": miembros del proyecto pueden ver

---

### Tabla: `notifications`

**Propósito**: Notificaciones para usuarios.

**Campos**:
- `id` uuid PK default `gen_random_uuid()`
- `user_id` uuid FK `profiles.id`
- `company_id` uuid FK `companies.id`
- `type` notification_type (`'success'`,`'warning'`,`'danger'`,`'info'`)
- `title` text
- `message` text NULL
- `link` text NULL
- `is_read` boolean default false
- `created_at` timestamptz default `now()`

**RLS/Pólíticas**:
- "Users can only see/update their own notifications": `auth.uid() = user_id`

---

### Tabla: `audit_log`

**Propósito**: Bitácora de eventos (por empresa/usuario).

**Campos**:
- `id` bigserial PK
- `company_id` uuid FK `companies.id` NULL
- `user_id` uuid FK `profiles.id` NULL
- `event_name` text
- `payload` jsonb NULL
- `timestamp` timestamptz default `now()`

**RLS/Pólíticas**:
- "Corp Admins can view audit logs for their company": `get_my_company_id()` y `get_my_role()='admin_corp'` (LEGACY)
- "Super Admins can view all audit logs": `get_my_role()='super_admin'` (LEGACY)

---

### Tabla: `user_favorites`

**Propósito**: Productos favoritos por usuario.

**Campos**:
- `user_id` uuid FK `profiles.id`, PK compuesta
- `product_id` uuid FK `products.id`, PK compuesta
- `created_at` timestamptz default `now()`

**RLS/Pólíticas**:
- "Users can only manage their own favorites": `auth.uid() = user_id` (ALL)

---

### Tabla: `user_cart_items`

**Propósito**: Carrito de compras por usuario.

**Campos**:
- `user_id` uuid FK `profiles.id`, PK compuesta
- `product_id` uuid FK `products.id`, PK compuesta
- `quantity` int check `> 0`
- `created_at` timestamptz default `now()`
- `updated_at` timestamptz default `now()`

**RLS/Pólíticas**:
- "Users can only manage their own cart items": `auth.uid() = user_id` (ALL)

---

### Tabla: `folio_counters`

**Propósito**: Folio incremental por empresa y año.

**Campos**:
- `company_id` uuid FK `companies.id`, PK compuesta
- `year` int PK compuesta
- `last_folio_number` int default 0

**RLS/Pólíticas**:
- "Corp Admins can view counters" (LEGACY admin_corp)
- "Super Admins can manage counters" (LEGACY)

---

## 🔢 Tipos y Enums

### `role_v2` (app_role_v2)
Enum con valores: `'admin'` | `'supervisor'` | `'user'`
**Usar este en frontend** para autorizaciones lógicas UI.

### `role` (app_role)
LEGACY: `'employee'`,`'admin_corp'`,`'super_admin'`
**No usar** para nueva lógica.

### Otros enums:

- **`integration_status`**: `'draft'`,`'pending_sync'`,`'syncing'`,`'synced'`,`'rejected'`,`'cancelled'`
- **`business_status`**: `'draft'`,`'submitted'`,`'approved'`,`'rejected'`,`'ordered'`,`'cancelled'`
- **`project_status`**: `'active'`,`'archived'`
- **`notification_type`**: `'success'`,`'warning'`,`'danger'`,`'info'`

---

## 🔒 Reglas RLS y Helpers

### RLS Global
**Habilitada en todas las tablas listadas**.

### Funciones Helper (asumidas por políticas)

#### `is_admin()`
Verdadero si el perfil actual tiene `role_v2='admin'`. Úsalo como admin lógico.

#### `get_my_company_id()`
Devuelve `company_id` del perfil de `auth.uid()`.

#### `get_my_role()`
Referencia a `role` (LEGACY). **No usar en frontend nuevo**.

---

## 💡 Buenas Prácticas para Frontend

1. **Siempre establecer sesión** antes de llamar Realtime o REST (`supabase.auth.getSession()`)
2. **Para consultas multi-tenant**, incluir filtros por `company_id` cuando aplique
3. **Evitar depender de `role` (LEGACY)**; usar `role_v2` y/o endpoints protegidos por políticas basadas en `is_admin()`

---

## 📡 Patrones de Consulta Recomendados (PostgREST)

### Notas Importantes

- **Evitar alias ambiguos** en embeds tipo `company:companies()` si no hay relación nombrada de forma explícita. Preferir `companies()` cuando PostgREST infiere por FK, o usar vistas.
- **Indexes**: Ya existen en PK/FK; si añadís filtros complejos en frontend, considera agregar índices adicionales.

### Ejemplos de Consultas

#### Obtener perfil del usuario actual
```
GET /rest/v1/profiles?select=id,company_id,full_name,avatar_url,role_v2&id=eq.{auth.uid}
```

#### Obtener empresa del usuario actual
```
GET /rest/v1/companies?select=id,name,bind_location_id,bind_price_list_id&id=eq.{company_id_del_perfil}
```

#### Productos de la empresa actual
```
GET /rest/v1/products?select=id,sku,name,price,stock,unit,category,image_url,is_active&company_id=eq.{company_id}
```

#### Proyectos visibles

**Si admin**:
```
GET /rest/v1/projects?select=*&order=created_at.desc
```

**Si miembro**:
```
GET /rest/v1/projects?select=id,name,description,status,supervisor_id,company_id,created_at,updated_at,active
```

#### Miembros de un proyecto
```
GET /rest/v1/project_members?select=project_id,user_id,role_in_project,added_at&project_id=eq.{project_id}
```

#### Requisiciones creadas por el usuario
```
GET /rest/v1/requisitions?select=id,company_id,project_id,internal_folio,total_amount,business_status,created_at,updated_at,items&created_by=eq.{auth.uid}
```

#### Items de una requisición
```
GET /rest/v1/requisition_items?select=id,requisition_id,product_id,quantity,unit_price,subtotal&requisition_id=eq.{requisition_id}
```

#### Plantillas del usuario
```
GET /rest/v1/requisition_templates?select=id,name,description,items,is_favorite,usage_count,last_used_at,project_id,company_id&user_id=eq.{auth.uid}
```

#### Notificaciones del usuario
```
GET /rest/v1/notifications?select=id,type,title,message,link,is_read,created_at&user_id=eq.{auth.uid}
```

**Recomendación**: Si se necesita "perfil + empresa" en una sola llamada, crear una vista estable (ver sección de vistas) en lugar de usar embed con alias que ha provocado 500.

---

## ✍️ Escrituras Típicas y Validaciones de RLS

### Crear/actualizar profile del propio usuario
```
PATCH /rest/v1/profiles?id=eq.{auth.uid}
Body permitido: full_name, avatar_url, role_v2 (solo administradores deberían cambiar roles; frontend normal no lo expone)
```

### Crear requisición (usuario miembro del proyecto)
```
POST /rest/v1/requisitions
Campos requeridos: company_id, project_id, created_by={auth.uid}, items (jsonb), total_amount
RLS: user_insert_own_project_requisitions
```

### Actualizar requisición en draft por el creador
```
PATCH /rest/v1/requisitions?id=eq.{id}&business_status=eq.draft
RLS: user_update_own_draft
```

### Aprobar requisición (supervisor del proyecto o admin)
```
PATCH /rest/v1/requisitions?id=eq.{id}
Cambios: business_status='approved', approved_by={auth.uid}
RLS: supervisor_approve_own_projects
```

### Favoritos y carrito (propietario)
```
POST/DELETE /rest/v1/user_favorites
POST/PATCH/DELETE /rest/v1/user_cart_items
RLS: auth.uid() = user_id
```

---

## 🗂️ Vistas Recomendadas para Robustecer el Frontend

Para evitar errores 500 por embeds y estandarizar respuestas, se recomienda crear y consumir vistas de sólo lectura:

### `profiles_with_company`
SELECT `p.*`, `c.*` como objeto anidado serializado o columnas prefijadas.
Sugerencia de proyección para REST: columnas planas con prefijo `company_`.
Consumo: `GET /rest/v1/profiles_with_company?id=eq.{auth.uid}`

### `requisitions_with_items`
Unir `requisitions` con agregación de `requisition_items` (`json_agg`).
Consumo: `GET /rest/v1/requisitions_with_items?created_by=eq.{auth.uid}`

### `projects_with_members`
Unir `projects` con membresías y quizá nombres de usuarios.
Consumo: `GET /rest/v1/projects_with_members?company_id=eq.{company_id}`

**Nota**: Estas vistas deben heredar RLS vía consultas basadas en policies existentes (o con SECURITY DEFINER controlado si es necesario y revocando EXECUTE a anon/authenticated).

Si quieres, puedo entregarte el SQL exacto para crear estas vistas con RLS compatibles.

---

## 🔐 Flujos de Autenticación y Autorización en Frontend

1. **Tras signIn**, refrescar el token antes de leer `role_v2` si lo derivan de JWT; lo recomendado es leer `role_v2` desde `/rest/v1/profiles`
2. **Guardar en estado**:
   - `user_id = session.user.id`
   - `profile.role_v2`
   - `profile.company_id`
3. **Condicionar UI**:
   - **admin**: acceso total dentro de su company (y a funciones marcadas `is_admin()`)
   - **supervisor**: permisos sobre proyectos que supervisa
   - **user**: permisos sobre sus proyectos/membresías y recursos propios

---

## ⚠️ Errores Conocidos y Mitigación

### 500 al usar embed alias `company:companies(*)`
**Evitar alias** mientras no exista relación nombrada acorde para PostgREST.
**Usar**: `companies(*)` o mejor, la vista `profiles_with_company`.

### Incompatibilidades por usar `role` (LEGACY)
**Migrar** toda la lógica de UI a `role_v2`.

### Filtros sin índices o subconsultas pesadas en RLS
**Asegurar índices** en columnas de join usadas por RLS (ya tenemos PK/FK; si se agregan condiciones nuevas, evaluar índices).

---

## 📋 Resumen de Endpoints REST Seguros Sugeridos

### Perfil actual
```
GET /rest/v1/profiles?id=eq.{auth.uid}&select=id,company_id,full_name,avatar_url,role_v2
```

### Empresa actual
```
GET /rest/v1/companies?id=eq.{company_id}&select=id,name,bind_location_id,bind_price_list_id
```

### Productos
```
GET /rest/v1/products?company_id=eq.{company_id}&select=id,sku,name,price,stock,unit,category,image_url,is_active
```

### Proyectos visibles
```
GET /rest/v1/projects?select=id,company_id,name,description,status,supervisor_id,created_by,created_at,updated_at,active
```

### Miembros de proyecto
```
GET /rest/v1/project_members?project_id=eq.{project_id}&select=project_id,user_id,role_in_project,added_at
```

### Requisiciones propias
```
GET /rest/v1/requisitions?created_by=eq.{auth.uid}&select=id,company_id,project_id,internal_folio,total_amount,business_status,items,created_at,updated_at
```

### Items de requisición
```
GET /rest/v1/requisition_items?requisition_id=eq.{id}&select=id,product_id,quantity,unit_price,subtotal
```

### Plantillas propias
```
GET /rest/v1/requisition_templates?user_id=eq.{auth.uid}&select=id,name,description,items,is_favorite,usage_count,last_used_at,project_id,company_id
```

### Notificaciones propias
```
GET /rest/v1/notifications?user_id=eq.{auth.uid}&select=id,type,title,message,link,is_read,created_at
```

---

## 📝 Notas Finales

- Este documento describe el estado actual de la base de datos
- Todas las políticas RLS están habilitadas y funcionando
- Preferir `role_v2` sobre `role` en toda lógica nueva
- Usar vistas en lugar de embeds complejos cuando sea posible
- Validar siempre `company_id` en operaciones multi-tenant

---

**Última actualización**: 2025-01-27  
**Versión**: 1.0

