# 🔍 Guía para Ejecutar Lighthouse Audit Manualmente

**Fecha:** 2025-01-09  
**Objetivo:** Verificar PWA y Performance scores

---

## 📋 PASOS PARA EJECUTAR LIGHTHOUSE

### 1. Preparar el Entorno

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev
# O si ya está corriendo en otro puerto:
# El servidor debe estar en http://localhost:5174
```

### 2. Abrir Chrome DevTools

1. Abre Chrome y navega a: `http://localhost:5174`
2. Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Ve a la pestaña **"Lighthouse"**

### 3. Configurar Lighthouse

1. **Selecciona las categorías:**
   - ✅ **PWA** (Progressive Web App)
   - ✅ **Performance**
   - Opcional: SEO, Accessibility, Best Practices

2. **Configuración:**
   - **Device:** Desktop (o Mobile si quieres probar móvil)
   - **Mode:** Navigation (para página completa)

3. **Haz clic en "Generate report"**

### 4. Revisar Resultados

#### PWA Score (debe ser 100/100)

Verifica que todas estas métricas estén en verde:

- ✅ **Installable** - La app puede instalarse
- ✅ **PWA Optimized** - Optimizaciones PWA presentes
- ✅ **Service Worker** - Service Worker registrado
- ✅ **Offline Capability** - Funciona offline
- ✅ **Manifest** - Manifest.json presente y válido

#### Performance Score (objetivo: >90)

Verifica métricas clave:

- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Total Blocking Time (TBT):** < 200ms
- **Cumulative Layout Shift (CLS):** < 0.1

### 5. Revisar Problemas

Si hay problemas, Lighthouse los mostrará en:

- **Opportunities** - Optimizaciones sugeridas
- **Diagnostics** - Información adicional
- **Passed audits** - Lo que está bien

---

## 📊 RESULTADOS ESPERADOS

### PWA Checklist

- ✅ **Manifest present** - manifest.webmanifest existe
- ✅ **Service Worker registered** - sw.js registrado
- ✅ **Offline page** - offline.html presente
- ✅ **Icons** - Íconos 192x192 y 512x512 presentes
- ✅ **Theme color** - Theme color configurado
- ✅ **Viewport** - Viewport meta tag presente
- ✅ **HTTPS** - Solo en producción (localhost OK para desarrollo)

### Performance

- ✅ **Score > 90** - Excelente
- ✅ **Score 75-89** - Bueno (aceptable)
- ⚠️ **Score < 75** - Requiere optimización

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### PWA Score < 100

**Problema:** Service Worker no registrado

- **Solución:** Verificar que `sw.js` esté en `dist/` después del build
- **Verificar:** `npm run build` y revisar `dist/sw.js`

**Problema:** Manifest no encontrado

- **Solución:** Verificar que `manifest.webmanifest` esté en `public/`
- **Verificar:** `curl http://localhost:5174/manifest.webmanifest`

**Problema:** Íconos faltantes

- **Solución:** Verificar que `pwa-icon-192.png` y `pwa-icon-512.png` estén en `public/`

### Performance Score Bajo

**Problema:** Imágenes grandes

- **Solución:** Optimizar imágenes, usar formatos modernos (WebP)

**Problema:** JavaScript grande

- **Solución:** Code splitting ya implementado, verificar chunks

**Problema:** CSS bloqueante

- **Solución:** Verificar que CSS crítico esté inline

---

## 📝 NOTAS

- **Desarrollo vs Producción:** Los scores pueden variar entre desarrollo y producción
- **Build necesario:** Para PWA completo, ejecuta `npm run build` y usa `npm run preview`
- **Puerto:** Asegúrate de usar el puerto correcto (5174 para dev, 4173 para preview)

---

## ✅ CHECKLIST FINAL

- [ ] Lighthouse ejecutado
- [ ] PWA Score: 100/100
- [ ] Performance Score: >90
- [ ] Todos los checks PWA pasan
- [ ] Sin errores críticos
- [ ] Reporte guardado

---

**Generado:** 2025-01-09
