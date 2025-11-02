# 📚 Referencia Técnica Base de Datos Supabase
## Documentación Condensada para Re-sincronización Frontend

**Propósito**: Este documento describe con precisión el esquema actual, nombres de tablas/campos, claves, tipos, y reglas de acceso (RLS/políticas) para que una IA o desarrollador pueda reconstruir y corregir la integración del frontend con Supabase (PostgREST y supabase-js) sin inconsistencias.

**Última actualización**: 2025-01-26

---

## 🔐 Configuración Base

### Esquema y RLS
- **Esquema**: Todas las tablas están en el esquema `public`
- **RLS**: Habilitado en todas las tablas documentadas
- **Autenticación**: Usuarios en `auth.users` (UUID), perfil en `public.profiles` con mismo `id`

### Multi-empresa
- Casi todas las entidades referencian `companies.id` mediante `company_id`
- Aislación de datos por empresa mediante políticas RLS

### Roles
- **Campo principal**: `profiles.role_v2` (usar este en frontend)
- **Valores**: `admin` | `supervisor` | `user`
- **Deprecado**: `profiles.role` (LEGACY - no usar en nueva lógica)

### PostgREST
- **Evitar**: Embeds ambiguos (ej: `company:companies(*)`)
- **Preferir**: Consultas con relaciones claras o vistas dedicadas

---

## 📊 Entidades Principales

### `companies`
**Propósito**: Entidad empresa/tenant. La mayoría de registros están vinculados a una company.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
name                  text UNIQUE
bind_location_id      text UNIQUE NULL
bind_price_list_id    text NULL
created_at            timestamptz DEFAULT now()
```

**Relaciones entrantes** (FK en otras tablas):
- `profiles.company_id`
- `products.company_id`
- `projects.company_id`
- `requisitions.company_id`
- `requisition_templates.company_id`
- `notifications.company_id`
- `folio_counters.company_id`
- `audit_log.company_id`

**RLS/Políticas**:
- `Users can view their own company`: Usuario solo puede ver su empresa (`id = get_my_company_id()`)
- `Admins manage companies`: Admins pueden ALL sobre su empresa
- `Super Admins can do anything on companies`: Super_admin global
- Políticas redundantes de SELECT por pertenencia

---

### `profiles`
**Propósito**: Perfil de usuario enlazado a `auth.users`. Controla rol y empresa.

**Campos**:
```sql
id                    uuid PRIMARY KEY (FK a auth.users.id)
company_id            uuid (FK a companies.id)
full_name             text NULL
avatar_url            text NULL
role                  app_role DEPRECATED (employee | admin_corp | super_admin) -- NO usar en frontend nuevo
updated_at            timestamptz DEFAULT now()
role_v2               app_role_v2 DEFAULT 'user' -- USAR ESTE (admin | supervisor | user)
```

**Relaciones salientes**:
- Pertenece a `companies` (`company_id`)
- Referenciado por múltiples tablas (FK entrantes)

**RLS/Políticas**:
- `Users see themselves` / `profiles_self_select`: Pueden verse a sí mismos por `id = auth.uid()`
- `profiles_company_select`: SELECT por usuarios de la misma company
- `Users can update their own profile`: UPDATE por `id = auth.uid()`
- `admin_*`: Vistas amplias si `is_admin()` evalúa true (ver helpers)

---

### `products`
**Propósito**: Catálogo de productos de una company.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
company_id            uuid FK companies.id
bind_id               text
sku                   text
name                  text
description           text NULL
price                 numeric DEFAULT 0 CHECK (price >= 0)
stock                 int DEFAULT 0 CHECK (stock >= 0)
unit                  text NULL
category              text NULL
image_url             text NULL
is_active             boolean DEFAULT true
bind_last_synced_at   timestamptz NULL
```

**RLS/Políticas**:
- `Users can view products from their own company`: `company_id = get_my_company_id()`

**Usos relacionados**:
- `user_favorites`, `user_cart_items` y `requisition_items` referencian `products.id`

---

