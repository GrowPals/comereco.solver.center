# 📚 Documentación ComerECO

Documentación completa del sistema ComerECO - Sistema de Requisiciones del Grupo Solven.

**Última actualización:** 5 de noviembre de 2025

---

## 🚀 Start Here

¿Primera vez en el proyecto? Empieza aquí:

1. 📖 **[README Principal](../README.md)** - Visión general del proyecto
2. ⚙️ **[Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)** - Cómo levantar el proyecto
3. 🔑 **[Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md)** - Configuración `.env`
4. 🏗️ **[Arquitectura de Roles](ARQUITECTURA_ROLES_PERMISOS.md)** - Sistema de permisos

### Para DevOps/Backend

5. 🚀 **[Aplicar Migraciones](guides/GUIA_APLICAR_MIGRACIONES.md)** - Migraciones y tests RLS (staging/prod)
6. 📊 **[Roadmap DB](ROADMAP_MEJORAS_DB.md)** - Plan de mejoras de base de datos
7. ✅ **[Auditoría Backend](REPORTE_AUDITORIA_BACKEND_FINAL.md)** - Estado actual del backend

---

## 📁 Estructura de Documentación

```
docs/
├── README.md                                   # Este archivo
│
├── 📋 Documentos Principales
│   ├── ARQUITECTURA_COMPLETA.md               # Arquitectura objetivo (blueprint)
│   ├── ARQUITECTURA_ROLES_PERMISOS.md         # Sistema RBAC vigente
│   ├── REPORTE_AUDITORIA_BACKEND_FINAL.md     # ⭐ Auditoría Backend 100% (Nov 2025)
│   ├── SECURITY_COMPREHENSIVE.md              # ⭐ Informe integral de seguridad (consolidado)
│   ├── CHECKLIST_PRODUCCION_AUTOMATIZACION.md # Tareas para producción
│   └── MODELO_PERMISOS_IMPLEMENTADO.md        # Modelo de permisos actual
│
├── audits/                                    # Auditorías funcionales, UI/UX y performance
│   ├── README.md                              # Índice y guía rápida
│   ├── performance/                           # Resultados Lighthouse + fixes
│   ├── ui-ux/                                 # Auditorías visuales y checklists
│   └── legacy/                                # Reportes históricos (pre 2025)
│
├── design/                                    # Sistema visual (tipografía, elevación, tokens)
├── features/                                  # Specs funcionales (p.ej. alert banner)
├── operations/                                # Checklists y runbooks de despliegue
│   ├── CHECKLIST_PRODUCCION.md                # QA previo a release
│   └── VERCEL_DEPLOYMENT.md                   # Guía para Vercel
│
├── integrations/                              # Integraciones externas
│   ├── BIND_SUPABASE_WORKFLOWS.md             # Flujo BIND ⇄ Supabase
│   └── claude/                                # Workflows y prompts Claude Code
│
├── 📖 guides/                                  # Guías técnicas
│   ├── IMPLEMENTACION_BACKEND_SUPABASE.md     # Backend con Supabase
│   ├── REFERENCIA_BD_SUPABASE.md              # ⭐ Esquema completo de BD
│   ├── GUIA_APLICAR_MIGRACIONES.md            # ⭐ Aplicar migraciones y tests RLS
│   ├── GUIA_BEST_PRACTICES_SUPABASE.md        # Mejores prácticas
│   ├── GUIA_DESPLIEGUE.md                     # Despliegue local/producción
│   ├── GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md # Integración BIND ERP
│   ├── GUIA_PRUEBAS_END_TO_END.md             # Pruebas E2E
│   ├── DEPLOYMENT_CHECKLIST.md                # Checklist deployment
│   ├── GUIA_CONFIGURACION_VERCEL.md           # Configuración Vercel
│   ├── GUIA_CONFIGURACION_DOMINIOS.md         # Configuración dominios
│   ├── GUIA_PRUEBAS_LOCALES.md                # Testing manual
│   ├── INSTRUCCIONES_VARIABLES_ENTORNO.md     # Variables de entorno
│   └── INDICE_SERVICIOS_WEBAPP.md             # Índice de servicios
│
├── 💻 development/                             # Desarrollo
│   ├── 10_PROMPTS_AGENTES_SUPABASE.md         # Prompts para IA
│   ├── PLAN_INTEGRACION_SUPABASE_100.md       # Plan de integración
│   ├── ANALISIS_CORE_EVOLUTIVO.md             # Análisis evolutivo
│   ├── PLAN_EJECUCION_CORE_EVOLUTIVO.md       # Plan de ejecución
│   ├── PROMPT_SIMPLE_AGENTES.md               # Prompts simples
│   └── PROMPT_SIMPLE_COPIAR_PEGAR.md          # Prompts copy-paste
│
├── 🧭 playbooks/                               # Procedimientos operativos
│   ├── ONBOARDING_PLATFORM_ADMINS.md          # Alta inicial de platform admins
│   ├── PRUEBAS_RLS.md                         # Suite automatizada RLS
│   └── REVISION_INDICES.md                    # Revisión mensual de índices
│
├── 🔧 troubleshooting/                         # Solución de problemas
│   ├── FIX_REACT_USESTATE_ERROR.md            # Fix error useState
│   ├── FIX_REACT_CREATECONTEXT_ERROR.md       # Fix error createContext
│   ├── FIX_DEPRECATION_WARNINGS.md            # Fix warnings deprecados
│   ├── CORRECCION_ERRORES_CONSOLA.md          # Fix logs consola (parcial)
│   ├── CORRECCION_ERRORES_CONSOLA_FINAL.md    # Fix logs consola (final)
│   ├── CORRECCIONES_FINALES.md                # Resumen de fixes críticos
│   └── CORRECCION_REACT_ROUTER_FLAGS.md       # Flags React Router
│
├── 🗄️ api/                                     # Scripts SQL
│   ├── CREATE_TEST_USER.sql                   # Crear usuario de prueba
│   ├── FIX_DATABASE_STRUCTURE.sql             # Fix estructura BD
│   ├── FIX_RLS_RECURSION.sql                  # Fix bug RLS
│   ├── MIGRACION_ADAPTACION_N8N.sql           # Migración para n8n
│   ├── MIGRACION_FIX_SECURITY_ISSUES.sql      # Fix seguridad
│   ├── MIGRACION_RLS_CRITICO.sql              # ⭐ Políticas RLS críticas
│   └── MIGRACION_TABLAS_FALTANTES.sql         # Tablas adicionales del sistema
│
└── 📦 archive/                                 # Documentación histórica
    ├── README.md                              # Índice del archivo
    ├── iterations/                            # Bitácoras de desarrollo
    ├── optimizations/                         # Optimizaciones por iteración
    └── audits/                                # Auditorías históricas
```

