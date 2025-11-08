# Sistema de Diseño ComerECO v2.0

Rediseño completo del sistema UI con estética moderna, minimalista y funcional.

## Filosofía de Diseño

Inspirado en **Linear, Vercel y Raycast**, este sistema se basa en:

- **Simplicidad**: Sin decoraciones innecesarias
- **Color como diferenciador**: No sombras, no bordes duros
- **Paleta pastel**: Colores suaves y gradientes funcionales
- **Consistencia**: Sistema unificado en toda la aplicación
- **Accesibilidad**: Excelente contraste en dark/light mode

## Principios Fundamentales

### ✅ LO QUE SÍ USAMOS

- Gradientes pastel sutiles y funcionales
- Colores para diferenciar estados y jerarquía
- Bordes sutiles con colores del sistema
- Rounded-xl como estándar (16px)
- Animaciones fluidas y sutiles
- Transiciones de 200ms
- Iconos planos con colores pasteles
- Padding consistente (p-4, gap-4, space-y-4)

### ❌ LO QUE NO USAMOS

- ❌ Sombras (box-shadow)
- ❌ Bordes duros o muy visibles
- ❌ Efectos glow
- ❌ Gradientes decorativos agresivos
- ❌ Iconos encerrados en círculos/cuadrados
- ❌ Colores sólidos planos (usar gradientes)
- ❌ Blanco puro (#fff) o negro puro (#000)

---

## Paleta de Colores

### Verde Menta - Success/Approval
```css
--success-500: #10B981  /* Light mode */
--success-500: #34D399  /* Dark mode */
```

### Amarillo Mostaza - Warning
```css
--warning-500: #F5A623  /* Light mode */
--warning-500: #FBBF24  /* Dark mode */
```

### Rojo Coral - Error/Danger
```css
--error-500: #F97066  /* Light mode */
--error-500: #FB7185  /* Dark mode */
```

### Azul Cielo - Info/Primary
```css
--info-500: #3B9EFF  /* Light mode */
--info-500: #60A5FA  /* Dark mode */
```

### Gris Lavanda - Neutral
```css
--neutral-100: #F3F4F8  /* Light mode */
--neutral-200: #202228  /* Dark mode */
```

---

## Componentes

### Button

**Variantes disponibles:**
- `primary` - Gradiente azul cielo (acciones principales)
- `secondary` - Gris neutral (acciones secundarias)
- `ghost` - Transparente con hover
- `success` - Verde menta (aprobar, confirmar)
- `danger` - Rojo coral (eliminar, rechazar)
- `warning` - Amarillo mostaza (advertencias)
- `outline` - Borde de color, fondo transparente
- `link` - Texto con underline

**Tamaños:**
- `sm` - h-9, px-4, text-sm
- `md` - h-11, px-6, text-base (default)
- `lg` - h-14, px-8, text-lg
- `icon` - h-11, w-11

**Ejemplo:**
```jsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  <IconPlus className="w-4 h-4" />
  Crear requisición
</Button>
```

---

### Badge

**Variantes:**
- `default` - Gris neutral
- `success` - Verde menta
- `warning` - Amarillo mostaza
- `danger` - Rojo coral
- `info` - Azul cielo
- Estados de requisiciones: `ordered`, `approved`, `sent`, `rejected`, `draft`, etc.

**Ejemplo:**
```jsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Aprobado</Badge>
<Badge status="approved" /> // Con icono automático
```

---

### Card

**Props:**
- `interactive` - Añade hover effect con lift

**Ejemplo:**
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card interactive>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>
```

---

### Input

**Estados:**
- Normal - Border sutil
- Focus - Ring primary
- Error - Border y fondo rojo coral pastel
- Success - Border y fondo verde menta pastel

**Ejemplo:**
```jsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Buscar..."
  error={hasError}
  success={isValid}
/>
```

---

## Iconos

### Guía de Uso

1. **Tamaño estándar**: `w-5 h-5` (20px) para UI normal
2. **Tamaño pequeño**: `w-4 h-4` (16px) para botones
3. **Tamaño grande**: `w-12 h-12` (48px) para stat cards
4. **NUNCA** encerrar en círculos o cuadrados
5. **Color pastel plano**, no background

**Colores recomendados:**
```jsx
// Success
<CheckCircle className="w-5 h-5 text-success-500" />

// Warning
<AlertTriangle className="w-5 h-5 text-warning-500" />

// Error
<XCircle className="w-5 h-5 text-error-500" />

// Info
<Info className="w-5 h-5 text-info-500" />

// Neutral
<Icon className="w-5 h-5 text-neutral-500" />
```

---

## Espaciado

**Sistema base 4px:**
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px ← **Estándar para padding**
- `space-6` = 24px
- `space-8` = 32px

**Uso recomendado:**
- `p-4` - Padding de cards y containers
- `gap-4` - Espacio entre elementos
- `space-y-4` - Espacio vertical en listas

---

## Border Radius

- `rounded-lg` = 8px - Pequeño
- `rounded-xl` = 16px - **Estándar** ← Usar este
- `rounded-2xl` = 24px - Grande
- `rounded-full` = 9999px - Círculos (badges, avatars)

---

## Tipografía

**Headings:**
```jsx
<h1 className="text-heading-1">Título Principal</h1>
<h2 className="text-heading-2">Sección</h2>
<h3 className="text-heading-3">Subsección</h3>
```

**Body:**
```jsx
<p className="text-body">Texto normal</p>
<p className="text-body-small">Texto pequeño</p>
<p className="text-muted-foreground">Texto secundario</p>
```

**Labels:**
```jsx
<span className="text-label">Label de formulario</span>
<span className="text-caption">CATEGORÍA</span>
```

---

## Dark Mode

Todos los componentes soportan dark mode automáticamente usando:
- `dark:` prefix en clases Tailwind
- Variables CSS que cambian según `.dark` class
- Paleta pastel adaptada para dark mode

**Ejemplo:**
```jsx
<div className="bg-card text-foreground border-border">
  // Colores se adaptan automáticamente
</div>
```

---

## Gradientes

**Uso funcional solamente:**

```jsx
// Botón primary
bg-gradient-to-br from-info-400 to-info-500

// Badge success
bg-gradient-to-br from-success-100 to-success-200

// Precio destacado
bg-gradient-to-br from-emerald-600 to-teal-600
```

**NO usar gradientes decorativos** sin función clara.

---

## Animaciones

**Transiciones:**
- Default: `duration-200`
- Hover: `hover:scale-[0.97]` (botones)
- Lift: `hover:-translate-y-0.5` (cards interactive)

**Timing:**
```jsx
transition-all duration-200
```

---

## Migración de Componentes Antiguos

### Antes (OLD):
```jsx
<button className="bg-blue-500 shadow-lg hover:shadow-xl border-2 border-blue-700">
  Click
</button>
```

### Después (NEW):
```jsx
import { Button } from '@/components/ui/button';

<Button variant="primary">
  Click
</Button>
```

### Antes (OLD):
```jsx
<div className="bg-white shadow-md hover:shadow-lg rounded-lg p-6 border border-gray-200">
  Card
</div>
```

### Después (NEW):
```jsx
import { Card } from '@/components/ui/card';

<Card interactive>
  Card
</Card>
```

---

## Archivos Modificados

### Sistema Base
- `src/styles/new-design-tokens.css` - Nuevos tokens de diseño
- `tailwind.config.js` - Configuración actualizada
- `src/index.css` - CSS base limpio

### Componentes UI
- `src/components/ui/button.jsx`
- `src/components/ui/badge.jsx`
- `src/components/ui/card.jsx`
- `src/components/ui/input.jsx`
- `src/components/ui/tabs.jsx`
- `src/components/ui/progress.jsx`

### Componentes Layout
- `src/components/layout/Header.jsx`
- `src/components/layout/Sidebar.jsx`

### Componentes de Negocio
- `src/components/ProductCard.jsx`
- `src/components/RequisitionCard.jsx`
- `src/components/dashboards/StatCard.jsx`

---

## FAQ

**¿Por qué no hay sombras?**
Las sombras agregan ruido visual innecesario. Usamos color, contraste y gradientes sutiles para crear jerarquía y separación visual.

**¿Cuándo usar gradientes?**
Solo cuando sean funcionales: botones, badges, backgrounds de precio. NO para decoración.

**¿Qué hacer con componentes no rediseñados?**
Seguir los principios de este documento:
- Eliminar sombras
- Usar componentes UI del sistema
- Aplicar paleta pastel
- Rounded-xl
- Padding consistente

**¿Cómo crear nuevos componentes?**
1. Usar componentes base (Card, Button, Badge)
2. Aplicar paleta pastel
3. Sin sombras ni bordes duros
4. Rounded-xl
5. Gradientes funcionales sutiles

---

## Soporte

Para preguntas o mejoras al sistema de diseño, crear issue en el repositorio.

**Versión:** 2.0
**Última actualización:** 2025-11-08
