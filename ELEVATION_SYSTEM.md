# Sistema de Elevación y Bordes - ComerECO

## Resumen de Cambios

Este documento describe el sistema de elevación unificado implementado para mejorar la consistencia visual entre light mode y dark mode.

### Problemas Resueltos

1. **Bordes demasiado prominentes en dark mode**: Los bordes tenían opacidades inconsistentes (0.22-0.32) que los hacían muy visibles
2. **Sistema de elevación inconsistente**: Las sombras y bordes no trabajaban juntos para crear una jerarquía visual clara

## Sistema de Elevación

El sistema define 6 niveles de elevación (0-5) que funcionan consistentemente en ambos temas:

### Light Mode
En light mode, la elevación se logra **únicamente con sombras**:

| Nivel | Nombre | Uso | Shadow |
|-------|--------|-----|---------|
| 0 | Flush | Elementos al nivel del fondo | `none` |
| 1 | Subtle | Separación mínima | `0 1px 2px rgba(15, 23, 42, 0.04)` |
| 2 | Card | Elevación estándar para cards | `0 2px 6px rgba(15, 23, 42, 0.05)` |
| 3 | Elevated | Elementos destacados | `0 6px 16px rgba(15, 23, 42, 0.09)` |
| 4 | Floating | Dropdowns, popovers | `0 8px 20px rgba(15, 23, 42, 0.10)` |
| 5 | Modal | Modales y overlays | `0 20px 40px rgba(15, 23, 42, 0.14)` |

### Dark Mode
En dark mode, la elevación se logra con **sombras + bordes sutiles con highlights**:

| Nivel | Nombre | Shadow | Border |
|-------|--------|---------|---------|
| 0 | Flush | `none` | `transparent` |
| 1 | Subtle | `0 1px 3px rgba(0, 0, 0, 0.20)` | `rgba(110, 180, 245, 0.12)` |
| 2 | Card | `0 3px 8px rgba(0, 0, 0, 0.22)` | `rgba(110, 180, 245, 0.16)` |
| 3 | Elevated | `0 6px 18px rgba(0, 0, 0, 0.30)` | `rgba(120, 190, 250, 0.20)` |
| 4 | Floating | `0 8px 20px rgba(0, 0, 0, 0.32)` | `rgba(130, 200, 255, 0.24)` |
| 5 | Modal | `0 16px 40px rgba(0, 0, 0, 0.38)` | `rgba(140, 210, 255, 0.28)` |

## Bordes Suavizados en Dark Mode

### Valores Anteriores vs Nuevos

| Elemento | Antes | Después | Cambio |
|----------|-------|---------|--------|
| `--border` | `rgba(100, 145, 220, 0.30)` | `rgba(110, 180, 245, 0.16)` | -47% opacidad |
| `--input` | `rgba(100, 145, 220, 0.32)` | `rgba(110, 180, 245, 0.18)` | -44% opacidad |
| `--sidebar-border` | `rgba(90, 150, 230, 0.24)` | `rgba(110, 180, 245, 0.18)` | -25% opacidad |
| `--nav-border` | `rgba(102, 162, 240, 0.26)` | `rgba(110, 180, 245, 0.18)` | -31% opacidad |
| Surface cards | `rgba(110, 180, 250, 0.22)` | `rgba(110, 180, 245, 0.16)` | -27% opacidad |

### Beneficios

- **Menor contraste visual**: Los bordes ya no dominan la interfaz
- **Mayor consistencia**: Todos los bordes usan el mismo rango de color `rgba(110-140, 180-210, 245-255)`
- **Jerarquía clara**: Los bordes aumentan en visibilidad con la elevación
- **Mejor legibilidad**: El contenido destaca más que los divisores

## Uso del Sistema

### Variables CSS Disponibles

```css
/* Elevación */
--elevation-0 to --elevation-5

/* Bordes de elevación (dark mode only) */
--elevation-border-0 to --elevation-border-5

/* Sombras específicas (mantienen compatibilidad) */
--shadow-xs, --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --shadow-2xl
--shadow-soft-sm, --shadow-soft-md, --shadow-soft-lg
--shadow-card, --shadow-elevated, --shadow-floating
--shadow-button, --shadow-button-hover
```

### Utility Classes

