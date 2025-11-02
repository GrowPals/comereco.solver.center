# Guía de Despliegue - COMERECO WEBAPP

## ✅ Build Completado Exitosamente

El proyecto se ha compilado correctamente. Los archivos de producción están en la carpeta `dist/`.

## 📦 Archivos Generados

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js (648.65 kB)
│   ├── index-[hash].css
│   └── [otros archivos assets]
```

## 🚀 Opciones de Despliegue

### 1. Vercel (Recomendado - Más Fácil)

**Pasos:**
1. Instala Vercel CLI: `npm i -g vercel`
2. En la raíz del proyecto ejecuta: `vercel`
3. Sigue las instrucciones en pantalla
4. Para producción: `vercel --prod`

**Configuración automática:**
- Vercel detecta automáticamente Vite
- No requiere configuración adicional
- Despliegue automático con cada push a GitHub

**Variables de entorno (si las necesitas):**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### 2. Netlify

**Pasos:**
1. Instala Netlify CLI: `npm i -g netlify-cli`
2. Ejecuta: `netlify deploy --prod --dir=dist`
3. O conecta tu repositorio en [Netlify](https://netlify.com)

**Configuración (netlify.toml):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. GitHub Pages

**Pasos:**
1. Instala gh-pages: `npm install --save-dev gh-pages`
2. Agrega al `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://tu-usuario.github.io/comereco-webapp"
}
```
3. Ejecuta: `npm run deploy`

**Configuración de Vite (vite.config.js):**
```js
export default defineConfig({
  base: '/comereco-webapp/', // nombre de tu repo
  // ... resto de configuración
})
```

### 4. AWS S3 + CloudFront

**Pasos:**
1. Build: `npm run build`
2. Sube a S3: `aws s3 sync dist/ s3://tu-bucket-name --delete`
3. Configura CloudFront para servir el S3 bucket
4. Configura SPA routing en CloudFront (redirigir todas las rutas a index.html)

### 5. Surge.sh (Rápido para pruebas)

**Pasos:**
1. Instala Surge: `npm install -g surge`
2. Build: `npm run build`
3. Despliega: `surge dist/ tu-dominio.surge.sh`

## 🔧 Configuración Post-Despliegue

### Variables de Entorno

Si necesitas variables de entorno en producción, configura:

1. **Vercel/Netlify:** Usa el panel de configuración
2. **GitHub Pages:** Usa `VITE_` prefix para variables públicas
3. **S3/CloudFront:** Configura en el build step

### Supabase

Las credenciales de Supabase están en `src/lib/customSupabaseClient.js`. 
**IMPORTANTE:** Para producción, considera moverlas a variables de entorno.

### Configuración de Rutas (SPA)

Asegúrate de que todas las rutas redirijan a `index.html` para que React Router funcione correctamente.

**Vercel/Netlify:** Configurado automáticamente
**GitHub Pages:** Usa `404.html` igual a `index.html`
**S3/CloudFront:** Configura redirección de errores 404/403 → index.html

## 📋 Checklist Pre-Despliegue

- [x] Build exitoso sin errores
- [ ] Verificar que todas las rutas funcionan
- [ ] Probar autenticación de Supabase
- [ ] Verificar variables de entorno
- [ ] Probar en modo producción localmente: `npm run preview`
- [ ] Verificar que las imágenes/assets se cargan correctamente
- [ ] Verificar responsive design
- [ ] Revisar errores de consola en producción

## 🧪 Prueba Local de Producción

```bash
npm run build
npm run preview
```

Esto construye y sirve la versión de producción localmente en `http://localhost:3000`

## 🐛 Troubleshooting

### Error: "Cannot find module"
- Ejecuta `npm install` antes del build
- Verifica que todas las dependencias estén en `package.json`

### Error: "Failed to resolve import"
- Verifica los alias en `vite.config.js`
- Asegúrate de usar `@/` para imports relativos

### Rutas no funcionan en producción
- Configura redirección SPA (todas las rutas → index.html)
- Verifica el `base` en `vite.config.js` si usas GitHub Pages

### Variables de entorno no funcionan
- Usa prefijo `VITE_` para variables públicas
- Reinicia el servidor después de cambiar variables

## 📝 Notas

- El build genera archivos optimizados y minificados
- Los assets tienen hash para cache busting
- El tamaño total del bundle es ~650KB (comprimido: ~200KB)

## 🎯 Recomendación

**Para producción:** Usa **Vercel** por su simplicidad y configuración automática.

**Para desarrollo rápido:** Usa **Surge.sh** para pruebas rápidas.

**Para empresa:** Usa **AWS S3 + CloudFront** o **Netlify** para mayor control.