---

## 📖 Documentación por Categoría

### 🏗️ Arquitectura y Diseño

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md) | Arquitectura objetivo del sistema | 🔵 Blueprint |
| [ARQUITECTURA_ROLES_PERMISOS.md](ARQUITECTURA_ROLES_PERMISOS.md) | Sistema RBAC y permisos | ✅ Vigente |
| [REPORTE_AUDITORIA_BACKEND_FINAL.md](REPORTE_AUDITORIA_BACKEND_FINAL.md) | ⭐ Auditoría Backend 100% (Nov 2025) | ✅ Vigente |
| [REFERENCIA_BD_SUPABASE.md](guides/REFERENCIA_BD_SUPABASE.md) | Esquema completo de base de datos | ✅ Vigente |
| [MODELO_PERMISOS_IMPLEMENTADO.md](MODELO_PERMISOS_IMPLEMENTADO.md) | Modelo de permisos implementado | ✅ Vigente |
| [DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md) | Sistema de diseño (tokens, layouts, grids) | ✅ Vigente |
| [ELEVATION_SYSTEM.md](design/ELEVATION_SYSTEM.md) | Reglas de elevación y sombras | ✅ Vigente |
| [TYPOGRAPHY.md](design/TYPOGRAPHY.md) | Catálogo tipográfico aprobado | ✅ Vigente |
| [ALERT_BANNER_SYSTEM.md](features/ALERT_BANNER_SYSTEM.md) | Especificación del sistema de alertas | ✅ Vigente |

