# Prompts de Corrección UX/UI - ComerECO WebApp

**Fecha de Auditoría**: 7 de Noviembre 2025
**Alcance**: Análisis completo en Desktop (Light/Dark) y Mobile (Light/Dark)
**Objetivo**: Prompts concretos para mejorar la experiencia de usuario sin especificar implementación técnica

---

## 1. JERARQUÍA VISUAL Y TIPOGRAFÍA

### Prompt 1.1: Simplificar títulos principales
**Problema**: Los títulos de página usan dos colores (texto negro + palabra destacada en azul) que compiten entre sí y rompen la lectura natural.

**Corrección solicitada**:
Rediseñar los títulos principales de todas las páginas para que usen un único tratamiento visual. El énfasis debe lograrse mediante tamaño, peso o posición, no mediante color dual. Ejemplos afectados: "Panel Ejecutivo", "Catálogo de productos", "Gestionar Productos", "Proyectos".

### Prompt 1.2: Establecer sistema tipográfico consistente
**Problema**: Existe inconsistencia en tamaños de fuente, pesos y espaciados entre diferentes secciones.

**Corrección solicitada**:
Definir y aplicar una escala tipográfica coherente con 4-5 niveles máximo (Heading 1, Heading 2, Body, Caption, Small). Asegurar que todos los textos de la misma jerarquía usen el mismo tamaño, peso y espaciado en todas las páginas.

### Prompt 1.3: Mejorar legibilidad de textos secundarios
**Problema**: Algunos textos auxiliares (descripciones, subtítulos) tienen bajo contraste especialmente en modo dark.

**Corrección solicitada**:
Revisar y ajustar el contraste de todos los textos secundarios para cumplir WCAG AA mínimo (4.5:1). Priorizar legibilidad sobre estética minimalista. Aplicar en descripciones de proyectos, subtítulos de secciones y metadata.

---

## 2. ESPACIADO Y RESPIRACIÓN VISUAL

### Prompt 2.1: Unificar espaciado entre secciones
**Problema**: El espaciado vertical entre secciones es inconsistente, algunas áreas se sienten apretadas mientras otras tienen demasiado espacio.

**Corrección solicitada**:
Implementar un sistema de espaciado vertical basado en múltiplos de 8px. Definir 3 tamaños: compacto (16px), estándar (24px), amplio (40px). Aplicar consistentemente en todas las páginas entre secciones, cards y grupos de contenido.

### Prompt 2.2: Añadir respiración en cards de información densa
**Problema**: Las cards con múltiples datos (requisiciones, proyectos) tienen mucha información sin suficiente espacio interno.

**Corrección solicitada**:
Aumentar padding interno de todas las cards con información densa. Añadir separadores visuales sutiles entre grupos de información dentro de la misma card. Considerar agrupar datos relacionados con micro-espaciado diferenciado.

---

## 3. NAVEGACIÓN Y WAYFINDING

### Prompt 3.1: Mejorar indicador de página activa en sidebar
**Problema**: El indicador de página activa (barra azul lateral) es funcional pero podría ser más prominente.

**Corrección solicitada**:
Rediseñar el indicador de navegación activa para que sea inmediatamente obvio cuál es la página actual. Considerar background sutil en todo el elemento, no solo barra lateral. Mantener suficiente contraste con elementos inactivos.

### Prompt 3.2: Optimizar área de toque en navegación mobile
**Problema**: Los botones de la navegación inferior mobile (bottom nav) tienen áreas de toque que parecen menores a 48x48px recomendados.

**Corrección solicitada**:
Verificar y ajustar todas las áreas táctiles del bottom navigation para cumplir el mínimo de 48x48px. Incrementar tamaño de iconos o padding según sea necesario. Asegurar espacio adecuado entre botones para evitar toques accidentales.

### Prompt 3.3: Reconsiderar botón central "+" en bottom nav
**Problema**: El botón central flotante en bottom nav interrumpe la simetría visual y puede causar toques accidentales.

**Corrección solicitada**:
Evaluar si el botón "Agregar" realmente merece la posición central prominente, o si debería integrarse al mismo nivel que otros items. Si se mantiene, asegurar que está suficientemente elevado y separado para evitar errores, y que su función sea universal (no solo "ir a catálogo").

---

## 4. FEEDBACK VISUAL E INTERACTIVIDAD

### Prompt 4.1: Mejorar feedback de botón favoritos
**Problema**: El botón de corazón para añadir favoritos en productos no tiene transición visual clara al activarse/desactivarse.

**Corrección solicitada**:
Añadir micro-animación al presionar favorito (escala o rebote sutil). El estado activo/inactivo debe ser inmediatamente obvio sin necesidad de recordar el estado anterior. Considerar feedback háptico en mobile.

