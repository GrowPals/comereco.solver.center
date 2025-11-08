/**
 * Configuración centralizada de rutas de la aplicación
 * 
 * Todas las rutas deben estar definidas aquí para mantener consistencia
 * y facilitar el mantenimiento.
 */

export const ROUTES = {
  // Rutas públicas
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
  
  // Rutas principales (requieren autenticación)
  DASHBOARD: '/dashboard',
  CATALOG: '/catalog',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  HELP: '/help',
  
  // Requisiciones
  REQUISITIONS: '/requisitions',
  REQUISITIONS_NEW: '/requisitions/new',
  REQUISITIONS_DETAIL: (id) => `/requisitions/${id}`,
  
  // Productos
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id) => `/products/${id}`,
  PRODUCTS_MANAGE: '/products/manage',
  
  // Carrito y compra
  CART: '/cart',
  CHECKOUT: '/checkout',
  
  // Herramientas del usuario
  TEMPLATES: '/templates',
  FAVORITES: '/favorites',
  NOTIFICATIONS: '/notifications',
  
  // Proyectos
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id) => `/projects/${id}`,
  
  // Administración (requieren permisos específicos)
  APPROVALS: '/approvals',
  USERS: '/users',
  REPORTS: '/reports',
  
  // Inventario
  INVENTORY_RESTOCK_RULES: '/inventory/restock-rules',
  
  // Utilidades
  NOT_FOUND: '/404',
  HOME: '/',
};

/**
 * Rutas que no deben mostrar navegación
 */
export const ROUTES_WITHOUT_NAV = [
  ROUTES.CHECKOUT,
  ROUTES.RESET_PASSWORD,
];

/**
 * Rutas que no deben mostrar bottom navigation
 */
export const ROUTES_WITHOUT_BOTTOM_NAV = [
  ROUTES.CART,
];

/**
 * Configuración de rutas con sus permisos requeridos
 */
export const ROUTE_CONFIG = {
  [ROUTES.DASHBOARD]: {
    requiresAuth: true,
    permissionCheck: null, // Todos los usuarios autenticados
  },
  [ROUTES.REQUISITIONS]: {
    requiresAuth: true,
    permissionCheck: null,
  },
  [ROUTES.REQUISITIONS_NEW]: {
    requiresAuth: true,
    permissionCheck: null,
  },
  [ROUTES.APPROVALS]: {
    requiresAuth: true,
    permissionCheck: (permissions) => permissions.canApproveRequisitions,
  },
  [ROUTES.USERS]: {
    requiresAuth: true,
    permissionCheck: (permissions) => permissions.canManageUsers,
  },
  [ROUTES.PROJECTS]: {
    requiresAuth: true,
    permissionCheck: null,
  },
  [ROUTES.PRODUCTS_MANAGE]: {
    requiresAuth: true,
    permissionCheck: (permissions) => permissions.isAdmin,
  },
  [ROUTES.INVENTORY_RESTOCK_RULES]: {
    requiresAuth: true,
    permissionCheck: (permissions) => permissions.canManageRestockRules,
  },
  [ROUTES.REPORTS]: {
    requiresAuth: true,
    permissionCheck: (permissions) => permissions.isAdmin,
  },
};

/**
 * Helper para construir rutas dinámicas
 */
export const buildRoute = {
  requisitionDetail: (id) => ROUTES.REQUISITIONS_DETAIL(id),
  projectDetail: (id) => ROUTES.PROJECT_DETAIL(id),
  productDetail: (id) => ROUTES.PRODUCT_DETAIL(id),
};

/**
 * Helper para verificar si una ruta requiere permisos especiales
 */
export const requiresPermission = (path) => {
  const config = ROUTE_CONFIG[path];
  return config?.permissionCheck !== null && config?.permissionCheck !== undefined;
};

/**
 * Helper para obtener el check de permisos de una ruta
 */
export const getPermissionCheck = (path) => {
  return ROUTE_CONFIG[path]?.permissionCheck || null;
};