### 🚀 Deployment y Configuración

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [GUIA_DESPLIEGUE.md](guides/GUIA_DESPLIEGUE.md) | Despliegue local y producción | ✅ Vigente |
| [DEPLOYMENT_CHECKLIST.md](guides/DEPLOYMENT_CHECKLIST.md) | Checklist de deployment | ✅ Vigente |
| [GUIA_CONFIGURACION_VERCEL.md](guides/GUIA_CONFIGURACION_VERCEL.md) | Configuración Vercel | ✅ Vigente |
| [GUIA_CONFIGURACION_DOMINIOS.md](guides/GUIA_CONFIGURACION_DOMINIOS.md) | Configuración de dominios | ✅ Vigente |
| [INSTRUCCIONES_VARIABLES_ENTORNO.md](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md) | Variables de entorno | ✅ Vigente |
| [CHECKLIST_PRODUCCION.md](operations/CHECKLIST_PRODUCCION.md) | QA previo al release | ✅ Vigente |
| [VERCEL_DEPLOYMENT.md](operations/VERCEL_DEPLOYMENT.md) | Troubleshooting despliegues en Vercel | ✅ Vigente |

### ✅ Auditorías y QA

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [audits/README.md](audits/README.md) | Índice rápido de auditorías | ✅ Vigente |
| [INFORME_AUDITORIA_COMPLETA.md](INFORME_AUDITORIA_COMPLETA.md) | Estado general 2025-01 | ✅ Vigente |
| [INFORME_AUDITORIA_FINAL_COMPLETO.md](INFORME_AUDITORIA_FINAL_COMPLETO.md) | Evidencias para release | ✅ Vigente |
| [INFORME_FINAL_AUDITORIA.md](INFORME_FINAL_AUDITORIA.md) | Resumen ejecutivo para stakeholders | ✅ Vigente |
| [audits/ui-ux/UI_UX_QUICK_FIX_CHECKLIST.md](audits/ui-ux/UI_UX_QUICK_FIX_CHECKLIST.md) | Checklist accionable UI/UX | ✅ Vigente |
| [audits/performance/PERFORMANCE_AUDIT_REPORT.md](audits/performance/PERFORMANCE_AUDIT_REPORT.md) | Resultados de performance y PWA | ✅ Vigente |

### 💾 Base de Datos y Backend

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [REPORTE_AUDITORIA_BACKEND_FINAL.md](REPORTE_AUDITORIA_BACKEND_FINAL.md) | ⭐ Auditoría Backend 100% | ✅ Vigente |
| [SECURITY_COMPREHENSIVE.md](SECURITY_COMPREHENSIVE.md) | ⭐ Informe integral de seguridad | ✅ Vigente |
| [IMPLEMENTACION_BACKEND_SUPABASE.md](guides/IMPLEMENTACION_BACKEND_SUPABASE.md) | Implementación backend | ✅ Vigente |
| [REFERENCIA_BD_SUPABASE.md](guides/REFERENCIA_BD_SUPABASE.md) | ⭐ Referencia completa de BD | ✅ Vigente |
| [GUIA_BEST_PRACTICES_SUPABASE.md](guides/GUIA_BEST_PRACTICES_SUPABASE.md) | Mejores prácticas | ✅ Vigente |
| [api/MIGRACION_RLS_CRITICO.sql](api/MIGRACION_RLS_CRITICO.sql) | ⭐ Políticas RLS críticas | ✅ APLICADO |
| [api/](api/) | Scripts SQL y migraciones | ✅ Vigente |

### 🧭 Playbooks operativos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [ONBOARDING_PLATFORM_ADMINS.md](playbooks/ONBOARDING_PLATFORM_ADMINS.md) | Alta inicial de platform admins | ✅ Vigente |
| [PRUEBAS_RLS.md](playbooks/PRUEBAS_RLS.md) | Ejecución de suite automatizada de RLS | ✅ Vigente |
| [REVISION_INDICES.md](playbooks/REVISION_INDICES.md) | Revisión mensual de índices sin uso | ✅ Vigente |

