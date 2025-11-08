# 🚀 GUÍA DE MEJORES PRÁCTICAS - INTEGRACIÓN SUPABASE

## 📋 Principios Fundamentales

### 1. **Siempre Validar Sesión**
```javascript
// ✅ CORRECTO
const { data: { session }, error } = await supabase.auth.getSession();
if (error || !session) {
    throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
}

// ❌ INCORRECTO
const { data } = await supabase.from('products').select('*');
```

### 2. **Usar role_v2, NO role**
```javascript
// ✅ CORRECTO
const userRole = user?.role_v2; // 'admin' | 'supervisor' | 'user'

// ❌ INCORRECTO
const userRole = user?.role; // Legacy, no usar
```

### 3. **Evitar Embeds Ambiguos**
```javascript
// ✅ CORRECTO - Consultas separadas
const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id, full_name, role_v2')
    .eq('id', user.id)
    .single();

const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', profile.company_id)
    .single();

// ✅ CORRECTO - Embed cuando PostgREST infiere por FK
const { data } = await supabase
    .from('requisitions')
    .select(`
        *,
        creator:created_by ( full_name, avatar_url ),
        project:project_id ( name )
    `);

// ❌ INCORRECTO - Embed ambiguo
const { data } = await supabase
    .from('profiles')
    .select(`*, company:companies(*)`); // Puede causar error 500
```

### 4. **Confiar en RLS para Filtrado**
```javascript
// ✅ CORRECTO - RLS filtra automáticamente por company_id
const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);
// RLS ya filtra por company_id del usuario autenticado

// ❌ INCORRECTO - Filtro manual innecesario
const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
const { data } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', profile.company_id); // RLS ya lo hace
```

### 5. **Establecer Campos Requeridos en Updates**
```javascript
// ✅ CORRECTO - Aprobar requisición
const updateData = {
    business_status: 'approved',
    approved_by: user.id, // ✅ Campo requerido
    updated_at: new Date().toISOString(),
};

// ✅ CORRECTO - Rechazar requisición
const updateData = {
    business_status: 'rejected',
    rejection_reason: reason,
    rejected_at: new Date().toISOString(), // ✅ Campo requerido
    updated_at: new Date().toISOString(),
};
```

---

## 🔧 Helpers Recomendados

### 1. **Helper de Autenticación**
```javascript
// src/utils/supabaseHelpers.js
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Valida que exista una sesión activa
 * @throws {Error} Si no hay sesión válida
 * @returns {Promise<Session>} La sesión válida
 */
export const ensureAuthenticated = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }
    return session;
};

/**
 * Valida que exista un usuario autenticado
 * @throws {Error} Si no hay usuario autenticado
 * @returns {Promise<User>} El usuario autenticado
 */
export const ensureAuthenticatedUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("Usuario no autenticado.");
    }
    return user;
};

/**
 * Obtiene el company_id del usuario actual
 * @throws {Error} Si no hay usuario o perfil
 * @returns {Promise<string>} El company_id
 */
export const getCurrentUserCompanyId = async () => {
    const user = await ensureAuthenticatedUser();
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
    
    if (error || !profile) {
        throw new Error("No se pudo obtener el perfil del usuario.");
    }
    
    return profile.company_id;
};
```

### 2. **Helper de Roles**
```javascript
// src/utils/roleHelpers.js (ya existe, pero mejorado)

/**
 * Verifica si el usuario tiene uno de los roles requeridos
 * @param {object} user - Objeto de usuario con role_v2
 * @param {Array<string>} requiredRoles - Roles requeridos ('admin' | 'supervisor' | 'user')
 * @returns {boolean}
 */
export const userHasRole = (user, requiredRoles) => {
    if (!user?.role_v2 || !Array.isArray(requiredRoles)) {
        return false;
    }
    return requiredRoles.includes(user.role_v2);
};

/**
 * Verifica si el usuario es admin
 */
export const isAdmin = (user) => user?.role_v2 === 'admin';

/**
 * Verifica si el usuario es supervisor o admin
 */
export const isSupervisorOrAdmin = (user) => {
    const role = user?.role_v2;
    return role === 'supervisor' || role === 'admin';
};
```

