# 📚 Documentación ComerECO

Documentación completa del sistema ComerECO - Sistema de Requisiciones del Grupo Solven.

## 📖 Índice de Documentación

### 🚀 Guías de Inicio Rápido

- **[Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)** - Instrucciones completas para desplegar la aplicación
- **[Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md)** - Configuración de variables de entorno
- **[Pruebas Locales](guides/GUIA_PRUEBAS_LOCALES.md)** - Guía para desarrollo local

### 🏗️ Arquitectura y Estructura

- **[Arquitectura de Roles y Permisos](ARQUITECTURA_ROLES_PERMISOS.md)** - Sistema completo de roles (ADMIN, SUPERVISOR, USUARIO)
- **[Índice de Servicios](guides/INDICE_SERVICIOS_WEBAPP.md)** - Documentación de servicios y funcionalidades

### 🔧 Backend y Base de Datos

- **[Documentación Técnica BD Supabase](guides/DOCUMENTACION_TECNICA_BD_SUPABASE.md)** - Estructura completa de la base de datos
- **[Referencia Técnica BD](guides/REFERENCIA_TECNICA_BD_SUPABASE.md)** - Referencia técnica de tablas y relaciones
- **[Implementación Backend](guides/IMPLEMENTACION_BACKEND_SUPABASE.md)** - Guía de implementación del backend
- **[Auditoría Backend](guides/AUDITORIA_BACKEND_SUPABASE.md)** - Auditoría completa del backend
- **[Auditoría BD](guides/AUDITORIA_BD_SUPABASE.md)** - Auditoría de la base de datos
- **[Mejores Prácticas Supabase](guides/GUIA_BEST_PRACTICES_SUPABASE.md)** - Guía de mejores prácticas

### 🌐 Despliegue y Configuración

- **[Deployment Checklist](guides/DEPLOYMENT_CHECKLIST.md)** - Checklist completo para despliegue
- **[Configuración Vercel](guides/GUIA_CONFIGURACION_VERCEL.md)** - Configuración específica de Vercel
- **[Configuración de Dominios](guides/GUIA_CONFIGURACION_DOMINIOS.md)** - Configuración de dominios personalizados
- **[Troubleshooting Login](guides/PASOS_PARA_ARREGLAR_LOGIN.md)** - Solución de problemas de autenticación

### 📊 Optimizaciones y Performance

- **[Optimizaciones Aplicadas](guides/OPTIMIZACIONES_APLICADAS.md)** - Documentación de optimizaciones implementadas

### 🗄️ API y Migraciones

- **[API](api/)** - Scripts SQL y migraciones de base de datos

### 🔄 Desarrollo

- **[Development](development/)** - Documentación de desarrollo, sprints y planificación

### 📁 Archivo Histórico

- **[Archive](archive/)** - Documentación histórica, auditorías pasadas, cambios de agentes y reportes de iteraciones

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

## 🔍 Búsqueda Rápida

### ¿Necesitas configurar el proyecto por primera vez?
👉 [Variables de Entorno](guides/INSTRUCCIONES_VARIABLES_ENTORNO.md) → [Guía de Despliegue](guides/GUIA_DESPLIEGUE.md)

### ¿Quieres entender cómo funcionan los roles?
👉 [Arquitectura de Roles y Permisos](ARQUITECTURA_ROLES_PERMISOS.md)

### ¿Necesitas información sobre la base de datos?
👉 [Documentación Técnica BD](guides/DOCUMENTACION_TECNICA_BD_SUPABASE.md) → [Referencia Técnica BD](guides/REFERENCIA_TECNICA_BD_SUPABASE.md)

### ¿Tienes problemas con el despliegue?
👉 [Deployment Checklist](guides/DEPLOYMENT_CHECKLIST.md) → [Troubleshooting Login](guides/PASOS_PARA_ARREGLAR_LOGIN.md)

---

**Última actualización:** 2025-01-26  
**Versión del proyecto:** 1.0.0