### Prompt 4.2: Indicador de items en carrito desde catálogo
**Problema**: Desde el catálogo de productos no es obvio cuántos items de cada producto ya están en el carrito.

**Corrección solicitada**:
Mostrar contador visible en cada producto que ya tiene items en carrito. Diferenciarlo visualmente del botón "Agregar". Permitir ajustar cantidad directamente desde el catálogo sin perder contexto.

### Prompt 4.3: Estados de carga y transiciones
**Problema**: No está claro el feedback durante operaciones asíncronas (carga de datos, guardado, etc).

**Corrección solicitada**:
Definir e implementar estados de carga consistentes para todas las operaciones: skeletons para carga inicial, spinners para operaciones en progreso, toast notifications para confirmaciones. Evitar bloquear toda la UI innecesariamente.

---

## 5. BADGES, ESTADOS Y ETIQUETAS

### Prompt 5.1: Consistencia en capitalización de estados
**Problema**: Estados de requisiciones mezclan estilos: "ordered" (minúsculas inglés), "Ordenada" (mayúscula español), "Aprobada" (mayúscula).

**Corrección solicitada**:
Estandarizar todos los badges de estado a español con primera letra mayúscula. Lista completa: Borrador, Enviada, Aprobada, Rechazada, Ordenada, En Proceso, Completada. Aplicar en toda la aplicación.

### Prompt 5.2: Mejorar contraste de badges de estado
**Problema**: Algunos badges (especialmente estados intermedios) no tienen suficiente contraste en modo dark.

**Corrección solicitada**:
Revisar y ajustar colores de todos los badges de estado para cumplir WCAG AA. Asegurar que cada estado es fácilmente distinguible de otros. Usar combinaciones de color + icono cuando sea posible para mayor accesibilidad.

### Prompt 5.3: Reducir competencia de atención en badges numéricos
**Problema**: Notificaciones (20) y carrito (99+) ambos usan badges rojos que compiten por atención constantemente.

**Corrección solicitada**:
Diferenciar visualmente badges informativos de badges de acción requerida. Considerar usar rojo solo para notificaciones que requieren atención inmediata. El contador de carrito podría usar color primario (azul) en vez de rojo.

---

## 6. TABLAS Y VISUALIZACIÓN DE DATOS

### Prompt 6.1: Mejorar separación visual entre filas de tabla
**Problema**: Tablas densas (productos, usuarios) tienen poca separación visual entre filas.

**Corrección solicitada**:
Añadir separadores sutiles entre filas o implementar hover row highlighting más obvio. En tablas largas, considerar alternancia sutil de background (zebra striping) especialmente en modo light. Incrementar padding vertical de celdas.

### Prompt 6.2: Optimizar tablas para mobile con contexto preservado
**Problema**: Tablas en mobile reducen columnas pero pierden contexto importante (proyecto, fecha en actividad reciente).

**Corrección solicitada**:
Rediseñar presentación de datos tabulares en mobile usando cards expandibles o formato lista con todos los datos importantes visibles. Permitir tap para expandir detalles sin navegar a otra página. Mantener capacidad de ordenamiento.

### Prompt 6.3: Añadir contexto a métricas del dashboard
**Problema**: Las cards de estadísticas muestran números sin tendencias, comparativas o contexto temporal.

**Corrección solicitada**:
Añadir indicadores de tendencia a cada métrica (↑↓ con porcentaje). Incluir comparativa vs periodo anterior. Micro-gráficos (sparklines) opcionales para mostrar tendencia de últimos días/semanas. Hacer números más accionables.

---

## 7. FORMULARIOS Y ENTRADA DE DATOS

### Prompt 7.1: Mejorar alineación de switch "INCLUIR SIN STOCK"
**Problema**: El toggle switch y su label no están óptimamente alineados, el label en mayúsculas es agresivo.

**Corrección solicitada**:
Alinear verticalmente switch y texto. Cambiar label a sentence case: "Incluir productos sin stock". Asegurar que el área de toque incluye tanto el switch como el label completo para mejor UX mobile.

### Prompt 7.2: Placeholder más específico en búsqueda
**Problema**: El placeholder de búsqueda es genérico ("Buscar requisiciones, productos...").

**Corrección solicitada**:
Hacer placeholder contextual a la página actual. En catálogo: "Buscar por nombre o SKU", en requisiciones: "Buscar por folio o proyecto", etc. Añadir atajos de teclado hint en desktop (ej: "⌘K para buscar").

### Prompt 7.3: Diseñar patrón consistente para formularios mobile
**Problema**: No hay patrón visual claro para formularios complejos en mobile (crear producto, nueva requisición).

**Corrección solicitada**:
Definir patrón mobile-first para formularios: campos full-width con labels flotantes, agrupación clara por secciones con headers, botones de acción sticky al fondo. Implementar progreso visual para formularios multi-paso.

