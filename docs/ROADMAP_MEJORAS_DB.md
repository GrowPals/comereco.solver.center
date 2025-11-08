# 🗺️ Roadmap de Mejoras – Plataforma Multi-tenant Supabase

> Orquestador: Codex – visión integral técnico-producto  
> Objetivo: elevar consistencia de datos, seguridad y experiencia operativa de administradores y usuarios finales.

---

## 🎯 Principios rectores
- **Tenant First**: mantener aislamiento estricto por compañía mientras habilitamos operaciones globales controladas.
- **Experiencia Fluida**: minimizar fricciones en onboarding, consulta y sincronización con sistemas externos.
- **Escalabilidad Consciente**: preparar el modelo para crecer en volumen, funcionalidades y equipos sin comprometer la integridad.
- **Observabilidad Extendida**: asegurar trazabilidad end-to-end (auditoría, sincronizaciones, estados).

---

## 🔝 Iniciativas Clave

| Prioridad | Iniciativa | Resultado esperado | Owner sugerido |
|-----------|------------|--------------------|----------------|
| Alta | **Refuerzo RLS y roles** | Admins ven inventario completo, se documenta rol `platform_admin`/permisos globales | Backend Lead |
| Alta | **Onboarding a prueba de fallos** | Todo invite genera `profiles` consistente + registro de quién invitó | Backend + Ops |
| Alta | **Consolidación estados `projects`** | Una sola fuente de verdad (`status` enum ampliado) | Backend |
| Media | **Definir estrategia `requisitions.items`** | Snapshot automático (trigger) o vista materializada consumible | Backend + Integraciones |
| Media | **Depuración de legados** | `profiles.role` eliminado, políticas solo con `role_v2` | Backend |
| Media | **Batería de pruebas RLS** | Suite automatizada (Supabase CLI + jest) | QA / Platform |
| Baja | **Monitoreo índices “observados”** | Script mensual que exporta `pg_stat_user_indexes` y explica decisiones | DevOps |

---

## 🧩 Plan de Ejecución (Fases Iterativas)

### Fase 1 – Seguridad y Datos Críticos
1. **Política SELECT products inactivos** ✅  
   - Añadida `products_select_admin_all` con visibilidad ampliada para admins y `platform_admin`.
2. **Rol Global** ✅  
   - `platform_admins` + helper `is_platform_admin()`; políticas actualizadas en `companies`, `audit_log`, `bind_*`, `folio_sequences`.
3. **Trigger post-invite** ✅  
   - Trigger `create_profile_after_signup` + tabla `user_invitations` con RLS y auditoría completa.

### Fase 2 – Consistencia Operativa
1. **Normalización de plantillas** ✅  
   - Tabla `requisition_template_items` + trigger `sync_template_items_from_json` + vista `requisition_template_items_view`.
2. **Infra para integraciones** ✅  
   - Cola `integration_queue` con RLS y helper `refresh_integration_views()` para `mv_products_for_sync`, `mv_requisitions_for_bind`, `mv_restock_alerts`.
3. **Indices & timestamps** ✅  
   - `set_timestamps` aplicado a tablas faltantes, nuevos índices (`inventory_restock_rules_company_status`, `requisition_templates_user_company`, `requisition_items_product`).
4. **Eliminar `profiles.role`**  
   - (Pendiente) verificar que ningún servicio externo lo use → migración `DROP COLUMN` cuando se confirme.

### Fase 3 – Observabilidad y Escalado
1. **Soft delete + limpieza histórica** ✅  
   - Columnas `deleted_at`, políticas actualizadas, triggers `soft_delete_*` y partial unique indexes.
2. **Rol `ops_automation` + cola robusta** ✅  
   - Helper `is_ops_automation()`, guía de tokens y RLS de `integration_queue` ampliada.
3. **Materialized views listas para workers** ✅  
   - `mv_products_for_sync`, `mv_requisitions_for_bind`, `mv_restock_alerts` con filtros `deleted_at` + helper `refresh_integration_views()`.
4. **Suite de tests RLS / monitoreo índices** 🚧  
   - Pendiente automatizar harness y reportes `pg_stat_user_indexes`.

### Fase 4 – Retención & Ops
1. **Archivos históricos** ✅  
   - Tablas `audit_log_archive`, `bind_sync_logs_archive`, funciones `archive_*`.
2. **Drop legados** ✅  
   - `profiles.role` eliminado; helpers dependen sólo de `role_v2`.
3. **Dashboards Ops** ✅  
   - `mv_integration_dashboard`, cron `refresh_integration_views_job`, RPCs `dequeue_/complete_integration_job`.
4. **Alert Hooks** ✅  
   - `notify_restock_alert` inserta jobs `target_system='alert'`.
5. **Tooling** ✅  
   - Scripts `scripts/db/run_rls_checks.sql` y `scripts/db/report_indexes.sql`.

### Fase 5 – Observabilidad continua (próxima)
1. Automatizar ejecución de smoke tests/pgTAP en CI.
2. Generar reportes periódicos de índices / pg_stat_statements.
3. Alerting real-time con Edge Functions (restock/integration backlog).
4. Documentar playbooks de retención y disaster recovery.

---

## ✅ Métricas de éxito
- ❌ 0 inconsistencias `profiles` ↔ `auth.users` en monitoreo semanal.
- 📈 Tiempos de respuesta sin degradación tras nuevas políticas (medido con Supabase logs).
- 🔒 Suite RLS con cobertura > 90 % de rutas críticas.
- ♻️ Reportes de índices con decisiones documentadas cada mes.
- ♟️ Integraciones externas (N8N/Bind) operando con estados consistentes (`integration_status` reflejado en dashboard interno).

---

## 🛠️ Checklist de Ready-to-Go (Fase 1)
- [x] Política `products_select_admin_all` aplicada y testeada.
- [x] Borrador de rol `platform_admin` y alcance definido.
- [x] Trigger `create_profile_if_missing` implementado con pruebas.
- [x] Registro de invitaciones habilitado y visibilidad en `audit_log`.
- [x] Doc actualizada y comunicada a equipo.

---

## 🚀 Próximos pasos inmediatos
1. Aprobar este roadmap en comité técnico (Backend + DevOps + Producto).  
2. Priorizar entregables de Fase 1 en backlog (estimación y asignación).  
3. Coordinar QA para preparar harness de pruebas RLS desde la semana siguiente.  
4. Planificar comunicación a soporte para anticipar cambios de onboarding y permisos.

> Roadmap vivo: cada avance queda documentado en `docs/roadmap` y se abrirán PRs con los siguientes hitos (Fase 2/3).
