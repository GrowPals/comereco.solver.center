# Sistema Tipográfico - ComerECO

## Descripción General

Sistema tipográfico consistente con 5 niveles de jerarquía, diseñado para cumplir con los estándares de accesibilidad WCAG AA (mínimo ratio de contraste 4.5:1).

## Escala Tipográfica

### 1. Headings (Encabezados)

#### `.heading-1` - Hero Titles
**Uso:** Títulos principales de página, héroes
- **Tamaño:** 36px (desktop) / 48px (móvil)
- **Peso:** Bold (700)
- **Line Height:** Tight (1.25)
- **Tracking:** Tight (-0.025em)
- **Color:** `text-foreground`

```jsx
<h1 className="heading-1">Bienvenido a ComerECO</h1>
```

#### `.heading-2` - Section Titles
**Uso:** Títulos de sección, divisiones mayores
- **Tamaño:** 30px (desktop) / 36px (móvil)
- **Peso:** Bold (700)
- **Line Height:** Tight (1.25)
- **Tracking:** Tight (-0.025em)
- **Color:** `text-foreground`

```jsx
<h2 className="heading-2">Productos Destacados</h2>
```

#### `.heading-3` - Subsection Titles
**Uso:** Títulos de subsección, títulos de tarjetas
- **Tamaño:** 24px (desktop) / 30px (móvil)
- **Peso:** Semibold (600)
- **Line Height:** Tight (1.25)
- **Color:** `text-foreground`

```jsx
<h3 className="heading-3">Estado Vacío</h3>
```

#### `.heading-4` - Component Titles
**Uso:** Títulos de componentes, encabezados menores
- **Tamaño:** 20px (desktop) / 24px (móvil)
- **Peso:** Semibold (600)
- **Line Height:** Normal (1.5)
- **Color:** `text-foreground`

```jsx
<h4 className="heading-4">Detalles de la Requisición</h4>
```

#### `.heading-5` - Minor Headings
**Uso:** Encabezados menores, títulos de listas
- **Tamaño:** 18px (desktop) / 20px (móvil)
- **Peso:** Semibold (600)
- **Line Height:** Normal (1.5)
- **Color:** `text-foreground`

```jsx
<h5 className="heading-5">Producto Premium</h5>
```

---

### 2. Body Text (Texto de Cuerpo)

#### `.body-large` - Emphasis Paragraphs
**Uso:** Texto introductorio, párrafos destacados
- **Tamaño:** 18px
- **Peso:** Normal (400)
- **Line Height:** Relaxed (1.625)
- **Color:** `text-foreground`

```jsx
<p className="body-large">Descripción destacada del producto o servicio.</p>
```

#### `.body-base` - Standard Body Text
**Uso:** Texto de cuerpo estándar, lectura por defecto
- **Tamaño:** 16px
- **Peso:** Normal (400)
- **Line Height:** Normal (1.5)
- **Color:** `text-foreground`

```jsx
<p className="body-base">Este es el texto estándar de lectura.</p>
```

#### `.body-small` - Compact Text
**Uso:** Texto compacto, información secundaria
- **Tamaño:** 14px
- **Peso:** Normal (400)
- **Line Height:** Normal (1.5)
- **Color:** `text-foreground`

```jsx
<p className="body-small">Información adicional compacta.</p>
```

---

### 3. Secondary Text (Texto Secundario)

**Mejora de Contraste:** Todas las clases secundarias cumplen WCAG AAA (ratio 11:1 en light mode, 8:1+ en dark mode)

#### `.text-secondary-lg` - Large Auxiliary Text
**Uso:** Texto auxiliar grande con contraste mejorado
- **Tamaño:** 18px
- **Line Height:** Relaxed (1.625)
- **Color:** `neutral-700` (light) / `neutral-200` (dark)
- **Contraste:** 11:1 (WCAG AAA)

```jsx
<p className="text-secondary-lg">Descripción auxiliar destacada</p>
```