---

## 8. SELECTOR DE EMPRESA Y MULTI-TENANT

### Prompt 8.1: Hacer selector de empresa más prominente
**Problema**: El selector de empresa actual es pequeño y podría pasar desapercibido, siendo una función crítica.

**Corrección solicitada**:
Rediseñar selector de empresa para que sea más obvio y accesible. Mostrar nombre de empresa actual de forma prominente. Al cambiar, feedback visual claro de que el contexto completo cambió (posible animación sutil de transición).

### Prompt 8.2: Indicador visual de contexto de empresa
**Problema**: No hay recordatorio constante de en cuál empresa estás trabajando dentro de las páginas.

**Corrección solicitada**:
Añadir indicador sutil pero persistente del contexto actual de empresa. Puede ser en topbar, breadcrumb ampliado o subtle background tint diferenciado por empresa. Especialmente importante en vistas de listado y dashboards.

---

## 9. ACCESIBILIDAD Y USABILIDAD

### Prompt 9.1: Añadir skip links funcionales
**Problema**: Existen skip links ("Saltar al contenido principal") pero no están probados completamente.

**Corrección solicitada**:
Verificar que todos los skip links funcionen correctamente en navegación por teclado. Hacerlos visibles al recibir focus. Asegurar que el foco se mueve correctamente al contenido/navegación al activarlos.

### Prompt 9.2: Mejorar navegación por teclado en modals
**Problema**: No está verificado el trap de foco en modals y dialogs.

**Corrección solicitada**:
Implementar focus trapping correcto en todos los modals. Al abrir: foco va al primer elemento interactivo. Tab/Shift+Tab cicla solo dentro del modal. Escape cierra. Al cerrar: foco regresa al elemento que lo abrió.

### Prompt 9.3: Aria labels descriptivos en iconos
**Problema**: Muchos botones solo de icono podrían no tener labels descriptivos para screen readers.

**Corrección solicitada**:
Auditar todos los botones de solo-icono y asegurar aria-labels descriptivos. Ejemplo: no solo "Buscar" sino "Buscar productos", no "Filtrar" sino "Abrir filtros de requisiciones". Contexto específico mejora navegación con lector de pantalla.

---

## 10. DARK MODE Y TEMAS

### Prompt 10.1: Suavizar bordes/divisores en dark mode
**Problema**: Algunos divisores y bordes son demasiado prominentes en modo oscuro.

**Corrección solicitada**:
Revisar todos los borders en dark mode y reducir su opacidad/contraste donde sea demasiado fuerte. Los divisores deben separar pero no dominar visualmente. Usar colores de border específicos para dark vs light.

### Prompt 10.2: Consistencia de elevación (shadows) entre temas
**Problema**: Las sombras/elevaciones no se adaptan consistentemente entre light y dark mode.

**Corrección solicitada**:
Definir sistema de elevación que funcione en ambos modos: en light usar sombras, en dark usar borders sutiles o highlights. Asegurar que la jerarquía de profundidad sea obvia en ambos temas. Cards, modals y dropdowns deben mantener claridad.

---

## 11. MOBILE: OPTIMIZACIONES ESPECÍFICAS

### Prompt 11.1: Reducir altura de header en mobile
**Problema**: El topbar mobile ocupa considerable espacio vertical valioso.

**Corrección solicitada**:
Optimizar header mobile para usar menos altura sin perder funcionalidad. Considerar colapsarlo al scroll hacia abajo, expandirlo al scroll hacia arriba. Priorizar contenido sobre chrome UI.

### Prompt 11.2: Mejorar cards de requisiciones en mobile
**Problema**: Cards de requisiciones en mobile tienen mucha información apretada sin clara jerarquía visual.

**Corrección solicitada**:
Rediseñar layout de cards de requisiciones mobile priorizando información clave (folio, monto, estado). Información secundaria (solicitante, proyecto) puede ser colapsable o en segundo nivel visual. Incrementar espacio entre elementos.

### Prompt 11.3: Gestión de catálogo en mobile más eficiente
**Problema**: Navegar catálogo largo en mobile requiere mucho scroll, difícil volver arriba.

**Corrección solicitada**:
Añadir botón "volver arriba" que aparece tras scroll. Considerar implementar scroll to top al tap en tab de navegación inferior ya activo. Mejorar filtros para reducir necesidad de scroll extenso.

---

## 12. MICRO-INTERACCIONES Y PULIDO

### Prompt 12.1: Añadir transiciones suaves a cambios de estado
**Problema**: Cambios entre páginas y estados son instantáneos, sin transiciones.

