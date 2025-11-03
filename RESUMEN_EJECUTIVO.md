# RESUMEN EJECUTIVO - MAPA DE ESTRUCTURA COMERECO

## SNAPSHOT RÁPIDO

| Métrica | Valor |
|---------|-------|
| **Páginas implementadas** | 17 de 20 (85%) |
| **Rutas definidas** | 31+ |
| **Servicios** | 12 |
| **Hooks personalizados** | 10+ |
| **Contextos** | 5 |
| **Componentes reutilizables** | 50+ en /ui |
| **Líneas de documentación** | 1,156 |

---

## 1. RUTAS CRÍTICAS (Lo que el usuario VE)

### Público (sin login)
```
/login                 → LoginPage
/reset-password        → ResetPasswordPage
```

### Privado (después de login)
```
/dashboard             → Dashboard (adaptado por rol)
/catalog               → Catálogo de productos
/requisitions          → Mis requisiciones
/requisitions/:id      → Detalle y aprobación
/checkout              → Revisar carrito y crear req
/approvals             → Aprobar/rechazar reqs (Admin/Supervisor)
/templates             → Mis plantillas
/projects              → Gestión de proyectos
/users                 → Gestión de usuarios (Admin)
/products/manage       → Gestión de productos (Admin)
/profile               → Mi perfil
/settings              → Configuración
/notifications         → Centro de notificaciones
/favorites             → Mis favoritos (shell vacío)
/history               → Historial (shell vacío)
/reports               → Reportes (shell vacío, Admin)
```

---

## 2. COMPONENTES DE NAVEGACIÓN

### Estructura (Mobile-first)
```
┌─────────────────────────────────────────┐
│ HEADER (búsqueda, notificaciones, user) │
├──────────────────────────────────────────┤
│                                          │
│          MAIN CONTENT AREA               │
│          (páginas rotan aquí)            │
│                                          │
├──────────────────────────────────────────┤
│ HOME │ SHOP │  [CART]  │ REQS │  MENU   │ ← BottomNav (móvil)
└──────────────────────────────────────────┘

Desktop:
┌──────────────────────────────────────────────┐
│ SIDEBAR │ HEADER | MAIN CONTENT   | CART    │
│ (menú)  │        | (páginas)      | (drawer)│
│         │        |                 |        │
└──────────────────────────────────────────────┘
```

### Sidebar
**Menú dinámico según rol:**
- **Principal:** Dashboard, Catálogo, Requisiciones
- **Herramientas:** Plantillas, Favoritos
- **Admin:** Usuarios, Productos, Reportes, Aprobaciones, Proyectos
- **Supervisor:** Aprobaciones, Proyectos

---

## 3. ESTADO GLOBAL (¿Dónde se guarda todo?)

### CartContext
```
items: [{id, name, price, quantity}],
totalItems: number,
subtotal: number,
vat: number (16%),
total: number,
addToCart, removeFromCart, updateQuantity, clearCart
```
**BD:** tabla `user_cart_items`
**Ubicación código:** `/src/context/CartContext.jsx`

### SupabaseAuthContext
```
session: {user, access_token},
user: {id, email, full_name, role_v2, company_id, company},
loading: boolean,
signIn(), signOut()
```
**BD:** tablas `profiles` + `companies`
**Ubicación código:** `/src/contexts/SupabaseAuthContext.jsx`

### FavoritesContext
```
favorites: [productId1, productId2, ...],
toggleFavorite(productId),
isFavorite(productId)
```
**BD:** tabla `user_favorites`
**Ubicación código:** `/src/context/FavoritesContext.jsx`

### RequisitionContext
```
requisition: {created_by, project_id, comments, items[]},
updateItemQuantity, removeItem, resetRequisition
```
**BD:** tabla `requisitions` + `requisition_items`
**Ubicación código:** `/src/context/RequisitionContext.jsx`

### ThemeContext
```
theme: 'light' | 'dark',
toggleTheme()
```
**Ubicación código:** `/src/context/ThemeContext.jsx`

---

## 4. SERVICIOS (Llamadas a API/BD)

### Principales (`/src/services`)

