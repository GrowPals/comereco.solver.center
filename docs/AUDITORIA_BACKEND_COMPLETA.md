# 🔒 Auditoría Backend Completa - ComerECO

**Fecha**: 2025-01-02
**Objetivo**: Asegurar que el 100% del frontend esté respaldado en el backend

---

## 📋 Resumen Ejecutivo

Esta auditoría verifica que todas las funcionalidades del frontend tengan su correspondiente respaldo en Supabase (base de datos, RLS, funciones, Edge Functions).

### Estado General
- ✅ **Tablas principales**: Creadas y documentadas
- ⚠️ **Políticas RLS**: Necesitan verificación completa
- ✅ **Funciones**: Implementadas con security
- ⚠️ **Edge Functions**: `invite-user` existe, faltan otras
- 🔴 **Migraciones**: Sin sistema centralizado

---

## 🗄️ 1. Estructura de Base de Datos

### Tablas Principales Verificadas

#### ✅ `profiles` - Perfiles de Usuario
```sql
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id),
    full_name text,
    avatar_url text,
    role_v2 app_role_v2 DEFAULT 'user'::app_role_v2,
    updated_at timestamptz DEFAULT now()
);
```
**Servicios que la usan**: `userService.js`

#### ✅ `companies` - Empresas
```sql
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    bind_location_id text,
    bind_price_list_id text,
    created_at timestamptz DEFAULT now()
);
```
**Servicios que la usan**: `companyService.js`

#### ✅ `products` - Catálogo de Productos
```sql
-- Campos principales
- id uuid PRIMARY KEY
- company_id uuid REFERENCES companies
- name text NOT NULL
- sku text
- category text
- stock integer
- unit_price numeric
- is_active boolean DEFAULT true
```
**Servicios que la usan**: `productService.js`

#### ✅ `requisitions` - Requisiciones
```sql
-- Campos principales
- id uuid PRIMARY KEY
- internal_folio text UNIQUE
- company_id uuid REFERENCES companies
- project_id uuid REFERENCES projects
- created_by uuid REFERENCES profiles
- approved_by uuid REFERENCES profiles
- total_amount numeric
- business_status text (draft, pending, approved, rejected)
- integration_status text (not_sent, sent, processing, completed, error)
- created_at timestamptz
```
**Servicios que la usan**: `requisitionService.js`

#### ✅ `requisition_items` - Ítems de Requisición
```sql
-- Campos principales
- id uuid PRIMARY KEY
- requisition_id uuid REFERENCES requisitions
- product_id uuid REFERENCES products
- quantity integer NOT NULL
- unit_price numeric NOT NULL
- subtotal numeric GENERATED
```

#### ✅ `projects` - Proyectos
```sql
-- Campos principales
- id uuid PRIMARY KEY
- company_id uuid REFERENCES companies
- name text NOT NULL
- description text
- status text
- bind_project_id text
```
**Servicios que la usan**: `projectService.js`

#### ⚠️ `templates` - Plantillas de Requisición
**Estado**: Servicio existe (`templateService.js`), verificar tabla

#### ⚠️ `favorites` - Productos Favoritos
**Estado**: Mencionado en UI, verificar implementación backend

#### ⚠️ `notifications` - Notificaciones
**Estado**: Servicio existe (`notificationService.js`), verificar tabla

#### ⚠️ `audit_logs` - Logs de Auditoría
**Estado**: Servicio existe (`auditLogService.js`), verificar tabla

---

## 🔐 2. Row Level Security (RLS)

### Políticas Implementadas

#### ✅ `profiles`
- **SELECT**: `auth.uid() = id` (usuarios ven su propio perfil)
- **UPDATE**: `auth.uid() = id` (usuarios actualizan su perfil)

#### ⚠️ `companies`
**Faltan políticas**: Verificar RLS para multi-tenant

#### ⚠️ `products`
**Esperado**: Filtrar por `company_id`
```sql
-- FALTA CREAR
CREATE POLICY "Users can view company products"
ON public.products FOR SELECT
USING (
    company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    )
);
```

#### ⚠️ `requisitions`
**Esperado**: Basado en rol
- **Admin**: Ve todas las requisiciones de su company
- **Supervisor**: Ve requisiciones de sus proyectos + las que debe aprobar
- **User**: Solo ve sus propias requisiciones

```sql
-- FALTA CREAR
CREATE POLICY "Users can view requisitions based on role"
ON public.requisitions FOR SELECT
USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND (
        -- Admin: ve todas
        (SELECT role_v2 FROM profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- User: solo las suyas
        created_by = auth.uid()
        OR
        -- Supervisor: las que debe aprobar
        (SELECT role_v2 FROM profiles WHERE id = auth.uid()) = 'supervisor'
    )
);
```

#### ⚠️ `projects`
**Esperado**: Filtrar por `company_id`

---

