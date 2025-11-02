# ComerECO - Sistema de Requisiciones

Sistema web interno para la gestión de requisiciones de compra del Grupo Solven.

## 🎯 Propósito

Digitalizar y optimizar el proceso de requisiciones de compra:
- **Usuarios:** Crean requisiciones desde catálogo de productos
- **Supervisores:** Revisan, aprueban o rechazan requisiciones
- **Administradores:** Gestionan usuarios y supervisan todo el sistema

## 🚀 Stack Tecnológico

- **Frontend:** React 18 + Vite
- **Routing:** React Router 6
- **Estilos:** TailwindCSS
- **UI:** shadcn/ui (Radix UI)
- **Animaciones:** Framer Motion
- **Formularios:** React Hook Form
- **Estado:** Context API
- **Base de Datos:** Supabase (pendiente migración)

## 📦 Instalación

```bash
npm install
npm run dev
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── context/         # Contextos (Auth, Cart, Requisitions, etc.)
├── pages/           # Páginas principales
├── hooks/           # Custom hooks
├── data/            # Datos mock (temporal)
├── services/        # Servicios (plantillas, etc.)
└── lib/             # Utilidades
```

## ✅ Estado Actual

**MVP v1.0.0 - LISTO PARA PRODUCCIÓN**

### Funcionalidades Implementadas

- ✅ Autenticación (teléfono + PIN)
- ✅ Carrito de compras
- ✅ Creación de requisiciones (multi-paso)
- ✅ Aprobación/Rechazo de requisiciones
- ✅ Gestión de usuarios (admin)
- ✅ Catálogo de productos
- ✅ Favoritos
- ✅ Plantillas
- ✅ Notificaciones
- ✅ Comentarios en requisiciones
- ✅ Configuración (perfil, dark mode)

### Datos Simulados

Los datos están en `src/data/mockdata.js` con estructura **100% alineada** con el esquema SQL de Supabase para facilitar la migración.

## 🔄 Migración a Supabase

### Preparación

1. **Esquema SQL:** `supabase/migrations/001_initial_schema.sql`
2. **Datos base:** Estructura alineada en `src/data/mockdata.js`
3. **Documentación:** Ver `docs/` para detalles técnicos

### Próximos Pasos

1. Crear proyecto en Supabase
2. Ejecutar migración SQL
3. Crear servicios API (ver `docs/SERVICIOS_API_COMPLETA.md`)
4. Reemplazar localStorage con servicios Supabase
5. Migrar datos existentes

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo (puerto 3000)
npm run build    # Build de producción
npm run preview  # Preview del build
```

## 👥 Roles

- **admin:** Acceso completo al sistema
- **supervisor:** Puede aprobar/rechazar requisiciones
- **usuario:** Crea requisiciones

## 📄 Licencia

Privado - Grupo Solven

---

**Última actualización:** 2025-01-15  
**Versión:** MVP v1.0.0