| Servicio | Funciones principales | BD |
|----------|---|---|
| **authService** | Delegado a SupabaseAuthContext | auth |
| **productService** | fetchProducts, createProduct, updateProduct | products |
| **requisitionService** | fetchRequisitions, updateStatus, createFrom Cart | requisitions, requisition_items |
| **userService** | fetchUsers, inviteUser, updateProfile | profiles |
| **projectService** | CRUD proyectos, gestión miembros | projects, project_members |
| **templateService** | CRUD plantillas | templates |
| **notificationService** | CRUD notificaciones | notifications |
| **dashboardService** | getDashboardStats (RPC) | custom functions |
| **companyService** | getCompanyDetails | companies |
| **auditLogService** | createAuditLog, getAuditLogs | audit_logs |
| **searchService** | searchGlobal | products, requisitions, projects |
| **databaseFunctionsService** | Wrappers RPC | custom functions |

**Patrón común:**
```javascript
// Validar sesión
const { session } = await getCachedSession();
if (!session) throw Error("No autenticado");

// Hacer query
const { data, error } = await supabase
  .from('table')
  .select(...)
  .eq('field', value);

// Manejar error
if (error) throw Error(formatErrorMessage(error));

// Retornar
return data;
```

---

## 5. HOOKS (Lógica reutilizable)

### Autenticación
- **useSupabaseAuth()** - session, user, signIn, signOut
- **useUserPermissions()** - isAdmin, isSupervisor, canApproveRequisitions, etc.

### Estado Global
- **useCart()** - items, addToCart, removeFromCart, clearCart
- **useFavorites()** - favorites, toggleFavorite, isFavorite
- **useRequisition()** - requisition, updateItemQuantity, removeItem

### Data Fetching (React Query)
- **useProducts(filters)** - obtiene productos paginados
- **useProductDetails(productId)** - detalle de un producto
- **useProductCategories()** - lista de categorías
- **useRequisitions(filters)** - lista de requisiciones
- **useRequisitionDetails(requisitionId)** - detalle de requisición
- **useRequisitionActions()** - submit, approve, reject

### Utilidades
- **useDebounce(value, delay)** - debounce para búsquedas
- **useSessionExpirationHandler()** - maneja expiración de sesión

---

## 6. ESTADO ACTUAL: LO QUE FUNCIONA vs NO FUNCIONA

### ✅ FUNCIONALES (17 páginas)
- Dashboard (admin/supervisor/user) ✅
- Catálogo ✅
- Requisiciones ✅
- Detalle de Requisición ✅
- Checkout ✅
- Aprobaciones ✅
- Plantillas ✅
- Proyectos ✅
- Usuarios ✅
- Gestión de Productos ✅
- Perfil ✅
- Configuración ✅
- Notificaciones ✅
- Login ✅
- Reset Password ✅

### ⚠️ INCOMPLETAS (3 páginas shell)
- **Favorites** - Lógica FUNCIONA pero página vacía
  - Necesita: Grid de productos favoritados
  - Archivo: `/src/pages/Favorites.jsx`
  
- **History** - Shell vacío
  - Necesita: Histórico de requisiciones completadas
  - Archivo: `/src/pages/History.jsx`
  
- **Reports** - Shell vacío
  - Necesita: Gráficos, analytics
  - Archivo: `/src/pages/admin/Reports.jsx`

---

## 7. FLUJO DE UNA COMPRA (User Journey)

```
1. Usuario inicia sesión
   └→ Validación en SupabaseAuthContext
   └→ Carga rol (admin/supervisor/user)
   └→ Carga permisos dinámicos

2. Navega a Catálogo
   └→ useProducts() obtiene productos (React Query)
   └→ Busca/filtra productos
   └→ Ve heart favorito (useFavorites)

3. Agrega producto a carrito
   └→ useCart().addToCart()
   └→ UPDATE user_cart_items en BD
   └→ Badge en BottomNav actualiza

4. Continúa comprando o va a Checkout
   └→ /checkout muestra resumen del carrito
   └→ Calcula subtotal + IVA (16%)

5. Crea requisición
   └→ Puede guardar como plantilla (opcional)
   └→ Envía requisición (draft → submitted)
   └→ Sistema crea audit log

6. Requisición espera aprobación
   └→ Supervisor/Admin ve en /approvals
   └→ Aprueba o rechaza (con motivo si rechaza)
   └→ Notificación en tiempo real (Supabase Realtime)

7. Usuario ve estado actualizado
   └→ /requisitions/:id muestra estado
   └→ Puede ver comentarios y cambios
```

---

