# AUDITORÍA EXHAUSTIVA DE UI/UX - ComerECO Webapp

**Fecha:** Noviembre 7, 2025
**Nivel de Profundidad:** Very Thorough
**Stack:** React 18.3.1 + Tailwind CSS + Radix UI

---

## RESUMEN EJECUTIVO

Se encontraron **47 problemas críticos y de mediano impacto** distribuidos en las siguientes categorías:

- **Alineación y Posicionamiento:** 8 problemas
- **Tipografía y Texto:** 11 problemas  
- **Contraste y Accesibilidad:** 9 problemas
- **Componentes Interactivos:** 10 problemas
- **Comportamiento Visual:** 6 problemas
- **Responsive Design:** 2 problemas
- **Dark Mode:** 1 problema

---

## 1. PROBLEMAS DE ALINEACIÓN Y POSICIONAMIENTO

### 1.1 Sidebar - Inconsistencia en padding del botón cerrar
**Archivo:** `src/components/layout/Sidebar.jsx`
**Líneas:** 167-174
**Problema:** El botón de cerrar menú tiene `shadow-none` aplicado directamente pero también `hover:shadow-none`, lo que causa redundancia visual. El padding también es inconsistente con otros botones de la aplicación.

```jsx
<button
  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 shadow-none hover:shadow-none active:shadow-none dark:border-border dark:text-muted-foreground dark:hover:bg-muted/40 dark:shadow-[0_20px_46px_rgba(5,12,28,0.5)]"
```

**Impacto:** Bajo
**Solución Recomendada:**
```jsx
// Eliminar redundancia y usar token consistente
className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:bg-muted/60 dark:border-border dark:text-muted-foreground dark:hover:bg-muted/40"
```

---

### 1.2 Header - Elementos horizontalmente desalineados en móvil
**Archivo:** `src/components/layout/Header.jsx`
**Líneas:** 117-127
**Problema:** En la versión móvil, los elementos están en una única fila con gap-3, pero el GlobalSearch ocupa flex-1 dejando espacio inconsistente. El spacing no se adapta bien cuando algunos elementos están ocultos.

**Impacto:** Bajo
**Solución Recomendada:**
```jsx
// Usar spacing scale consistente
<div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
  <div className="flex-1 min-w-0">
    <GlobalSearch variant="mobile" />
  </div>
  <CompanySwitcher variant="icon" />
  {/* ... resto */}
</div>
```

---

### 1.3 ProductCard - Desalineación en contenedor inferior
**Archivo:** `src/components/ProductCard.jsx`
**Líneas:** 185-217
**Problema:** El contenedor de cantidad tiene `surface-card p-2` pero los botones dentro tienen alturas diferentes (h-11 vs el span que no tiene altura fija). Causa misalineación visual en el botón de cantidad.

**Impacto:** Medio
**Solución Recomendada:**
```jsx
// Asegurar alturas consistentes
<div className="flex w-full items-center justify-between gap-3 rounded-2xl surface-card p-2 h-[52px]">
  <button className="flex h-11 w-11 items-center justify-center...">
    {/* ... */}
  </button>
  <span className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-xl...">
    {currentQuantity}
  </span>
  <button className="flex h-11 w-11 items-center justify-center...">
    {/* ... */}
  </button>
</div>
```

---

### 1.4 RequisitionCard - Inconsistencia gap móvil vs desktop
**Archivo:** `src/components/RequisitionCard.jsx`
**Líneas:** 111-112
**Problema:** El gap es 6 unidades en todos los tamaños, pero en móvil con flex-col esto crea espaciado demasiado grande.

**Impacto:** Bajo
**Solución Recomendada:**
```jsx
<div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
```

---

### 1.5 BottomNav - Botones sin min-width consistente
**Archivo:** `src/components/layout/BottomNav.jsx`
**Líneas:** 44, 97
**Problema:** Los botones de navegación tienen `min-h-[44px] min-w-[44px]` pero el tamaño real varía debido a padding, causando misalineación en grid de 5 columnas.

**Impacto:** Medio
**Solución Recomendada:**
```jsx
// Usar clases consistentes
className="nav-link-base relative flex h-[44px] w-[44px] items-center justify-center transition-transform duration-200"
```

---

### 1.6 StatCard - Falta de alineación vertical correcta
**Archivo:** `src/components/dashboards/StatCard.jsx`
**Líneas:** 22-39
**Problema:** El CardHeader tiene `space-y-0` pero CardContent no tiene padding inferior consistente. La barra de gradiente tiene comportamiento hover que cambia layout.

