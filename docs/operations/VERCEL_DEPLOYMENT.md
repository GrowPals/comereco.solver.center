# Guía de Despliegue en Vercel

## Problema: Webapp no carga (pantalla en blanco)

Si la webapp no carga en Vercel y ves una pantalla en blanco, el problema más común es que **faltan las variables de entorno**.

## Solución: Configurar Variables de Entorno en Vercel

### Paso 1: Acceder a la configuración del proyecto

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar las variables requeridas

Agrega las siguientes variables de entorno:

#### Variables Requeridas (Obligatorias)

| Variable | Valor | Entornos |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://azjaehrdzdfgrumbqmuc.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `tu_clave_anon_de_supabase` | Production, Preview, Development |

**IMPORTANTE**: Sin estas variables, la aplicación NO cargará.

#### Dónde obtener las claves de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Paso 3: Redesplegar después de configurar las variables

Después de agregar las variables de entorno:

1. Ve a la pestaña **Deployments**
2. Encuentra el último deployment
3. Haz clic en los tres puntos (⋮) → **Redeploy**
4. Selecciona **Use existing Build Cache** (opcional)
5. Haz clic en **Redeploy**

O simplemente haz un nuevo commit y push al repositorio.

## Configuración Automática

El proyecto incluye:

- ✅ `vercel.json` - Configuración de build y rutas
- ✅ `vite.config.js` - Configuración de Vite optimizada para producción
- ✅ `fix-html-order.cjs` - Script post-build para corregir orden de carga

## Verificar el Deployment

Para verificar que todo funciona:

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña **Console**
3. Si ves errores sobre variables de entorno, verifica el Paso 2
4. Si ves errores de red a Supabase, verifica que las credenciales sean correctas

## Troubleshooting

### La webapp muestra pantalla en blanco

**Causa**: Falta configurar las variables de entorno en Vercel

**Solución**: Sigue los pasos 1-3 arriba

### Error: "Variables de entorno de Supabase no configuradas"

**Causa**: Las variables `VITE_SUPABASE_URL` y/o `VITE_SUPABASE_ANON_KEY` no están configuradas

**Solución**: Agrega las variables en Vercel Settings → Environment Variables

### El build falla en Vercel

**Causa Posible 1**: Dependencias faltantes
**Solución**: Verifica que `package.json` esté completo y haz commit

**Causa Posible 2**: Errores de TypeScript/ESLint
**Solución**: Ejecuta `npm run build` localmente para verificar que no haya errores

### La webapp carga pero no funciona correctamente

**Causa**: Credenciales de Supabase incorrectas o expiradas

**Solución**:
1. Verifica que las credenciales en Vercel sean las correctas
2. Ve a Supabase Dashboard → Settings → API
3. Regenera las claves si es necesario
4. Actualiza las variables en Vercel
5. Redeploy

## Comandos Útiles (Local)

```bash
# Instalar dependencias
npm install

# Build local (para verificar que funciona)
npm run build

# Preview del build
npm run preview

# Limpiar y reconstruir
npm run build:clean
```

## Soporte

Si después de seguir esta guía el problema persiste:

1. Verifica los logs de build en Vercel
2. Revisa la consola del navegador para errores específicos
3. Confirma que las credenciales de Supabase sean válidas
