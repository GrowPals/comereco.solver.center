# 🔍 Auditoría Completa del Backend Supabase
**Fecha:** 2025-01-26  
**Proyecto:** comereco.solver.center (azjaehrdzdfgrumbqmuc)  
**Estado:** ACTIVE_HEALTHY

---

## 📊 Resumen Ejecutivo

### ✅ Estado General
- **13 tablas** en el esquema `public`
- **Todas las tablas están conectadas** correctamente con foreign keys
- **RLS habilitado** en todas las tablas
- **Ninguna tabla muerta** - todas tienen propósito funcional

### ⚠️ Problemas Encontrados
- **3 errores críticos** de seguridad (SECURITY DEFINER views)
- **28 advertencias** de seguridad (funciones con search_path mutable)
- **29 índices sin usar** que pueden optimizarse
- **Múltiples políticas permisivas** que afectan rendimiento
- **Políticas RLS** que re-evalúan funciones innecesariamente

---

## 📋 Análisis de Tablas

### Tablas Principales (13 total)

| Tabla | Filas | Uso Frontend | Uso Backend | Estado |
|-------|-------|--------------|-------------|--------|
| `companies` | 4 | ✅ | ✅ | ✅ Activa |
| `profiles` | 1 | ✅ | ✅ | ✅ Activa |
| `products` | 15 | ✅ | ✅ | ✅ Activa |
| `projects` | 1 | ✅ | ✅ | ✅ Activa |
| `project_members` | 1 | ✅ | ✅ | ✅ Activa |
| `requisitions` | 0 | ✅ | ✅ | ✅ Activa |
| `requisition_items` | 0 | ✅ | ✅ | ✅ Activa |
| `requisition_templates` | 0 | ✅ | ✅ | ✅ Activa |
| `user_cart_items` | 0 | ✅ | ✅ | ✅ Activa |
| `user_favorites` | 0 | ✅ | ✅ | ✅ Activa |
| `notifications` | 0 | ✅ | ✅ | ✅ Activa |
| `audit_log` | 72 | ❌ | ✅ | ✅ Backend only |
| `folio_counters` | 16 | ❌ | ✅ | ✅ Backend only |

### ✅ Conclusión: No hay tablas muertas

**Todas las tablas están siendo utilizadas:**
- Las tablas marcadas como "Backend only" (`audit_log` y `folio_counters`) son utilizadas por:
  - **14 funciones** dependen de `audit_log`
  - **4 triggers** dependen de `audit_log`
  - **6 funciones** dependen de `folio_counters`
  - **2 triggers** dependen de `folio_counters`

Estas tablas son críticas para el funcionamiento del sistema aunque no se accedan directamente desde el frontend.

---

## 🔗 Relaciones entre Tablas

### Mapa de Foreign Keys (24 relaciones)

```
companies (centro del sistema)
├── profiles (company_id)
├── products (company_id)
├── projects (company_id)
├── requisitions (company_id)
├── requisition_templates (company_id)
├── notifications (company_id)
├── audit_log (company_id)
└── folio_counters (company_id)

profiles (usuarios)
├── projects (created_by, supervisor_id)
├── requisitions (created_by, approved_by)
├── requisition_templates (user_id)
├── project_members (user_id)
├── notifications (user_id)
├── user_cart_items (user_id)
├── user_favorites (user_id)
└── audit_log (user_id)

projects (proyectos)
├── requisitions (project_id)
├── requisition_templates (project_id)
└── project_members (project_id)

products (productos)
├── requisition_items (product_id)
├── user_cart_items (product_id)
└── user_favorites (product_id)

requisitions (requisiciones)
└── requisition_items (requisition_id)
```

### ✅ Conclusión: Todas las relaciones están correctamente definidas

---

## 🔒 Problemas de Seguridad

### ❌ ERRORES CRÍTICOS (3)

#### 1. Vistas con SECURITY DEFINER
**Nivel:** ERROR  
**Riesgo:** ALTO  
**Impacto:** Las vistas ejecutan con permisos del creador, no del usuario que consulta

| Vista | Descripción |
|-------|-------------|
| `company_products_view` | View con SECURITY DEFINER |
| `v_is_supervisor` | View con SECURITY DEFINER |
| `dashboard_stats` | View con SECURITY DEFINER |

**Solución:** Eliminar SECURITY DEFINER o revisar que las políticas RLS funcionen correctamente.

#### 2. Funciones con Search Path Mutable (28)
**Nivel:** WARN  
**Riesgo:** MEDIO  
**Impacto:** Posible vulnerabilidad de seguridad por inyección de schema

**Funciones afectadas:**
- `update_requisition_total`
- `update_updated_at_column`
- `get_unique_product_categories` (2 versiones)
- `current_user_id`
- `topic_project_id`
- `calculate_item_subtotal`
- `get_current_user_claims`
- `handle_new_user`
- `is_admin`
- `get_missing_indexes`
- `validate_requisition_status_transition`
- `current_company_id`
- `current_app_role`
- `set_updated_at`
- `topic_company_id`
- `get_my_company_id`
- `enqueue_requisition_for_bind`
- `get_my_claims`
- `get_my_role`
- `storage_company_id`
- `same_company_storage`
- `get_slow_queries`

**Solución:** Agregar `SET search_path = public` en todas las funciones.

#### 3. Leaked Password Protection Deshabilitado
**Nivel:** WARN  
**Riesgo:** MEDIO  
**Impacto:** No se verifica si las contraseñas están comprometidas