### `projects`
**Propósito**: Proyectos de una company. Base para membresías y requisiciones.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
company_id            uuid FK companies.id
name                  text
description           text NULL
status                project_status DEFAULT 'active' ('active' | 'archived')
created_by            uuid FK profiles.id
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
supervisor_id         uuid FK profiles.id NULL
active                boolean DEFAULT true
```

**RLS/Políticas**:
- `proj_company_select`: SELECT por company del usuario
- `admin_select_all_projects` & `admin_modify_all_projects`: Admins amplio acceso
- `supervisor_select_own_projects`: Supervisor o admin
- `supervisor_update_own_projects`: Supervisor o admin
- `user_select_member_projects`: Miembros del proyecto (via `project_members`) pueden ver

---

### `project_members`
**Propósito**: Membresía de usuarios a proyectos, relación N:N.

**Campos**:
```sql
project_id            uuid FK projects.id (PK compuesta)
user_id               uuid FK profiles.id (PK compuesta)
role_in_project       text DEFAULT 'member'
added_at              timestamptz DEFAULT now()
```

**RLS/Políticas**:
- `admin_all_project_members` y `admin_manage_all_members`: Admin amplio acceso
- `supervisor_manage_own_members`: Si es supervisor del proyecto o admin
- `user_select_own_membership`: Un usuario puede ver su propia membresía
- `user_view_members_of_own_projects`: Ver miembros de proyectos donde participa

---

### `requisitions`
**Propósito**: Requisiciones/órdenes internas por proyecto y company.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
company_id            uuid FK companies.id
internal_folio        text
total_amount          numeric DEFAULT 0
comments              text NULL
bind_order_id         text NULL
bind_status           text NULL
bind_rejection_reason text NULL
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
integration_status    integration_status DEFAULT 'draft' ('draft','pending_sync','syncing','synced','rejected','cancelled')
business_status       business_status DEFAULT 'draft' ('draft','submitted','approved','rejected','ordered','cancelled')
project_id            uuid FK projects.id NULL
created_by            uuid FK profiles.id NULL
approved_by           uuid FK profiles.id NULL
items                 jsonb DEFAULT '[]'
rejected_at           timestamptz NULL
rejection_reason      text NULL
```

**RLS/Políticas**:
- `user_insert_own_project_requisitions`: INSERT si es miembro del proyecto y `created_by = auth.uid()`
- `user_select_own_requisitions`: SELECT de las que creó
- `user_update_own_draft`: UPDATE si es el creador y `business_status = 'draft'`
- `supervisor_approve_own_projects`: UPDATE para aprobar si supervisor del proyecto o admin

---

### `requisition_items`
**Propósito**: Líneas de productos de cada requisición.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4()
requisition_id        uuid FK requisitions.id
product_id            uuid FK products.id
quantity              int CHECK (quantity > 0)
unit_price            numeric
subtotal              numeric
```

**RLS/Políticas**:
- `Users can view items of requisitions they are allowed to see`: EXISTS sobre `requisitions r` donde `r.id = requisition_items.requisition_id` (hereda reglas de visibilidad de `requisitions`)

---

### `requisition_templates`
**Propósito**: Plantillas de requisición reutilizables por usuario/proyecto.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id               uuid FK profiles.id
company_id            uuid FK companies.id
name                  text
description           text NULL
items                 jsonb
is_favorite           boolean DEFAULT false
usage_count           int DEFAULT 0
last_used_at          timestamptz NULL
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
project_id            uuid FK projects.id NULL
```

**RLS/Políticas**:
- `Users can manage their own templates`: `auth.uid() = user_id AND company_id = get_my_company_id()`
- `admin_manage_all_templates`: `is_admin()`
- `supervisor_manage_own_templates`: Supervisor del proyecto o admin
- `user_select_member_templates`: Miembros del proyecto pueden ver

---

### `notifications`
**Propósito**: Notificaciones para usuarios.