## 8. AUTORIZACIÓN Y PERMISOS

### Sistema de roles (role_v2)
```
Admin:
  - Acceso a: todos los módulos
  - Permisos: crear usuarios, productos, ver reportes
  - RLS: ve datos de su company

Supervisor:
  - Acceso a: aprobaciones, proyectos
  - Permisos: aprobar/rechazar requisiciones
  - RLS: ve datos de su company

User (por defecto):
  - Acceso a: catálogo, carrito, mis requisiciones
  - Permisos: crear requisiciones, usar plantillas
  - RLS: ve productos de su company
```

### Validación
1. **Cliente:** PrivateRoute + useUserPermissions
2. **Servidor:** RLS en Supabase (automático por company_id)

---

## 9. LLAMADAS A API MÁS FRECUENTES

| Operación | Servicio | Tabla | Frecuencia |
|-----------|----------|-------|-----------|
| Obtener productos | productService | products | Cada page load |
| Agregar al carrito | useCart() | user_cart_items | Constante |
| Crear requisición | requisitionService | requisitions | Puntual |
| Obtener aprobaciones | requisitionService | requisitions | Puntual (admin) |
| Listar usuarios | userService | profiles | Puntual (admin) |
| Obtener dashboard stats | dashboardService | RPC | Page load |

**Caching:**
- Productos: 10 minutos (staleTime)
- Requisiciones: 2 minutos
- Carrito: 30 segundos (refetch on focus)
- Favoritos: 5 minutos

---

## 10. ESTRUCTURA DE CARPETAS

```
/src
├── /pages               ← 19 páginas (routing)
├── /components
│   ├── /layout          ← Sidebar, BottomNav, Header
│   ├── /dashboards      ← AdminDashboard, UserDashboard, etc
│   ├── /requisition-steps
│   ├── /skeletons       ← Loaders
│   ├── /ui              ← 50+ componentes reutilizables
│   └── *.jsx            ← Componentes de negocio
├── /services            ← 12 servicios (API)
├── /hooks               ← 10+ hooks personalizados
├── /context             ← Contextos (CartContext, etc)
├── /contexts            ← SupabaseAuthContext
├── /lib                 ← Utilidades y configuración
├── /types               ← TypeScript types
├── /utils               ← Helpers
├── /styles              ← CSS global
├── App.jsx              ← Rutas principales
└── main.jsx             ← Entry point
```

---

## 11. TECNOLOGÍAS CLAVE

| Layer | Tecnología |
|-------|-----------|
| Frontend | React 18, Vite |
| UI | Tailwind CSS, Radix UI (shadcn) |
| State | TanStack Query, React Context |
| Backend | Supabase (Auth, DB, RLS, Realtime) |
| Forms | react-hook-form |
| Dates | date-fns |
| Animations | Framer Motion |
| Routing | React Router v6 |

---

## 12. PRÓXIMOS PASOS RECOMENDADOS

### Corto plazo (1-2 semanas)
1. Completar página de Favoritos
2. Implementar Historial de requisiciones
3. Agregar gráficos básicos en Reportes

### Mediano plazo (1 mes)
1. Integración con Bind Locations
2. Integración con Bind Price Lists
3. Dashboard de auditoría

### Largo plazo (>1 mes)
1. Full-text search avanzada
2. Integración con sistemas externos
3. Mobile app nativa (React Native)

---

## PREGUNTAS FRECUENTES

**P: ¿Dónde se almacena el carrito?**
A: En `user_cart_items` tabla en Supabase. Persiste entre sesiones.

**P: ¿Cómo se filtran los datos por empresa?**
A: RLS (Row Level Security) en Supabase filtra automáticamente por `company_id`.

**P: ¿Quién puede aprobar requisiciones?**
A: Admin o Supervisor según `role_v2` en tabla `profiles`.

**P: ¿Cómo se sincronizan cambios en tiempo real?**
A: Supabase Realtime. Ver RequisitionDetail.jsx línea 64.

**P: ¿Dónde se guardan los favoritos?**
A: En tabla `user_favorites` (user_id, product_id).

---

**Documento generado:** 3 de Noviembre de 2024
**Total de líneas:** 1,156 en MAPA_ESTRUCTURA_COMPLETO.md
**Cobertura:** 100% del código visible

Archivo completo disponible en: `/MAPA_ESTRUCTURA_COMPLETO.md`
