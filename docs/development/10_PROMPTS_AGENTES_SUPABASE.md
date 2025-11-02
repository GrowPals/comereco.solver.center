# 🎯 10 PROMPTS PARA AGENTES - INTEGRACIÓN SUPABASE 100%

**Proyecto:** ComerECO - Sistema de Requisiciones  
**Fecha:** 2025-01-27  
**Objetivo:** Configurar integración completa con Supabase sin errores

---

## 📋 INSTRUCCIONES DE USO

Cada prompt está diseñado para ser asignado a un agente diferente. Cada agente debe:
1. Leer el prompt completo
2. Revisar los archivos mencionados
3. Verificar la base de datos usando las herramientas de Supabase MCP
4. Corregir todos los problemas encontrados
5. Documentar los cambios realizados
6. Verificar que no hay errores

---

## 🤖 PROMPT 1: AGENTE CONFIGURACIÓN BASE

```
Eres un especialista en configuración de Supabase. Tu tarea es verificar y corregir la configuración base de Supabase en el proyecto ComerECO.

CONTEXTO:
El proyecto ComerECO es un sistema de gestión de requisiciones que usa React + Vite + Supabase. 
Proyecto Supabase: azjaehrdzdfgrumbqmuc (comereco.solver.center)

TAREAS ESPECÍFICAS:

1. VERIFICAR VARIABLES DE ENTORNO:
   - Verifica que existe archivo .env en la raíz del proyecto
   - Verifica que VITE_SUPABASE_URL está configurada correctamente (debe ser: https://azjaehrdzdfgrumbqmuc.supabase.co)
   - Verifica que VITE_SUPABASE_ANON_KEY está configurada
   - Verifica que NO hay valores hardcodeados en el código
   - Crea .env.example si no existe con formato correcto

2. REVISAR CUSTOM SUPABASE CLIENT:
   - Lee el archivo src/lib/customSupabaseClient.js
   - Verifica que la configuración sigue mejores prácticas:
     * auth.persistSession = true
     * auth.autoRefreshToken = true
     * auth.detectSessionInUrl = true
     * Storage configurado correctamente
     * Real-time optimizado
   - Verifica que NO hay valores hardcodeados (debe usar import.meta.env)
   - Asegura manejo correcto de errores en desarrollo vs producción

3. VERIFICAR DOCUMENTACIÓN:
   - Verifica que docs/INSTRUCCIONES_VARIABLES_ENTORNO.md existe y está actualizada
   - Documenta cualquier cambio realizado

4. VALIDAR CONFIGURACIÓN CON SUPABASE:
   - Usa las herramientas MCP de Supabase para verificar:
     * Que el proyecto existe y está activo
     * Que las credenciales son correctas
     * Que puedes conectarte sin errores

CRITERIOS DE ÉXITO:
✅ Archivo .env existe y está configurado correctamente
✅ No hay valores hardcodeados en el código
✅ Cliente de Supabase está optimizado según mejores prácticas
✅ Documentación actualizada
✅ Conexión a Supabase funciona sin errores

ARCHIVOS A REVISAR:
- src/lib/customSupabaseClient.js
- .env (no debe estar en git)
- .env.example
- docs/INSTRUCCIONES_VARIABLES_ENTORNO.md

HERAMIENTAS DISPONIBLES:
- Acceso completo a Supabase MCP (list_projects, get_project, etc.)
- Acceso completo al código del proyecto
- Puedes crear/modificar archivos según sea necesario

AL FINALIZAR:
- Crea un resumen de los cambios realizados
- Indica si hay problemas que requieren atención del usuario
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 2: AGENTE AUTENTICACIÓN Y PERFILES

```
Eres un especialista en autenticación y gestión de perfiles con Supabase. Tu tarea es verificar y corregir todo el sistema de autenticación y perfiles de usuario en ComerECO.

CONTEXTO:
El proyecto usa Supabase Auth con perfiles en la tabla profiles. Los usuarios pertenecen a una compañía (companies) y tienen roles (role_v2: admin/supervisor/user).

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR SUPABASE AUTH CONTEXT:
   - Lee src/contexts/SupabaseAuthContext.jsx
   - Verifica que fetchUserProfile funciona correctamente:
     * Carga el perfil desde profiles
     * Carga la compañía desde companies (consulta separada, NO embed ambiguo)
     * Maneja errores correctamente (NO hacer signOut automático)
   - Verifica que se usa role_v2 (NO role legacy)
   - Asegura que la sesión persiste correctamente
   - Verifica que autoRefreshToken funciona