**Impacto:** Bajo
**Solución Recomendada:**
```jsx
<CardContent className="relative z-10 pb-4">
  {/* ... */}
  <div className="mt-4 h-1 w-16 rounded-full bg-gradient-primary transition-all duration-300 group-hover:w-full"></div>
</CardContent>
```

---

### 1.7 GlobalSearch - PopoverContent desalineado en móvil
**Archivo:** `src/components/layout/GlobalSearch.jsx`
**Líneas:** 127-132
**Problema:** El PopoverContent cambia alignment y ancho según variante, pero el padding interno es siempre p-2, causando inconsistencia.

**Impacto:** Medio

---

### 1.8 FAB - Posicionamiento incorrecto respecto a BottomNav
**Archivo:** `src/components/FAB.jsx`
**Línea:** 12
**Problema:** El FAB usa cálculos de bottom aproximados que pueden no coincidir perfectamente con la altura real de BottomNav.

**Impacto:** Medio

---

## 2. PROBLEMAS DE TIPOGRAFÍA Y TEXTO

### 2.1 Sidebar - Truncado sin titulo (title attribute)
**Archivo:** `src/components/layout/Sidebar.jsx`
**Línea:** 188
**Problema:** El email del usuario tiene `truncate` pero sin `title` attribute, sin tooltip cuando está truncado.

```jsx
<p className="truncate text-sm text-muted-foreground" title={userEmail}>{userEmail}</p>
```

---

### 2.2 ProductCard - Line-height inconsistente
**Archivo:** `src/components/ProductCard.jsx`
**Línea:** 137
**Problema:** El nombre del producto usa `leading-snug` (1.375) pero el body pequeño no especifica line-height.

---

### 2.3 Header - Nombre de usuario sin max-width
**Archivo:** `src/components/layout/Header.jsx`
**Línea:** 94
**Problema:** El nombre del usuario en dropdown puede desbordarse en nombres muy largos.

---

### 2.4 Input - Placeholder color inconsistente en dark mode
**Archivo:** `src/components/ui/input.jsx`
**Línea:** 25
**Problema:** El placeholder tiene `placeholder:text-neutral-400` pero debería ser más visible en dark mode.

---

### 2.5 GlobalSearch - Texto sin ellipsis consistente en resultados
**Archivo:** `src/components/layout/GlobalSearch.jsx`
**Líneas:** 168-169
**Problema:** No todos los textos tienen truncate aplicado.

---

### 2.6 Button - Text color inconsistente con estados disabled
**Archivo:** `src/components/ui/button.jsx`
**Línea:** 8
**Problema:** El buttonVariants define `disabled:opacity-50` pero no hay consistencia visual completa.

---

### 2.7-2.11 Problemas adicionales menores
- RequisitionCard: Truncado inconsistente
- StatCard: Font size no responsive
- NotificationCenter: Línea clamp inconsistente
- Sidebar: Badge text size
- Input: Error message color en dark mode

---

## 3. PROBLEMAS DE CONTRASTE Y ACCESIBILIDAD

### 3.1 Dark Mode - Contraste insuficiente en bordes (CRÍTICO)
**Archivo:** `src/index.css`
**Líneas:** 245-252
**Problema:** Los bordes en dark mode usan `rgba(95, 138, 210, 0.22)` que es demasiado transparente (22% de opacidad). No cumple WCAG AA sobre fondos azul oscuro.

**Impacto:** Crítico
**Solución Recomendada:**
```css
--border: rgba(95, 138, 210, 0.35); /* Aumentar a 35% */
--input: rgba(95, 138, 210, 0.42); /* Aumentar a 42% */
```

---

### 3.2 Dark Mode - Fondos de elemento sin suficiente contraste (CRÍTICO)
**Archivo:** `src/index.css`
**Línea:** 218-219
**Problema:** La tarjeta en dark mode usa `#0b1626` sobre fondo `#0f1c2d` que tienen muy poco contraste (ratio ~1.5:1).

**Impacto:** Crítico
**Solución Recomendada:**
```css
--card: #132345; /* Aumentar contraste */
```

---

### 3.3 Dark Mode - Texto secundario ilegible (CRÍTICO)
**Archivo:** `src/index.css`
**Línea:** 228
**Problema:** El texto secundario `#d9e6ff` sobre fondo `#0b1626` tiene contraste muy bajo.

**Impacto:** Crítico
**Solución Recomendada:**
```css
--secondary-foreground: #e6f0ff; /* Más claro */
```

---