**Campos**:
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id               uuid FK profiles.id
company_id            uuid FK companies.id
type                  notification_type ('success','warning','danger','info')
title                 text
message               text NULL
link                  text NULL
is_read               boolean DEFAULT false
created_at            timestamptz DEFAULT now()
```

**RLS/Políticas**:
- `Users can only see/update their own notifications`: `auth.uid() = user_id`

---

### `audit_log`
**Propósito**: Bitácora de eventos (por empresa/usuario).

**Campos**:
```sql
id                    bigserial PRIMARY KEY
company_id            uuid FK companies.id NULL
user_id               uuid FK profiles.id NULL
event_name            text
payload               jsonb NULL
timestamp             timestamptz DEFAULT now()
```

**RLS/Políticas**:
- `Corp Admins can view audit logs for their company`: `get_my_company_id()` y `get_my_role()='admin_corp'` (LEGACY)
- `Super Admins can view all audit logs`: `get_my_role()='super_admin'` (LEGACY)

---

### `user_favorites`
**Propósito**: Productos favoritos por usuario.

**Campos**:
```sql
user_id               uuid FK profiles.id (PK compuesta)
product_id            uuid FK products.id (PK compuesta)
created_at            timestamptz DEFAULT now()
```

**RLS/Políticas**:
- `Users can only manage their own favorites`: `auth.uid() = user_id` (ALL)

---

### `user_cart_items`
**Propósito**: Carrito de compras por usuario.

**Campos**:
```sql
user_id               uuid FK profiles.id (PK compuesta)
product_id            uuid FK products.id (PK compuesta)
quantity              int CHECK (quantity > 0)
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

**RLS/Políticas**:
- `Users can only manage their own cart items`: `auth.uid() = user_id` (ALL)

---

### `folio_counters`
**Propósito**: Folio incremental por empresa y año.

**Campos**:
```sql
company_id            uuid FK companies.id (PK compuesta)
year                  int (PK compuesta)
last_folio_number     int DEFAULT 0
```

**RLS/Políticas**:
- `Corp Admins can view counters` (LEGACY admin_corp)
- `Super Admins can manage counters` (LEGACY)

---

## 🎭 Tipos y Roles

### Enums Principales

**`app_role_v2`** (usar en frontend):
```sql
'admin' | 'supervisor' | 'user'
```

**`app_role`** (LEGACY - no usar):
```sql
'employee' | 'admin_corp' | 'super_admin'
```

**Otros enums**:
- `integration_status`: `'draft'`, `'pending_sync'`, `'syncing'`, `'synced'`, `'rejected'`, `'cancelled'`
- `business_status`: `'draft'`, `'submitted'`, `'approved'`, `'rejected'`, `'ordered'`, `'cancelled'`
- `project_status`: `'active'`, `'archived'`
- `notification_type`: `'success'`, `'warning'`, `'danger'`, `'info'`

---

## 🔧 Reglas RLS y Helpers

### Funciones Helper (asumidas por políticas)

**`is_admin()`**:
- Devuelve `true` si el perfil actual tiene `role_v2='admin'`
- Usar como admin lógico en frontend

**`get_my_company_id()`**:
- Devuelve `company_id` del perfil de `auth.uid()`

**`get_my_role()`**:
- Referencia a `role` (LEGACY)
- **No usar en frontend nuevo**

---

## ✅ Buenas Prácticas para Frontend

1. **Sesión**: Siempre establecer sesión antes de llamar Realtime o REST (`supabase.auth.getSession()`)

2. **Multi-tenant**: Para consultas multi-tenant, incluir filtros por `company_id` cuando aplique

3. **Roles**: Evitar depender de `role` (LEGACY); usar `role_v2` y/o endpoints protegidos por políticas basadas en `is_admin()`

4. **Índices**: Ya existen en PK/FK; si añadís filtros complejos en frontend, considera agregar índices adicionales

---

## 📡 Patrones de Consulta Recomendados (PostgREST)

### Notas Importantes
- **Evitar**: Alias ambiguos en embeds tipo `company:companies()` si no hay relación nombrada explícita
- **Preferir**: `companies()` cuando PostgREST infiere por FK, o usar vistas dedicadas

### Ejemplos de Consultas

**Obtener perfil del usuario actual**:
```http
GET /rest/v1/profiles?select=id,company_id,full_name,avatar_url,role_v2&id=eq.{auth.uid}
```

