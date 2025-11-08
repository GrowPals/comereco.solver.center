# RUTAS EXACTAS DE ARCHIVOS - ESTRUCTURA COMERECO

## PÁGINAS (Routing)

### Páginas principales
```
/src/pages/Dashboard.jsx                    → GET /dashboard
/src/pages/Catalog.jsx                      → GET /catalog
/src/pages/Requisitions.jsx                 → GET /requisitions
/src/pages/RequisitionDetail.jsx            → GET /requisitions/:id
/src/pages/Checkout.jsx                     → GET /checkout
/src/pages/NewRequisition.jsx               → GET /new-requisition
/src/pages/Approvals.jsx                    → GET /approvals
/src/pages/Templates.jsx                    → GET /templates
/src/pages/Projects.jsx                     → GET /projects
/src/pages/Users.jsx                        → GET /users
/src/pages/Profile.jsx                      → GET /profile
/src/pages/Settings.jsx                     → GET /settings
/src/pages/Notifications.jsx                → GET /notifications
/src/pages/Favorites.jsx                    → GET /favorites (SHELL VACÍO)
/src/pages/History.jsx                      → GET /history (SHELL VACÍO)
/src/pages/Login.jsx                        → GET /login
/src/pages/ResetPassword.jsx                → GET /reset-password
/src/pages/admin/ManageProducts.jsx         → GET /products/manage
/src/pages/admin/Reports.jsx                → GET /reports (SHELL VACÍO)
```

---

## COMPONENTES DE LAYOUT

```
/src/components/layout/Sidebar.jsx          ← Navegación principal
/src/components/layout/BottomNav.jsx        ← Nav móvil (5 botones)
/src/components/layout/Header.jsx           ← Barra superior
/src/components/layout/Footer.jsx           ← Pie de página
/src/components/layout/NotificationCenter.jsx ← Centro de notificaciones
```

---

## COMPONENTES DE NEGOCIO

```
/src/components/Cart.jsx                    ← Panel del carrito
/src/components/ProductCard.jsx             ← Tarjeta de producto
/src/components/RequisitionCard.jsx         ← Tarjeta de requisición
/src/components/SearchDialog.jsx            ← Búsqueda global
/src/components/CommentsSection.jsx         ← Comentarios en requisición
/src/components/CartIcon.jsx                ← Ícono del carrito
/src/components/EmptyState.jsx              ← Estado vacío
/src/components/ErrorState.jsx              ← Estado de error
/src/components/PageLoader.jsx              ← Loader de página
/src/components/ErrorBoundary.jsx           ← Boundary para errores
/src/components/SkipLinks.jsx               ← Links de accesibilidad
/src/components/SearchBar.jsx               ← Barra de búsqueda
/src/components/OptimizedImage.jsx          ← Imagen optimizada
/src/components/HeroCard.jsx                ← Tarjeta hero
/src/components/MultiStepProgressBar.jsx    ← Barra de progreso
/src/components/Timeline.jsx                ← Timeline de cambios
/src/components/FAB.jsx                     ← Botón flotante
```

---

## DASHBOARDS

```
/src/components/dashboards/AdminDashboard.jsx
/src/components/dashboards/SupervisorDashboard.jsx
/src/components/dashboards/UserDashboard.jsx
/src/components/dashboards/StatCard.jsx
/src/components/dashboards/QuickAccess.jsx
/src/components/dashboards/RecentRequisitions.jsx
```

---

## PASOS DE REQUISICIÓN (Multi-step form)

```
/src/components/requisition-steps/GeneralDataStep.jsx
/src/components/requisition-steps/ItemsStep.jsx
/src/components/requisition-steps/ReviewStep.jsx
/src/components/requisition-steps/ConfirmationStep.jsx
```

---

## SKELETONS (Loaders)

```
/src/components/skeletons/DashboardSkeleton.jsx
/src/components/skeletons/ProductCardSkeleton.jsx
```

---

## COMPONENTES UI REUTILIZABLES (50+)

