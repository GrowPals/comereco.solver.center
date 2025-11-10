# 📑 Auditorías ComerECO

Esta carpeta agrupa todo el historial de auditorías funcionales, UI/UX y de performance. Usa esta guía rápida para saber qué leer según lo que necesites validar hoy.

## ✅ Paquete vigente (enero 2025)

| Documento | Uso recomendado |
|-----------|-----------------|
| [INFORME_AUDITORIA_COMPLETA.md](../INFORME_AUDITORIA_COMPLETA.md) | Estado general y métricas actuales |
| [INFORME_AUDITORIA_FINAL_COMPLETO.md](../INFORME_AUDITORIA_FINAL_COMPLETO.md) | Evidencia compilada para aprobar el release |
| [INFORME_FINAL_AUDITORIA.md](../INFORME_FINAL_AUDITORIA.md) | Resumen ejecutivo para stakeholders |

> Estos tres archivos son los únicos que debes compartir para documentar el estado actual de la plataforma.

## 🎨 Kit UI/UX (`ui-ux/`)
- [AUDIT_INDEX.md](ui-ux/AUDIT_INDEX.md): índice para navegar la auditoría visual.
- [AUDIT_SUMMARY.txt](ui-ux/AUDIT_SUMMARY.txt): snapshot rápido con métricas y severidad.
- [UI_UX_QUICK_FIX_CHECKLIST.md](ui-ux/UI_UX_QUICK_FIX_CHECKLIST.md): checklist accionable con fixes.
- [UI_UX_AUDIT_REPORT.md](ui-ux/UI_UX_AUDIT_REPORT.md): informe detallado con contexto y capturas.

## 🚀 Performance & PWA (`performance/`)
- [PERFORMANCE_AUDIT_REPORT.md](performance/PERFORMANCE_AUDIT_REPORT.md): resultados completos de Lighthouse/Playwright.
- [PERFORMANCE_AUDIT_SUMMARY.md](performance/PERFORMANCE_AUDIT_SUMMARY.md): resumen ejecutivo de performance.
- [PERFORMANCE_FIXES_CODE.md](performance/PERFORMANCE_FIXES_CODE.md): fixes aplicados con referencias a código.
- [RESUMEN_FINAL_PWA_COMPLETA.md](performance/RESUMEN_FINAL_PWA_COMPLETA.md): checklist final de PWA.

## 🗂️ Historial/Legacy (`legacy/`)
Documentos anteriores al paquete vigente. Conservaron contexto y evidencias históricas, pero no representan el estado actual.

- [AUDITORIA_COMPLETA_FINAL.md](legacy/AUDITORIA_COMPLETA_FINAL.md)
- [AUDITORIA_COMPLETA_RESUMEN_EJECUTIVO.md](legacy/AUDITORIA_COMPLETA_RESUMEN_EJECUTIVO.md)
- [AUDIT_REQUISITIONS_APPROVALS_REPORTS.md](legacy/AUDIT_REQUISITIONS_APPROVALS_REPORTS.md)
- [RESUMEN_COMPLETO_AUDITORIA.md](legacy/RESUMEN_COMPLETO_AUDITORIA.md)
- [RESUMEN_FINAL_CORRECCIONES.md](legacy/RESUMEN_FINAL_CORRECCIONES.md)

## ➕ Cómo agregar nuevos reportes
1. Guarda el resumen ejecutivo junto al paquete vigente y enlázalo desde la tabla inicial.
2. Cualquier entrega UI/UX o performance se guarda dentro de su subcarpeta con fecha en el encabezado.
3. Cuando un documento quede obsoleto, muévelo a `legacy/` para mantener el histórico limpio.
