# 📚 Resumen Ejecutivo UX/UI – Playwright Audit v3

**Fecha:** 07-Nov-2025  
**Cobertura:** Desktop y Mobile (Light/Dark) para Dashboard, Requisiciones, Aprobaciones, Plantillas, Reportes y Centro de Ayuda.  
**Fuente:** Capturas automáticas en `.playwright-mcp/audit-v3/` generadas con `scripts/playwright-audit-run.mjs`.

---

## 1. Identidad Visual y Paleta
- Iconografía circular con glow azul se repite en toda la app, lo que la hace ver infantil y sin jerarquía.
- Títulos bicolor (negro + azul eléctrico) y badges rojos saturados generan ruido visual.
- En dark mode domina un solo tono azul profundo; faltan superficies diferenciadas y tokens claros para contraste.

## 2. Superficies y Cards
- Cards de requisiciones, aprobaciones y plantillas usan bordes gruesos, degradados y sombras inconsistentes.
- Estado de las requisiciones depende solo del color del borde; no hay indicadores semánticos reutilizables.
- En mobile, los cards ocupan demasiado espacio y duplican información (iconos idénticos, texto redundante).

## 3. Navegación y CTAs
- Header con buscador, íconos circulares y badges “99+” ocupa demasiada altura y no escala bien a mobile.
- Bottom navigation mezcla iconos rellenos/outline y el botón central `+` no tiene etiqueta accesible.
- Botones principales usan gradientes intensos y sombras pesadas; no existe un sistema coherente de CTAs.

## 4. Filtros, Tablas y Textos Auxiliares
- Filtros actuales son cápsulas con sombras internas; lucen retro y ocupan espacio.
- Tablas (Actividad Reciente, Reportes) tienen iconos de ordenamiento grandes, texto en inglés (“ordered”) y espaciados irregulares.
- Secciones como “Usuarios Más Activos” y “Actualizado” carecen de estados vacíos o visuales atractivos.

## 5. Centro de Ayuda y Bloques Informativos
- Reutiliza la misma cabecera/icónicos que el resto de la app, sin transmitir calidez ni profesionalismo.
- Cards de contacto/chat son casi fantasma; los CTA son simples enlaces subrayados.
- FAQ carece de divisores claros; en dark mode el texto se pierde y no hay badges por rol.

## 6. Impacto por Modo / Dispositivo
- **Desktop Light:** Sobresaturación de gradientes y glow; falta retícula común.
- **Desktop Dark:** Monocromático, bajo contraste, badges sin adaptación (rojos siguen sobre fondo claro).
- **Mobile Light/Dark:** Header y bottom nav dominan la pantalla; botones gigantes y filtros con demasiado padding.

## 7. Recomendaciones Clave
1. Definir un sistema visual unificado (paleta, iconografía, superficies) que funcione en ambos modos.
2. Replantear tarjetas y KPIs con barras laterales o badges semánticos en vez de bordes completos.
3. Simplificar header/bottom nav y estandarizar CTAs (tokens `primary/secondary/ghost/danger` + estados).
4. Modernizar filtros y tablas con chips/drops compactos y cabeceras minimalistas.
5. Dar identidad propia al Centro de Ayuda (ilustración, CTA reales, FAQ organizado).

> Detalles completos de cada hallazgo y prompts accionables se encuentran en `docs/UI_PROMPTS_CORRECCIONES_ICONOS.md`.
