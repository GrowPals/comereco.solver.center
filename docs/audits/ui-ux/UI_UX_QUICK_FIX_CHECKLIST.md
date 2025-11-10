# CHECKLIST RÁPIDO - PROBLEMAS CRÍTICOS DE UI/UX

## 🔴 CRÍTICO - HACERLO HOY (30 minutos aprox)

### Dark Mode Contraste
- [ ] **src/index.css** (Línea 245): `--border: rgba(95, 138, 210, 0.22)` → `0.35`
- [ ] **src/index.css** (Línea 246): `--input: rgba(95, 138, 210, 0.28)` → `0.42`
- [ ] **src/index.css** (Línea 218): `--card: #0b1626` → `#132345`
- [ ] **src/index.css** (Línea 228): `--secondary-foreground: #d9e6ff` → `#e6f0ff`
- [ ] **src/index.css** (Línea 240): `--muted-foreground: rgba(..., 0.8)` → `0.95`

**Impacto:** 🔴 CRÍTICO - Afecta legibilidad en dark mode para todos los usuarios

---

## 🟠 ALTA PRIORIDAD - ESTA SEMANA (2-3 horas aprox)

### Alineación Visual
- [ ] **src/components/ProductCard.jsx** (L:185-217): Fijar altura del contenedor de cantidad
  ```jsx
  <div className="... h-[52px]">  <!-- Agregar altura fija -->
  ```

- [ ] **src/components/layout/BottomNav.jsx** (L:44,97): Estandarizar tamaño de botones
  ```jsx
  className="nav-link-base relative flex h-[44px] w-[44px]"  <!-- h-[44px] exacto -->
  ```

### Accesibilidad
- [ ] **src/components/layout/Sidebar.jsx** (L:188): Agregar title attribute
  ```jsx
  <p className="truncate text-sm text-muted-foreground" title={userEmail}>
  ```

- [ ] **src/components/layout/Header.jsx** (L:94): Agregar truncate
  ```jsx
  <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">
  ```

- [ ] **src/components/layout/Sidebar.jsx** (L:23): Agregar aria-current
  ```jsx
  <NavLink to={to} aria-current={isActive ? "page" : undefined}>
  ```

### Interactividad
- [ ] **src/components/ProductCard.jsx** (L:170): Mejorar disabled state del botón
  ```jsx
  disabled={isAdding || !isInStock}
  className={cn(
    'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-semibold transition-all',
    isInStock 
      ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]'
      : 'cursor-not-allowed bg-muted/40 text-muted-foreground/60 opacity-60'
  )}
  ```

---

## 🟡 MEDIA PRIORIDAD - PRÓXIMAS SEMANAS (4-5 horas aprox)

### Animaciones (Móvil)
- [ ] **src/components/RequisitionCard.jsx** (L:95): Condicionar animación hover a desktop
- [ ] **src/components/ProductCard.jsx** (L:83): Cambiar de translate a shadow en hover
- [ ] **src/components/layout/Sidebar.jsx** (L:155): Ajustar duración de transición

### Responsive
- [ ] **src/components/dashboards/StatCard.jsx** (L:34): Hacer font-size responsive
  ```jsx
  <div className="mb-2 text-2xl sm:text-3xl font-extrabold">
  ```

- [ ] **src/components/layout/Header.jsx** (L:68): Hacer logo responsive
  ```jsx
  <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
  ```

### Tipografía
- [ ] **src/components/ui/input.jsx** (L:25): Ajustar placeholder en dark mode
- [ ] **src/components/layout/GlobalSearch.jsx** (L:169): Añadir truncate a SKU
- [ ] **src/components/layout/NotificationCenter.jsx** (L:55): Añadir line-clamp al título

---

## 📊 ESTADÍSTICAS DEL INFORME

| Categoría | Total | Críticos | Altos | Medios | Bajos |
|-----------|-------|----------|-------|--------|-------|
| Alineación | 8 | 0 | 2 | 3 | 3 |
| Tipografía | 11 | 0 | 1 | 3 | 7 |
| Contraste/A11y | 9 | 5 | 2 | 1 | 1 |
| Componentes | 10 | 0 | 3 | 4 | 3 |
| Visual | 6 | 0 | 0 | 3 | 3 |
| Responsive | 2 | 0 | 0 | 1 | 1 |
| Dark Mode | 1 | 1 | 0 | 0 | 0 |
| **TOTAL** | **47** | **6** | **8** | **15** | **18** |

---

## 🎯 PLAN DE EJECUCIÓN RECOMENDADO

### Sprint 1 (Hoy - 30 min)
Arreglarprobemas críticos de dark mode que afectan a todos los usuarios:
- Dark mode contrast issues

### Sprint 2 (Esta semana - 2-3 horas)
Problemas altos de usabilidad e interactividad:
- Alineación visual
- Accesibilidad básica (aria-labels)
- Estados disabled de botones

### Sprint 3 (Próximas semanas - 4-5 horas)
Mejoras de experiencia y responsive:
- Animaciones optimizadas para móvil
- Responsive design mejorado
- Tipografía escalable

---

## 📝 NOTAS IMPORTANTES

1. **Dark Mode es CRÍTICO**: 5 de 6 problemas críticos están en dark mode
2. **Contraste WCAG**: No cumple actualmente con WCAG AA en varias combinaciones
3. **Móvil**: Varias animaciones no son apropiadas para touch
4. **Accesibilidad**: Algunos elementos necesitan aria-labels y aria-current

---

## ✅ VERIFICACIÓN FINAL

Después de aplicar los fixes:
- [ ] Revisar dark mode con herramienta de contraste (webAIM)
- [ ] Probar navegación con keyboard (Tab, Enter, Escape)
- [ ] Verificar en móvil (iOS y Android)
- [ ] Screen reader test (opcional)
- [ ] Lighthouse audit