2. VERIFICAR LOGIN PAGE:
   - Lee src/pages/Login.jsx
   - Verifica que el login funciona correctamente
   - Verifica que después del login se carga el perfil inmediatamente
   - Verifica que la redirección funciona correctamente
   - Asegura manejo correcto de errores de autenticación

3. VERIFICAR SERVICIOS DE AUTENTICACIÓN:
   - Lee src/services/authService.js y src/services/userService.js
   - Verifica que todas las funciones funcionan correctamente
   - Asegura que se valida sesión antes de hacer queries

4. VALIDAR ESTRUCTURA DE BASE DE DATOS:
   - Usa Supabase MCP para verificar:
     * Tabla profiles existe con campos: id, company_id, full_name, avatar_url, role_v2
     * Tabla companies existe con campos: id, name, bind_location_id, bind_price_list_id
     * Relación profiles.company_id → companies.id existe
     * RLS está habilitado en ambas tablas

5. CORREGIR PROBLEMAS CONOCIDOS:
   - Si hay errores 500 por embeds ambiguos, usar consultas separadas
   - Asegurar que NO se usa profiles.role (legacy), solo role_v2
   - Verificar que los usuarios solo ven datos de su compañía (RLS)

CRITERIOS DE ÉXITO:
✅ Login funciona sin errores
✅ Perfiles se cargan correctamente con compañía
✅ Sesión persiste correctamente
✅ No hay errores 500 en consola
✅ No hay embeds ambiguos
✅ Se usa role_v2 (no role legacy)
✅ RLS funciona correctamente

ARCHIVOS A REVISAR:
- src/contexts/SupabaseAuthContext.jsx
- src/pages/Login.jsx
- src/services/authService.js
- src/services/userService.js

PRUEBAS A REALIZAR:
1. Iniciar sesión con un usuario válido
2. Verificar que el perfil se carga con la compañía
3. Verificar que la sesión persiste al recargar
4. Verificar que solo se ven datos de la compañía del usuario

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos que requieren corrección
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 3: AGENTE PRODUCTOS Y CATÁLOGO

```
Eres un especialista en gestión de productos y catálogos. Tu tarea es verificar y corregir todo el sistema de productos en ComerECO.

CONTEXTO:
El sistema tiene un catálogo de productos que se filtran por compañía. Los productos tienen categorías, precios, stock, etc.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR PRODUCT SERVICE:
   - Lee src/services/productService.js
   - Verifica que fetchProducts:
     * Filtra automáticamente por company_id (RLS)
     * Valida sesión antes de hacer queries
     * Filtra solo productos activos (is_active = true)
     * Maneja paginación correctamente
   - Verifica búsqueda de productos (filtros, categorías)

2. VERIFICAR FUNCIÓN RPC DE CATEGORÍAS:
   - Verifica que get_unique_product_categories se llama correctamente
   - Usa Supabase MCP para verificar que la función existe:
     * Nombre: get_unique_product_categories
     * Parámetro: p_company_id UUID
     * Retorna: TABLE(category TEXT)
   - Asegura que se pasa el parámetro p_company_id correctamente
   - Verifica que solo retorna categorías de productos activos

3. VALIDAR ESTRUCTURA DE BASE DE DATOS:
   - Usa Supabase MCP para verificar tabla products:
     * Campos: id, company_id, sku, name, description, price, stock, unit, category, image_url, is_active
     * RLS está habilitado
     * Índices en company_id, is_active, category
     * Foreign key: products.company_id → companies.id

4. VERIFICAR COMPONENTES DE PRODUCTOS:
   - Busca componentes que usan productos (catálogo, búsqueda)
   - Verifica que manejan correctamente:
     * Lista vacía de productos
     * Errores de carga
     * Imágenes que no cargan
     * Productos sin stock

5. CORREGIR PROBLEMAS CONOCIDOS:
   - Asegurar que siempre se valida sesión antes de queries
   - Verificar que RLS filtra automáticamente por company_id
   - Asegurar que solo productos activos se muestran

CRITERIOS DE ÉXITO:
✅ Productos se muestran filtrados por compañía
✅ Solo productos activos se muestran
✅ Búsqueda funciona correctamente
✅ Categorías se cargan sin errores
✅ RPC get_unique_product_categories funciona correctamente
✅ Imágenes se cargan correctamente
✅ Manejo correcto de errores

ARCHIVOS A REVISAR:
- src/services/productService.js
- Componentes que usan productos (buscar en src/components y src/pages)

PRUEBAS A REALIZAR:
1. Cargar lista de productos (debe filtrar por compañía)
2. Buscar productos por nombre/SKU
3. Filtrar por categoría
4. Verificar que productos inactivos NO se muestran
5. Verificar que categorías se cargan correctamente

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos o funciones RPC
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 4: AGENTE SISTEMA DE REQUISICIONES (CORE)

```
Eres un especialista en sistemas de requisiciones. Tu tarea es verificar y corregir TODO el sistema de requisiciones en ComerECO. Esta es una tarea CRÍTICA.