#### `.text-secondary` - Standard Auxiliary Text
**Uso:** Texto auxiliar estándar, descripciones
- **Tamaño:** 16px
- **Line Height:** Normal (1.5)
- **Color:** `neutral-700` (light) / `neutral-200` (dark)
- **Contraste:** 11:1 (WCAG AAA)

```jsx
<p className="text-secondary">Subtítulo o descripción secundaria</p>
```

#### `.text-secondary-sm` - Small Auxiliary Text
**Uso:** Texto auxiliar pequeño, metadatos
- **Tamaño:** 14px
- **Line Height:** Normal (1.5)
- **Color:** `neutral-700` (light) / `neutral-200` (dark)
- **Contraste:** 11:1 (WCAG AAA)

```jsx
<p className="text-secondary-sm">Información complementaria</p>
```

---

### 4. Muted/Tertiary Text (Texto Terciario)

#### `.text-muted` - Less Important Information
**Uso:** Información menos importante, texto de apoyo
- **Tamaño:** 14px
- **Line Height:** Normal (1.5)
- **Color:** `neutral-600` (light) / `neutral-300` (dark)
- **Contraste:** 7:1 (WCAG AA)

```jsx
<p className="text-muted">Texto de apoyo menos prominente</p>
```

#### `.text-muted-xs` - Extra Small Muted
**Uso:** Texto muy pequeño, menos prominente
- **Tamaño:** 12px
- **Line Height:** Normal (1.5)
- **Color:** `neutral-600` (light) / `neutral-300` (dark)
- **Contraste:** 7:1 (WCAG AA)

```jsx
<p className="text-muted-xs">Etiqueta pequeña</p>
```

---

### 5. Labels & Metadata

#### `.caption` - Uppercase Labels
**Uso:** Etiquetas en mayúsculas, tags, badges
- **Tamaño:** 12px
- **Peso:** Semibold (600)
- **Line Height:** Normal (1.5)
- **Tracking:** Wide (0.025em)
- **Transform:** Uppercase
- **Color:** `neutral-600` (light) / `neutral-300` (dark)

```jsx
<span className="caption">Precio</span>
<span className="caption">Folio</span>
```

#### `.label` - Form Labels
**Uso:** Etiquetas de formulario, inputs
- **Tamaño:** 14px
- **Peso:** Medium (500)
- **Line Height:** None (1)
- **Color:** `text-foreground`

```jsx
<label className="label">Nombre del Producto</label>
```

#### `.text-small` - Fine Print
**Uso:** Texto pequeño, helper text
- **Tamaño:** 12px
- **Line Height:** Normal (1.5)
- **Color:** `neutral-600` (light) / `neutral-300` (dark)

```jsx
<span className="text-small">Texto de ayuda o nota al pie</span>
```

---

### 6. Numeric/Display Text

#### `.display-number` - Large Stats
**Uso:** Números grandes para estadísticas, métricas
- **Tamaño:** 36px (desktop) / 48px (móvil)
- **Peso:** Bold (700)
- **Tracking:** Tight (-0.025em)
- **Variant:** Tabular nums
- **Color:** `text-foreground`

```jsx
<div className="display-number">1,234</div>
```

#### `.price-large` - Large Price Display
**Uso:** Precios grandes, montos destacados
- **Tamaño:** 24px
- **Peso:** Bold (700)
- **Variant:** Tabular nums
- **Color:** `text-foreground`

```jsx
<p className="price-large">$1,299.00</p>
```

#### `.price-medium` - Medium Price Display
**Uso:** Precios medianos, montos regulares
- **Tamaño:** 20px
- **Peso:** Bold (700)
- **Variant:** Tabular nums
- **Color:** `text-foreground`

```jsx
<p className="price-medium">$599.00</p>
```

---

### 7. Interactive Text

#### `.text-link` - Link Style
**Uso:** Enlaces, texto interactivo
- **Color:** `primary-600` (light) / `primary-400` (dark)
- **Hover:** `primary-700` (light) / `primary-300` (dark)
- **Decoration:** Underline on hover
- **Underline Offset:** 2px
- **Transition:** Colors

