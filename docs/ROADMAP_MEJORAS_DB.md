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
1. **Consolidar `projects.status`/`active`** ✅  
   - `active` eliminado; UI/servicios usan `status` como fuente de verdad.  
2. **Snapshot vs Vista para `requisitions.items`** ✅  
   - Trigger `refresh_requisition_items_snapshot` mantiene el JSON sincronizado (evaluar vista materializada sólo para analítica pesada).  
3. **Eliminar `profiles.role`**  
   - Verificar ningún servicio externo lo usa.  
  - Migración drop column + limpieza de código frontend/backend.

### Fase 3 – Observabilidad y Escalado
1. **Suite de tests RLS** 🚧  
   - Harness inicial con `npm run test:rls` (crea datos temporales y valida políticas clave).  
   - Extender casos: supervisor, platform admin, `requisition_templates`, `audit_log`.
2. **Revisión periódica de índices**  
   - Script `npm run report:indexes` genera archivos `docs/reports/unused-indexes-*.md`.  
   - Calendarizar ejecución mensual (1er lunes) y documentar decisiones.
3. **Documentación viva**  
   - Actualizar `docs/guides/REFERENCIA_BD_SUPABASE.md` tras cada cambio estructural.  
   - Checklist antes de despliegues major (migraciones, RLS, tests).

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
