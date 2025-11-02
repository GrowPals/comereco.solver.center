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
   
   Consulta `docs/INSTRUCCIONES_VARIABLES_ENTORNO.md` para más detalles.

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
├── src/                 # Código fuente de la aplicación
│   ├── components/      # Componentes React reutilizables
│   ├── lib/             # Utilidades y configuraciones
│   ├── pages/           # Páginas de la aplicación
│   └── routes/          # Configuración de rutas
├── public/              # Archivos estáticos
├── docs/                # Documentación del proyecto
├── dist/                # Build de producción (generado)
├── package.json         # Dependencias y scripts
├── vite.config.js       # Configuración de Vite
└── vercel.json          # Configuración de Vercel
```

## 🧪 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza el build de producción localmente

## ⚡ Performance y Optimizaciones

- **Bundle Size:** Optimizado con code splitting avanzado
- **Lazy Loading:** Todas las rutas se cargan bajo demanda
- **Cache:** Assets estáticos con cache de 1 año
- **Build:** Optimizado con esbuild para builds rápidos

Para más detalles, consulta `docs/OPTIMIZACIONES_APLICADAS.md`.

## 🔐 Seguridad

- Headers de seguridad configurados en Vercel
- Variables de entorno para credenciales sensibles
- Supabase client con configuración optimizada de autenticación

## 📚 Documentación Adicional

- [Guía de Despliegue](docs/GUIA_DESPLIEGUE.md) - Instrucciones detalladas de despliegue
- [Variables de Entorno](docs/INSTRUCCIONES_VARIABLES_ENTORNO.md) - Configuración de variables
- [Arquitectura de Roles](docs/ARQUITECTURA_ROLES_PERMISOS.md) - Sistema de permisos
- [Auditoría de Base de Datos](docs/AUDITORIA_BD_SUPABASE.md) - Estructura de la BD
- [Optimizaciones Aplicadas](docs/OPTIMIZACIONES_APLICADAS.md) - Detalles de optimizaciones
- [Verificación Vercel](docs/VERIFICACION_VERCEL.md) - Checklist de verificación

## 🔐 Seguridad

- Las credenciales de Supabase deben estar en variables de entorno
- Nunca commitees el archivo `.env` al repositorio
- Usa `.env.example` como plantilla para otros desarrolladores

## 🤝 Contribución

Para contribuir al proyecto, consulta la documentación en `docs/` y sigue las mejores prácticas de desarrollo establecidas.

## 📝 Licencia

Proyecto privado del Grupo Solven. Todos los derechos reservados.
