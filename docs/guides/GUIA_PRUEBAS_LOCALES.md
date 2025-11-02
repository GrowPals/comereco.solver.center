# Guía de Pruebas Locales con Supabase

## ✅ Sí, puedes probar localmente antes de desplegar

La aplicación está configurada para trabajar con Supabase en desarrollo local. Las credenciales están configuradas en `src/lib/customSupabaseClient.js` y funcionarán perfectamente en tu entorno local.

## 🚀 Cómo Probar Localmente

### Paso 1: Iniciar el servidor de desarrollo

```bash
npm run dev
```

Esto iniciará el servidor en `http://localhost:3000` (o el puerto que Vite asigne).

### Paso 2: Verificar la conexión con Supabase

1. Abre tu navegador en `http://localhost:3000`
2. Abre la consola del navegador (F12)
3. Intenta hacer login o cualquier operación que use Supabase
4. Verifica que no haya errores de conexión

### Paso 3: Probar Funcionalidades

**Autenticación:**
- ✅ Login/Logout
- ✅ Registro de usuarios
- ✅ Recuperación de contraseña

**Requisiciones:**
- ✅ Crear requisición
- ✅ Ver lista de requisiciones
- ✅ Ver detalles de requisición
- ✅ Aprobar/Rechazar (si eres supervisor)

**Catálogo:**
- ✅ Ver productos
- ✅ Buscar productos
- ✅ Filtrar por categoría
- ✅ Agregar al carrito

**Dashboard:**
- ✅ Ver estadísticas
- ✅ Ver requisiciones recientes

## 🔍 Verificar que Supabase Funciona

### En la Consola del Navegador

Busca estos mensajes:
- ✅ Sin errores de CORS
- ✅ Sin errores de autenticación
- ✅ Requests exitosos a `azjaehrdzdfgrumbqmuc.supabase.co`

### En la Red (Network Tab)

1. Abre DevTools → Network
2. Busca requests a `supabase.co`
3. Verifica que las respuestas sean `200 OK` o `201 Created`

## 📝 Checklist de Pruebas Locales

Antes de desplegar, verifica:

- [ ] El servidor inicia sin errores
- [ ] Puedes hacer login exitosamente
- [ ] Los datos se cargan desde Supabase
- [ ] Puedes crear/editar requisiciones
- [ ] Las imágenes se cargan correctamente
- [ ] El routing funciona (navegar entre páginas)
- [ ] No hay errores en la consola
- [ ] El diseño responsive funciona
- [ ] Los permisos de roles funcionan correctamente

## 🐛 Troubleshooting Local

### Error: "Cannot connect to Supabase"

**Solución:**
1. Verifica tu conexión a internet
2. Verifica que las credenciales en `customSupabaseClient.js` sean correctas
3. Verifica que tu proyecto Supabase esté activo

### Error: "CORS policy blocked"

**Solución:**
- En desarrollo local, Vite maneja CORS automáticamente
- Si persiste, verifica la configuración de CORS en tu proyecto Supabase

### Error: "Invalid API key"

**Solución:**
1. Verifica las credenciales en `src/lib/customSupabaseClient.js`
2. Asegúrate de usar la clave `anon` pública, no la secreta

### La aplicación carga pero no hay datos

**Solución:**
1. Verifica que tu proyecto Supabase tenga datos
2. Verifica que las políticas RLS (Row Level Security) permitan acceso
3. Verifica que estés autenticado si es necesario

## 🔐 Configuración de Supabase para Desarrollo

Las credenciales actuales funcionan tanto en desarrollo como en producción:

```javascript
// src/lib/customSupabaseClient.js
const supabaseUrl = 'https://azjaehrdzdfgrumbqmuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Nota:** Estas son las credenciales públicas (`anon` key) que son seguras para usar en el cliente.

## 📊 Probar Modo Producción Localmente

Para simular exactamente cómo funcionará en producción:

```bash
# 1. Construir la aplicación
npm run build

# 2. Servir la versión de producción
npm run preview
```

Esto te dará una versión optimizada y minificada, igual a la que se desplegará en Vercel.

## 🎯 Flujo Recomendado

1. **Desarrollo:** `npm run dev` → Prueba cambios rápidamente
2. **Pre-producción:** `npm run build && npm run preview` → Verifica que todo funcione igual que en producción
3. **Despliegue:** Cuando todo funcione bien localmente, despliega a Vercel

## ✅ Ventajas de Probar Localmente

- ✅ Desarrollo más rápido (hot reload)
- ✅ Debugging más fácil
- ✅ No consume recursos de despliegue
- ✅ Puedes probar sin internet (si usas datos mock)
- ✅ Puedes hacer cambios y ver resultados inmediatamente

## 🚨 Importante

**Antes de desplegar a producción:**
- [ ] Todas las pruebas locales pasan
- [ ] No hay errores en consola
- [ ] Las funcionalidades críticas funcionan
- [ ] El build de producción funciona (`npm run build`)

