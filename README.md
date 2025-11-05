# ComerECO - Sistema de Requisiciones

Sistema web interno para la gestión de requisiciones de compra del Grupo Solven, construido con un stack tecnológico moderno y escalable.

## 🎯 Propósito

Digitalizar y optimizar el proceso de requisiciones de compra dentro de la compañía, basado en un modelo de roles y permisos.

- **Usuarios:** Crean requisiciones desde un catálogo de productos centralizado.
- **Supervisores:** Revisan, aprueban o rechazan requisiciones de sus proyectos asignados.
- **Administradores:** Gestionan usuarios, proyectos y supervisan todo el sistema.

## 🚀 Stack Tecnológico

- **Framework:** React 18 + Vite
- **Routing:** React Router 6
- **Estilos:** TailwindCSS
- **UI:** shadcn/ui (Radix UI)
- **Animaciones:** Framer Motion
- **Gestión de Estado de Servidor:** TanStack Query (React Query)
- **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, Realtime)

## 📦 Instalación y Desarrollo Local

### Requisitos

- Node.js v20 o superior
- npm o yarn
- Cuenta de Supabase configurada

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd "COMERECO WEBAPP"
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```
   
   Consulta [`docs/guides/INSTRUCCIONES_VARIABLES_ENTORNO.md`](docs/guides/INSTRUCCIONES_VARIABLES_ENTORNO.md) para más detalles.

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:3000`

5. **Construir para producción**
   ```bash
   npm run build
   ```
   
   Los archivos de producción estarán en la carpeta `dist/`

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue Automático con Git

1. Conecta tu repositorio GitHub con Vercel
2. Vercel detectará automáticamente que es un proyecto Vite
3. Configura las variables de entorno en el dashboard de Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz push a tu rama principal y Vercel desplegará automáticamente

### Opción 2: Despliegue Manual con CLI

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Desplegar**
   ```bash
   vercel
   ```
   
   Para producción:
   ```bash
   vercel --prod
   ```

3. **Configurar variables de entorno**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

### Configuración de Vercel

El proyecto incluye `vercel.json` con la configuración optimizada para Vercel. No se requiere configuración adicional.

## 📁 Estructura del Proyecto

```
COMERECO WEBAPP/
├── src/                    # Código fuente de la aplicación
│   ├── components/         # Componentes React reutilizables
│   ├── lib/                # Utilidades y configuraciones
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios y API clients
│   └── hooks/              # Custom React hooks
├── public/                 # Archivos estáticos
├── docs/                   # Documentación completa del proyecto
│   ├── guides/            # Guías técnicas y de referencia
│   ├── development/       # Documentación de desarrollo
│   ├── archive/           # Documentación histórica
│   └── api/               # Scripts SQL y migraciones
├── dist/                  # Build de producción (generado)
├── package.json           # Dependencias y scripts
├── vite.config.js         # Configuración de Vite
└── vercel.json            # Configuración de Vercel
```

> 📚 **Documentación completa:** Ver [`docs/README.md`](docs/README.md) para el índice completo de documentación.

## 🧪 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción localmente

## ⚡ Performance y Optimizaciones

- **Bundle Size:** Optimizado con code splitting avanzado
- **Lazy Loading:** Todas las rutas se cargan bajo demanda
- **Cache:** Assets estáticos con cache de 1 año
- **Build:** Optimizado con esbuild para builds rápidos

## 📚 Documentación

La documentación completa está organizada en [`docs/`](docs/README.md). Documentación esencial:

### 🚀 Inicio Rápido
- **[Guía de Despliegue](docs/guides/GUIA_DESPLIEGUE.md)** - Instrucciones detalladas de despliegue
- **[Variables de Entorno](docs/guides/INSTRUCCIONES_VARIABLES_ENTORNO.md)** - Configuración de variables
- **[Deployment Checklist](docs/guides/DEPLOYMENT_CHECKLIST.md)** - Checklist completo para despliegue

### 🏗️ Arquitectura
- **[Arquitectura de Roles y Permisos](docs/ARQUITECTURA_ROLES_PERMISOS.md)** - Sistema completo de roles
- **[Documentación Técnica BD](docs/guides/DOCUMENTACION_TECNICA_BD_SUPABASE.md)** - Estructura de la BD
- **[Implementación Backend](docs/guides/IMPLEMENTACION_BACKEND_SUPABASE.md)** - Guía de implementación
- **[Reglas de Reabastecimiento Automático](docs/RESTOCK_RULES.md)** - Modelo, UI y conexión con n8n

### ⚡ Optimizaciones
- **[Mejores Prácticas Supabase](docs/guides/GUIA_BEST_PRACTICES_SUPABASE.md)** - Reglas vigentes para sesiones, RLS y consultas

> 📖 **Ver índice completo:** [`docs/README.md`](docs/README.md)

## 🔐 Seguridad y Mejores Prácticas

- Headers de seguridad configurados en Vercel
- Variables de entorno para credenciales sensibles
- Supabase client con configuración optimizada de autenticación
- Row Level Security (RLS) implementado en todas las tablas
- Autenticación basada en roles y permisos
- **IMPORTANTE:** Nunca commitees el archivo `.env` al repositorio
- Usa `.env.example` como plantilla para otros desarrolladores

## 🤝 Contribución

Para contribuir al proyecto, consulta la documentación en `docs/` y sigue las mejores prácticas de desarrollo establecidas.

## 📝 Licencia

Proyecto privado del Grupo Solven. Todos los derechos reservados.