```jsx
<a href="/productos" className="text-link">Ver todos los productos</a>
```

---

## Ratios de Contraste (WCAG)

### Light Mode
| Elemento | Color | Ratio | Estándar |
|----------|-------|-------|----------|
| Primary Text | `#0F172A` | 16:1 | WCAG AAA |
| Secondary Text | `#334155` | 11:1 | WCAG AAA |
| Muted Text | `#475569` | 7:1 | WCAG AA |

### Dark Mode
| Elemento | Color | Ratio | Estándar |
|----------|-------|-------|----------|
| Primary Text | `#e6efff` | 14:1 | WCAG AAA |
| Secondary Text | `#E2E8F0` | 8:1+ | WCAG AAA |
| Muted Text | `rgba(210, 224, 250, 0.95)` | 7:1+ | WCAG AA |

---

## Ejemplos de Uso

### ProductCard
```jsx
{/* Category Badge */}
<span className="caption">Alimentos</span>

{/* Product Name */}
<h3 className="heading-5">Manzanas Orgánicas</h3>

{/* Availability */}
<p className="text-secondary-sm">DISPONIBLE · 50 pzas</p>

{/* Price Label */}
<span className="caption">Precio</span>

{/* Price Value */}
<p className="price-large text-emerald-600">$45.00</p>

{/* Unit */}
<span className="text-muted">/ kg</span>
```

### EmptyState
```jsx
{/* Title */}
<h2 className="heading-3">No hay productos</h2>

{/* Description */}
<p className="text-secondary">No se encontraron productos en esta categoría.</p>
```

### RequisitionCard
```jsx
{/* Label */}
<p className="caption">Folio</p>

{/* Folio Number */}
<p className="price-medium">REQ-001</p>

{/* Metadata Label */}
<p className="text-muted-xs">Solicitante</p>

{/* Metadata Value */}
<p className="text-secondary-sm font-semibold">Juan Pérez</p>

{/* Amount */}
<p className="price-medium">$12,500.00</p>
```

### StatCard
```jsx
{/* Stat Label */}
<CardTitle className="caption">Total de Ventas</CardTitle>

{/* Stat Value */}
<div className="display-number">$45,678</div>
```

---

## Mejores Prácticas

### 1. Consistencia
- ✅ **Hacer:** Usar siempre las clases semánticas definidas
- ❌ **Evitar:** Crear clases ad-hoc como `text-xl font-bold`

### 2. Jerarquía
- ✅ **Hacer:** Mantener una jerarquía visual clara con los headings
- ❌ **Evitar:** Saltar niveles de headings (h1 → h3)

### 3. Contraste
- ✅ **Hacer:** Usar clases `.text-secondary` para textos auxiliares con buen contraste
- ❌ **Evitar:** Usar colores que no cumplan WCAG AA (4.5:1)

### 4. Legibilidad
- ✅ **Hacer:** Usar `.body-base` para textos largos de lectura
- ❌ **Evitar:** Usar texto muy pequeño para contenido principal

### 5. Semántica
- ✅ **Hacer:** Usar los elementos HTML correctos (h1-h6, p, span)
- ❌ **Evitar:** Usar divs para todo

---

## Migrando Código Existente

### Antes (Ad-hoc)
```jsx
<h3 className="text-2xl font-bold text-foreground">Título</h3>
<p className="text-base leading-relaxed text-muted-foreground">Descripción</p>
<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etiqueta</span>
```

### Después (Semántico)
```jsx
<h3 className="heading-3">Título</h3>
<p className="text-secondary">Descripción</p>
<span className="caption">Etiqueta</span>
```

---

## Soporte y Referencias

- **Archivos de Configuración:**
  - `tailwind.config.js` - Definiciones de clases semánticas
  - `src/index.css` - Variables CSS y colores
  - `src/styles/design-tokens.css` - Tokens de diseño

- **Estándares de Accesibilidad:**
  - [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
  - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Última actualización:** 2025-11-08
**Versión:** 1.0.0
