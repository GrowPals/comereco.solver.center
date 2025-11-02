# ✅ Checklist de Despliegue a Vercel

## Estado Actual
- ✅ Base de datos configurada correctamente
- ✅ Perfil de usuario creado (team@growpals.mx)
- ✅ Variables de entorno actualizadas localmente
- ✅ Proyecto construido exitosamente (dist/)
- 🔄 **EN PROGRESO**: Configurar variables en Vercel

---

## 📋 Pasos para Completar el Despliegue

### 1. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel: https://vercel.com/tu-usuario/comereco-webapp/settings/environment-variables

Agrega estas **2 variables**:

#### Variable 1: VITE_SUPABASE_URL
- **Name** (campo de la izquierda): `VITE_SUPABASE_URL`
- **Value** (campo de la derecha): `https://azjaehrdzdfgrumbqmuc.supabase.co`
- **Environments**: Selecciona "Production", "Preview", y "Development"

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Name** (campo de la izquierda): `VITE_SUPABASE_ANON_KEY`
- **Value** (campo de la derecha): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amFlaHJkemRmZ3J1bWJxbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQwNDIsImV4cCI6MjA3NzQ4MDA0Mn0.DVhyeFbF0egeLWKwUQiM8wL5fpeO4WtDHT6Zlz9vZo8`
- **Environments**: Selecciona "Production", "Preview", y "Development"

Después de agregar cada variable, haz clic en **"Save"**.

---

### 2. Hacer Commit de los Cambios (Opcional pero Recomendado)

Los archivos modificados incluyen mejoras importantes:
- `src/contexts/SupabaseAuthContext.jsx` - Logging mejorado y fix del logout loop
- `src/pages/Login.jsx` - Lógica de redirección corregida
- Nuevos archivos de documentación SQL

**Para hacer commit:**

```bash
git add src/contexts/SupabaseAuthContext.jsx
git add src/pages/Login.jsx
git add docs/
git commit -m "fix: Corregir loop de logout y agregar logging para debug de autenticación

- Comentar signOut automático en SupabaseAuthContext
- Modificar lógica de redirección en Login para solo esperar session
- Agregar logs con emojis para facilitar debug
- Incluir scripts SQL para reparación de base de datos

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

**Esto disparará un redespliegue automático en Vercel** si tu proyecto está conectado a GitHub.

---

### 3. Redesplegar Manualmente (Si No Hiciste Git Push)

Si prefieres no hacer commit ahora, puedes redesplegar manualmente:

1. Ve a: https://vercel.com/tu-usuario/comereco-webapp
2. Ve a la pestaña **"Deployments"**
3. Haz clic en el menú ⋮ del deployment más reciente
4. Selecciona **"Redeploy"**
5. Asegúrate de seleccionar **"Use existing Build Cache: No"** para que tome las nuevas variables

---

### 4. Verificar el Despliegue

Una vez que Vercel termine el deployment:

1. Ve a: **https://comereco.solver.center**
2. Abre la consola del navegador (**F12** > Console)
3. Intenta hacer login con:
   - Email: `team@growpals.mx`
   - Tu contraseña

#### Logs Esperados en la Consola:

Deberías ver logs con emojis como:

```
🔐 Estado de autenticación cambió
✅ Usuario autenticado:
🔍 Obteniendo perfil completo para usuario: a9b3c244-9400-4d5c-8ce2-3ee9400a0af6
✅ Perfil de usuario obtenido exitosamente
✅ Datos de la empresa obtenidos
```

#### Si Todo Sale Bien:
- ✅ Verás el mensaje de "¡Bienvenido de vuelta!"
- ✅ Serás redirigido al Dashboard
- ✅ La consola mostrará todos los logs con ✅

#### Si Hay Problemas:
- Busca logs con ❌ o ⚠️ en la consola
- Toma screenshot de los errores
- Verifica que las variables de entorno en Vercel estén correctamente configuradas

---

## 🔍 Troubleshooting

### Error: "No API key found in request"
❌ **Las variables de entorno no están configuradas en Vercel**
✅ Revisa el Paso 1 y asegúrate de guardar ambas variables

### Error: "Invalid login credentials"
❌ **Credenciales incorrectas**
✅ Verifica email y contraseña

### Error 500 en profiles
❌ **La base de datos no tiene la estructura correcta**
✅ Vuelve a ejecutar el script `FIX_DATABASE_STRUCTURE.sql` en Supabase

### Aún se queda en login screen
❌ **Puede ser un problema de caché del navegador**
✅ Haz hard reload: **Ctrl + Shift + R** (Windows/Linux) o **Cmd + Shift + R** (Mac)

---

## 📞 Siguiente Paso

Una vez completados los pasos 1-4, **prueba el login en producción** y reporta:
- ✅ Si funcionó correctamente
- ❌ Si hay errores, comparte los logs de la consola