**Solución:** Habilitar en el dashboard de Supabase: Settings → Auth → Password Security

---

## ⚡ Problemas de Rendimiento

### 1. Índices Sin Usar (29)

**Nivel:** INFO  
**Impacto:** Ocupan espacio pero no mejoran rendimiento

#### Índices sin usar por tabla:

**products (7 índices):**
- `idx_products_company_id`
- `idx_products_bind_id`
- `idx_products_sku`
- `idx_products_company_sku`
- `idx_products_company_id_bind_id`
- `idx_products_category`
- `idx_products_company_is_active`
- `idx_products_company_category_active`

**audit_log (4 índices):**
- `idx_audit_log_company_ts`
- `idx_audit_log_company_id_event_name`
- `idx_audit_log_company_id_timestamp`
- `idx_audit_log_user_id`

**profiles (2 índices):**
- `idx_profiles_role`
- `idx_profiles_company_id`

**requisitions (2 índices):**
- `idx_requisitions_company_id`
- `idx_requisitions_project`
- `idx_requisitions_approved_by`

**requisition_items (2 índices):**
- `idx_requisition_items_requisition_id`
- `idx_requisition_items_product_id`

**requisition_templates (2 índices):**
- `idx_requisition_templates_company_id`
- `idx_templates_project`
- `idx_templates_created_by`

**projects (3 índices):**
- `idx_projects_created_by`
- `idx_projects_supervisor`
- `idx_projects_active`
- `idx_projects_company`

**project_members (2 índices):**
- `idx_project_members_user_id`
- `idx_project_members_project`

**notifications (2 índices):**
- `idx_notifications_user_company`
- `idx_notifications_company_id`

**companies (2 índices):**
- `idx_companies_name`
- `idx_companies_bind_location`

**user_cart_items (1 índice):**
- `idx_user_cart_items_product_id`

**user_favorites (1 índice):**
- `idx_user_favorites_product_id`

**Recomendación:** 
- **NO eliminar** todavía - pueden ser útiles en el futuro
- Monitorear uso durante 30 días más
- Si siguen sin usarse, considerar eliminarlos

### 2. Políticas RLS que Re-evalúan Funciones (5)

**Nivel:** WARN  
**Impacto:** Rendimiento subóptimo a escala

**Tablas afectadas:**
- `realtime.messages` (4 políticas)
- `public.notifications` (2 políticas)

**Problema:** Las políticas llaman `auth.uid()` directamente en lugar de `(select auth.uid())`, causando re-evaluación por fila.

**Solución:** Cambiar `auth.uid()` por `(select auth.uid())` en las políticas.

### 3. Múltiples Políticas Permisivas (17 casos)

**Nivel:** WARN  
**Impacto:** Cada política debe ejecutarse para cada query, afectando rendimiento

**Tablas afectadas:**
- `audit_log` (1 caso - SELECT)
- `companies` (4 casos - SELECT, INSERT, UPDATE, DELETE)
- `folio_counters` (1 caso - SELECT)
- `profiles` (3 casos - SELECT, UPDATE)
- `project_members` (4 casos - SELECT, INSERT, UPDATE, DELETE)
- `projects` (2 casos - SELECT, UPDATE)
- `requisition_templates` (4 casos - SELECT, INSERT, UPDATE, DELETE)
- `requisitions` (1 caso - UPDATE)

**Recomendación:** Consolidar políticas duplicadas usando condiciones OR en una sola política.

---

## 📈 Migraciones Aplicadas

Se encontraron **10 migraciones** aplicadas:

1. `fix_security_issues` (20251102110425)
2. `optimize_rls_policies` (20251102110455)
3. `seed_sample_products` (20251102110646)
4. `seed_sample_project` (20251102110717)
5. `fix_get_unique_product_categories_add_company_id` (20251102110831)
6. `fix_create_full_requisition_remove_requester_id` (20251102110848)
7. `add_product_indexes_for_performance` (20251102110851)
8. `recreate_clear_user_cart_with_jsonb` (20251102110929)
9. `add_notifications_insert_delete_policies` (20251102111006)

---

## ✅ Conclusión Final

### Estado del Backend: **FUNCIONAL Y CONECTADO**

**Puntos Positivos:**
- ✅ Todas las tablas están conectadas correctamente
- ✅ No hay tablas muertas u obsoletas
- ✅ RLS habilitado en todas las tablas
- ✅ Foreign keys correctamente definidas
- ✅ Migraciones aplicadas correctamente

**Acciones Recomendadas:**
1. 🔴 **URGENTE:** Corregir vistas SECURITY DEFINER
2. 🟡 **IMPORTANTE:** Agregar `SET search_path` a funciones
3. 🟡 **IMPORTANTE:** Optimizar políticas RLS para rendimiento
4. 🟢 **OPCIONAL:** Consolidar políticas duplicadas
5. 🟢 **OPCIONAL:** Monitorear índices sin usar

---

## 📝 Próximos Pasos

1. Revisar y corregir vistas SECURITY DEFINER
2. Crear migración para agregar `SET search_path` a funciones
3. Optimizar políticas RLS problemáticas
4. Monitorear uso de índices durante 30 días
5. Consolidar políticas duplicadas si es necesario

---

**Generado por:** Auditoría Automática Supabase  
**Última actualización:** 2025-01-26

