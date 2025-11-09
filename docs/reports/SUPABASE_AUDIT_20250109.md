# 📦 Supabase Audit – 2025-01-09

Este informe resume el estado actual de la base de datos remota (`azjaehrdzdfgrumbqmuc`) tras generar los reportes de inventario de tablas e índices.

- **Fuente de datos**
  - `docs/reports/table-inventory-20250109.txt`
  - `docs/reports/indexes-20250109.txt`
- **Comando**: `psql "$DB_URL" -f scripts/db/report_indexes.sql` y consultas ad-hoc contra `information_schema.tables`.

## 1. Inventario de Esquemas

- **auth**: 18 tablas estándar + `audit_log_entries`. Sin datos anómalos. Revisar `refresh_tokens` y `sessions` al pasar a producción para purgar sesiones antiguas.
- **cron**: `job` y `job_run_details` existen pero no hay registros (0 jobs configurados). Si el cron de Supabase no se usará, deshabilitarlo para reducir ruido.
- **pgmq**: Hay colas `a_requisition_outbox_queue` y `q_requisition_outbox_queue` sin lecturas (`idx_scan = 0`). Confirmar si seguirá usándose el enfoque outbox; de lo contrario, migrar a una sola cola o limpiar las entradas archivadas.
- **public**: 30 tablas + 6 vistas relevantes (`company_products_view`, `requisitions_pending_sync`, etc.). Entidades principales: `companies`, `projects`, `requisitions`, `requisition_items`, `inventory_restock_rules`. Se mantienen tablas históricas (`audit_log_archive`, `bind_sync_logs_archive`). Recomiendo:
  - Vaciar datos dummy antes de producción usando `supabase/limpieza_total.sql`, conservando admins y compañías reales.
  - Revisar vistas `products_pending_sync` y `requisitions_pending_sync`: actúan como staging para Bind; documentar columnas obligatorias para los workflows de n8n.
- **realtime**: múltiples particiones `messages_YYYY_MM_DD`. Supabase crea estas tablas automáticamente para logs de realtime. Considera activar la política de retención para evitar crecimiento.
- **storage / vault / supabase_migrations**: estructuras estándar, sin hallazgos.

## 2. Índices y uso

- Más de 50 índices muestran `idx_scan = 0` (audit logs, colas pgmq, `bind_*_archive`). Esto confirma que la mayoría del tráfico actual es de pruebas. Antes del corte a producción:
  - Archivar o truncar `audit_log_archive` y `bind_sync_logs_archive` para reducir el tamaño de `pg_stat_user_indexes` y evitar vacuum innecesario.
  - Validar si necesitamos todos los índices compuestos de `audit_log_archive` (hay 4 redundantes). Podrían consolidarse tras tener datos reales.
- Índices con scans reales (top 10 en `pg_stat_statements`): provienen de consultas a `requisitions`, `requisition_items`, `products`, `projects`. No se detectaron planes lentos (>100 ms promedio) en el muestreo.

## 3. Recomendaciones inmediatas

1. **Limpieza controlada**
   - Ejecutar `supabase/limpieza_total.sql` en un maintenance window: preserva admins (`team@growpals.mx`) y compañías válidas, pero elimina seed data.
   - Validar después con `scripts/db/run_rls_checks.sql` para asegurar que las políticas siguen consistentes tras la limpieza.
2. **Métricas de índices**
   - Programar `scripts/db/report_indexes.sql` como auditoría mensual (perfiere guardarlo en `docs/reports/indexes-YYYYMM.txt`).
   - Analizar cada trimestre qué índices no se usan para deshabilitarlos o consolidarlos.
3. **Planificación Bind/n8n**
   - Documentar en `docs/GRUPO_SOLVEN_PLAN_DETALLADO.md` qué vistas alimentarán los workflows (`requisitions_pending_sync`, `products_pending_sync`, `integration_queue`).
   - Confirmar que `integration_queue` tiene estrategias de vacuum/análisis porque actualmente no registra actividad.
4. **Retención realtime**
   - Ajustar la política de `supabase realtime` (Settings → Database) para que solo conserve `messages_*` una semana si no se requiere histórico.

## 4. Próximos pasos sugeridos

| Prioridad | Acción | Resultado esperado |
|-----------|--------|--------------------|
| Alta | Ejecutar limpieza y volver a poblar con datos reales vía workflows | Base lista para producción sin ruido de pruebas |
| Media | Definir colas pgmq únicas + documentación de outbox | Sin duplicidad de `a_/q_` colas; monitoreo claro |
| Media | Automatizar reportes (`run_rls_checks`, `report_indexes`) en CI/CD o cron local | Alertas tempranas ante drift o índices obsoletos |
| Baja | Revisar índices redundantes en tablas de auditoría | Menor consumo de almacenamiento y mantenimiento |

Con esto dejamos mapeado el estado real de Supabase y las acciones necesarias antes de abrirla a usuarios finales.

## 5. Ejecución de limpieza (2025-01-09)

- Se actualizó `supabase/limpieza_total.sql` para manejar tablas opcionales (`folio_counters`) mediante `to_regclass`, evitando errores cuando la tabla no está presente.
- La limpieza se ejecutó contra la instancia remota y dejó únicamente al usuario `team@growpals.mx`, su compañía y cero registros operativos (ver log en la terminal y en el script).
- Posteriormente se corrió `scripts/db/run_rls_checks.sql` para verificar que las políticas siguen consistentes; todas las pruebas (`admin`, `user`, `ops_automation`) pasaron y el script finalizó en `ROLLBACK` como se espera.
- Recomendación: mantener este flujo documentado para futuras limpiezas antes de importar datos desde Bind/n8n (limpieza → run_rls_checks → seed).