CONTEXTO:
El sistema gestiona requisiciones de compra con estados (business_status, integration_status). Hay una inconsistencia conocida entre created_by y requester_id.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. RESOLVER INCONSISTENCIA created_by vs requester_id:
   - PROBLEMA CRÍTICO: El código usa created_by pero algunos lugares esperan requester_id
   - Usa Supabase MCP para verificar tabla requisitions:
     * ¿Qué campo existe realmente: created_by o requester_id?
     * Verifica la estructura real de la tabla
   - CORREGIR el código para usar el campo correcto consistentemente
   - Actualiza todos los servicios que usan requisiciones

2. VERIFICAR REQUISITION SERVICE:
   - Lee src/services/requisitionService.js completamente
   - Verifica fetchRequisitions:
     * Usa el campo correcto (created_by o requester_id)
     * Evita embeds ambiguos (usa consultas separadas)
     * Filtra por company_id correctamente
     * Maneja paginación y ordenamiento
   - Verifica fetchRequisitionDetails:
     * Carga todos los datos necesarios
     * Carga items desde requisition_items (tabla separada)
     * Carga datos del requester (consulta separada)
     * Carga datos del proyecto (consulta separada)
     * NO usa embeds ambiguos

3. VERIFICAR FUNCIÓN RPC create_full_requisition:
   - Usa Supabase MCP para verificar que existe:
     * Nombre: create_full_requisition
     * Parámetros: p_comments TEXT, p_items JSONB
     * Retorna: UUID (ID de la requisición creada)
   - Verifica que el código llama la función correctamente
   - Verifica que los items se transforman al formato correcto antes de llamar RPC
   - Verifica que internal_folio se genera automáticamente

4. VERIFICAR ESTADOS DE REQUISICIÓN:
   - Verifica que business_status acepta: draft, submitted, approved, rejected, ordered, cancelled
   - Verifica que integration_status acepta: draft, pending_sync, syncing, synced, rejected, cancelled
   - Verifica que las actualizaciones de estado funcionan correctamente

5. VALIDAR ESTRUCTURA DE BASE DE DATOS:
   - Usa Supabase MCP para verificar tabla requisitions:
     * Campos: id, company_id, internal_folio, total_amount, business_status, integration_status, created_by, approved_by, project_id, etc.
     * Foreign keys: created_by → profiles.id, approved_by → profiles.id, project_id → projects.id
     * RLS habilitado
     * Índices en: company_id, created_by, business_status, project_id

6. VERIFICAR COMPONENTES:
   - Revisa src/pages/RequisitionDetail.jsx
   - Revisa src/pages/Requisitions.jsx
   - Verifica que muestran los datos correctamente
   - Verifica que manejan errores correctamente

7. CORREGIR PROBLEMAS CONOCIDOS:
   - ❌ Embeds ambiguos que causan errores 500 → Usar consultas separadas
   - ❌ Falta de filtrado por company_id → Agregar filtrado explícito
   - ❌ Inconsistencia created_by vs requester_id → Unificar

CRITERIOS DE ÉXITO:
✅ Lista de requisiciones carga sin errores
✅ Detalles de requisición muestran todos los datos
✅ Crear requisición funciona correctamente
✅ Estados se actualizan correctamente
✅ NO hay errores 500 por joins ambiguos
✅ Campo correcto usado consistentemente (created_by o requester_id)
✅ RLS funciona correctamente