**Obtener empresa del usuario actual**:
```http
GET /rest/v1/companies?select=id,name,bind_location_id,bind_price_list_id&id=eq.{company_id_del_perfil}
```

**Productos de la empresa actual**:
```http
GET /rest/v1/products?select=id,sku,name,price,stock,unit,category,image_url,is_active&company_id=eq.{company_id}
```

**Proyectos visibles**:
- Si admin:
```http
GET /rest/v1/projects?select=*&order=created_at.desc
```
- Si miembro:
```http
GET /rest/v1/projects?select=id,name,description,status,supervisor_id,company_id,created_at,updated_at,active
```

**Miembros de un proyecto**:
```http
GET /rest/v1/project_members?select=project_id,user_id,role_in_project,added_at&project_id=eq.{project_id}
```

**Requisiciones creadas por el usuario**:
```http
GET /rest/v1/requisitions?select=id,company_id,project_id,internal_folio,total_amount,business_status,created_at,updated_at,items&created_by=eq.{auth.uid}
```

**Items de una requisición**:
```http
GET /rest/v1/requisition_items?select=id,requisition_id,product_id,quantity,unit_price,subtotal&requisition_id=eq.{requisition_id}
```

**Plantillas del usuario**:
```http
GET /rest/v1/requisition_templates?select=id,name,description,items,is_favorite,usage_count,last_used_at,project_id,company_id&user_id=eq.{auth.uid}
```

**Notificaciones del usuario**:
```http
GET /rest/v1/notifications?select=id,type,title,message,link,is_read,created_at&user_id=eq.{auth.uid}
```

**Recomendación**: Si se necesita "perfil + empresa" en una sola llamada, crear una vista estable (ver sección de vistas) en lugar de usar embed con alias que ha provocado errores 500.

---

## ✍️ Escrituras Típicas y Validaciones de RLS

### Crear/actualizar profile del propio usuario
```http
PATCH /rest/v1/profiles?id=eq.{auth.uid}
```
**Body permitido**: `full_name`, `avatar_url`, `role_v2` (solo administradores deberían cambiar roles; frontend normal no lo expone)

### Crear requisición (usuario miembro del proyecto)
```http
POST /rest/v1/requisitions
```
**Campos requeridos**: `company_id`, `project_id`, `created_by={auth.uid}`, `items` (jsonb), `total_amount`

**RLS**: `user_insert_own_project_requisitions`

### Actualizar requisición en draft por el creador
```http
PATCH /rest/v1/requisitions?id=eq.{id}&business_status=eq.draft
```
**RLS**: `user_update_own_draft`

### Aprobar requisición (supervisor del proyecto o admin)
```http
PATCH /rest/v1/requisitions?id=eq.{id}
```
**Cambios**: `business_status='approved'`, `approved_by={auth.uid}`

**RLS**: `supervisor_approve_own_projects`

### Favoritos y carrito (propietario)
```http
POST/DELETE /rest/v1/user_favorites
POST/PATCH/DELETE /rest/v1/user_cart_items
```
**RLS**: `auth.uid() = user_id`

---

## 👁️ Vistas Recomendadas para Robustecer el Frontend

Para evitar errores 500 por embeds y estandarizar respuestas, se recomienda crear y consumir vistas de sólo lectura:

### `profiles_with_company`
**Propósito**: Unir `profiles` con `companies` como objeto anidado serializado o columnas prefijadas.

**Sugerencia de proyección para REST**: Columnas planas con prefijo `company_`

**Consumo**:
```http
GET /rest/v1/profiles_with_company?id=eq.{auth.uid}
```

### `requisitions_with_items`
**Propósito**: Unir `requisitions` con agregación de `requisition_items` (`json_agg`).

**Consumo**:
```http
GET /rest/v1/requisitions_with_items?created_by=eq.{auth.uid}
```

### `projects_with_members`
**Propósito**: Unir `projects` con membresías y quizá nombres de usuarios.

**Consumo**:
```http
GET /rest/v1/projects_with_members?company_id=eq.{company_id}
```

