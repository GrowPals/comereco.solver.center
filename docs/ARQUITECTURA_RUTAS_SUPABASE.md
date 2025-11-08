# Arquitectura de Rutas, Funcionalidades y Supabase

Este documento resume la estructura actualizada de la webapp ComerECO tras la habilitación del modo multi-empresa con roles `dev`/`admin`/`supervisor`/`user`. Sirve como referencia rápida para QA, soporte y nuevos desarrolladores.

## 1. Rutas de la Aplicación

Todas las rutas excepto `/login` están envueltas por `PrivateRoute` (`src/App.jsx:253-267`), por lo que requieren sesión válida. La tabla siguiente indica permisos adicionales cuando aplican.

| Ruta | Componente | Descripción | Permisos extras |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | Vista pública de autenticación (`src/App.jsx:258`). | – |
| `/` | `Navigate → /dashboard` | Redirección tras login (`src/App.jsx:230`). | – |
| `*` | `NotFoundPage` | Vista 404 (`src/App.jsx:231`). | – |
| `/dashboard` | `Dashboard` | Resumen general (`src/App.jsx:177`). | Sesión activa |
| `/requisitions` | `RequisitionsPage` | Listado de requisiciones (`src/App.jsx:178`). | Sesión |
| `/requisitions/new` | `NewRequisitionPage` | Alta de requisición (`src/App.jsx:179`). | Sesión |
| `/requisitions/:id` | `RequisitionDetail` | Detalle individual (`src/App.jsx:180`). | Sesión + acceso al proyecto |
| `/profile` | `ProfilePage` | Datos personales (`src/App.jsx:181`). | Sesión |
| `/approvals` | `ApprovalsPage` | Bandeja de aprobación (`src/App.jsx:183-187`). | `canApproveRequisitions` (admin/supervisor/dev) |
| `/users` | `UsersPage` | Gestión de usuarios (`src/App.jsx:188-191`). | `canManageUsers` (admin/dev) |
| `/projects` | `ProjectsPage` | Listado proyectos (`src/App.jsx:193-197`). | Sesión |
| `/projects/:id` | `ProjectDetail` | Detalle de proyecto (`src/App.jsx:198-201`). | Miembro, supervisor o admin/dev |
| `/products/manage` | `ManageProductsPage` | Catálogo interno (`src/App.jsx:203-207`). | Solo admin/dev |
| `/inventory/restock-rules` | `InventoryRestockRulesPage` | Reglas de reabasto (`src/App.jsx:208-211`). | `canManageRestockRules` |
| `/reports` | `ReportsPage` | Analíticos (`src/App.jsx:213-216`). | Solo admin/dev |
| `/settings` | `SettingsPage` | Preferencias personales (`src/App.jsx:219`). | Sesión |
| `/catalog` | `CatalogPage` | Catálogo público interno (`src/App.jsx:220`). | Sesión |
| `/producto/:id` | `ProductDetail` | Detalle de producto (`src/App.jsx:221`). | Sesión |
| `/notifications` | `NotificationsPage` | Centro de avisos (`src/App.jsx:222`). | Sesión |
| `/cart` | `CartPage` | Carrito; deshabilita bottom-nav (`src/App.jsx:223`). | Sesión |
| `/checkout` | `CheckoutPage` | Flujo de compra (`src/App.jsx:224`). | Sesión |
| `/templates` | `TemplatesPage` | Plantillas reutilizables (`src/App.jsx:225`). | Sesión |
| `/favorites` | `FavoritesPage` | Favoritos (`src/App.jsx:226`). | Sesión |
| `/help` | `HelpPage` | Centro de ayuda (`src/App.jsx:227`). | Sesión |
| `/reset-password` | `ResetPasswordPage` | Reset (pública si llega desde mail) (`src/App.jsx:228`). | Token válido |

## 2. Funcionalidades Clave