ARCHIVOS A REVISAR:
- src/services/requisitionService.js
- src/pages/RequisitionDetail.jsx
- src/pages/Requisitions.jsx
- src/services/dashboardService.js (si usa requisiciones)

PRUEBAS A REALIZAR:
1. Listar requisiciones (debe filtrar por compañía)
2. Ver detalle de requisición (debe mostrar todos los datos)
3. Crear requisición desde carrito
4. Actualizar estado de requisición
5. Verificar que no hay errores 500

AL FINALIZAR:
- Documenta TODOS los cambios realizados
- Indica claramente qué campo se usa (created_by o requester_id)
- Indica si hay problemas con la base de datos que requieren corrección
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 5: AGENTE ITEMS DE REQUISICIONES

```
Eres un especialista en gestión de items de requisiciones. Tu tarea es verificar y corregir el sistema de items de requisiciones en ComerECO.

CONTEXTO:
Los items de requisiciones están en una tabla separada (requisition_items), no como JSONB en requisitions. Cada item tiene relación con un producto.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR TABLA requisition_items:
   - Usa Supabase MCP para verificar estructura:
     * Campos: id, requisition_id, product_id, quantity, unit_price, subtotal
     * Foreign keys: requisition_id → requisitions.id (CASCADE), product_id → products.id
     * RLS habilitado
     * Constraints: quantity > 0

2. VERIFICAR CREACIÓN DE ITEMS:
   - Verifica que al crear requisición, los items se crean correctamente:
     * En requisition_items (tabla separada)
     * Con los campos correctos (quantity, unit_price, subtotal)
     * Con relación correcta a requisition_id y product_id
   - Verifica que la función RPC create_full_requisition crea los items correctamente

3. VERIFICAR CÁLCULOS:
   - Verifica que subtotal = quantity * unit_price
   - Verifica que total_amount en requisitions = suma de subtotales
   - Verifica que los cálculos se hacen correctamente al crear/actualizar items

4. VERIFICAR JOINS CON PRODUCTOS:
   - Verifica que al cargar items, se hace join con products:
     * Consulta separada (NO embed ambiguo)
     * Se obtienen: name, sku, image_url, unit del producto
   - Verifica que se maneja correctamente si el producto fue eliminado

5. VERIFICAR ACTUALIZACIÓN DE ITEMS:
   - Verifica que se pueden actualizar items de requisiciones en borrador
   - Verifica que quantity siempre es positiva
   - Verifica que los cálculos se actualizan al cambiar cantidad/precio

6. VERIFICAR ELIMINACIÓN:
   - Verifica que al eliminar requisición, los items se eliminan (CASCADE)
   - Verifica que se puede eliminar un item individual

7. VERIFICAR CÓDIGO:
   - Busca en requisitionService.js todas las funciones que manejan items
   - Verifica que usan la tabla requisition_items (NO el campo items JSONB)
   - Verifica que los joins se hacen correctamente

CRITERIOS DE ÉXITO:
✅ Items se crean correctamente al crear requisición
✅ Cálculos de subtotales y totales son correctos
✅ Joins con productos funcionan sin errores
✅ Items se muestran correctamente en detalles
✅ Actualización de items funciona
✅ Eliminación funciona correctamente (CASCADE)

ARCHIVOS A REVISAR:
- src/services/requisitionService.js (secciones de items)
- Componentes que muestran items de requisiciones

PRUEBAS A REALIZAR:
1. Crear requisición con items (verificar que se crean en requisition_items)
2. Ver detalles de requisición (verificar que items se cargan con datos de productos)
3. Actualizar cantidad de item (verificar que cálculos se actualizan)
4. Eliminar requisición (verificar que items se eliminan)

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 6: AGENTE CARRITO Y FAVORITOS

```
Eres un especialista en carritos de compras y sistemas de favoritos. Tu tarea es verificar y corregir el sistema de carrito y favoritos en ComerECO.

CONTEXTO:
El sistema tiene un carrito de compras (user_cart_items) y favoritos (user_favorites) por usuario.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR TABLA user_cart_items:
   - Usa Supabase MCP para verificar estructura:
     * Campos: user_id, product_id, quantity, created_at, updated_at
     * Primary key: (user_id, product_id)
     * Foreign keys: user_id → profiles.id, product_id → products.id
     * RLS habilitado
     * Constraint: quantity > 0