**Nota**: Estas vistas deben heredar RLS vía consultas basadas en policies existentes (o con `SECURITY DEFINER` controlado si es necesario y revocando `EXECUTE` a `anon`/`authenticated`).

**💡 Si quieres, puedo entregarte el SQL exacto para crear estas vistas con RLS compatibles.**

---

## 🔐 Flujos de Autenticación y Autorización en Frontend

### Flujo Post-Login
1. Tras `signIn`, refrescar el token antes de leer `role_v2` si lo derivan de JWT
2. **Recomendado**: Leer `role_v2` desde `/rest/v1/profiles` (no desde JWT)

### Estado a Guardar
```javascript
{
  user_id: session.user.id,
  profile: {
    role_v2: 'admin' | 'supervisor' | 'user',
    company_id: uuid
  }
}
```

### Condicionar UI según Rol

**`admin`**:
- Acceso total dentro de su company
- Funciones marcadas `is_admin()`

**`supervisor`**:
- Permisos sobre proyectos que supervisa

**`user`**:
- Permisos sobre sus proyectos/membresías y recursos propios

---

## ⚠️ Errores Conocidos y Mitigación

### 500 al usar embed alias `company:companies(*)`
**Problema**: Alias ambiguo mientras no exista relación nombrada acorde para PostgREST

**Solución**:
- Usar `companies(*)` o mejor, la vista `profiles_with_company`

### Incompatibilidades por usar `role` (LEGACY)
**Problema**: Lógica de UI usando campo deprecado

**Solución**:
- Migrar toda la lógica de UI a `role_v2`

### Filtros sin índices o subconsultas pesadas en RLS
**Problema**: Performance degradada

**Solución**:
- Asegurar índices en columnas de join usadas por RLS (ya tenemos PK/FK; si se agregan condiciones nuevas, evaluar índices)

---

## 📋 Resumen de Endpoints REST Seguros Sugeridos

### Perfil Actual
```http
GET /rest/v1/profiles?id=eq.{auth.uid}&select=id,company_id,full_name,avatar_url,role_v2
```

### Empresa Actual
```http
GET /rest/v1/companies?id=eq.{company_id}&select=id,name,bind_location_id,bind_price_list_id
```

### Productos
```http
GET /rest/v1/products?company_id=eq.{company_id}&select=id,sku,name,price,stock,unit,category,image_url,is_active
```

### Proyectos Visibles
```http
GET /rest/v1/projects?select=id,company_id,name,description,status,supervisor_id,created_by,created_at,updated_at,active
```

### Miembros de Proyecto
```http
GET /rest/v1/project_members?project_id=eq.{project_id}&select=project_id,user_id,role_in_project,added_at
```

### Requisiciones Propias
```http
GET /rest/v1/requisitions?created_by=eq.{auth.uid}&select=id,company_id,project_id,internal_folio,total_amount,business_status,items,created_at,updated_at
```

### Items de Requisición
```http
GET /rest/v1/requisition_items?requisition_id=eq.{id}&select=id,product_id,quantity,unit_price,subtotal
```

### Plantillas Propias
```http
GET /rest/v1/requisition_templates?user_id=eq.{auth.uid}&select=id,name,description,items,is_favorite,usage_count,last_used_at,project_id,company_id
```

### Notificaciones Propias
```http
GET /rest/v1/notifications?user_id=eq.{auth.uid}&select=id,type,title,message,link,is_read,created_at
```

---

## 📝 Notas Finales

### Consideraciones de Implementación
1. **Vistas**: Implementar vistas recomendadas para evitar errores 500 en embeds complejos
2. **Migración**: Migrar toda lógica de `role` (LEGACY) a `role_v2`
3. **Testing**: Validar todas las políticas RLS con diferentes roles y empresas
4. **Performance**: Monitorear queries complejas y agregar índices según necesidad

### Soporte
Para consultas sobre SQL de vistas o políticas RLS específicas, referirse a `AUDITORIA_BD_SUPABASE.md` o consultar directamente con el equipo de backend.

---

**Versión del documento**: 1.0  
**Mantenido por**: Equipo de Desarrollo ComerECO  
**Última revisión**: 2025-01-26