```
/src/components/ui/button.jsx
/src/components/ui/card.jsx
/src/components/ui/dialog.jsx
/src/components/ui/input.jsx
/src/components/ui/textarea.jsx
/src/components/ui/select.jsx
/src/components/ui/badge.jsx
/src/components/ui/avatar.jsx
/src/components/ui/table.jsx
/src/components/ui/pagination.jsx
/src/components/ui/toast.jsx
/src/components/ui/tabs.jsx
/src/components/ui/dropdown-menu.jsx
/src/components/ui/confirm-dialog.jsx
/src/components/ui/loading-spinner.jsx
/src/components/ui/skeleton.jsx
/src/components/ui/label.jsx
/src/components/ui/checkbox.jsx
/src/components/ui/radio-group.jsx
/src/components/ui/switch.jsx
/src/components/ui/accordion.jsx
/src/components/ui/alert.jsx
/src/components/ui/alert-dialog.jsx
/src/components/ui/drawer.jsx
/src/components/ui/popover.jsx
/src/components/ui/scroll-area.jsx
/src/components/ui/tooltip.jsx
/src/components/ui/toaster.jsx
/src/components/ui/toast-notification.jsx
/src/components/ui/form-status-feedback.jsx
/src/components/ui/floating-input.jsx
/src/components/ui/input-field.jsx
/src/components/ui/page-transition.jsx
/src/components/ui/ripple-button.jsx
/src/components/ui/empty-state.jsx
/src/components/ui/slider.jsx
/src/components/ui/progress.jsx
/src/components/ui/calendar.jsx
/src/components/ui/useToast.js
```

---

## SERVICIOS (API & BD)

```
/src/services/authService.js                ← Autenticación
/src/services/productService.js             ← Productos
/src/services/requisitionService.js         ← Requisiciones
/src/services/userService.js                ← Usuarios
/src/services/projectService.js             ← Proyectos
/src/services/templateService.js            ← Plantillas
/src/services/notificationService.js        ← Notificaciones
/src/services/dashboardService.js           ← Estadísticas
/src/services/companyService.js             ← Empresas
/src/services/auditLogService.js            ← Auditoría
/src/services/searchService.js              ← Búsqueda
/src/services/databaseFunctionsService.js   ← RPC functions
/src/services/api/                          ← (subcarpeta si existe)
```

---

## CONTEXTOS Y PROVIDERS

### Contextos
```
/src/context/AppProviders.jsx               ← Stack de providers
/src/context/CartContext.jsx                ← Carrito
/src/context/FavoritesContext.jsx           ← Favoritos
/src/context/RequisitionContext.jsx         ← Requisición temp
/src/context/AuthContext.jsx                ← (Legacy, ver SupabaseAuthContext)
/src/context/ThemeContext.jsx               ← Tema (light/dark)
```

### Auth Context
```
/src/contexts/SupabaseAuthContext.jsx       ← Autenticación activa
```

---

## HOOKS PERSONALIZADOS

### Autenticación
```
/src/hooks/useUserPermissions.js            ← Permisos por rol
```

### Estado Global
```
/src/hooks/useCart.js                       ← Carrito (TanStack Query)
/src/hooks/useFavorites.js                  ← Favoritos (TanStack Query)
/src/hooks/useRequisitions.js               ← Requisiciones (TanStack Query)
```

### Data Fetching
```
/src/hooks/useProducts.js                   ← Productos
/src/hooks/useRequisitionActions.js         ← Acciones de requisición
```

### Utilidades
```
/src/hooks/useDebounce.js                   ← Debounce para búsqueda
/src/hooks/useSessionExpirationHandler.js   ← Expiración de sesión
```

---

## CONFIGURACIÓN Y UTILIDADES

### Librerías
```
/src/lib/utils.js                           ← Utilidades (cn, etc)
/src/lib/customSupabaseClient.js            ← Cliente Supabase
/src/lib/supabaseHelpers.js                 ← Helpers de Supabase
```

### Utilidades
```
/src/utils/errorHandler.js                  ← Manejo de errores
/src/utils/roleHelpers.jsx                  ← Helpers de roles
/src/utils/logger.js                        ← Logger personalizado
```

### Tipos
```
/src/types/catalog.js                       ← Tipos de catálogo
/src/types/user.js                          ← Tipos de usuario
```

### Data
```
/src/data/mockdata.js                       ← Datos mock
```

### Estilos
```
/src/styles/                                ← (Si hay archivos CSS adicionales)
/src/index.css                              ← CSS global
```

---

## ARCHIVOS PRINCIPALES

```
/src/App.jsx                                ← Componente raíz (rutas)
/src/main.jsx                               ← Entry point de Vite
```

---

## CONFIGURACIÓN DEL PROYECTO

```
/vite.config.js                             ← Vite
/tailwind.config.js                         ← Tailwind CSS
/package.json                               ← Dependencias
/jsconfig.json                              ← Path aliases
/eslint.config.js                           ← ESLint
/postcss.config.js                          ← PostCSS
/index.html                                 ← HTML principal
```

