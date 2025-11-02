# INSTRUCCIONES PARA MODIFICAR customSupabaseClient.js MANUALMENTE

## 🚨 IMPORTANTE

El archivo `src/lib/customSupabaseClient.js` está protegido y debe modificarse **manualmente** fuera del entorno de Cursor.

## PASO 1: Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
VITE_SUPABASE_URL=https://azjaehrdzdfgrumbqmuc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amFlaHJkemRmZ3J1bWJxbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQwNDIsImV4cCI6MjA3NzQ4MDA0Mn0.DVhyeFbF0egeLWKwUQiM8wL5fpeO4WtDHT6Zlz9vZo8
```

## PASO 2: Crear archivo .env.example

Crea un archivo `.env.example` en la raíz del proyecto con valores de ejemplo (sin claves reales):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## PASO 3: Modificar src/lib/customSupabaseClient.js

**Reemplaza el contenido actual** con:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## PASO 4: Verificar .gitignore

El archivo `.gitignore` ya está actualizado para incluir `.env` y sus variantes.

## PASO 5: Verificar que funciona

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