### 🔌 Integraciones

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md](../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md) | Guía de integración Bind ERP | 🔵 Blueprint |
| [../integrations/n8n/](../integrations/n8n/) | Documentación n8n | 🔵 Blueprint |
| [CHECKLIST_PRODUCCION_AUTOMATIZACION.md](CHECKLIST_PRODUCCION_AUTOMATIZACION.md) | Checklist de automatización | 🔵 Blueprint |
| [CLAUDE_CODE_WEB_README.md](integrations/claude/CLAUDE_CODE_WEB_README.md) | Setup y prerequisitos Claude Code | 📘 Referencia |
| [WORKFLOW_CLAUDE_CODE_WEB.md](integrations/claude/WORKFLOW_CLAUDE_CODE_WEB.md) | Flujo operativo Claude Code Web | 📘 Referencia |

### 🧪 Testing y QA

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [GUIA_PRUEBAS_LOCALES.md](guides/GUIA_PRUEBAS_LOCALES.md) | Guía de testing local | ✅ Vigente |

### 🔧 Troubleshooting

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [PASOS_PARA_ARREGLAR_LOGIN.md](guides/PASOS_PARA_ARREGLAR_LOGIN.md) | Solucionar problemas login | ✅ Vigente |
| [troubleshooting/FIX_REACT_USESTATE_ERROR.md](troubleshooting/FIX_REACT_USESTATE_ERROR.md) | Fix error useState | ✅ Vigente |
| [troubleshooting/FIX_REACT_CREATECONTEXT_ERROR.md](troubleshooting/FIX_REACT_CREATECONTEXT_ERROR.md) | Fix error createContext | ✅ Vigente |
| [troubleshooting/FIX_DEPRECATION_WARNINGS.md](troubleshooting/FIX_DEPRECATION_WARNINGS.md) | Fix warnings deprecados | ✅ Vigente |
| [troubleshooting/CORRECCION_ERRORES_CONSOLA.md](troubleshooting/CORRECCION_ERRORES_CONSOLA.md) | Correcciones iniciales de consola | 📘 Referencia |
| [troubleshooting/CORRECCION_ERRORES_CONSOLA_FINAL.md](troubleshooting/CORRECCION_ERRORES_CONSOLA_FINAL.md) | Resultado final de limpieza de consola | 📘 Referencia |
| [troubleshooting/CORRECCIONES_FINALES.md](troubleshooting/CORRECCIONES_FINALES.md) | Bitácora de fixes críticos | 📘 Referencia |
| [troubleshooting/CORRECCION_REACT_ROUTER_FLAGS.md](troubleshooting/CORRECCION_REACT_ROUTER_FLAGS.md) | Fix de banderas de React Router | 📘 Referencia |

### 💻 Desarrollo

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [development/](development/) | Planes y prompts de desarrollo | ✅ Vigente |
| [INDICE_SERVICIOS_WEBAPP.md](guides/INDICE_SERVICIOS_WEBAPP.md) | Índice de servicios | ✅ Vigente |

---

## 🔍 Búsqueda Rápida

### ¿Necesitas...?

**Configurar el proyecto por primera vez:**
1. [Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md)
2. [Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)
3. [Guía de Pruebas Locales](guides/GUIA_PRUEBAS_LOCALES.md)

**Entender la arquitectura:**
1. [Arquitectura de Roles y Permisos](ARQUITECTURA_ROLES_PERMISOS.md)
2. [Referencia BD Supabase](guides/REFERENCIA_BD_SUPABASE.md)
3. [Arquitectura Completa](ARQUITECTURA_COMPLETA.md) (objetivo)

**Solucionar un problema:**
1. [Troubleshooting Login](guides/PASOS_PARA_ARREGLAR_LOGIN.md)
2. [Carpeta troubleshooting/](troubleshooting/)
3. [Informe Integral de Seguridad](SECURITY_COMPREHENSIVE.md)

**Desplegar a producción:**
1. [Deployment Checklist](guides/DEPLOYMENT_CHECKLIST.md)
2. [Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)
3. [Configuración Vercel](guides/GUIA_CONFIGURACION_VERCEL.md)

**Integrar con Bind ERP:**
1. [Guía Implementación Bind](guides/GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md)
2. [Documentación n8n](../integrations/n8n/)
3. [Auditoría actual](AUDITORIA_VISION_REALIDAD_PLAN_2025.md)

---

## 📊 Estado del Proyecto

### ✅ Implementado y Funcional

