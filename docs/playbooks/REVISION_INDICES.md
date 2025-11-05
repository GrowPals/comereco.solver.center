# Playbook: Revisión Periódica de Índices

Objetivo: ejecutar el reporte de índices sin uso y documentar acciones derivadas para mantener la base de datos optimizada conforme crece el tráfico.

## Cadencia recomendada

- **1er lunes de cada mes** después del corte nocturno de operaciones.
- Complementar con una revisión extraordinaria antes de grandes despliegues que alteren tablas o políticas.

## 1. Preparar conexión de solo lectura

Definir la cadena de conexión en una variable segura (sólo lectura recomendada):

```
SUPABASE_DB_REPORT_URL=postgres://report_user:password@db.<project-ref>.supabase.co:5432/postgres
```

> Para evitar exponer la clave de servicio, crea un usuario Postgres con permiso `CONNECT` y `SELECT` sobre `pg_stat_user_indexes`.

## 2. Generar reporte

```
export SUPABASE_DB_REPORT_URL=postgres://...
npm run report:indexes
```

El script genera un archivo en `docs/reports/unused-indexes-YYYY-MM-DDTHH-mm-ss.md` con el listado de índices cuyo `idx_scan = 0`.

## 3. Analizar resultados

1. Cruza la lista con despliegues recientes (¿acaba de crearse el índice?).
2. Valida si el índice es parte de una migración pendiente o un plan de pruebas.
3. Determina acción:
   - **Eliminar** si no hay justificación.
   - **Conservar** documentando el motivo (ej. índices para reportes esporádicos).
   - **Re-crear** con otra definición si el problema es de selectividad.

Registra la decisión en el mismo archivo generado (añade secciones `Acciones` y `Responsable`).

## 4. Seguimiento

- Anexa el reporte al comité técnico mensual.
- Crea tickets en el backlog para drops o recreaciones acordadas.
- Repite el comando después de ejecutar migraciones relacionados para verificar impacto.

## Referencias

- `tools/report-unused-indexes.ts`
- `docs/ROADMAP_MEJORAS_DB.md` > Fase 3 – Observabilidad
- Supabase docs: [Unused Index Advisor](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