## ⚙️ 3. Funciones y Triggers

### ✅ Funciones Implementadas

#### 1. `get_unique_product_categories(company_id_param uuid)`
```sql
-- Retorna categorías únicas de productos
-- Usado en: productService.js
```

#### 2. `current_user_id()`
```sql
-- Retorna auth.uid()
-- Helper para RLS
```

#### 3. `is_admin()`
```sql
-- Verifica si el usuario es admin
-- Usado en políticas RLS
```

#### 4. `handle_new_user()` - Trigger
```sql
-- Auto-crea perfil cuando se registra usuario
-- Trigger: AFTER INSERT ON auth.users
```

#### 5. `update_updated_at_column()` - Trigger
```sql
-- Actualiza campo updated_at automáticamente
```

### ⚠️ Funciones Faltantes

#### 1. `get_user_role(user_id uuid)`
```sql
-- CREAR: Retorna el rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role_v2 AS $$
BEGIN
    RETURN (SELECT role_v2 FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
```

#### 2. `get_user_company_id(user_id uuid)`
```sql
-- CREAR: Retorna la company_id del usuario
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT company_id FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
```

#### 3. `validate_requisition_approval(requisition_id uuid, approver_id uuid)`
```sql
-- CREAR: Valida que el usuario puede aprobar la requisición
```

---

## 🚀 4. Edge Functions (Supabase Functions)

### ✅ Implementadas
1. **`invite-user`**: Invitar usuarios con roles
   - Usado en: `userService.js`

### 🔴 Faltantes pero Necesarias

#### 1. `create-requisition`
**Razón**: Lógica compleja que requiere transacciones
```typescript
// Crear requisición + items + generar folio + notificaciones
```

#### 2. `approve-requisition`
**Razón**: Validaciones de negocio + integración con Bind ERP
```typescript
// Validar permisos + actualizar estado + enviar a Bind
```

#### 3. `sync-bind-products`
**Razón**: Integración con ERP externo
```typescript
// Obtener productos de Bind ERP + actualizar base de datos
```

#### 4. `generate-report`
**Razón**: Procesamiento pesado
```typescript
// Generar reportes complejos + enviar por email
```

---

## 🔗 5. Mapeo Frontend ↔ Backend

### Servicios del Frontend

| Servicio | Tabla(s) | RLS | Edge Function | Estado |
|----------|---------|-----|---------------|--------|
| `userService.js` | `profiles` | ✅ | `invite-user` ✅ | ✅ OK |
| `productService.js` | `products` | ⚠️ | - | ⚠️ Falta RLS |
| `requisitionService.js` | `requisitions`, `requisition_items` | ⚠️ | 🔴 | ⚠️ Falta RLS + EF |
| `projectService.js` | `projects` | ⚠️ | - | ⚠️ Falta RLS |
| `templateService.js` | `templates` | ❓ | - | 🔴 Verificar tabla |
| `notificationService.js` | `notifications` | ❓ | - | 🔴 Verificar tabla |
| `companyService.js` | `companies` | ⚠️ | - | ⚠️ Falta RLS |
| `dashboardService.js` | Multiple | ⚠️ | - | ⚠️ Optimizar queries |
| `auditLogService.js` | `audit_logs` | ❓ | - | 🔴 Verificar tabla |

### Rutas del Frontend sin Backend Completo

#### 1. `/templates` - Plantillas
- **Frontend**: Página existe
- **Backend**: Verificar si tabla `templates` existe
- **Acción**: Crear migración

#### 2. `/favorites` - Favoritos
- **Frontend**: Página existe
- **Backend**: Tabla `user_favorites` o campo en `profiles`
- **Acción**: Decidir arquitectura

#### 3. `/notifications` - Notificaciones
- **Frontend**: NotificationCenter existe
- **Backend**: Verificar tabla `notifications`
- **Acción**: Crear migración si falta

#### 4. `/reports` - Reportes (Admin)
- **Frontend**: Página existe
- **Backend**: Edge Function para generación
- **Acción**: Crear Edge Function

#### 5. `/help` - Ayuda
- **Frontend**: Link en sidebar
- **Backend**: ¿Contenido estático o base de datos?
- **Acción**: Decidir arquitectura

---

## 🛡️ 6. Seguridad y Validaciones

### ✅ Implementado
- Validación de sesión en todos los servicios
- Uso de `getCachedSession()` para evitar queries repetidas
- Funciones con `SET search_path = public`
- Triggers con `SECURITY DEFINER`

### ⚠️ Pendiente
- **RLS completo** en todas las tablas
- **Validaciones de negocio** en Edge Functions
- **Rate limiting** en endpoints críticos
- **Logs de auditoría** para acciones importantes

---

## 📊 7. Performance y Optimización

### ✅ Implementado
- Índices en campos frecuentes (`company_id`, `created_by`)
- Queries con `range()` para paginación
- `select()` específico (no `*` innecesario)
- Batch queries con `Promise.all()`