2. VERIFICAR FUNCIONES DE CARRITO:
   - Busca servicios que manejan el carrito
   - Verifica que se puede:
     * Agregar producto al carrito (UPSERT)
     * Actualizar cantidad (si ya existe)
     * Eliminar producto del carrito
     * Obtener carrito del usuario autenticado
   - Verifica que solo el usuario autenticado ve su carrito

3. VERIFICAR FUNCIÓN RPC clear_user_cart:
   - Usa Supabase MCP para verificar que existe:
     * Nombre: clear_user_cart
     * Sin parámetros (usa auth.uid())
     * Retorna: JSONB con success
   - Verifica que el código llama la función correctamente

4. VERIFICAR TABLA user_favorites:
   - Usa Supabase MCP para verificar estructura:
     * Campos: user_id, product_id, created_at
     * Primary key: (user_id, product_id)
     * Foreign keys: user_id → profiles.id, product_id → products.id
     * RLS habilitado

5. VERIFICAR FUNCIONES DE FAVORITOS:
   - Verifica que se puede:
     * Agregar producto a favoritos
     * Eliminar producto de favoritos
     * Obtener favoritos del usuario
   - Verifica que solo el usuario autenticado ve sus favoritos

6. VERIFICAR JOINS CON PRODUCTOS:
   - Verifica que al cargar carrito/favoritos, se hace join con products:
     * Consulta separada o embed correcto
     * Se obtienen todos los datos necesarios del producto

7. VERIFICAR MANEJO DE ERRORES:
   - Verifica que se maneja correctamente:
     * Producto eliminado del catálogo
     * Usuario no autenticado
     * Producto no encontrado

CRITERIOS DE ÉXITO:
✅ Agregar al carrito funciona (UPSERT)
✅ Actualizar cantidad funciona
✅ Eliminar del carrito funciona
✅ Vaciar carrito funciona (RPC)
✅ Agregar/eliminar favoritos funciona
✅ Solo usuario autenticado ve su carrito/favoritos
✅ Joins con productos funcionan
✅ Manejo correcto de errores

ARCHIVOS A REVISAR:
- Servicios que manejan carrito (buscar en src/services)
- Servicios que manejan favoritos (buscar en src/services)
- Componentes de carrito y favoritos

PRUEBAS A REALIZAR:
1. Agregar producto al carrito
2. Actualizar cantidad en carrito
3. Eliminar producto del carrito
4. Vaciar carrito completo
5. Agregar/eliminar favoritos
6. Verificar que solo se ven propios datos

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos o funciones RPC
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 7: AGENTE PLANTILLAS DE REQUISICIONES

```
Eres un especialista en sistemas de plantillas. Tu tarea es verificar y corregir el sistema de plantillas de requisiciones en ComerECO.

CONTEXTO:
Los usuarios pueden crear plantillas de requisiciones que guardan items predefinidos. Las plantillas tienen un contador de uso y fecha de último uso.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR TABLA requisition_templates:
   - Usa Supabase MCP para verificar estructura:
     * Campos: id, user_id, company_id, project_id, name, description, items (JSONB), is_favorite, usage_count, last_used_at, created_at, updated_at
     * Foreign keys: user_id → profiles.id, company_id → companies.id, project_id → projects.id
     * RLS habilitado

2. VERIFICAR TEMPLATE SERVICE:
   - Lee src/services/templateService.js
   - Verifica que getTemplates:
     * Filtra por user_id del usuario autenticado
     * Filtra por company_id (RLS)
     * Ordena por is_favorite, last_used_at, created_at
   - Verifica que se puede crear/editar/eliminar plantillas

3. VERIFICAR FUNCIÓN RPC use_requisition_template:
   - Usa Supabase MCP para verificar que existe:
     * Nombre: use_requisition_template
     * Parámetro: p_template_id UUID
     * Retorna: UUID (ID de la requisición creada)
     * Debe incrementar usage_count y actualizar last_used_at
   - Verifica que el código llama la función correctamente

4. VERIFICAR ESTRUCTURA JSONB items:
   - Verifica que items tiene estructura correcta:
     * Array de objetos con: product_id, quantity, unit_price, product_name
     * O estructura que espera create_full_requisition
   - Verifica que se valida la estructura al crear/editar plantilla

5. VERIFICAR FUNCIONALIDADES:
   - Verifica que is_favorite funciona para marcar favoritas
   - Verifica que usage_count se incrementa al usar plantilla
   - Verifica que last_used_at se actualiza al usar plantilla
   - Verifica que se puede filtrar por proyecto

6. VERIFICAR PERMISOS:
   - Verifica que usuarios solo ven sus propias plantillas
   - Verifica que pueden crear/editar/eliminar sus plantillas
   - Verifica RLS funciona correctamente

CRITERIOS DE ÉXITO:
✅ Lista de plantillas carga correctamente
✅ Crear plantilla funciona
✅ Editar plantilla funciona
✅ Eliminar plantilla funciona
✅ Usar plantilla crea requisición correctamente
✅ Contador de uso se actualiza
✅ Fecha de último uso se actualiza
✅ Favoritos funcionan
✅ Solo se ven propias plantillas

ARCHIVOS A REVISAR:
- src/services/templateService.js
- Componentes que usan plantillas

PRUEBAS A REALIZAR:
1. Crear plantilla con items
2. Listar plantillas (solo propias)
3. Usar plantilla (debe crear requisición y actualizar contador)
4. Marcar como favorita
5. Eliminar plantilla

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos o funciones RPC
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 8: AGENTE SISTEMA DE NOTIFICACIONES

```
Eres un especialista en sistemas de notificaciones. Tu tarea es verificar y corregir el sistema de notificaciones en ComerECO. Esta es una tarea CRÍTICA.

