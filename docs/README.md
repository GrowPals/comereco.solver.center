# 📚 Documentación ComerECO

Documentación completa del sistema ComerECO - Sistema de Requisiciones del Grupo Solven. Esta guía está organizada según el estado real del contenido para evitar confusiones entre lo implementado y lo que aún es un plan.

---

## 📖 Índice rápido por estado

### ✅ Implementado (Base funcional)

- **[Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)** – Cómo levantar el proyecto local y en Vercel.
- **[Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md)** – Configuración de `.env`.
- **[Pruebas Locales](guides/GUIA_PRUEBAS_LOCALES.md)** – Flujo recomendado de QA manual.
- **[Arquitectura de Roles y Permisos](ARQUITECTURA_ROLES_PERMISOS.md)** – Descripción del RBAC actual.
- **[Documentación Técnica BD Supabase](guides/DOCUMENTACION_TECNICA_BD_SUPABASE.md)** – Esquema vigente en Supabase.
- **[Referencia Técnica BD](guides/REFERENCIA_TECNICA_BD_SUPABASE.md)** – Relaciones, claves foráneas y RLS activos.
- **[Implementación Backend](guides/IMPLEMENTACION_BACKEND_SUPABASE.md)** – Cómo interactúa hoy el frontend con Supabase.
- **[Mejores Prácticas Supabase](guides/GUIA_BEST_PRACTICES_SUPABASE.md)** – Reglas vigentes para sesiones, RLS y consultas.
- **[Estado General de la BD](ESTADO_BASE_DATOS.md)** – Problemas vigentes y salud actual.
- **[Fix RLS Recursivo](INSTRUCCIONES_FIX_RLS_RECURSION.md)** – Script y pasos para resolver el bug de políticas.
- **[RESUMEN_AUDITORIA_ACTUALIZADO.md](../RESUMEN_AUDITORIA_ACTUALIZADO.md)** – Fotografía actual (nov-2025) con hallazgos críticos.

### 🔄 En planeación / pendientes

> Estos documentos describen la arquitectura objetivo (Bind ERP + n8n). No hay migraciones ni código que materialicen todavía esas piezas.

- **[Arquitectura Completa](ARQUITECTURA_COMPLETA.md)** – Diseño de la solución final (marcado como blueprint).
- **[Checklist Producción y Automatización](CHECKLIST_PRODUCCION_AUTOMATIZACION.md)** – Lista de tareas pendientes para llegar a producción.
- **[Guía de Implementación Bind](../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md)** – Plan de trabajo paso a paso (todos los checkboxes comienzan vacíos).
- **[docs/api/](api/)** – Scripts SQL disponibles; faltan migraciones clave (`get_dashboard_stats`, `bind_mappings`, `bind_sync_logs`, triggers PGMQ, etc.).

### 🛠️ Soporte y operación

- **[Deployment Checklist](guides/DEPLOYMENT_CHECKLIST.md)**
- **[Configuración Vercel](guides/GUIA_CONFIGURACION_VERCEL.md)**
- **[Configuración de Dominios](guides/GUIA_CONFIGURACION_DOMINIOS.md)**
- **[Troubleshooting Login](guides/PASOS_PARA_ARREGLAR_LOGIN.md)**

### 🗄️ Archivo histórico y planeación

- **[Development](development/)** – Planes de sprints y bitácoras.
- **[Archive](archive/)** – Registros anteriores (mantener como referencia, no representan el estado actual).

---

## 🎯 Estructura del Proyecto

```
COMERECO WEBAPP/
├── src/                    # Código fuente de la aplicación
│   ├── components/         # Componentes React reutilizables
│   ├── lib/                # Utilidades y configuraciones
│   ├── pages/              # Páginas de la aplicación
│   └── services/           # Servicios y API clients
├── docs/                   # Documentación completa
│   ├── guides/             # Guías técnicas y de referencia
│   ├── development/        # Documentación de desarrollo
│   ├── archive/            # Documentación histórica
│   └── api/                # Scripts SQL y migraciones
├── public/                 # Archivos estáticos
└── README.md               # Documentación principal del proyecto
```

---

## 🔍 Búsqueda rápida

- **Configurar proyecto:** [Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md) → [Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)
- **Entender roles:** [Arquitectura de Roles y Permisos](ARQUITECTURA_ROLES_PERMISOS.md)
- **Consultar tablas:** [Documentación Técnica BD](guides/DOCUMENTACION_TECNICA_BD_SUPABASE.md)
- **Despliegue / Soporte:** [Deployment Checklist](guides/DEPLOYMENT_CHECKLIST.md) → [Troubleshooting Login](guides/PASOS_PARA_ARREGLAR_LOGIN.md)

---

## 🆕 Actualizaciones destacadas

- **Noviembre 2025:** `RESUMEN_AUDITORIA_ACTUALIZADO.md` reemplaza reportes anteriores que hablaban de automatización completa. Se documenta que Bind ERP y `get_dashboard_stats` siguen pendientes.
- **Guías de integración Bind:** permanecen como blueprint. Cada documento ahora especifica que requiere migraciones futuras.

---

**Última curación del índice:** 2025-11-02  
**Contacto:** equipo ComerECO