---

## SUPABASE

```
/supabase/                                  ← (Migraciones, seeds, etc)
```

---

## DOCUMENTACIÓN GENERADA

```
/MAPA_ESTRUCTURA_COMPLETO.md                ← Documentación completa (1,156 líneas)
/RESUMEN_EJECUTIVO.md                       ← Resumen ejecutivo
/RUTAS_ARCHIVOS_PRECISAS.md                 ← Este archivo
```

---

## CONTEO POR TIPO

| Tipo | Cantidad | Ruta |
|------|----------|------|
| Páginas | 19 | /src/pages |
| Componentes de layout | 5 | /src/components/layout |
| Componentes de negocio | 15 | /src/components |
| Dashboards | 6 | /src/components/dashboards |
| Steps (requisición) | 4 | /src/components/requisition-steps |
| Skeletons | 2 | /src/components/skeletons |
| UI Components | 35+ | /src/components/ui |
| Servicios | 12 | /src/services |
| Contextos | 6 | /src/context + /src/contexts |
| Hooks | 10+ | /src/hooks |
| **TOTAL** | **150+** | **/src** |

---

## BÚSQUEDA RÁPIDA POR FUNCIONALIDAD

### Carrito de compras
- **Componente:** `/src/components/Cart.jsx`
- **Hook:** `/src/hooks/useCart.js`
- **Contexto:** `/src/context/CartContext.jsx`
- **Servicio:** `/src/services/productService.js`

### Requisiciones
- **Página:** `/src/pages/RequisitionDetail.jsx`
- **Listado:** `/src/pages/Requisitions.jsx`
- **Crear:** `/src/pages/Checkout.jsx` o `/src/pages/NewRequisition.jsx`
- **Servicio:** `/src/services/requisitionService.js`
- **Hook:** `/src/hooks/useRequisitions.js`

### Aprobaciones
- **Página:** `/src/pages/Approvals.jsx`
- **Servicio:** `/src/services/requisitionService.js` (fetchPendingApprovals)
- **Permiso:** `canApproveRequisitions` en `/src/hooks/useUserPermissions.js`

### Catálogo de Productos
- **Página:** `/src/pages/Catalog.jsx`
- **Card:** `/src/components/ProductCard.jsx`
- **Servicio:** `/src/services/productService.js`
- **Hook:** `/src/hooks/useProducts.js`

### Favoritos
- **Página:** `/src/pages/Favorites.jsx` (SHELL)
- **Hook:** `/src/hooks/useFavorites.js`
- **Contexto:** `/src/context/FavoritesContext.jsx`
- **Servicio:** `/src/services/productService.js` (fetch favoritos)

### Plantillas
- **Página:** `/src/pages/Templates.jsx`
- **Servicio:** `/src/services/templateService.js`

### Proyectos
- **Página:** `/src/pages/Projects.jsx`
- **Servicio:** `/src/services/projectService.js`

### Usuarios
- **Página:** `/src/pages/Users.jsx`
- **Servicio:** `/src/services/userService.js`
- **Permiso:** `canManageUsers` en `/src/hooks/useUserPermissions.js`

### Autenticación
- **Página:** `/src/pages/Login.jsx`
- **Context:** `/src/contexts/SupabaseAuthContext.jsx`
- **Hook:** `useSupabaseAuth()` en `/src/contexts/SupabaseAuthContext.jsx`

### Dashboard
- **Página:** `/src/pages/Dashboard.jsx`
- **Componentes:** 
  - `/src/components/dashboards/AdminDashboard.jsx`
  - `/src/components/dashboards/SupervisorDashboard.jsx`
  - `/src/components/dashboards/UserDashboard.jsx`
- **Servicio:** `/src/services/dashboardService.js`

### Notificaciones
- **Página:** `/src/pages/Notifications.jsx`
- **Componente:** `/src/components/layout/NotificationCenter.jsx`
- **Servicio:** `/src/services/notificationService.js`

### Permisos y Roles
- **Hook:** `/src/hooks/useUserPermissions.js`
- **Context:** `/src/contexts/SupabaseAuthContext.jsx` (user.role_v2)

### Búsqueda Global
- **Componente:** `/src/components/SearchDialog.jsx`
- **Servicio:** `/src/services/searchService.js`

---

**Última actualización:** 3 de Noviembre de 2024
**Cobertura:** 100% de la estructura visible
