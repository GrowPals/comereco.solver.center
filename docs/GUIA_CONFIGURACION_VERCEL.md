# 🚀 Guía de Configuración de Vercel - Paso a Paso

## 📋 Configuración en la Interfaz de Vercel

### 1. Framework Preset
✅ **Mantener:** Vite (ya está detectado correctamente)

### 2. Root Directory
✅ **Mantener:** `./` (raíz del proyecto)

### 3. Build and Output Settings

#### Build Command
```
npm run build
```
✅ Esto ya debería estar configurado automáticamente

#### Output Directory
```
dist
```
✅ Esto ya debería estar configurado automáticamente

#### Install Command
```
npm install
```
✅ Esto ya debería estar configurado automáticamente

---

## 🔑 Variables de Entorno (IMPORTANTE)

Debes agregar las siguientes variables de entorno haciendo clic en **"+ Add More"**:

### Variable 1: VITE_SUPABASE_URL
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://azjaehrdzdfgrumbqmuc.supabase.co`

### Variable 2: VITE_SUPABASE_ANON_KEY
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amFlaHJkemRmZ3J1bWJxbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQwNDIsImV4cCI6MjA3NzQ4MDA0Mn0.DVhyeFbF0egeLWKwUQiM8wL5fpeO4WtDHT6Zlz9vZo8`

### Pasos para agregar variables:

1. Haz clic en **"+ Add More"** en la sección de Environment Variables
2. En el campo **Key**, escribe: `VITE_SUPABASE_URL`
3. En el campo **Value**, escribe: `https://azjaehrdzdfgrumbqmuc.supabase.co`
4. Haz clic en **"+ Add More"** nuevamente
5. En el campo **Key**, escribe: `VITE_SUPABASE_ANON_KEY`
6. En el campo **Value**, escribe: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amFlaHJkemRmZ3J1bWJxbXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQwNDIsImV4cCI6MjA3NzQ4MDA0Mn0.DVhyeFbF0egeLWKwUQiM8wL5fpeO4WtDHT6Zlz9vZo8`

⚠️ **IMPORTANTE:** Asegúrate de que ambas variables estén configuradas antes de hacer clic en "Deploy"

---

## 📝 Resumen de Configuración

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Environment Variables:
  ✅ VITE_SUPABASE_URL
  ✅ VITE_SUPABASE_ANON_KEY
```

---

## 🚀 Después de Configurar

1. Verifica que todas las variables de entorno estén agregadas
2. Haz clic en el botón **"Deploy"** en la parte inferior
3. Espera a que termine el build (tardará aproximadamente 30-60 segundos)
4. Una vez completado, Vercel te dará una URL de despliegue

---

## ✅ Verificación Post-Despliegue

Después del despliegue, verifica:

1. ✅ La aplicación carga correctamente
2. ✅ Puedes hacer login
3. ✅ Las conexiones a Supabase funcionan
4. ✅ No hay errores en la consola del navegador

---

## 🆘 Si hay Problemas

Si el despliegue falla:

1. **Revisa los logs de build** en Vercel
2. **Verifica que las variables de entorno estén escritas correctamente** (sin espacios extra)
3. **Asegúrate de que el repositorio tenga el código actualizado**
4. **Verifica que `vercel.json` esté en el repositorio**

---

## 📚 Documentación Adicional

- [Guía de Despliegue](docs/GUIA_DESPLIEGUE.md)
- [Variables de Entorno](docs/INSTRUCCIONES_VARIABLES_ENTORNO.md)
- [Verificación Vercel](docs/VERIFICACION_VERCEL.md)

