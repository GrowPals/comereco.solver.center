# 🌐 Navegación Automatizada con Playwright

Guía completa para navegar y validar la aplicación usando Playwright como Claude.

## 🎯 ¿Qué es esto?

Playwright permite navegar la aplicación de forma automatizada, como si fueras un usuario real, pero programáticamente. Esto es útil para:

- ✅ Validar que las rutas funcionan correctamente
- ✅ Verificar que no hay errores de JavaScript
- ✅ Medir performance y tiempos de carga
- ✅ Tomar screenshots automáticamente
- ✅ Probar flujos completos de usuario

## 🚀 Formas de Navegar

### 1. UI Interactiva (Recomendado para exploración)

```bash
npm run test:ui
```

**Qué hace:**
- Abre la UI de Playwright
- Puedes ver el navegador en tiempo real
- Navegas manualmente mientras Playwright registra
- Puedes crear tests sobre la marcha
- Perfecto para explorar y entender la app

### 2. Navegación Automatizada (Script)

```bash
# Primero inicia el servidor
npm run dev

# En otra terminal, ejecuta:
npm run navigate
```

**Qué hace:**
- Navega automáticamente a la aplicación
- Toma screenshots
- Verifica rutas normalizadas
- Detecta errores de consola
- Mide performance
- Prueba navegación entre rutas
- Genera reporte en consola

### 3. Tests con Navegador Visible

```bash
npm run test:headed
```

**Qué hace:**
- Ejecuta todos los tests
- Muestra el navegador ejecutándose
- Puedes ver qué está pasando
- Útil para debugging

### 4. Tests Específicos

```bash
# Solo tests de rutas
npm run test:routes

# Solo tests de performance
npm run test:performance

# Solo smoke tests
npm run test:smoke
```

## 📋 Script de Navegación Personalizado

El script `scripts/navigate-and-validate.js` hace lo siguiente:

1. **Inicia navegador** (visible para que veas qué pasa)
2. **Navega a la página principal**
3. **Toma screenshot** → `test-results/homepage.png`
4. **Verifica título** y contenido
5. **Busca elementos clave** (botones, enlaces)
6. **Valida rutas** (verifica que no hay `/producto/`)
7. **Detecta errores** de consola
8. **Mide performance** (tiempo de carga, recursos)
9. **Prueba navegación** entre diferentes rutas
10. **Genera reporte** completo

## 🔍 Ejemplo de Uso

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Navegar y validar
npm run navigate
```

**Salida esperada:**
```
🌐 Iniciando navegación automatizada...

📄 Navegando a la página principal...
✅ Screenshot guardado: test-results/homepage.png
📌 Título de la página: ComerECO
✅ Contenido cargado: true

🔍 Buscando elementos clave...
   Login button: ✅ Encontrado

🛣️  Verificando rutas...
   Enlaces encontrados: 15
   Rutas: /dashboard, /catalog, /requisitions, ...
   Rutas normalizadas: ✅

🚨 Verificando errores...
   Errores críticos: ✅ Ninguno

⚡ Verificando performance...
   Tiempo de carga: 1234ms
   DOM Content Loaded: 856ms
   Recursos cargados: 42

🧭 Probando navegación...
   /catalog: ✅ Carga correcta
   /dashboard: ✅ Carga correcta
   /login: ✅ Carga correcta

✅ Navegación completada
```

## 🎨 UI Interactiva de Playwright

La mejor forma de explorar la aplicación:

```bash
npm run test:ui
```

**Características:**
- 🖱️ Navegación manual mientras se graba
- 📸 Screenshots automáticos
- 🎥 Grabación de acciones
- 🔍 Inspector de elementos
- 📊 Timeline de eventos
- 💾 Guardar tests sobre la marcha

## 🛠️ Personalizar Navegación

Puedes modificar `scripts/navigate-and-validate.js` para:

- Navegar a rutas específicas
- Hacer clic en botones
- Llenar formularios
- Verificar contenido específico
- Medir métricas personalizadas

**Ejemplo de personalización:**

```javascript
// Navegar a catálogo
await page.goto(`${BASE_URL}/catalog`);

// Buscar un producto
await page.fill('input[type="search"]', 'producto test');

// Hacer clic en resultado
await page.click('.product-card:first-child');

// Verificar que carga la página de detalle
await expect(page).toHaveURL(/\/products\//);
```

## 📊 Screenshots y Reportes

Los screenshots se guardan en:
- `test-results/homepage.png` - Página principal
- `test-results/error.png` - Si hay errores

Los reportes HTML de Playwright se generan en:
- `playwright-report/` - Reporte HTML completo

## 🔧 Configuración

### Variables de Entorno

```bash
# Cambiar puerto del servidor
VITE_PORT=3000 npm run navigate

# Cambiar URL base
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run navigate
```

### Modificar Playwright Config

Edita `playwright.config.ts` para:
- Cambiar timeouts
- Agregar más navegadores
- Modificar viewport
- Configurar proxies

## 💡 Casos de Uso

### Validar después de cambios

```bash
# Después de hacer cambios
npm run navigate
# Verifica que todo sigue funcionando
```

### Debugging visual

```bash
npm run test:ui
# Navega manualmente y ve qué pasa
```

### CI/CD

```bash
# En CI, ejecuta tests sin UI
npm run test:e2e
# Genera reportes automáticamente
```

## 🎯 Próximos Pasos

1. **Explorar la app**: `npm run test:ui`
2. **Validar cambios**: `npm run navigate`
3. **Crear tests**: Usa la UI para grabar acciones
4. **Automatizar**: Agrega más validaciones al script

---

**¿Necesitas ayuda?** Revisa los tests en `tests/e2e/` para ejemplos de navegación automatizada.