- ✅ Sistema de autenticación con Supabase Auth
- ✅ Sistema RBAC (admin, supervisor, user)
- ✅ Gestión de requisiciones
- ✅ Workflow de aprobaciones
- ✅ Dashboard básico
- ✅ Multi-empresa (multi-tenant)
- ✅ RLS (Row Level Security) configurado

### 🔵 En Planeación (Blueprint)

- 🔵 Integración con Bind ERP
- 🔵 Automatización con n8n
- 🔵 Dashboard de estadísticas avanzado
- 🔵 Notificaciones en tiempo real
- 🔵 Sincronización automática de productos

**Consulta:** [AUDITORIA_VISION_REALIDAD_PLAN_2025.md](../AUDITORIA_VISION_REALIDAD_PLAN_2025.md) para el estado detallado.

---

## 🎓 Leyenda

| Ícono | Significado |
|-------|-------------|
| ✅ | Documentación vigente y código implementado |
| 🔵 | Blueprint / En planeación (no implementado aún) |
| ⭐ | Documento clave - Lectura esencial |
| 📦 | Documentación histórica (referencia) |

---

## 🗂️ Documentación Relacionada

### Raíz del Proyecto
- [README Principal](../README.md) - Documentación principal
- [Auditoría Nov 2025](../AUDITORIA_VISION_REALIDAD_PLAN_2025.md) - Estado actual del proyecto
- [Guía Bind ERP](../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md) - Plan de integración

### Integraciones
- [n8n Workflows](../integrations/n8n/) - Documentación de n8n y Bind ERP

### Archivo Histórico
- [archive/README.md](archive/README.md) - Índice de documentación histórica

---

## 📝 Contribuir a la Documentación

### Al crear nueva documentación:

1. **Ubicación correcta:**
   - Guías técnicas → `guides/`
   - Desarrollo/Prompts → `development/`
   - Solución de problemas → `troubleshooting/`
   - Scripts SQL → `api/`

2. **Formato:**
   - Usar Markdown (.md)
   - Incluir fecha de última actualización
   - Marcar estado (✅ Vigente / 🔵 Blueprint)

3. **Actualizar índices:**
   - Agregar referencia en este README
   - Actualizar links relevantes

### Al deprecar documentación:

1. Mover a `archive/` con subcarpeta apropiada
2. Actualizar referencias en README
3. Documentar razón en commit

---

## 🔄 Últimas Actualizaciones

### Noviembre 2025 - Auditoría Completa Backend ⭐

- ✅ **Auditoría Backend 100%** - Sistema completamente respaldado
- ✅ **Políticas RLS críticas** corregidas y aplicadas
- ✅ **15 tablas verificadas** - Todas operativas con RLS
- ✅ **Seguridad mejorada** - Functions con search_path fijado
- ✅ **Sistema de aprobaciones** funcional (admins y supervisores)
- ✅ **Gestión de proyectos** CRUD completo habilitado
- ✅ **Sistema de folios** operativo
- ✅ **Audit logs** habilitados

**Documentos creados:**
- [REPORTE_AUDITORIA_BACKEND_FINAL.md](REPORTE_AUDITORIA_BACKEND_FINAL.md)
- [api/MIGRACION_RLS_CRITICO.sql](api/MIGRACION_RLS_CRITICO.sql) ✅ APLICADO
- [api/MIGRACION_TABLAS_FALTANTES.sql](api/MIGRACION_TABLAS_FALTANTES.sql)

### Noviembre 2025 - Limpieza y Reorganización

- ✅ **Consolidada** documentación de seguridad en [SECURITY_COMPREHENSIVE.md](SECURITY_COMPREHENSIVE.md)
- ✅ **Archivados** 3 documentos redundantes de seguridad
- ✅ **Expandido** suite de tests RLS (4 test suites completas)
- ✅ **Creados** scripts de automatización y mantenimiento
- ✅ **Reorganizada** carpeta `archive/` con subcarpetas lógicas
- ✅ **Creada** carpeta `troubleshooting/` para fixes
- ✅ **Actualizado** índice maestro con nueva estructura

**Reducción:** 3 documentos de seguridad consolidados en 1

Ver detalles: [archive/audits/](archive/audits/)

---

**Última curación:** 6 de noviembre de 2025
**Mantenido por:** Equipo ComerECO
**Próxima revisión:** Diciembre 2025
