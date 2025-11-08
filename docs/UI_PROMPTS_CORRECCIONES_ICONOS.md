# 🎯 Prompts de Corrección Estética (Playwright Audit v3)

Este documento agrupa instrucciones listas para pasar a un agente/diseñador. No incluyen código, solo lineamientos concretos basados en las capturas generadas con Playwright (`.playwright-mcp/audit-v3/*`).

---

## 1. Sistema Iconográfico y Cromático

- **Referencia visual:** `desktop-light__dashboard.png`, `desktop-light__requisitions.png`, `desktop-light__reports.png` + equivalentes dark y mobile.
- **Encargo:** Reemplazar los íconos circulares con glow azul por un set corporativo consistente apto para light/dark.
- **Instrucciones:**
  1. Define una paleta jerárquica con tokens (`primary/500`, `neutral/200`, `warning/600`, etc.) y su versión dark. Incluye degradés solo donde aporten valor (p. ej. iconos de estado financiero).
  2. Diseña pictogramas outline para cada dato (folio, solicitante, fecha, monto, frecuencia, acciones) con grosor uniforme y tamaños 20/24 px; documenta spacing respecto al texto.
  3. Establece reglas de estado (default, hover, pressed, disabled) usando leves cambios de color y sombras coherentes.
  4. Explica cómo aplicar los tokens en badges (`Pendiente`, `Frecuente`, `99+`) para que no compitan con los CTAs.

## 2. Rediseño de Cards y Métricas

- **Referencia:** `desktop-light__requisitions.png`, `desktop-light__approvals.png`, `desktop-light__templates.png`, `desktop-light__reports.png`, `desktop-dark__*.png`.
- **Encargo:** Construir un sistema de superficies (cards) con elevaciones controladas y jerarquías claras.
- **Instrucciones:**
  1. Define escalas `surface/0` (sin sombra) hasta `surface/3` (tarjetas destacadas) con sombras suaves y radios consistentes.
  2. Sustituye bordes completos/gradients por indicadores discretos de estado: barra lateral de 4px o badge alineada al título.
  3. Reorganiza el contenido interno siguiendo una retícula de 8px (título → metadata → monto → acciones). Documenta ejemplos desktop/mobile.
  4. Describe variantes para cards de estado (pendiente/aprobada/rechazada) con tokens semánticos y cómo cambian en dark mode.

## 3. CTAs y Navegación Responsive

- **Referencia:** `mobile-light__*.png`, `mobile-dark__*.png`, `desktop-light__reports.png`.
- **Encargo:** Uniformar botones primarios/secundarios y limpiar header + navegación inferior.
- **Instrucciones:**
  1. Define tokens de botón (`primary`, `secondary`, `ghost`, `danger`) con colores, radios, sombras y estados (hover/focus/pressed). Incluye variantes para dark mode.
  2. Rediseña el header responsive reduciendo altura: integra búsqueda, indicadores y switch de tema sin cápsulas redundantes; especifica espaciamiento y tamaños.
  3. Documenta un bottom navigation coherente: iconos outline, etiquetas cortas, botón central `+` con tooltip/label y estados accesibles.
  4. Establece estilos para badges de notificación (99+, 20) y chips (“Frecuente”, “Pendiente”) reutilizando la nueva paleta.

## 4. Filtros, Tablas y Textos Auxiliares

- **Referencia:** `desktop-light__requisitions.png` (filtros + tabla Actividad Reciente), `mobile-light__requisitions.png`, `desktop-light__reports.png`.
- **Encargo:** Modernizar filtros y tablas para la lectura en desktop/mobile.
- **Instrucciones:**
  1. Propón chips o dropdowns compactos con iconografía discreta; documenta estados (selected, hover, disabled) y tamaños.
  2. Reestiliza cabeceras de tabla con iconos de ordenamiento minimalistas y alineación perfecta; indica spacing entre columnas y altura por fila.
  3. Localiza el contenido (evitar “ordered”) y define reglas de casing en badges.
  4. Define patrones de “estado vacío” para secciones como “Usuarios Más Activos” o tablas sin datos, asegurando que se perciba intencional.

## 5. Centro de Ayuda y Bloques Informativos

- **Referencia:** `desktop-light__help.png`, `desktop-dark__help.png`, `mobile-light/dark__help.png`.
- **Encargo:** Dar identidad propia al centro de soporte.
- **Instrucciones:**
  1. Diseña una cabecera específica para soporte (ilustración simple o ícono dedicado) con copy empático; evita repetir el mismo glow que en otras secciones.
  2. Convierte los módulos de contacto/chat en cards funcionales con CTA claros (“Enviar correo”, “Abrir chat”), estados deshabilitados comprensibles y metadata (SLA, horario).
  3. Reestructura el FAQ con tabs o categorías visibles, divisores claros y badges según rol; define cómo se ven los acordeones en light/dark.
  4. Añade mecanismos para proteger el email (botón copiar, ofuscación) y enlaces a documentación relevante.

---

> **Nota:** Estos prompts se basan en las capturas generadas el 07 Nov 2025 mediante `scripts/playwright-audit-run.mjs`. Cualquier cambio posterior en la UI requiere repetir el barrido para validar ajustes.
