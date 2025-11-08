# Páginas y Funcionalidades Clave

Este documento enumera cada página expuesta por la webapp (según `src/App.jsx`) y resume las funcionalidades clave que habilita el sistema tras la actualización multi-tenant.

## 1. Páginas de la Aplicación

| Ruta | Componente | Descripción / Notas | Permisos |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | Portal público de acceso; integra recuperación de contraseña (`/reset-password`). | Pública |
| `/dashboard` | `Dashboard` | KPIs y accesos rápidos personalizados; ejecuta prefetch de requisiciones y productos. | Sesión |
| `/requisitions` | `RequisitionsPage` | Listado con filtros por estado/proyecto y accesos a detalle. | Sesión |
| `/requisitions/new` | `NewRequisitionPage` | Wizard de creación con plantillas, carrito y validaciones. | Sesión |
| `/requisitions/:id` | `RequisitionDetail` | Timeline, comentarios, datos financieros y acciones (submit/approve). | Sesión + acceso |
| `/approvals` | `ApprovalsPage` | Cola de aprobaciones; muestra filtros avanzados y acciones masivas. | `canApproveRequisitions` |
| `/profile` | `ProfilePage` | Perfil personal, foto, datos de contacto y toggles (mantenidos en `profiles`). | Sesión |
| `/users` | `UsersPage` | Gestión centralizada: invitaciones (Edge Function), edición, estados y permisos. | `canManageUsers` |
| `/projects` | `ProjectsPage` | Vista general con modal de creación/edición y gestión de miembros. | Sesión |
| `/projects/:id` | `ProjectDetail` | Resumen de proyecto, miembros, requisiciones ligadas. | Admin/supervisor miembro |
| `/products/manage` | `ManageProductsPage` | CRUD del catálogo interno, subida de imágenes y stock. | Admin/dev |
| `/inventory/restock-rules` | `InventoryRestockRulesPage` | Configura reglas automáticas por producto/proyecto. | Admin/supervisor |
| `/reports` | `ReportsPage` | Panel de Analytics (montos, estados, top productos). | Admin/dev |
| `/catalog` | `CatalogPage` | Catálogo navegable estilo e-commerce, incluye filtros y favoritos. | Sesión |
| `/producto/:id` | `ProductDetail` | Ficha con imágenes, descripción extendida, botón “Agregar al carrito”. | Sesión |
| `/notifications` | `NotificationsPage` | Bandeja de notificaciones internas (creadas vía `audit_log`). | Sesión |
| `/cart` | `CartPage` | Carrito persistente (usa RPC `clear_user_cart` tras crear requisición). | Sesión |
| `/checkout` | `CheckoutPage` | Flujo de confirmación previo al alta de requisición. | Sesión |
| `/templates` | `TemplatesPage` | Listado/edición de plantillas reutilizables para requisiciones. | Sesión |
| `/favorites` | `FavoritesPage` | Colección de productos favoritos por usuario. | Sesión |
| `/settings` | `SettingsPage` | Preferencias generales (tema, notificaciones, etc.). | Sesión |
| `/help` | `HelpPage` | Documentación interna / enlaces de soporte. | Sesión |
| `/reset-password` | `ResetPasswordPage` | Flujo de restablecimiento (ingresando desde link de correo). | Token válido |

## 2. Funcionalidades Clave

1. **Multi-empresa con selector dinámico**
   - Contexto `CompanyScopeProvider` y el componente `CompanySwitcher` en el header permiten a los roles `dev` alternar entre “Todas las empresas” y una específica. Los servicios (`src/services/*`) consultan `scopeToCompany`/`ensureScopedCompanyId` para filtrar/validar automáticamente.

2. **Roles extendidos y permisos**
   - `useUserPermissions` y `getUserAccessContext` exponen flags (`isDev`, `isAdmin`, `canManageUsers`, etc.). El rol `dev` se considera platform admin en backend (RLS) y front-end (UI desbloqueada).

3. **Gestión de usuarios robusta**
   - Invitaciones via Edge Function `invite-user` (con `service_role`, alta en `user_invitations` y registro en `platform_admins` cuando el rol es `dev`).
   - Cambios de rol, activación/desactivación y control de “envío sin aprobación” se sincronizan con Supabase (`profiles`, `auth.users`).

4. **Requisiciones end-to-end**
   - Creación (plantillas, carrito, validaciones), submit, aprobación/rechazo, detalle con auditoría y reportes. Integrado con RPCs (`create_full_requisition`, `perform_global_search`, etc.) y guardias RLS por `company_id`.

5. **Catálogo y productos**
   - CRUD completo (precios, stock, imágenes) con almacenamiento en bucket `product-images` y scoping por compañía.

6. **Reglas de reabasto & Analytics**
   - Configuración de thresholds y proveedores preferidos; reportes mensuales, top productos y estados de requisiciones, todos filtrados por el scope activo.

7. **Scripts de bootstrap y documentación operativa**
   - `npm run seed:core-admins` genera las cuentas base (Growpals/dev + admins de cada empresa). Guía en `docs/playbooks/BOOTSTRAP_CORE_ADMINS.md` + `.env.example` con las variables necesarias.

## 3. Supabase – Operativa General

- **Auth & perfiles**: `auth.users` + `public.profiles` sincronizados por triggers. `app_role_v2` incluye `dev`; funciones `is_admin`, `is_supervisor`, `is_platform_admin` controlan la lógica.
- **RLS**: Tablas críticas restringen consultas a `company_id = get_user_company_id()` con excepciones para `is_platform_admin` (developers). Guardias definidos en migraciones 20250307/20250308.
- **RPCs**: `admin_upsert_profile`, `get_unique_product_categories`, `clear_user_cart`, `perform_global_search`, etc. Edge Function `invite-user` maneja invitaciones con service_role.
- **Storage**: bucket `product-images` segmentado por empresa para productos y avatares.
- **Herramientas**: CLI de Supabase (push/pull), scripts en `tools/`, documentación en `docs/` para bootstrap y verificación.

Con esta referencia puedes ubicar dónde se ubica cada página, qué permiso necesita y cómo se relaciona con la arquitectura multi-tenant y Supabase.