---

## 📊 Estructura de Datos Esperada

### Perfil de Usuario
```javascript
{
    id: "uuid",
    company_id: "uuid",
    full_name: "string",
    avatar_url: "string | null",
    role_v2: "admin" | "supervisor" | "user", // ✅ Usar este
    role: "employee" | "admin_corp" | "super_admin", // ❌ Legacy, no usar
    updated_at: "timestamp"
}
```

### Requisición
```javascript
{
    id: "uuid",
    company_id: "uuid",
    project_id: "uuid | null",
    internal_folio: "string",
    total_amount: "number",
    business_status: "draft" | "submitted" | "approved" | "rejected" | "ordered" | "cancelled",
    integration_status: "draft" | "pending_sync" | "syncing" | "synced" | "rejected" | "cancelled",
    created_by: "uuid", // ✅ Campo correcto
    approved_by: "uuid | null",
    rejected_at: "timestamp | null",
    rejection_reason: "string | null",
    items: "jsonb", // Array de items
    created_at: "timestamp",
    updated_at: "timestamp"
}
```

### Producto
```javascript
{
    id: "uuid",
    company_id: "uuid", // RLS filtra automáticamente
    bind_id: "string",
    sku: "string",
    name: "string",
    description: "string | null",
    price: "number",
    stock: "number",
    unit: "string | null",
    category: "string | null",
    image_url: "string | null",
    is_active: "boolean",
    bind_last_synced_at: "timestamp | null"
}
```

---

## ⚠️ Errores Comunes y Soluciones

### Error 1: "Embed alias ambiguous"
**Problema**: `company:companies(*)` causa error 500

**Solución**: Usar consultas separadas
```javascript
// ❌ INCORRECTO
.select(`*, company:companies(*)`)

// ✅ CORRECTO
// Primero obtener perfil
const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id, ...')
    .single();

// Luego obtener empresa
const { data: company } = await supabase
    .from('companies')
    .select('id, name, ...')
    .eq('id', profile.company_id)
    .single();
```

### Error 2: "Cannot read property 'role' of undefined"
**Problema**: Usar `user.role` en lugar de `user.role_v2`

**Solución**: Usar `user.role_v2`
```javascript
// ❌ INCORRECTO
if (user.role === 'admin') { ... }

// ✅ CORRECTO
if (user.role_v2 === 'admin') { ... }
```

### Error 3: "RLS policy violation"
**Problema**: Query no incluye filtros necesarios o usuario no tiene permisos

**Solución**: 
- Verificar que el usuario esté autenticado
- Verificar que RLS esté configurado correctamente
- Usar `getSession()` antes de queries

### Error 4: "approved_by is null"
**Problema**: No se establece `approved_by` al aprobar

**Solución**: Añadir `approved_by` en update
```javascript
// ✅ CORRECTO
if (status === 'approved') {
    updateData.approved_by = user.id;
}
```

---

## 🎯 Checklist para Nuevos Servicios

Al crear un nuevo servicio, verificar:

- [ ] ¿Valida sesión antes de hacer queries?
- [ ] ¿Usa `role_v2` en lugar de `role`?
- [ ] ¿Evita embeds ambiguos?
- [ ] ¿Confía en RLS para filtrado por `company_id`?
- [ ] ¿Maneja errores correctamente?
- [ ] ¿Establece campos requeridos en updates (ej: `approved_by`, `rejected_at`)?
- [ ] ¿Usa tipos correctos según el esquema de BD?

---

## 📚 Referencias

- `docs/REFERENCIA_TECNICA_BD_SUPABASE.md` - Esquema completo de BD
- `docs/CORRECCIONES_SUPABASE.md` - Correcciones aplicadas
- `docs/AUDITORIA_BD_SUPABASE.md` - Auditoría de BD

---

**Última actualización**: 2025-01-26

