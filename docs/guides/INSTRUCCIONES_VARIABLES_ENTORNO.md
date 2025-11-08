# INSTRUCCIONES PARA CONFIGURAR VARIABLES DE ENTORNO

## ✅ CONFIGURACIÓN ACTUALIZADA

El archivo `src/lib/customSupabaseClient.js` ha sido configurado correctamente según mejores prácticas:
- ✅ No hay valores hardcodeados
- ✅ Validación de variables de entorno
- ✅ Configuración óptima de auth (persistSession, autoRefreshToken, detectSessionInUrl)
- ✅ Configuración de storage y real-time optimizada

## PASO 1: Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_SUPABASE_URL=https://azjaehrdzdfgrumbqmuc.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

**Para obtener tu clave anon:**
1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc
2. Ve a Settings > API
3. Copia la "anon/public" key (puedes usar la legacy o la nueva clave publishable)

## PASO 2: Verificar archivo .env.example

El archivo `.env.example` ya existe en la raíz del proyecto con el formato correcto. Úsalo como referencia.

## PASO 3: Verificar .gitignore

El archivo `.gitignore` ya está actualizado para incluir `.env` y sus variantes.

## PASO 4: Verificar que funciona

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Verifica que la aplicación carga correctamente
3. Verifica que puedes iniciar sesión y hacer queries a Supabase

## ⚠️ NOTAS IMPORTANTES

- **NUNCA** subas el archivo `.env` a Git
- **SÍ** sube el archivo `.env.example` como referencia
- Las variables de entorno en Vite deben empezar con `VITE_` para ser accesibles en el cliente
- Si cambias las variables, reinicia el servidor de desarrollo

## 🔒 SEGURIDAD

Una vez que hayas hecho estos cambios:
- ✅ Las claves ya no estarán expuestas en el código fuente
- ✅ Cada desarrollador puede tener su propio archivo `.env`
- ✅ Puedes usar diferentes entornos (desarrollo, producción) con diferentes claves
- ✅ El código puede compartirse públicamente sin riesgo