### 3.4 Dark Mode - Muted foreground poco visible
**Archivo:** `src/index.css`
**Línea:** 240
**Problema:** `rgba(201, 215, 242, 0.8)` resulta en un color muy desaturado.

**Impacto:** Medio
**Solución Recomendada:**
```css
--muted-foreground: rgba(201, 215, 242, 0.95); /* Aumentar a 95% */
```

---

### 3.5 Button - Focus ring no suficientemente visible en dark mode
**Archivo:** `src/components/ui/button.jsx`
**Línea:** 8
**Problema:** El ring es `ring-primary-200` que es muy clara sobre fondo azul oscuro.

**Impacto:** Medio

---

### 3.6-3.9 Problemas menores de accesibilidad
- SearchBar: Ícono sin aria-hidden
- FAB: aria-label genérico
- StatCard: Icon color en dark mode
- Input: Success message contrast

---

## 4. PROBLEMAS EN COMPONENTES INTERACTIVOS

### 4.1 ProductCard - Botón agregar sin disabled style claro
**Archivo:** `src/components/ProductCard.jsx`
**Línea:** 170-172
**Problema:** El botón deshabilitado cuando no hay stock usa estilos poco visibles.

**Impacto:** Medio

### 4.2-4.10 Problemas interactivos adicionales
- Input sin feedback táctil móvil
- Button sin distinción en dark mode
- Sidebar MenuItem sin aria-current
- BottomNav sin suficiente spacing de touch
- Header dropdown sin documentación de escape
- GlobalSearch sin focus automático
- FAB sin indicación de hover en móvil
- ProductCard botón favorito sin animación
- Select sin estilos disabled

---

## 5. PROBLEMAS DE COMPORTAMIENTO VISUAL

### 5.1 ProductCard - Animación hover causa salto de layout
**Archivo:** `src/components/ProductCard.jsx`
**Línea:** 83
**Problema:** El `hover:-translate-y-1` causa movimiento de tarjeta en grillas.

**Impacto:** Medio

### 5.2-5.6 Otros problemas visuales
- Button gradiente muy brillante en dark mode
- Sidebar animación muy rápida
- GlobalSearch spinner parpadeo
- BottomNav animación sin restricción
- RequisitionCard animación sin atenuamiento

---

## 6. PROBLEMAS DE RESPONSIVE DESIGN

### 6.1 Header - Texto logo muy pequeño en móvil
**Archivo:** `src/components/layout/Header.jsx`
**Línea:** 68-70
**Problema:** Logo "ComerECO" usa `text-xl` que es pequeño en móvil.

---

### 6.2 RequisitionCard - Estructura móvil no optimizada
**Archivo:** `src/components/RequisitionCard.jsx`
**Línea:** 112
**Problema:** Los elementos pueden estar apretados en pantallas pequeñas.

---

## 7. DARK MODE - PROBLEMA CRÍTICO GLOBAL

### 7.1 Index.css - Contraste global insuficiente
**Archivo:** `src/index.css`
**Líneas:** 202-305
**Problema:** El sistema de dark mode usa opacidades muy bajas (22%, 28%, 32%) que no cumplen WCAG AA en muchas combinaciones.

**Impacto:** CRÍTICO - MÁXIMA PRIORIDAD

**Solución Recomendada:**
```css
.dark {
  --border: rgba(95, 138, 210, 0.35);
  --input: rgba(95, 138, 210, 0.42);
  --muted-foreground: rgba(201, 215, 242, 0.95);
  --card: #132345;
  --secondary-foreground: #e6f0ff;
}
```

---

## RESUMEN DE RECOMENDACIONES

### MÁXIMA PRIORIDAD (Crítico - Hacer hoy):
1. ✅ Aumentar contraste en dark mode (todos los tokens)
2. ✅ Revisar TODAS las combinaciones texto/fondo en dark mode
3. ✅ Hacer focus states más visibles
4. ✅ Arreglar desalineaciones visibles

### ALTA PRIORIDAD (Esta semana):
1. ✅ Agregar aria-labels faltantes
2. ✅ Mejorar feedback visual en botones disabled
3. ✅ Optimizar animaciones para móvil
4. ✅ Normalizar espaciados

### MEDIA PRIORIDAD (Próximas semanas):
1. ✅ Agregar title attributes
2. ✅ Mejorar responsive design
3. ✅ Refinar transiciones
4. ✅ Documentar pautas

---

## ENLACES DE REFERENCIA

- WCAG 2.1 Contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- Radix UI A11y: https://www.radix-ui.com/docs/primitives/overview/accessibility
- Tailwind A11y: https://tailwindcss.com/docs/features/typography
