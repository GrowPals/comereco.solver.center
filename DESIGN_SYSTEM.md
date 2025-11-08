# Sistema de Diseño ComerECO

## Colores

### Primarios

- **primary-500**: `#22c55e` - Verde principal
- **primary-600**: `#16a34a` - Verde hover
- **primary-700**: `#15803d` - Verde active

### Secundarios

- **blue-500**: `#3b82f6` - Azul para acciones secundarias
- **blue-600**: `#2563eb` - Azul hover

### Neutrales

- **Light mode backgrounds**: `neutral-50`, `white`
- **Dark mode backgrounds**: `neutral-900`, `neutral-950`
- **Light mode text**: `neutral-900` (principal), `neutral-600` (secundario)
- **Dark mode text**: `neutral-100` (principal), `neutral-400` (secundario)

## Tipografía

### Jerarquía

```tsx
<h1>text-2xl font-bold</h1>
<h2>text-xl font-bold</h2>
<h3>text-lg font-semibold</h3>
<p>text-sm (body normal)</p>
<label>text-xs font-semibold uppercase</label>
```

## Espaciado

### Escala recomendada

- **Entre secciones grandes**: `space-y-8` (32px)
- **Entre elementos relacionados**: `space-y-4` (16px)
- **Dentro de cards**: `p-6` (24px)
- **Entre items de lista**: `gap-3` (12px)

## Componentes

### Botones

```tsx
// Primario
<button className="btn-primary">Guardar</button>

// Secundario (outline)
<button className="btn-secondary">Cancelar</button>

// Terciario (outline neutral)
<button className="btn-outline">Filtrar</button>

// Ghost
<button className="btn-ghost">Limpiar</button>
```

### Cards

```tsx
// Card básica
<div className="card">...</div>

// Card con hover
<div className="card-hover">...</div>

// Card de métrica
<div className="metric-card">
  <p className="metric-label">Total de Usuarios</p>
  <p className="metric-value">45</p>
</div>
```

### Inputs

```tsx
<div>
  <label className="label">Email</label>
  <input type="email" className="input" />
</div>

<div>
  <label className="label">País</label>
  <select className="select">
    <option>México</option>
  </select>
</div>
```

### Empty States

```tsx
<div className="empty-state">
  <div className="empty-state-icon bg-neutral-100 dark:bg-neutral-800">
    <Icon className="w-12 h-12" />
  </div>
  <h3 className="text-2xl font-bold mb-3">Título</h3>
  <p className="text-sm text-neutral-600 dark:text-neutral-400">
    Descripción
  </p>
</div>
```

## Buenas Prácticas

### Contraste

- **Light mode**: texto principal `text-neutral-900`, secundario `text-neutral-600`
- **Dark mode**: texto principal `text-neutral-100`, secundario `text-neutral-400`
- Nunca usar `text-neutral-500` en dark mode

### Hover States

Todos los elementos interactivos deben tener hover:

```tsx
hover:bg-primary-700
hover:shadow-xl
hover:text-blue-700
```

### Focus States

Los inputs y botones tienen focus automático con la clase `.input` o `.btn-*`

### Responsive

- **Mobile-first**: clases base para mobile
- **Desktop**: usar `md:` y `lg:` prefixes
- Ejemplo:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Transiciones

Siempre agregar transiciones suaves:

```tsx
transition-all duration-200
transition-colors
transition-shadow duration-200
```

### Iconos

- **Tamaño estándar**: `w-5 h-5` o `w-6 h-6`
- **En cards de métricas**: `w-6 h-6`
- **En empty states**: `w-12 h-12`
- **Librería**: lucide-react

#### SectionIcon (insignias hero)

- Usa `<SectionIcon>` para encabezados o bloques principales; aporta presencia y refuerza jerarquía.
- Tamaños disponibles: `sm`, `md` (default) y `lg`.
- Tonos disponibles: `primary`, `sky`, `amber`, `violet`, `slate`.
- Incluye degradado, halo y badge; no necesita wrappers adicionales.

```tsx
import { User } from 'lucide-react';
import { SectionIcon } from '@/components/ui/icon-wrapper';

<SectionIcon icon={User} tone="violet" size="lg" />;
```

#### StatIcon (métricas y accesos)

- Usa `<StatIcon>` en KPI cards y accesos rápidos para iconos compactos pero expresivos.
- Props clave: `tone` (mismos tonos que SectionIcon + `rose`, `slate`), `size` (`sm`, `md`, `lg`) y `glow` para activar/desactivar el halo.

```tsx
import { FileText } from 'lucide-react';
import { StatIcon } from '@/components/ui/icon-wrapper';

<StatIcon icon={FileText} tone="amber" size="sm" glow={false} />;
```

## Checklist de Implementación

- [ ] Todos los colores definidos en tokens
- [ ] Espaciado usa múltiplos de 4 (4px, 8px, 12px, 16px, 24px, 32px)
- [ ] Tipografía sigue jerarquía clara
- [ ] Clases reutilizables en globals.css
- [ ] Componentes usan clases del sistema
- [ ] Contraste WCAG AA en todos los modos
- [ ] Hover y focus states consistentes
- [ ] Transiciones suaves en todas las interacciones
- [ ] Responsive: mobile-first approach
- [ ] Documentación clara para desarrolladores

## Archivos del Sistema

- `/src/lib/design-tokens.ts` - Tokens de diseño en TypeScript
- `/tailwind.config.js` - Configuración de Tailwind
- `/src/index.css` - Estilos globales y clases reutilizables
- `/DESIGN_SYSTEM.md` - Esta documentación

## Tests de Implementación

1. Crear componente nuevo usando solo clases del sistema
2. Verificar que no haya colores hardcodeados (ej. `#22c55e`)
3. Todos los botones usan clases `btn-*`
4. Todas las cards usan clase `card` o `card-hover`
5. Inputs usan clase `input`
6. Empty states usan estructura estándar
