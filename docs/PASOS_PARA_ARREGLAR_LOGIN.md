# 🔧 Cómo Arreglar el Problema de Login

## 📌 Problema Identificado

**Error:** `42P17` - La tabla `profiles` o la columna `role_v2` no existen en tu base de datos de Supabase.

**Tu autenticación funciona**, pero falta crear el perfil del usuario en la base de datos.

---

## ✅ Solución Paso a Paso

### Paso 1: Acceder al SQL Editor de Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **azjaehrdzdfgrumbqmuc**
4. En el menú lateral izquierdo, haz click en **"SQL Editor"**

### Paso 2: Ejecutar el Script de Reparación

1. En el SQL Editor, haz click en **"New query"**
2. Abre el archivo `/docs/FIX_DATABASE_STRUCTURE.sql` (está en este proyecto)
3. **Copia TODO el contenido** del archivo
4. **Pégalo** en el SQL Editor de Supabase
5. Haz click en el botón **"Run"** (o presiona `Ctrl + Enter`)

### Paso 3: Verificar los Resultados

Deberías ver mensajes como:

```
✅ Script ejecutado correctamente
```

Y al final, una tabla con tu información de perfil:

| id | full_name | role_v2 | company_id | company_name | email |
|----|-----------|---------|------------|--------------|-------|
| a9b3c244-... | Team Solver | admin | ... | Solver | team@growpals.mx |

### Paso 4: Probar el Login

1. Vuelve a tu aplicación: [https://comereco.solver.center](https://comereco.solver.center)
2. **Recarga la página completamente** (Ctrl + Shift + R)
3. Intenta hacer login con:
   - Email: `team@growpals.mx`
   - Tu contraseña

**¡Deberías poder entrar al dashboard ahora!**

---

## 🎯 Qué Hace el Script

El script realiza estas acciones automáticamente:

1. ✅ Crea el tipo de dato `app_role_v2` (enum con valores: admin, supervisor, user)
2. ✅ Crea la tabla `profiles` si no existe
3. ✅ Agrega la columna `role_v2` si falta
4. ✅ Habilita RLS (Row Level Security)
5. ✅ Crea políticas de seguridad básicas
6. ✅ Crea la empresa "Solver" si no existe
7. ✅ Crea tu perfil de usuario con rol de **admin**
8. ✅ Crea un trigger para auto-crear perfiles de nuevos usuarios

---

## 🐛 Si Algo Sale Mal

### Error: "relation public.companies does not exist"

Si ves este error, significa que tampoco existe la tabla `companies`.

**Solución rápida:**

```sql
-- Crear tabla companies primero
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    bind_location_id text,
    bind_price_list_id text,
    created_at timestamptz DEFAULT now()
);

-- Luego ejecuta el script completo de nuevo
```

### Error: "permission denied"

Asegúrate de que estás ejecutando el script como **propietario del proyecto** en Supabase.

### Aún no puedo entrar

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login
4. Busca la request a `profiles`
5. Si aún ves error 500, **toma screenshot** y compártelo

---

## 📞 Ayuda Adicional

Si necesitas ayuda:
1. Copia el **mensaje de error** que aparece en el SQL Editor
2. Toma un **screenshot** de la consola del navegador
3. Compártelos para diagnóstico adicional

---

**¡Una vez ejecutado el script, el login debería funcionar perfectamente!**