CONTEXTO:
El sistema tiene notificaciones en tiempo real que se filtran por usuario. Cada usuario solo debe ver sus propias notificaciones.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR TABLA notifications:
   - Usa Supabase MCP para verificar estructura:
     * Campos: id, user_id, company_id, type, title, message, link, is_read, created_at
     * Foreign keys: user_id → profiles.id, company_id → companies.id
     * RLS habilitado
     * Índices en: user_id, is_read, created_at

2. VERIFICAR NOTIFICATION SERVICE:
   - Lee src/services/notificationService.js
   - PROBLEMA CRÍTICO: Verifica que getNotifications:
     * Filtra por user_id del usuario autenticado (EXPLÍCITAMENTE)
     * NO retorna todas las notificaciones
     * Valida sesión antes de hacer queries
   - Verifica que se puede marcar como leída (is_read)
   - Verifica que se ordena por created_at desc

3. VERIFICAR SUSCRIPCIONES REAL-TIME:
   - Verifica que las suscripciones real-time funcionan:
     * Filtran por user_id correctamente
     * Solo escuchan notificaciones del usuario autenticado
     * Se manejan correctamente los eventos INSERT
   - Verifica que se limpian las suscripciones al desmontar componente

4. VERIFICAR TIPOS DE NOTIFICACIÓN:
   - Verifica que type acepta: success, warning, danger, info
   - Verifica que se muestran correctamente según tipo

5. VERIFICAR FUNCIONALIDADES:
   - Verifica que link funciona para redirección
   - Verifica que se puede crear notificación desde el sistema
   - Verifica que se cuenta correctamente notificaciones no leídas

6. VERIFICAR PERMISOS:
   - Verifica que usuarios solo ven sus propias notificaciones (RLS)
   - Verifica que pueden actualizar solo sus propias notificaciones

CRITERIOS DE ÉXITO:
✅ Solo se muestran notificaciones del usuario autenticado
✅ Marcar como leída funciona
✅ Real-time funciona (nuevas notificaciones aparecen automáticamente)
✅ Tipos de notificación se muestran correctamente
✅ Links funcionan correctamente
✅ Contador de no leídas funciona
✅ RLS funciona correctamente

ARCHIVOS A REVISAR:
- src/services/notificationService.js
- Componentes que muestran notificaciones

PRUEBAS A REALIZAR:
1. Cargar notificaciones (solo propias)
2. Marcar como leída
3. Verificar real-time (crear notificación desde otro lugar)
4. Verificar contador de no leídas
5. Verificar links funcionan

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos o RLS
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 9: AGENTE PROYECTOS Y MIEMBROS

