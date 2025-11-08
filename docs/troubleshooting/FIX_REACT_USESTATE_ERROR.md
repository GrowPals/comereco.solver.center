# Fix: Error "Cannot read properties of undefined (reading 'useState')"

## Problema Resuelto

El error `Cannot read properties of undefined (reading 'useState')` ocurría en producción cuando React no estaba disponible en el momento en que los componentes intentaban usar hooks de React.

## Causa Raíz

1. **Múltiples instancias de React**: Diferentes versiones de React siendo cargadas por dependencias
2. **Orden de carga incorrecto**: React no estaba disponible antes de que otros módulos lo necesitaran
3. **Chunking problemático**: Todo el vendor code estaba en un único chunk, causando problemas de carga

## Soluciones Implementadas

### 1. Configuración de Vite (`vite.config.js`)

#### a) Separación de Chunks
- **React y React-DOM** en chunk separado (`react-vendor`)
- **React Router** en chunk separado (`react-router-vendor`)
- **Radix UI** en chunk separado (`radix-vendor`)
- Otros vendor dependencies en chunk general (`vendor`)

#### b) Optimización de Dependencias
```javascript
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-router-dom',
    'react-dom/client'
  ],
  esbuildOptions: {
    define: {
      global: 'globalThis',
    },
  },
}
```

#### c) Deduplicación de React
```javascript
resolve: {
  dedupe: ['react', 'react-dom'],
  alias: {
    'react': path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
  },
}
```

#### d) Configuración de Build
- `commonjsOptions` para manejar módulos mixtos
- `inlineDynamicImports: false` para prevenir problemas de code splitting
- Chunks nombrados consistentemente para mejor caché

### 2. Package.json Overrides

Forzamos una única versión de React en todas las dependencias:

```json
"overrides": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### 3. Verificaciones de Seguridad en `main.jsx`

Agregamos verificaciones explícitas para asegurar que React esté disponible:

```javascript
if (!React || !ReactDOM) {
  throw new Error('React no está disponible...');
}
```

## Resultado del Build

El build ahora genera correctamente:

```
dist/assets/react-vendor-8fdf3465.js       200.10 kB │ gzip:  65.85 kB
dist/assets/radix-vendor-f6ddd0ea.js       110.08 kB │ gzip:  32.38 kB
dist/assets/vendor-6a46b321.js             375.13 kB │ gzip: 116.22 kB
dist/assets/index-cd92c708.js              87.70 kB │ gzip:  23.45 kB
```

El HTML incluye correctamente:
- `<link rel="modulepreload" crossorigin href="/assets/react-vendor-8fdf3465.js">`
- React se carga ANTES que otros módulos

## Verificaciones Realizadas

✅ React useState está correctamente incluido en react-vendor chunk
✅ El orden de carga es correcto (react-vendor primero)
✅ No hay múltiples instancias de React
✅ Todas las importaciones de React están correctas
✅ Build se completa sin errores
✅ Preview server funciona correctamente

## Prevención de Errores Futuros

### 1. Mantener Versiones Consistentes
Siempre usar `overrides` en package.json para forzar una única versión de React.

### 2. Verificar Build
Después de cada cambio importante:
```bash
rm -rf dist node_modules/.vite
npm install
npm run build
npm run preview
```

### 3. Monitorear Chunks
Verificar que react-vendor se genere correctamente:
```bash
ls -lh dist/assets/react-vendor*.js
```

### 4. Error Boundaries
El ErrorBoundary existente capturará cualquier error de React y mostrará un fallback apropiado.

## Comandos Útiles

```bash
# Limpiar cache y rebuild
rm -rf dist node_modules/.vite
npm install
npm run build

# Verificar versión de React
npm list react react-dom

# Verificar chunks generados
ls -lh dist/assets/react-vendor*.js

# Preview local
npm run preview
```

## Notas Importantes

1. **No eliminar los overrides** del package.json - son críticos para prevenir múltiples instancias
2. **No cambiar el orden de chunks** en vite.config.js - React debe estar primero
3. **Mantener alias de React** en resolve - aseguran una única instancia
4. **Verificar después de actualizar dependencias** - nuevas versiones pueden traer múltiples React

## Estado Actual

✅ **PROBLEMA RESUELTO**
- Build exitoso
- React correctamente separado
- Orden de carga correcto
- Sin múltiples instancias
- Preview funcionando

---

**Fecha de Fix**: 2025-11-02
**Versión de React**: 18.2.0 (forzada con overrides)