### ⚠️ Recomendaciones
1. **Crear índices adicionales**:
```sql
CREATE INDEX IF NOT EXISTS idx_requisitions_company_status
ON requisitions(company_id, business_status);

CREATE INDEX IF NOT EXISTS idx_products_company_category
ON products(company_id, category) WHERE is_active = true;
```

2. **Materialized Views** para dashboard:
```sql
CREATE MATERIALIZED VIEW dashboard_stats_mv AS
SELECT
    company_id,
    COUNT(*) as total_requisitions,
    SUM(total_amount) as total_spent
FROM requisitions
GROUP BY company_id;

-- Refresh automático
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚨 8. Acciones Inmediatas Requeridas

### Prioridad ALTA 🔴

1. **Crear políticas RLS faltantes**
   - `products`: Filtrar por company_id
   - `requisitions`: Basado en rol
   - `projects`: Filtrar por company_id
   - Archivo: `MIGRACION_RLS_COMPLETO.sql`

2. **Verificar tablas faltantes**
   - `templates`
   - `notifications`
   - `audit_logs`
   - `user_favorites` (si aplica)
   - Archivo: `MIGRACION_TABLAS_FALTANTES.sql`

3. **Edge Functions críticas**
   - `create-requisition` (transaccional)
   - `approve-requisition` (validaciones + Bind)

### Prioridad MEDIA ⚠️

4. **Optimizar queries de dashboard**
   - Crear materialized views
   - Implementar cache

5. **Completar sistema de notificaciones**
   - Tabla `notifications`
   - Trigger para crear notificaciones automáticas
   - Polling o Realtime subscriptions

6. **Sistema de favoritos**
   - Decidir: tabla separada vs campo JSON en profiles
   - Implementar

### Prioridad BAJA 🟡

7. **Contenido de Ayuda**
   - Página estática vs base de datos
   - Implementar

8. **Logs de auditoría completos**
   - Triggers en tablas críticas
   - Función helper `log_action()`

---

## 📝 9. Checklist de Verificación

### Base de Datos
- [x] Tabla `profiles` con `role_v2`
- [x] Tabla `companies`
- [x] Tabla `products`
- [x] Tabla `requisitions`
- [x] Tabla `requisition_items`
- [x] Tabla `projects`
- [ ] Tabla `templates` (verificar)
- [ ] Tabla `notifications` (verificar)
- [ ] Tabla `audit_logs` (verificar)
- [ ] Tabla `user_favorites` (decidir)

### RLS
- [x] `profiles` - Básico
- [ ] `companies` - Falta
- [ ] `products` - Falta
- [ ] `requisitions` - Falta
- [ ] `projects` - Falta
- [ ] `templates` - Falta
- [ ] `notifications` - Falta

### Funciones
- [x] `get_unique_product_categories`
- [x] `current_user_id`
- [x] `is_admin`
- [x] `handle_new_user` (trigger)
- [ ] `get_user_role` (crear)
- [ ] `get_user_company_id` (crear)
- [ ] `validate_requisition_approval` (crear)

### Edge Functions
- [x] `invite-user`
- [ ] `create-requisition` (crear)
- [ ] `approve-requisition` (crear)
- [ ] `sync-bind-products` (crear)
- [ ] `generate-report` (crear)

### Performance
- [x] Índices básicos
- [ ] Índices adicionales (crear)
- [ ] Materialized views (crear)
- [ ] Cache strategy (implementar)

---

## 🎯 10. Plan de Acción

### Fase 1: Seguridad (1-2 días)
1. Crear `MIGRACION_RLS_COMPLETO.sql`
2. Aplicar políticas RLS en todas las tablas
3. Probar acceso por roles

### Fase 2: Tablas Faltantes (1 día)
1. Crear `MIGRACION_TABLAS_FALTANTES.sql`
2. Implementar `templates`, `notifications`, `audit_logs`
3. Actualizar servicios del frontend

### Fase 3: Edge Functions Críticas (2-3 días)
1. Implementar `create-requisition`
2. Implementar `approve-requisition`
3. Actualizar frontend para usar EF

### Fase 4: Optimización (1-2 días)
1. Crear índices adicionales
2. Implementar materialized views
3. Configurar cache

### Fase 5: Features Completas (2-3 días)
1. Sistema de notificaciones completo
2. Sistema de favoritos
3. Logs de auditoría

---

## 📞 Siguientes Pasos

1. **Revisar este documento** con el equipo
2. **Priorizar acciones** según impacto
3. **Crear migraciones** documentadas
4. **Aplicar cambios** en entorno de desarrollo
5. **Probar exhaustivamente** antes de producción

---

**Última actualización**: 2025-01-02
**Responsable**: Claude Agent
**Estado**: ⚠️ Requiere Acción Inmediata