```
Eres un especialista en gestión de proyectos y equipos. Tu tarea es verificar y corregir el sistema de proyectos y miembros en ComerECO.

CONTEXTO:
El sistema tiene proyectos que pertenecen a compañías. Los usuarios pueden ser miembros de proyectos con diferentes roles. Los supervisores gestionan proyectos.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR TABLA projects:
   - Usa Supabase MCP para verificar estructura:
     * Campos: id, company_id, name, description, status, supervisor_id, created_by, active, created_at, updated_at
     * Foreign keys: company_id → companies.id, supervisor_id → profiles.id, created_by → profiles.id
     * RLS habilitado
     * Índices en: company_id, supervisor_id, active

2. VERIFICAR TABLA project_members:
   - Usa Supabase MCP para verificar estructura:
     * Campos: project_id, user_id, role_in_project, added_at
     * Primary key: (project_id, user_id)
     * Foreign keys: project_id → projects.id, user_id → profiles.id
     * RLS habilitado

3. VERIFICAR PROJECT SERVICE:
   - Lee src/services/projectService.js
   - Verifica que fetchProjects:
     * Filtra por company_id (RLS)
     * Solo muestra proyectos donde el usuario es miembro o supervisor
     * Valida sesión antes de hacer queries
   - Verifica que se puede crear/editar/eliminar proyectos

4. VERIFICAR GESTIÓN DE MIEMBROS:
   - Verifica que se puede:
     * Agregar miembros a proyecto
     * Eliminar miembros de proyecto
     * Actualizar rol en proyecto (role_in_project)
   - Verifica que solo supervisores/admins pueden gestionar miembros

5. VERIFICAR PERMISOS:
   - Verifica que usuarios solo ven proyectos donde son miembros
   - Verifica que supervisores ven proyectos asignados (supervisor_id)
   - Verifica que admins ven todos los proyectos de su compañía
   - Verifica RLS funciona correctamente

6. VERIFICAR RELACIÓN CON REQUISICIONES:
   - Verifica que las requisiciones se vinculan correctamente a proyectos
   - Verifica que se puede filtrar requisiciones por proyecto

CRITERIOS DE ÉXITO:
✅ Lista de proyectos carga correctamente
✅ Filtrado por compañía funciona
✅ Solo se ven proyectos donde usuario es miembro
✅ Crear/editar/eliminar proyectos funciona
✅ Gestión de miembros funciona
✅ Permisos funcionan según rol
✅ Supervisores ven proyectos asignados
✅ RLS funciona correctamente

ARCHIVOS A REVISAR:
- src/services/projectService.js
- Componentes de gestión de proyectos

PRUEBAS A REALIZAR:
1. Listar proyectos (solo donde es miembro)
2. Crear proyecto
3. Agregar miembros a proyecto
4. Verificar que supervisor ve proyectos asignados
5. Verificar permisos de edición

AL FINALIZAR:
- Documenta todos los cambios realizados
- Indica si hay problemas con la base de datos o RLS
- Verifica que no hay errores de linting
```

---

## 🤖 PROMPT 10: AGENTE RLS, FUNCIONES RPC Y OPTIMIZACIONES