**Corrección solicitada**:
Implementar transiciones sutiles (150-250ms) en navegación entre páginas, apertura de modals, expansión de secciones. Evitar transiciones largas que ralenticen percepción. Usar easing curves naturales (ease-out para entradas, ease-in para salidas).

### Prompt 12.2: Feedback visual en hover de elementos interactivos
**Problema**: No todos los elementos interactivos tienen feedback de hover claro.

**Corrección solicitada**:
Asegurar que todos los elementos clicables/tapeable tienen estado hover visible en desktop. Cambio de color, elevación sutil o escala ligera. Cursor pointer consistente. En mobile, feedback mediante pressed state.

### Prompt 12.3: Animaciones de carga con skeleton screens
**Problema**: Estados de carga muestran vacío o spinner genérico sin contexto.

**Corrección solicitada**:
Implementar skeleton screens que reflejen la estructura del contenido a cargar. Para listas: mostrar cards skeleton. Para formularios: inputs skeleton. Añadir sutil shimmer animation. Mucho más profesional que spinners genéricos.

---

## 13. PROYECTOS: MEJORAS ESPECÍFICAS

### Prompt 13.1: Diferenciación visual entre proyectos duplicados
**Problema**: En la lista de proyectos hay duplicados visualmente idénticos sin forma de diferenciarlos.

**Corrección solicitada**:
Si los proyectos duplicados son válidos (diferentes fases/periodos), añadir metadata visible que los diferencie: ID, fecha, fase, estado. Si son duplicados de datos, limpiar. Evitar confusión al usuario.

### Prompt 13.2: Estado "Sin asignar" más accionable
**Problema**: Muchos proyectos muestran "Sin asignar" sin call-to-action obvio.

**Corrección solicitada**:
Si "Sin asignar" requiere acción (asignar responsable), hacerlo obvio con color/icono que indique acción pendiente. Si es informativo, usar estilo neutral. Considerar quick-action para asignar directamente desde la card.

---

## 14. GESTIÓN DE PRODUCTOS: TABLA

### Prompt 14.1: Acciones de producto más accesibles
**Problema**: Menú de acciones (tres puntos) en cada fila requiere click adicional para ver opciones.

**Corrección solicitada**:
Mostrar 2-3 acciones más comunes directamente en hover de fila (editar, duplicar, desactivar). Mantener menú de overflow para acciones menos frecuentes. Reduce clicks y hace flujo más eficiente.

### Prompt 14.2: Ordenamiento de columnas más obvio
**Problema**: No está claro cuál columna está activamente ordenando la tabla.

**Corrección solicitada**:
Al ordenar por columna, indicador visual claro: header más prominente, flecha de dirección obvia, texto más bold. Permitir remover ordenamiento para volver a orden predeterminado. Estado persistente al navegar.

---

## 15. USUARIOS: PÁGINA DE GESTIÓN

### Prompt 15.1: Manejar mejor alert de "Migraciones pendientes"
**Problema**: Alert amarillo de "Migraciones pendientes" domina visualmente la página y parece error.

**Corrección solicitada**:
Si es temporal (desarrollo), ocultarlo en producción. Si es funcionalidad permanente, hacerlo menos alarmante: info badge colapsable, no alert full-width. Incluir acción clara para resolver (botón "Sincronizar ahora") o dismissible si no es crítico.

### Prompt 15.2: Avatar placeholder más profesional
**Problema**: Avatar placeholder "C" en círculo es muy básico.

**Corrección solicitada**:
Mejorar generación de avatares placeholder: usar gradientes generados a partir del nombre, mejor tipografía para iniciales, posibilidad de colores variados. Considerar opciones: avatars ilustrados, identicons, o integración con Gravatar.

---

## PRIORIZACIÓN SUGERIDA

### 🔴 Alta Prioridad (Impacto inmediato en UX):
- 1.1, 1.2 (Tipografía consistente)
- 4.2 (Indicador carrito en catálogo)
- 5.1 (Consistencia de estados)
- 11.2 (Cards mobile requisiciones)
- 15.1 (Alert de migraciones)

### 🟡 Media Prioridad (Mejoras notables):
- 2.1, 2.2 (Espaciado)
- 3.1 (Indicador nav activa)
- 5.3 (Badges atención)
- 6.3 (Contexto en métricas)
- 12.3 (Skeleton screens)

### 🟢 Baja Prioridad (Pulido y refinamiento):
- 3.3 (Botón central nav)
- 8.2 (Indicador contexto empresa)
- 12.1, 12.2 (Micro-interacciones)
- 14.1 (Quick actions tabla)

---

**Nota Final**: Estos prompts están diseñados para ser implementados de forma independiente y progresiva. Cada uno incluye el problema identificado y la corrección deseada sin especificar tecnología o código. Pueden ser asignados a diseñadores y desarrolladores para implementación autónoma.