1. **Selector multi-empresa dinámico**: `CompanyScopeProvider` + `CompanySwitcher` en el header permiten a roles `dev` alternar entre “Todas” y una empresa específica. Servicios y consultas usan `scopeToCompany`/`ensureScopedCompanyId` para respetar la selección (`src/context/CompanyScopeContext.jsx`, `src/lib/companyScope.js`, `src/components/layout/Header.jsx`).
2. **Rol `dev` (super admin)**: definido en `app_role_v2`, tratado como platform admin en `is_platform_admin()`, con permisos globales en `useUserPermissions` y `getUserAccessContext`. Puede gestionar cualquier empresa y crear otros developers.
3. **Gestión de usuarios avanzada**: `src/pages/Users.jsx` soporta invitaciones (Edge Function `invite-user`), edición, activación/desactivación y toggles de aprobación directa. Los servicios (`src/services/userService.js`) validan roles extendidos y usan RPC `admin_upsert_profile` para seed.
4. **Módulos core**: requisiciones (creación, aprobación, analytics), proyectos, plantillas, reglas de reabasto, catálogos, carrito/checkout, notificaciones. Cada servicio (`src/services/*`) valida sesión, usa `scopeToCompany` y se apoya en React Query para caching.
5. **Scripts y documentación operativa**: `npm run seed:core-admins` crea las cuatro empresas base con contraseñas conocidas (ver `docs/playbooks/BOOTSTRAP_CORE_ADMINS.md`). `.env.example` incluye variables necesarias (anon, service_role, redirect, contraseñas seed opcionales).

## 3. Supabase – Arquitectura y Operación

### 3.1 Auth y perfiles
- `auth.users` se sincroniza con `public.profiles` mediante triggers/migraciones (`supabase/migrations/20250307_enforce_rls_guards.sql`).
- `profiles.role_v2` usa `app_role_v2 = ('admin','supervisor','user','dev')`. El rol determina permisos en funciones `is_admin`, `is_supervisor`, `is_platform_admin` (`supabase/migrations/20251107070635_add_dev_role.sql`).
- RPC `admin_upsert_profile` (security definer) permite que scripts/funciones con `service_role` inserten/actualicen perfiles sin romper RLS.

### 3.2 RLS y guardias
- Tablas críticas (`projects`, `requisitions`, `products`, `inventory_restock_rules`, `user_invitations`, etc.) tienen políticas que combinan `company_id = get_user_company_id()` con checks `is_admin()`/`is_supervisor()`/`is_platform_admin()` (`supabase/migrations/20251105111939_remote_schema.sql`).
- Triggers legacy fueron reemplazados por funciones guardia (`*_guard`) en `supabase/migrations/20250308_adjust_rls_guards.sql` para mantener mensajes “Acceso no autorizado”.

### 3.3 RPCs y Edge Functions
- RPCs disponibles: `get_unique_product_categories`, `clear_user_cart`, `admin_upsert_profile`, `perform_global_search` optimizado, etc.
- Edge Function `invite-user` usa la `service_role` para invitar usuarios, asignar `company_id/role_v2` y registrar developers como `platform_admins` (`supabase/functions/invite-user/index.ts`).

### 3.4 Storage y asset management
- Bucket `product-images` organiza archivos por `company_id` (productos) y `companyId/profiles` (avatars). `src/services/imageService.js` valida tipo/tamaño y genera URLs públicas firmadas.

### 3.5 Tooling y despliegues
- `supabase db push/pull` sincroniza migraciones. En caso de bloqueo por migraciones legacy, se puede aplicar SQL manualmente desde el dashboard (ver sección “Next Steps” en README).
- Scripts CLI (`tools/bootstrap-core-admins.mjs`, `tools/seed-platform-admins.mjs`) consumen la `service_role`. Documentación de uso en `docs/playbooks/BOOTSTRAP_CORE_ADMINS.md`.
- Variables necesarias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_REDIRECT_URL`, `CORE_PASSWORD_*` (solo local).

## 4. Checklist de Verificación

1. `npm run seed:core-admins` completó (ver tabla final del comando). Si se vuelve a correr, respeta idempotencia.
2. Developers (`role_v2 = 'dev'`) pueden alternar entre “Todas” y empresas específicas. Admins comunes solo ven su compañía.
3. Edge Function `invite-user` envía correos con redirect `https://comereco.solver.center/reset-password` y respeta permisos (solo admin/dev).
4. Los servicios clave responden según el scope seleccionado (projects, requisitions, products, restock rules, templates).
5. Migración `20251107070635_add_dev_role.sql` y funciones asociadas están aplicadas en el proyecto remoto (ver `pg_proc` o `supabase db push`).

Documenta cualquier ajuste adicional directamente en este archivo o en los playbooks correspondientes para mantener la arquitectura sincronizada.