```
Eres un especialista en seguridad, funciones RPC y optimización de bases de datos. Tu tarea es verificar y optimizar RLS, funciones RPC y performance en ComerECO. Esta es una tarea CRÍTICA.

CONTEXTO:
El sistema debe tener RLS correctamente configurado, funciones RPC funcionando y queries optimizados. Esta es la revisión final de seguridad y performance.

PROYECTO SUPABASE: azjaehrdzdfgrumbqmuc

TAREAS ESPECÍFICAS:

1. VERIFICAR POLÍTICAS RLS:
   - Usa Supabase MCP para verificar RLS en todas las tablas:
     * profiles: Solo ven su propio perfil y perfiles de su compañía
     * products: Solo ven productos de su compañía
     * requisitions: Solo ven requisiciones de su compañía (y según rol)
     * requisition_items: Solo ven items de requisiciones que pueden ver
     * user_cart_items: Solo ven su propio carrito
     * user_favorites: Solo ven sus propios favoritos
     * notifications: Solo ven sus propias notificaciones
     * projects: Solo ven proyectos de su compañía donde son miembros
     * project_members: Solo ven miembros de proyectos que pueden ver
     * requisition_templates: Solo ven sus propias plantillas
   - Verifica que las políticas permiten las operaciones necesarias (SELECT, INSERT, UPDATE, DELETE)

2. VERIFICAR FUNCIONES RPC:
   - Usa Supabase MCP para verificar que existen todas las funciones:
     * create_full_requisition(p_comments TEXT, p_items JSONB) → UUID
     * use_requisition_template(p_template_id UUID) → UUID
     * broadcast_to_company(p_event_name TEXT, p_payload JSONB) → JSONB
     * clear_user_cart() → JSONB
     * get_unique_product_categories(p_company_id UUID) → TABLE(category TEXT)
   - Verifica que cada función:
     * Tiene los parámetros correctos
     * Retorna el tipo correcto
     * Verifica permisos (auth.uid())
     * Maneja errores correctamente
   - Verifica que el código las llama correctamente

3. VERIFICAR ÍNDICES:
   - Usa Supabase MCP para verificar índices en:
     * products: company_id, is_active, category, name (búsqueda)
     * requisitions: company_id, created_by, business_status, project_id, created_at
     * requisition_items: requisition_id, product_id
     * user_cart_items: user_id, (user_id, product_id) único
     * notifications: user_id, is_read, created_at
     * profiles: company_id, role_v2
     * projects: company_id, supervisor_id, active
   - Verifica que los índices mejoran performance de queries frecuentes

4. VERIFICAR INTEGRIDAD REFERENCIAL:
   - Verifica foreign keys tienen CASCADE/RESTRICT correctos:
     * requisition_items.requisition_id → requisitions.id (CASCADE DELETE)
     * requisition_items.product_id → products.id (RESTRICT)
     * user_cart_items.product_id → products.id (RESTRICT)
     * profiles.company_id → companies.id (RESTRICT)

5. VERIFICAR OPTIMIZACIONES:
   - Verifica que no hay queries N+1
   - Verifica que se usa paginación donde es necesario
   - Verifica que se evitan embeds ambiguos
   - Verifica que se valida sesión antes de queries
   - Verifica que se filtran datos temprano (company_id, user_id)

6. VERIFICAR SUSCRIPCIONES REAL-TIME:
   - Verifica que las suscripciones:
     * Filtran correctamente por user_id/company_id
     * Se limpian al desmontar componentes
     * Manejan errores correctamente

7. VERIFICAR LOGGING Y DEBUGGING:
   - Verifica que hay logging adecuado para debugging
   - Verifica que los errores se manejan correctamente
   - Verifica que los mensajes de error son útiles

CRITERIOS DE ÉXITO:
✅ RLS funciona correctamente (usuarios solo ven sus datos)
✅ Todas las funciones RPC funcionan sin errores
✅ Índices mejoran performance
✅ No hay errores de integridad referencial
✅ Real-time funciona correctamente
✅ No hay queries N+1
✅ Performance es óptima
✅ Logging adecuado para debugging

ARCHIVOS A REVISAR:
- Todos los servicios (src/services/*.js)
- Todos los componentes que hacen queries
- Configuración de Supabase

PRUEBAS A REALIZAR:
1. Verificar que usuarios solo ven datos de su compañía
2. Probar todas las funciones RPC
3. Verificar performance de queries frecuentes
4. Verificar real-time funciona
5. Verificar que no hay errores de seguridad

AL FINALIZAR:
- Crea un reporte completo de:
  * Políticas RLS verificadas
  * Funciones RPC verificadas
  * Índices verificados/creados
  * Optimizaciones aplicadas
  * Problemas encontrados y corregidos
- Indica si hay problemas que requieren atención del usuario
- Verifica que no hay errores de linting
```

---

## 📝 NOTAS FINALES

1. **Orden de ejecución recomendado:**
   - Primero: Agentes 1, 2, 4 (críticos)
   - Segundo: Agentes 3, 5, 8, 9 (altos)
   - Tercero: Agentes 6, 7 (medios)
   - Final: Agente 10 (optimización final)

2. **Comunicación entre agentes:**
   - Si un agente encuentra un problema que afecta a otro, debe documentarlo claramente
   - Los agentes deben verificar que sus cambios no rompen funcionalidad de otros

3. **Verificación final:**
   - Después de completar todos los prompts, ejecutar el checklist final del plan
   - Probar todas las funcionalidades principales
   - Verificar que no hay errores en consola

---

**Documento creado:** 2025-01-27  
**Versión:** 1.0  
**Autor:** Sistema de Integración Supabase ComerECO