```jsx
// Aplicar elevación automáticamente en ambos modos
<div className="elevation-2 border rounded-xl">
  Card con elevación nivel 2
</div>

<div className="elevation-4 border rounded-xl">
  Dropdown con elevación nivel 4
</div>
```

### Componentes Actualizados

Los siguientes componentes han sido actualizados para usar el nuevo sistema:

- ✅ `Card` - Usa `border-border` que se adapta automáticamente
- ✅ `Dialog` - Removidos bordes hardcoded, usa variables CSS
- ✅ `Dropdown` - Usa `surface-card` con sistema de elevación
- ✅ `Popover` - Usa `surface-card` con sistema de elevación
- ✅ Clases de superficie: `.surface-card`, `.surface-panel`, `.surface-overlay`, `.surface-chip`
- ✅ Header actions: `.header-action-btn`, `.company-switcher-pill`
- ✅ Navigation: `.nav-shell`, `.bottom-nav-shell`, `.sidebar-shell`

## Ejemplos de Uso

### Cards con diferentes elevaciones

```jsx
// Card básico (elevation-2)
<Card className="p-6">
  Contenido del card
</Card>

// Card elevado al hacer hover
<Card interactive className="p-6">
  Card interactivo con hover effect
</Card>

// Card destacado (elevation-3)
<div className="elevation-3 border border-border rounded-2xl p-6">
  Card muy destacado
</div>
```

### Modales y Overlays

```jsx
// Modal usa elevation-5 automáticamente
<Dialog>
  <DialogContent>
    El modal tiene la máxima elevación
  </DialogContent>
</Dialog>

// Dropdown usa elevation-4
<DropdownMenu>
  <DropdownMenuContent>
    El dropdown tiene elevación flotante
  </DropdownMenuContent>
</DropdownMenu>
```

### Navegación

```jsx
// La navegación usa bordes sutiles automáticamente
<nav className="nav-shell">
  {/* Usa --nav-border que es más sutil ahora */}
</nav>
```

## Mejores Prácticas

### ✅ Recomendado

1. **Usar variables CSS**: Siempre preferir `border-border` sobre valores hardcoded
2. **Aplicar elevación por contexto**:
   - Cards: `elevation-2`
   - Dropdowns/Popovers: `elevation-4`
   - Modals: `elevation-5`
3. **Combinar con surface classes**: Las clases `.surface-*` ya incluyen el sistema de elevación

### ❌ Evitar

1. **Bordes hardcoded en dark mode**: No usar valores como `dark:border-slate-700`
2. **Sombras personalizadas**: Usar el sistema en lugar de valores custom
3. **Opacidades altas en bordes**: Mantener bordes sutiles (< 0.25 en dark mode)

## Variables de Borde en Dark Mode

### Bordes Base
```css
--border: rgba(110, 180, 245, 0.16)
--input: rgba(110, 180, 245, 0.18)
```

### Bordes de Navegación
```css
--nav-border: rgba(110, 180, 245, 0.18)
--sidebar-border: rgba(110, 180, 245, 0.18)
--bottom-nav-border: rgba(110, 180, 245, 0.18)
```

### Bordes Interactivos (hover)
```css
hover: rgba(130, 200, 255, 0.22)
focus: rgba(120, 190, 255, 0.35)
```

## Testing

Para verificar que el sistema funciona correctamente:

1. **Light Mode**: Verificar que las sombras crean jerarquía clara sin bordes muy visibles
2. **Dark Mode**: Verificar que los bordes son sutiles pero perceptibles, complementados por sombras
3. **Transiciones**: Al cambiar de tema, la jerarquía visual debe mantenerse equivalente
4. **Hover States**: Los estados interactivos deben ser claros pero no agresivos

## Changelog

### 2025-01-08
- ✨ Sistema de elevación unificado con 6 niveles (0-5)
- 🎨 Bordes suavizados en dark mode (~40% menos opacidad)
- 🔧 Variables CSS consistentes para bordes de elevación
- 📚 Utility classes para aplicar elevación
- ♻️ Actualización de componentes UI (Card, Dialog, etc.)
- 📝 Documentación completa del sistema

---

**Mantenido por**: GrowPals Engineering Team
**Última actualización**: 2025-01-08
