# 🐳 Guía Completa: Supabase Local con Docker

**Proyecto:** ComerECO Web Application
**Fecha:** 2025-11-05
**Versión:** 1.0
**Autor:** Equipo de Desarrollo

---

## 📋 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [¿Qué es Supabase Local?](#-qué-es-supabase-local)
3. [¿Por qué usar Docker?](#-por-qué-usar-docker)
4. [Arquitectura Completa](#-arquitectura-completa)
5. [Servicios y Contenedores](#-servicios-y-contenedores)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Comandos Esenciales](#-comandos-esenciales)
8. [Workflow de Desarrollo](#-workflow-de-desarrollo)
9. [Migrations: Local vs Cloud](#-migrations-local-vs-cloud)
10. [Puertos y URLs](#-puertos-y-urls)
11. [Casos de Uso Prácticos](#-casos-de-uso-prácticos)
12. [Troubleshooting](#-troubleshooting)
13. [Mejores Prácticas](#-mejores-prácticas)
14. [Comparación: Local vs Cloud](#-comparación-local-vs-cloud)
15. [FAQ](#-faq)

---

## 🎯 Introducción

Esta guía explica en profundidad cómo funciona Supabase Local con Docker en el proyecto ComerECO, por qué es esencial para el desarrollo, y cómo usarlo de manera efectiva.

### ¿Para quién es esta guía?

- ✅ Desarrolladores nuevos en el proyecto
- ✅ Desarrolladores que necesitan entender la infraestructura local
- ✅ Cualquiera que quiera entender cómo funciona Supabase bajo el capó
- ✅ Equipos que necesitan configurar ambientes de desarrollo

---

## 🏗️ ¿Qué es Supabase Local?

**Supabase Local** es una versión completa de Supabase que corre en tu máquina usando Docker.

### Concepto Clave

```
┌─────────────────────────────────────────────────┐
│  Supabase Cloud (Producción)                   │
│  https://azjaehrdzdfgrumbqmuc.supabase.co      │
│                                                  │
│  - Usado por usuarios reales                    │
│  - Datos de producción                          │
│  - Costos por uso                               │
│  - Requiere internet                            │
└─────────────────────────────────────────────────┘
                    ↕️
               (sincronización)
                    ↕️
┌─────────────────────────────────────────────────┐
│  Supabase Local (Desarrollo)                    │
│  http://127.0.0.1:54321                         │
│                                                  │
│  - Solo en tu máquina                           │
│  - Datos de prueba                              │
│  - Gratis e ilimitado                           │
│  - Funciona sin internet                        │
└─────────────────────────────────────────────────┘
```

### ¿Qué incluye?

Supabase Local NO es solo una base de datos. Incluye **TODO el stack**:

- 🗄️ PostgreSQL 17 (base de datos)
- 🔐 GoTrue (autenticación)
- 📡 PostgREST (API REST automática)
- ⚡ Realtime (WebSockets)
- 📦 Storage (almacenamiento de archivos)
- 🖥️ Studio (interfaz visual)
- 📧 Email testing
- 🚀 Edge Functions
- 📊 Analytics
- 🛡️ API Gateway

---

## 🐋 ¿Por qué usar Docker?

Docker empaqueta cada componente de Supabase en **contenedores aislados**.

### Analogía Simple

Imagina Docker como un "empaque de viaje":

```
📦 Docker Container = Maleta sellada
   ├── Sistema operativo mini (Alpine Linux)
   ├── Aplicación (PostgreSQL, PostgREST, etc.)
   ├── Dependencias necesarias
   └── Configuración

✅ Ventajas:
   - Abres la maleta = Todo funciona
   - No contamina tu sistema
   - Misma maleta funciona en cualquier máquina
   - Puedes tener múltiples maletas abiertas
```

### Beneficios Específicos

#### 1. **Aislamiento**
```bash
# Sin Docker:
npm install -g supabase-cli
# Instala Node.js, PostgreSQL, Go, Rust...
# Tu sistema se llena de dependencias

# Con Docker:
docker-compose up
# Todo queda en contenedores
# Tu sistema queda limpio
```

#### 2. **Consistencia**
```yaml
# Todos en el equipo usan:
postgres: 17.6.1.032  # Misma versión
postgrest: v13.0.5    # Mismas APIs
gotrue: v2.180.0      # Mismo comportamiento
```

#### 3. **Portabilidad**
```bash
# En tu máquina (Linux WSL):
docker-compose up ✅

# En Mac de tu compañero:
docker-compose up ✅

# En servidor de staging:
docker-compose up ✅
```

#### 4. **Facilidad de Limpieza**
```bash
# Eliminar TODO Supabase Local:
docker-compose down -v

# Tu sistema:
# - Sin rastros de PostgreSQL
# - Sin configuraciones huérfanas
# - Sin archivos basura
```

---

## 🏛️ Arquitectura Completa

### Diagrama de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                    TU APLICACIÓN                             │
│              (Next.js en http://localhost:3000)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓ (HTTP/WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                 KONG API GATEWAY                             │
│              (http://127.0.0.1:54321)                        │
│                                                               │
│  - Punto de entrada único                                    │
│  - Ruteo a servicios internos                                │
│  - Rate limiting                                             │
│  - CORS handling                                             │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
       ↓              ↓              ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ PostgREST│  │ GoTrue   │  │ Realtime │  │ Storage  │
│ (REST)   │  │ (Auth)   │  │ (WS)     │  │ (Files)  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └─────────────┴─────────────┴─────────────┘
                    │
                    ↓
          ┌─────────────────┐
          │   PostgreSQL    │
          │  (port 54322)   │
          │                 │
          │  - auth.users   │
          │  - public.*     │
          │  - storage.*    │
          └─────────────────┘
```

### Flujo de una Request

```
1. Tu app hace:
   fetch('http://127.0.0.1:54321/rest/v1/products')

2. Kong recibe:
   - Valida token JWT
   - Aplica rate limiting
   - Enruta a PostgREST

3. PostgREST:
   - Traduce a SQL: SELECT * FROM products
   - Valida RLS (Row Level Security)
   - Ejecuta query en PostgreSQL

4. PostgreSQL:
   - Ejecuta query
   - Aplica políticas RLS
   - Retorna datos

5. PostgREST:
   - Formatea a JSON
   - Retorna a Kong

6. Kong:
   - Retorna a tu app
   - Logs en Vector/Logflare
```

---

## 🎛️ Servicios y Contenedores

### 1. PostgreSQL (`supabase_db`)

**Función:** Base de datos principal

**Puerto:** `54322` (local) → `5432` (interno)

**Imagen:** `public.ecr.aws/supabase/postgres:17.6.1.032`

#### ¿Qué hace?
- Almacena todos tus datos (users, products, requisitions, etc.)
- Ejecuta queries SQL
- Aplica RLS (Row Level Security)
- Ejecuta triggers y functions

#### Extensiones incluidas:
```sql
-- Ver extensiones instaladas
SELECT * FROM pg_extension;
```

Principales:
- `pgcrypto` - Encriptación
- `uuid-ossp` - Generación de UUIDs
- `pg_stat_statements` - Estadísticas de queries
- `pg_trgm` - Búsqueda full-text
- `pgvector` - Vectores para AI/ML
- `pgmq` - Message Queue (colas)

#### Acceso directo:
```bash
# Conectar con psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# O desde Docker
docker exec -it supabase_db_COMERECO-WEBAPP psql -U postgres

# Ver tablas
\dt

# Ver schemas
\dn

# Ver funciones
\df
```

#### Datos persistentes:
```bash
# Ver volumen
docker volume ls | grep supabase

# Ubicación:
# /var/lib/docker/volumes/supabase_db_COMERECO-WEBAPP/_data

# Backup:
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > backup.sql
```

---

### 2. Kong API Gateway (`supabase_kong`)

**Función:** Proxy y punto de entrada único

**Puerto:** `54321` (local) → `8000` (interno)

**Imagen:** `public.ecr.aws/supabase/kong:2.8.1`

#### ¿Qué hace?
- Recibe todas las requests
- Valida autenticación (JWT)
- Rutea a servicios internos
- Aplica rate limiting
- Maneja CORS

#### Rutas configuradas:
```
/rest/v1/*         → PostgREST (port 3000)
/auth/v1/*         → GoTrue (port 9999)
/realtime/v1/*     → Realtime (port 4000)
/storage/v1/*      → Storage (port 5000)
/graphql/v1/*      → PostgREST GraphQL
```

#### Ejemplo de uso:
```javascript
// Todas estas requests van a Kong primero
const { data } = await supabase
  .from('products')  // → Kong → PostgREST → PostgreSQL
  .select('*')

await supabase.auth.signIn()  // → Kong → GoTrue
```

---

### 3. PostgREST (`supabase_rest`)

**Función:** Auto-genera REST API desde tu schema SQL

**Puerto:** `3000` (solo interno)

**Imagen:** `public.ecr.aws/supabase/postgrest:v13.0.5`

#### ¿Qué hace?
```
Tu schema SQL:
┌─────────────────┐
│ CREATE TABLE    │
│ products (      │
│   id UUID,      │
│   name TEXT     │
│ );              │
└─────────────────┘
         ↓
PostgREST auto-genera:
┌─────────────────────────────────┐
│ GET    /products                │
│ POST   /products                │
│ PATCH  /products?id=eq.{uuid}   │
│ DELETE /products?id=eq.{uuid}   │
└─────────────────────────────────┘
```

#### Características:
- **Filtros avanzados:**
  ```javascript
  // WHERE name LIKE '%pastilla%' AND price > 10
  .select('*')
  .ilike('name', '%pastilla%')
  .gt('price', 10)
  ```

- **Joins automáticos:**
  ```javascript
  // SELECT * FROM requisitions
  // LEFT JOIN companies ON requisitions.company_id = companies.id
  .select('*, companies(*)')
  ```

- **RLS integrado:**
  ```sql
  -- PostgREST ejecuta queries con:
  SET LOCAL role = 'authenticated';
  SET LOCAL request.jwt.claim.sub = '{user_id}';
  ```

#### Ver logs:
```bash
docker logs supabase_rest_COMERECO-WEBAPP -f
```

---

### 4. GoTrue (`supabase_auth`)

**Función:** Sistema de autenticación

**Puerto:** `9999` (solo interno)

**Imagen:** `public.ecr.aws/supabase/gotrue:v2.180.0`

#### ¿Qué hace?
- Registro de usuarios
- Login/Logout
- Recuperación de contraseñas
- OAuth (Google, GitHub, etc.)
- Magic links
- Gestión de sesiones (JWT)

#### Flujo de autenticación:
```
1. User hace login:
   POST /auth/v1/token
   Body: { email, password }

2. GoTrue:
   - Valida credenciales contra auth.users
   - Genera JWT (expira en 1 hora)
   - Retorna: { access_token, refresh_token }

3. Tu app guarda token:
   localStorage.setItem('token', access_token)

4. Requests subsecuentes:
   Headers: { Authorization: 'Bearer {token}' }

5. Kong valida token:
   - Verifica firma
   - Extrae user_id
   - Pasa a PostgREST

6. PostgreSQL usa user_id para RLS:
   auth.uid() = {user_id_from_token}
```

#### Tabla auth.users:
```sql
-- Ver usuarios
SELECT id, email, created_at, confirmed_at
FROM auth.users;

-- Crear usuario manualmente (testing)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

---

### 5. Realtime (`supabase_realtime`)

**Función:** WebSockets para cambios en tiempo real

**Puerto:** `4000` (solo interno)

**Imagen:** `public.ecr.aws/supabase/realtime:v2.57.3`

#### ¿Qué hace?
```javascript
// Escucha cambios en productos
const subscription = supabase
  .channel('products-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'products'
  }, (payload) => {
    console.log('Cambio detectado:', payload)
  })
  .subscribe()
```

#### Eventos soportados:
- `INSERT` - Nuevo registro
- `UPDATE` - Registro modificado
- `DELETE` - Registro eliminado
- `*` - Todos los eventos

#### Casos de uso:
```javascript
// 1. Chat en tiempo real
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    addMessageToUI(payload.new)
  })
  .subscribe()

// 2. Notificaciones de requisiciones
supabase
  .channel('requisitions')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'requisitions',
    filter: 'user_id=eq.' + userId
  }, (payload) => {
    showNotification('Tu requisición cambió de estado')
  })
  .subscribe()

// 3. Presence (quién está online)
const channel = supabase.channel('online-users')

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Usuarios online:', Object.keys(state).length)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: userId, online_at: new Date() })
    }
  })
```

#### Habilitar Realtime en tabla:
```sql
-- Por defecto, Realtime está deshabilitado
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Ver tablas con Realtime habilitado
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

---

### 6. Storage API (`supabase_storage`)

**Función:** Almacenamiento de archivos (imágenes, PDFs, etc.)

**Puerto:** `5000` (solo interno)

**Imagen:** `public.ecr.aws/supabase/storage-api:v1.28.2`

#### ¿Qué hace?
- Upload/Download de archivos
- Genera URLs públicas o privadas
- Redimensiona imágenes automáticamente
- S3-compatible

#### Estructura:
```
storage.buckets        → Contenedores (ej: avatars, documents)
  ├── id
  ├── name
  ├── public (bool)
  └── file_size_limit

storage.objects        → Archivos individuales
  ├── id
  ├── bucket_id
  ├── name               (ej: user/123/avatar.jpg)
  ├── owner              (user_id)
  └── metadata
```

#### Ejemplo de uso:
```javascript
// 1. Crear bucket
await supabase
  .storage
  .createBucket('product-images', {
    public: true,
    fileSizeLimit: 5242880  // 5MB
  })

// 2. Upload archivo
const file = document.querySelector('input[type="file"]').files[0]
const { data, error } = await supabase
  .storage
  .from('product-images')
  .upload(`products/${productId}/main.jpg`, file)

// 3. Get URL pública
const { data } = supabase
  .storage
  .from('product-images')
  .getPublicUrl(`products/${productId}/main.jpg`)

console.log(data.publicUrl)
// http://127.0.0.1:54321/storage/v1/object/public/product-images/products/123/main.jpg

// 4. Redimensionar imagen
const url = supabase
  .storage
  .from('product-images')
  .getPublicUrl(`products/${productId}/main.jpg`, {
    transform: {
      width: 300,
      height: 300,
      resize: 'cover'
    }
  })
```

#### RLS en Storage:
```sql
-- Permitir upload solo a dueños
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir lectura pública
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

### 7. Supabase Studio (`supabase_studio`)

**Función:** Interfaz visual (igual que supabase.com/dashboard)

**Puerto:** `54323` (acceso local)

**Imagen:** `public.ecr.aws/supabase/studio:2025.10.27-sha-85b84e0`

#### ¿Qué puedes hacer?

1. **Table Editor**
   - Ver/editar datos
   - Crear/modificar tablas
   - Gestionar relaciones

2. **SQL Editor**
   - Ejecutar queries
   - Ver historial
   - Guardar snippets

3. **Authentication**
   - Ver usuarios
   - Gestionar policies
   - Configurar providers

4. **Storage**
   - Ver buckets
   - Upload/delete archivos
   - Gestionar políticas

5. **Database**
   - Ver schema
   - Triggers
   - Extensions
   - Replicación

6. **API Docs**
   - Documentación auto-generada
   - Ejemplos de código
   - OpenAPI spec

#### Acceso:
```bash
# Abrir Studio
open http://127.0.0.1:54323

# Login (primera vez):
# - No requiere password en local
# - Click en "Continue with local development"
```

---

### 8. Mailpit (`supabase_inbucket`)

**Función:** Email testing (captura emails enviados)

**Puerto:** `54324` (acceso local)

**Imagen:** `public.ecr.aws/supabase/mailpit:v1.22.3`

#### ¿Qué hace?
En desarrollo, los emails NO se envían realmente. Mailpit los captura:

```javascript
// Tu código envía email:
await supabase.auth.resetPasswordForEmail('user@example.com')

// Email NO llega a user@example.com
// En su lugar, aparece en: http://127.0.0.1:54324
```

#### Ver emails:
```bash
# 1. Abrir Mailpit UI
open http://127.0.0.1:54324

# Verás lista de emails capturados:
# - Confirmación de registro
# - Reset password
# - Magic links
# - Invitaciones
```

#### Usar magic link en desarrollo:
```bash
# 1. Ejecuta:
await supabase.auth.signInWithOtp({ email: 'test@example.com' })

# 2. Ve a Mailpit: http://127.0.0.1:54324

# 3. Abre el email, copia el link

# 4. Pégalo en el navegador
# Formato: http://localhost:3000/auth/confirm?token=xxxxx
```

---

### 9. Postgres Meta (`supabase_pg_meta`)

**Función:** API para metadata de PostgreSQL

**Puerto:** `8080` (solo interno)

**Imagen:** `public.ecr.aws/supabase/postgres-meta:v0.93.1`

#### ¿Qué hace?
Expone información de PostgreSQL vía REST API para Studio:

```bash
# Ejemplos de lo que hace:
GET /tables          → Lista de tablas
GET /columns?table=products  → Columnas de tabla
GET /roles           → Roles de PostgreSQL
GET /extensions      → Extensiones instaladas
GET /policies        → RLS policies
```

Studio usa esto para mostrar la UI.

---

### 10. Edge Runtime (`supabase_edge_runtime`)

**Función:** Ejecuta Edge Functions (Deno)

**Puerto:** `8081` (solo interno)

**Imagen:** `public.ecr.aws/supabase/edge-runtime:v1.69.15`

#### ¿Qué hace?
Corre funciones serverless escritas en TypeScript/Deno:

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()

  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

```bash
# Deploy local
supabase functions deploy hello

# Invocar
curl -X POST http://127.0.0.1:54321/functions/v1/hello \
  -H "Content-Type: application/json" \
  -d '{"name":"World"}'
```

---

### 11. Vector (`supabase_vector`)

**Función:** Recolección de logs

**Imagen:** `public.ecr.aws/supabase/vector:0.28.1-alpine`

#### ¿Qué hace?
- Agrega logs de todos los servicios
- Los envía a Logflare (Analytics)
- Permite búsqueda centralizada

---

### 12. Logflare (`supabase_analytics`)

**Función:** Dashboard de logs y analytics

**Puerto:** `54327` (acceso local)

**Imagen:** `public.ecr.aws/supabase/logflare:1.23.2`

#### ¿Qué hace?
```bash
# Ver logs en tiempo real
open http://127.0.0.1:54327

# Verás:
# - Queries SQL ejecutados
# - Requests API
# - Errores
# - Performance metrics
```

Útil para debugging.

---

## 🚀 Instalación y Configuración

### Requisitos Previos

```bash
# 1. Instalar Docker
# Ubuntu/WSL:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Mac:
# Descargar Docker Desktop: https://docker.com/products/docker-desktop

# Windows:
# Usar WSL2 + Docker Desktop

# 2. Verificar instalación
docker --version
docker-compose --version

# 3. Instalar Supabase CLI
npm install -g supabase

# Verificar
supabase --version
```

### Inicializar Proyecto

```bash
# 1. Clonar repo (si aún no lo tienes)
git clone <tu-repo>
cd COMERECO-WEBAPP

# 2. Verificar carpeta supabase existe
ls supabase/
# Deberías ver:
# - config.toml
# - migrations/
# - seed.sql

# 3. Iniciar Supabase Local
supabase start

# Primera vez toma ~5 minutos:
# - Descarga imágenes Docker (~2GB)
# - Crea contenedores
# - Aplica migrations
# - Carga seed data
```

### Configuración Inicial

```bash
# 1. Ver status
supabase status

# Output:
#     API URL: http://127.0.0.1:54321
#     DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
#     Studio URL: http://127.0.0.1:54323
#     Anon key: eyJh...
#     Service role key: eyJh...

# 2. Copiar keys a .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-de-status>
SUPABASE_SERVICE_ROLE_KEY=<service-key-de-status>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
EOF

# 3. Abrir Studio
open http://127.0.0.1:54323
```

### Verificar Todo Funciona

```bash
# 1. Test conexión DB
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT version();"

# 2. Test API
curl http://127.0.0.1:54321/rest/v1/ \
  -H "apikey: <anon-key>"

# 3. Ver containers corriendo
docker ps

# Deberías ver ~12 contenedores
```

---

## 💻 Comandos Esenciales

### Comandos Supabase CLI

```bash
# ═══════════════════════════════════════════════════
# CICLO DE VIDA
# ═══════════════════════════════════════════════════

# Iniciar todos los servicios
supabase start

# Detener (datos persisten)
supabase stop

# Detener y eliminar datos
supabase stop --no-backup

# Reiniciar
supabase restart

# Ver status
supabase status

# ═══════════════════════════════════════════════════
# MIGRATIONS
# ═══════════════════════════════════════════════════

# Crear nueva migration
supabase migration new add_products_table

# Ver migrations pendientes
supabase migration list

# Aplicar migrations (reset completo)
supabase db reset

# Diff: Ver cambios en DB vs migrations
supabase db diff

# Diff y crear migration automática
supabase db diff -f new_changes

# ═══════════════════════════════════════════════════
# SINCRONIZACIÓN CON CLOUD
# ═══════════════════════════════════════════════════

# Linkear con proyecto cloud
supabase link --project-ref <project-ref>

# Ver project-ref
supabase projects list

# Pull: Traer schema de cloud a local
supabase db pull

# Push: Subir migrations a cloud
supabase db push

# ═══════════════════════════════════════════════════
# TESTING
# ═══════════════════════════════════════════════════

# Ejecutar tests
supabase test db

# Ver logs en tiempo real
supabase logs --tail

# Ver logs de servicio específico
supabase logs postgres --tail
supabase logs auth --tail
supabase logs storage --tail

# ═══════════════════════════════════════════════════
# FUNCIONES
# ═══════════════════════════════════════════════════

# Crear función
supabase functions new my-function

# Deploy local
supabase functions deploy my-function

# Invocar
supabase functions invoke my-function \
  --body '{"name":"test"}'

# Ver logs de funciones
supabase functions logs my-function

# ═══════════════════════════════════════════════════
# GENERACIÓN DE TIPOS
# ═══════════════════════════════════════════════════

# Generar types TypeScript
supabase gen types typescript --local > types/supabase.ts

# Desde cloud
supabase gen types typescript --linked > types/supabase.ts
```

### Comandos Docker

```bash
# ═══════════════════════════════════════════════════
# VER ESTADO
# ═══════════════════════════════════════════════════

# Ver todos los contenedores
docker ps -a

# Ver solo contenedores de Supabase
docker ps | grep supabase

# Ver uso de recursos
docker stats

# Ver imágenes descargadas
docker images | grep supabase

# ═══════════════════════════════════════════════════
# LOGS
# ═══════════════════════════════════════════════════

# Logs de contenedor específico
docker logs supabase_db_COMERECO-WEBAPP

# Seguir logs en tiempo real
docker logs -f supabase_db_COMERECO-WEBAPP

# Últimas 100 líneas
docker logs --tail 100 supabase_db_COMERECO-WEBAPP

# Con timestamps
docker logs -t supabase_db_COMERECO-WEBAPP

# ═══════════════════════════════════════════════════
# ACCESO A CONTENEDORES
# ═══════════════════════════════════════════════════

# Entrar a shell de contenedor
docker exec -it supabase_db_COMERECO-WEBAPP bash

# Ejecutar comando en contenedor
docker exec supabase_db_COMERECO-WEBAPP psql -U postgres -c "SELECT COUNT(*) FROM auth.users"

# ═══════════════════════════════════════════════════
# LIMPIEZA
# ═══════════════════════════════════════════════════

# Detener todos los contenedores de Supabase
docker stop $(docker ps -q --filter "name=supabase")

# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Ver volúmenes
docker volume ls | grep supabase

# Eliminar volumen (¡CUIDADO! Pierdes datos)
docker volume rm supabase_db_COMERECO-WEBAPP

# Limpieza completa (libera espacio)
docker system prune -a --volumes

# ═══════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════

# Reiniciar contenedor específico
docker restart supabase_db_COMERECO-WEBAPP

# Ver health status
docker inspect supabase_db_COMERECO-WEBAPP | grep -A 10 Health

# Ver configuración de red
docker network inspect supabase_network_COMERECO-WEBAPP

# Ver variables de entorno
docker exec supabase_db_COMERECO-WEBAPP env
```

### Comandos PostgreSQL

```bash
# ═══════════════════════════════════════════════════
# CONEXIÓN
# ═══════════════════════════════════════════════════

# Conectar con psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# O desde variable
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
psql $DATABASE_URL

# ═══════════════════════════════════════════════════
# DENTRO DE psql (\comandos)
# ═══════════════════════════════════════════════════

# Listar bases de datos
\l

# Conectar a otra DB
\c postgres

# Listar schemas
\dn

# Listar tablas (schema actual)
\dt

# Listar tablas (todos los schemas)
\dt *.*

# Ver tabla específica
\d products

# Listar funciones
\df

# Listar triggers
SELECT * FROM pg_trigger;

# Listar políticas RLS
\dp products

# Ver usuarios/roles
\du

# Ver tamaño de tablas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Salir
\q

# ═══════════════════════════════════════════════════
# QUERIES ÚTILES
# ═══════════════════════════════════════════════════

# Ver migrations aplicadas
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version;

# Ver usuarios auth
SELECT id, email, created_at, confirmed_at
FROM auth.users;

# Ver sesiones activas
SELECT *
FROM auth.sessions
WHERE expires_at > NOW();

# Ver queries lentos
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# Ver conexiones activas
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE state = 'active';

# Vacuumar tabla (optimizar)
VACUUM ANALYZE products;

# Recrear índices
REINDEX TABLE products;

# ═══════════════════════════════════════════════════
# BACKUP Y RESTORE
# ═══════════════════════════════════════════════════

# Backup completo
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > backup_$(date +%Y%m%d).sql

# Backup solo schema
pg_dump --schema-only postgresql://postgres:postgres@127.0.0.1:54322/postgres > schema.sql

# Backup solo datos
pg_dump --data-only postgresql://postgres:postgres@127.0.0.1:54322/postgres > data.sql

# Backup tabla específica
pg_dump -t products postgresql://postgres:postgres@127.0.0.1:54322/postgres > products_backup.sql

# Restore
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

---

## 🔄 Workflow de Desarrollo

### Flujo Completo: Idea → Producción

```
┌─────────────────────────────────────────────────┐
│  1. DESARROLLO LOCAL                            │
└─────────────────────────────────────────────────┘

# Iniciar Supabase Local
cd ~/COMERECO-WEBAPP
supabase start

# Abrir Studio
open http://127.0.0.1:54323

┌─────────────────────────────────────────────────┐
│  2. CREAR CAMBIOS EN DB                         │
└─────────────────────────────────────────────────┘

# Opción A: SQL Editor en Studio
# - Escribir SQL
# - Ejecutar
# - Ver resultados inmediatos

# Opción B: Crear migration
supabase migration new add_restock_rules

# Editar: supabase/migrations/20250105_add_restock_rules.sql
CREATE TABLE restock_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  min_stock INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restock_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company rules"
ON restock_rules FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products
    WHERE company_id = auth.jwt()->>'company_id'::uuid
  )
);

# Aplicar migration
supabase db reset

# Verificar
psql $DATABASE_URL -c "\d restock_rules"

┌─────────────────────────────────────────────────┐
│  3. DESARROLLAR FEATURES EN NEXT.JS             │
└─────────────────────────────────────────────────┘

# Terminal 1: Supabase (ya corriendo)
supabase start

# Terminal 2: Next.js dev server
npm run dev

# Terminal 3: Ver logs Supabase
supabase logs --tail

# Desarrollar features:
# - src/app/restock-rules/page.tsx
# - src/lib/api/restock-rules.ts

┌─────────────────────────────────────────────────┐
│  4. TESTING                                     │
└─────────────────────────────────────────────────┘

# Test manual en http://localhost:3000
# - Crear reglas
# - Editar reglas
# - Verificar RLS funciona

# Test de DB directo
psql $DATABASE_URL
> INSERT INTO restock_rules (product_id, min_stock)
  VALUES ('...', 10);
> SELECT * FROM restock_rules;

# Ver requests en Studio Logs
open http://127.0.0.1:54323/project/default/logs/explorer

┌─────────────────────────────────────────────────┐
│  5. COMMIT CHANGES                              │
└─────────────────────────────────────────────────┘

git add supabase/migrations/
git add src/app/restock-rules/
git commit -m "feat: Add restock rules management"
git push origin feature/restock-rules

┌─────────────────────────────────────────────────┐
│  6. PUSH A STAGING (opcional)                   │
└─────────────────────────────────────────────────┘

# Link a proyecto staging
supabase link --project-ref staging-ref

# Push migrations
supabase db push

# Deploy app a Vercel staging
git push origin staging

┌─────────────────────────────────────────────────┐
│  7. PUSH A PRODUCCIÓN                           │
└─────────────────────────────────────────────────┘

# Link a producción
supabase link --project-ref prod-ref

# Verificar migrations pendientes
supabase db diff

# Push
supabase db push

# Confirmar en Supabase Dashboard
open https://supabase.com/dashboard/project/<prod-ref>/editor

# Deploy app
git push origin main

# Vercel auto-deploys

┌─────────────────────────────────────────────────┐
│  8. MONITOREO                                   │
└─────────────────────────────────────────────────┘

# Ver logs producción
open https://supabase.com/dashboard/project/<prod-ref>/logs

# Ver analytics
open https://vercel.com/dashboard/analytics
```

### Workflow Diario

```bash
# ═══════════════════════════════════════════════════
# INICIO DEL DÍA
# ═══════════════════════════════════════════════════

# 1. Pull últimos cambios
git pull origin main

# 2. Iniciar Supabase (si no está corriendo)
supabase start

# 3. Aplicar nuevas migrations (si hay)
supabase db reset

# 4. Iniciar dev server
npm run dev

# 5. Abrir Studio
open http://127.0.0.1:54323

# ═══════════════════════════════════════════════════
# DURANTE EL DÍA
# ═══════════════════════════════════════════════════

# Si cambias DB:
# 1. Edita SQL en Studio O crea migration
# 2. Si usaste Studio, genera migration:
supabase db diff -f changes_20250105

# 3. Aplica
supabase db reset

# Si cambias código:
# - Next.js auto-reload (Fast Refresh)
# - Supabase no requiere restart

# ═══════════════════════════════════════════════════
# FIN DEL DÍA
# ═══════════════════════════════════════════════════

# 1. Commit
git add .
git commit -m "feat: ..."
git push

# 2. Detener Supabase (opcional)
supabase stop

# O dejar corriendo para mañana (recomendado)
# Los contenedores usan poca RAM cuando idle
```

---

## 🗂️ Migrations: Local vs Cloud

### ¿Qué son las Migrations?

**Migrations** son archivos SQL que definen cambios en tu schema.

```
supabase/migrations/
├── 20250101000000_initial_schema.sql
├── 20250102120000_add_products.sql
├── 20250103090000_add_rls_policies.sql
└── 20250105140000_add_restock_rules.sql
```

### Reglas de Oro

1. ✅ **NUNCA editar migrations aplicadas**
   - Las migrations son inmutables
   - Si necesitas cambiar algo, crea nueva migration

2. ✅ **Las migrations son la fuente de verdad**
   - No el schema en Studio
   - No cambios manuales en producción

3. ✅ **Siempre usar migrations en local primero**
   - Test local
   - Luego push a cloud

### Crear Migration

```bash
# Método 1: Manual
supabase migration new add_inventory_table

# Editar archivo generado
vim supabase/migrations/20250105140523_add_inventory_table.sql

# Escribir SQL:
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

# Método 2: Desde cambios en Studio
# 1. Hacer cambios en Studio (Table Editor)
# 2. Generar migration desde diff:
supabase db diff -f add_inventory_table

# Supabase auto-genera SQL basado en cambios
```

### Aplicar Migration Local

```bash
# Opción A: Reset (recomendado)
supabase db reset

# Lo que hace:
# 1. DROP DATABASE
# 2. CREATE DATABASE
# 3. Aplica TODAS las migrations en orden
# 4. Carga seed.sql (datos de prueba)

# Opción B: Aplicar solo nuevas (no recomendado local)
# No hay comando directo, usa reset siempre

# Verificar aplicadas
psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations"
```

### Push a Cloud

```bash
# 1. Link con cloud (primera vez)
supabase link --project-ref azjaehrdzdfgrumbqmuc

# 2. Ver qué migrations faltan en cloud
supabase db diff

# Output:
# Local migrations not in remote:
# - 20250105140523_add_inventory_table.sql

# 3. Push
supabase db push

# ⚠️ IMPORTANTE:
# - Esto NO hace reset en cloud
# - Solo aplica migrations faltantes
# - Es irreversible
# - ¡Haz backup primero!

# 4. Confirmar en Dashboard
open https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc/editor
```

### Pull desde Cloud

```bash
# Scenario: Alguien más hizo cambios en cloud
# (no recomendado, pero pasa)

# 1. Pull schema
supabase db pull

# Genera nueva migration con diferencias

# 2. Review cambios
git diff supabase/migrations/

# 3. Si OK, commit
git add supabase/migrations/
git commit -m "chore: Sync schema from cloud"

# 4. Aplicar local
supabase db reset
```

### Rollback (Revertir)

```bash
# No hay rollback automático en Supabase
# Debes crear migration manual

# Si aplicaste:
# 20250105_add_column.sql
ALTER TABLE products ADD COLUMN new_field TEXT;

# Crear rollback:
supabase migration new rollback_add_column

# Editar:
ALTER TABLE products DROP COLUMN new_field;

# Aplicar
supabase db reset  # local
supabase db push   # cloud
```

### Estrategia de Migrations

```bash
# ✅ BUENAS PRÁCTICAS

# 1. Migrations pequeñas y frecuentes
# Mal:
# 20250105_big_update.sql (500 líneas, 10 tablas)

# Bien:
# 20250105_add_products_table.sql
# 20250105_add_products_rls.sql
# 20250105_add_products_indexes.sql

# 2. Nombres descriptivos
# Mal:
# 20250105_changes.sql
# 20250105_fix.sql

# Bien:
# 20250105_add_inventory_tracking.sql
# 20250105_fix_products_rls_policy.sql

# 3. Comentarios explicativos
-- Migration: Add inventory tracking
-- Purpose: Track real-time product quantities
-- Related: Issue #123
-- Author: @username

CREATE TABLE inventory (...);

# 4. Idempotencia (pueden ejecutarse múltiples veces)
-- Mal:
CREATE TABLE products (...);  -- Falla si ya existe

-- Bien:
CREATE TABLE IF NOT EXISTS products (...);

-- O:
DROP TABLE IF EXISTS products;
CREATE TABLE products (...);

# 5. Transacciones
BEGIN;

-- Cambios relacionados
ALTER TABLE products ADD COLUMN stock INTEGER;
CREATE INDEX idx_products_stock ON products(stock);

COMMIT;
```

### Ejemplo Completo

```bash
# ═══════════════════════════════════════════════════
# FEATURE: Agregar sistema de notificaciones
# ═══════════════════════════════════════════════════

# 1. Crear migration
supabase migration new add_notifications_system

# 2. Editar: supabase/migrations/20250105_add_notifications_system.sql
-- Tabla de notificaciones
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Función para marcar como leídas
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpiar notificaciones antiguas (> 30 días)
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = TRUE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_old_notifications
AFTER INSERT ON notifications
EXECUTE FUNCTION delete_old_notifications();

# 3. Aplicar local
supabase db reset

# 4. Verificar
psql $DATABASE_URL
> \d notifications
> SELECT * FROM pg_policies WHERE tablename = 'notifications';

# 5. Seed data (opcional)
# Editar: supabase/seed.sql
INSERT INTO notifications (user_id, title, message, type)
SELECT
  id,
  'Welcome!',
  'Thanks for joining ComerECO',
  'success'
FROM auth.users
LIMIT 5;

# 6. Test en app
# src/lib/api/notifications.ts
export async function getNotifications() {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  return data
}

# 7. Commit
git add supabase/migrations/20250105_add_notifications_system.sql
git add supabase/seed.sql
git commit -m "feat: Add notifications system"

# 8. Push a cloud cuando esté listo
supabase link --project-ref prod-ref
supabase db push
```

---

## 🌐 Puertos y URLs

### Mapa de Puertos

```
┌──────────────┬────────────────┬─────────────────────────────┐
│   Servicio   │    Puerto      │         URL/Uso             │
├──────────────┼────────────────┼─────────────────────────────┤
│ Kong         │ 54321          │ http://127.0.0.1:54321      │
│ (API Gateway)│                │ Punto de entrada principal  │
├──────────────┼────────────────┼─────────────────────────────┤
│ PostgreSQL   │ 54322          │ postgresql://               │
│              │                │   postgres:postgres@        │
│              │                │   127.0.0.1:54322/postgres  │
├──────────────┼────────────────┼─────────────────────────────┤
│ Studio       │ 54323          │ http://127.0.0.1:54323      │
│ (Dashboard)  │                │ UI de administración        │
├──────────────┼────────────────┼─────────────────────────────┤
│ Mailpit      │ 54324          │ http://127.0.0.1:54324      │
│ (Email test) │                │ Ver emails capturados       │
├──────────────┼────────────────┼─────────────────────────────┤
│ Logflare     │ 54327          │ http://127.0.0.1:54327      │
│ (Analytics)  │                │ Dashboard de logs           │
├──────────────┼────────────────┼─────────────────────────────┤
│ PostgREST    │ 3000 (interno) │ Via Kong: /rest/v1/*        │
├──────────────┼────────────────┼─────────────────────────────┤
│ GoTrue       │ 9999 (interno) │ Via Kong: /auth/v1/*        │
├──────────────┼────────────────┼─────────────────────────────┤
│ Realtime     │ 4000 (interno) │ Via Kong: /realtime/v1/*    │
├──────────────┼────────────────┼─────────────────────────────┤
│ Storage      │ 5000 (interno) │ Via Kong: /storage/v1/*     │
└──────────────┴────────────────┴─────────────────────────────┘
```

### URLs por Funcionalidad

```javascript
// ═══════════════════════════════════════════════════
// REST API (PostgREST)
// ═══════════════════════════════════════════════════
const API_URL = 'http://127.0.0.1:54321/rest/v1'

// Listar productos
fetch(`${API_URL}/products`, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${token}`
  }
})

// ═══════════════════════════════════════════════════
// Authentication (GoTrue)
// ═══════════════════════════════════════════════════
const AUTH_URL = 'http://127.0.0.1:54321/auth/v1'

// Signup
fetch(`${AUTH_URL}/signup`, {
  method: 'POST',
  headers: { 'apikey': ANON_KEY },
  body: JSON.stringify({ email, password })
})

// Login
fetch(`${AUTH_URL}/token?grant_type=password`, {
  method: 'POST',
  headers: { 'apikey': ANON_KEY },
  body: JSON.stringify({ email, password })
})

// ═══════════════════════════════════════════════════
// Storage
// ═══════════════════════════════════════════════════
const STORAGE_URL = 'http://127.0.0.1:54321/storage/v1'

// Upload
const formData = new FormData()
formData.append('file', file)

fetch(`${STORAGE_URL}/object/bucket-name/path/file.jpg`, {
  method: 'POST',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

// ═══════════════════════════════════════════════════
// Realtime (WebSocket)
// ═══════════════════════════════════════════════════
const WS_URL = 'ws://127.0.0.1:54321/realtime/v1/websocket'

const socket = new WebSocket(WS_URL)

// ═══════════════════════════════════════════════════
// GraphQL
// ═══════════════════════════════════════════════════
const GRAPHQL_URL = 'http://127.0.0.1:54321/graphql/v1'

fetch(GRAPHQL_URL, {
  method: 'POST',
  headers: {
    'apikey': ANON_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `
      query {
        productsCollection {
          edges {
            node {
              id
              name
              price
            }
          }
        }
      }
    `
  })
})
```

### Configuración en .env.local

```bash
# ═══════════════════════════════════════════════════
# LOCAL DEVELOPMENT
# ═══════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# ═══════════════════════════════════════════════════
# PRODUCTION (Vercel)
# ═══════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://azjaehrdzdfgrumbqmuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres.[PASSWORD]@db.azjaehrdzdfgrumbqmuc.supabase.co:5432/postgres
```

---

## 💡 Casos de Uso Prácticos

### Caso 1: Desarrollar Feature Completo (RLS Testing)

**Objetivo:** Agregar feature de "favoritos" con RLS

```bash
# ═══════════════════════════════════════════════════
# PASO 1: Setup Local
# ═══════════════════════════════════════════════════
supabase start
open http://127.0.0.1:54323

# ═══════════════════════════════════════════════════
# PASO 2: Crear Schema
# ═══════════════════════════════════════════════════
supabase migration new add_favorites

# Editar migration:
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Ver solo propios favoritos
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Agregar solo a sí mismo
CREATE POLICY "Users can insert own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Eliminar solo propios
CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

# Aplicar
supabase db reset

# ═══════════════════════════════════════════════════
# PASO 3: Crear Usuarios de Prueba
# ═══════════════════════════════════════════════════
psql $DATABASE_URL

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user1@test.com', crypt('password', gen_salt('bf')), NOW()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user2@test.com', crypt('password', gen_salt('bf')), NOW());

# ═══════════════════════════════════════════════════
# PASO 4: Test RLS Manual
# ═══════════════════════════════════════════════════

-- Simular user1
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Agregar favorito
INSERT INTO favorites (user_id, product_id)
VALUES ('11111111-1111-1111-1111-111111111111', (SELECT id FROM products LIMIT 1));

-- Ver favoritos (debe ver 1)
SELECT * FROM favorites;

-- Intentar ver favoritos de user2 (debe retornar vacío)
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SELECT * FROM favorites;  -- 0 resultados ✅

# ═══════════════════════════════════════════════════
# PASO 5: Desarrollar API
# ═══════════════════════════════════════════════════

# src/lib/api/favorites.ts
export async function addFavorite(productId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ product_id: productId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getFavorites() {
  const { data } = await supabase
    .from('favorites')
    .select('*, products(*)')
  return data
}

export async function removeFavorite(productId: string) {
  await supabase
    .from('favorites')
    .delete()
    .eq('product_id', productId)
}

# ═══════════════════════════════════════════════════
# PASO 6: Test en App
# ═══════════════════════════════════════════════════

# Terminal 2:
npm run dev

# Browser: http://localhost:3000
# 1. Login como user1@test.com
# 2. Agregar favorito
# 3. Verificar aparece en lista

# Studio: Ver queries ejecutados
open http://127.0.0.1:54323/project/default/logs/explorer

# ═══════════════════════════════════════════════════
# PASO 7: Deploy
# ═══════════════════════════════════════════════════
git add .
git commit -m "feat: Add favorites system"
git push

supabase db push  # Push migration a cloud
```

---

### Caso 2: Debugging Query Lento

**Objetivo:** Identificar y resolver query lento

```bash
# ═══════════════════════════════════════════════════
# PASO 1: Detectar Query Lento
# ═══════════════════════════════════════════════════

# En tu app, notas que listar requisitions toma >2s

# ═══════════════════════════════════════════════════
# PASO 2: Ver Query en Studio
# ═══════════════════════════════════════════════════
open http://127.0.0.1:54323/project/default/logs/explorer

# Buscar query lento
# Filter: duration > 1000ms

# ═══════════════════════════════════════════════════
# PASO 3: Analizar con EXPLAIN
# ═══════════════════════════════════════════════════
psql $DATABASE_URL

EXPLAIN ANALYZE
SELECT
  r.*,
  c.name as company_name,
  p.name as project_name,
  u.email as created_by_email
FROM requisitions r
JOIN companies c ON r.company_id = c.id
JOIN projects p ON r.project_id = p.id
JOIN auth.users u ON r.created_by = u.id
WHERE r.company_id = '...'
ORDER BY r.created_at DESC;

# Output muestra:
# - Seq Scan on requisitions (LENTO) ❌
# - No usa índices

# ═══════════════════════════════════════════════════
# PASO 4: Agregar Índices
# ═══════════════════════════════════════════════════
supabase migration new add_requisitions_indexes

# Editar:
CREATE INDEX idx_requisitions_company_id ON requisitions(company_id);
CREATE INDEX idx_requisitions_created_at ON requisitions(created_at DESC);
CREATE INDEX idx_requisitions_company_created ON requisitions(company_id, created_at DESC);

# Aplicar
supabase db reset

# ═══════════════════════════════════════════════════
# PASO 5: Verificar Mejora
# ═══════════════════════════════════════════════════
EXPLAIN ANALYZE
-- mismo query

# Output ahora muestra:
# - Index Scan using idx_requisitions_company_created ✅
# - Execution Time: 12ms (antes: 2000ms)

# ═══════════════════════════════════════════════════
# PASO 6: Test en App
# ═══════════════════════════════════════════════════
# Refrescar página
# Listar requisitions ahora <100ms

# ═══════════════════════════════════════════════════
# PASO 7: Deploy
# ═══════════════════════════════════════════════════
git add supabase/migrations/
git commit -m "perf: Add indexes for requisitions queries"
supabase db push
```

---

### Caso 3: Sincronizar Schema entre Devs

**Objetivo:** Dev B quiere los cambios de Dev A

```bash
# ═══════════════════════════════════════════════════
# SCENARIO
# ═══════════════════════════════════════════════════
# Dev A creó nueva tabla "inventory"
# Dev A hizo push a main
# Dev B necesita sincronizar

# ═══════════════════════════════════════════════════
# DEV B: Pull Changes
# ═══════════════════════════════════════════════════

# 1. Pull código
git pull origin main

# 2. Ver nuevas migrations
ls supabase/migrations/
# Output:
# - 20250105_add_inventory.sql (NUEVA)

# 3. Aplicar migrations
supabase db reset

# Output:
# Applying migration 20250105_add_inventory.sql...
# ✓ Migration applied successfully

# 4. Verificar
psql $DATABASE_URL -c "\d inventory"

# 5. Continuar desarrollo normalmente
npm run dev
```

---

### Caso 4: Testing de Edge Functions

```bash
# ═══════════════════════════════════════════════════
# PASO 1: Crear Function
# ═══════════════════════════════════════════════════
supabase functions new send-notification

# Editar: supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, message } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Crear notificación en DB
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: 'New Notification',
      message: message,
      type: 'info'
    })

  return new Response(JSON.stringify({ success: true }))
})

# ═══════════════════════════════════════════════════
# PASO 2: Deploy Local
# ═══════════════════════════════════════════════════
supabase functions deploy send-notification

# ═══════════════════════════════════════════════════
# PASO 3: Test
# ═══════════════════════════════════════════════════
curl -X POST http://127.0.0.1:54321/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{"userId":"11111111-1111-1111-1111-111111111111","message":"Hello!"}'

# ═══════════════════════════════════════════════════
# PASO 4: Ver Logs
# ═══════════════════════════════════════════════════
supabase functions logs send-notification --tail

# ═══════════════════════════════════════════════════
# PASO 5: Verificar en DB
# ═══════════════════════════════════════════════════
psql $DATABASE_URL -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1"
```

---

## 🐛 Troubleshooting

### Problema 1: Supabase no inicia

```bash
# Síntomas:
supabase start
# Error: Cannot connect to Docker daemon

# ═══════════════════════════════════════════════════
# SOLUCIÓN 1: Docker no está corriendo
# ═══════════════════════════════════════════════════
sudo systemctl start docker    # Linux
open -a Docker                  # Mac

# Verificar
docker ps

# ═══════════════════════════════════════════════════
# SOLUCIÓN 2: Permisos
# ═══════════════════════════════════════════════════
sudo usermod -aG docker $USER
newgrp docker

# ═══════════════════════════════════════════════════
# SOLUCIÓN 3: Puertos ocupados
# ═══════════════════════════════════════════════════
# Ver qué usa puerto 54321
sudo lsof -i :54321

# Matar proceso
sudo kill -9 <PID>

# O cambiar puerto en config.toml
[api]
port = 54321  → port = 54421

# ═══════════════════════════════════════════════════
# SOLUCIÓN 4: Reset completo
# ═══════════════════════════════════════════════════
supabase stop
docker system prune -a --volumes  # ⚠️ Elimina TODO Docker
supabase start
```

---

### Problema 2: Migration Falla

```bash
# Síntomas:
supabase db reset
# Error: migration 20250105_xxx.sql failed

# ═══════════════════════════════════════════════════
# SOLUCIÓN 1: Ver error específico
# ═══════════════════════════════════════════════════
supabase db reset 2>&1 | grep -A 10 "ERROR"

# Errores comunes:
# - "relation already exists" → DROP IF EXISTS primero
# - "column does not exist" → Typo en nombre
# - "syntax error" → SQL inválido

# ═══════════════════════════════════════════════════
# SOLUCIÓN 2: Test migration manualmente
# ═══════════════════════════════════════════════════
psql $DATABASE_URL < supabase/migrations/20250105_xxx.sql

# Ver línea exacta con error

# ═══════════════════════════════════════════════════
# SOLUCIÓN 3: Dividir migration grande
# ═══════════════════════════════════════════════════
# Si migration tiene 500 líneas, dividir en partes
# Ejecutar parte por parte para encontrar error

# ═══════════════════════════════════════════════════
# SOLUCIÓN 4: Skip migration (último recurso)
# ═══════════════════════════════════════════════════
# Marcar como aplicada sin ejecutar
psql $DATABASE_URL -c "
  INSERT INTO supabase_migrations.schema_migrations (version)
  VALUES ('20250105_xxx');
"
```

---

### Problema 3: RLS No Funciona

```bash
# Síntomas:
# - Queries retornan datos de otros usuarios
# - O retornan vacío cuando no debería

# ═══════════════════════════════════════════════════
# DEBUG PASO A PASO
# ═══════════════════════════════════════════════════

# 1. Verificar RLS está habilitado
psql $DATABASE_URL -c "
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'tu_tabla';
"
# rowsecurity debe ser 't' (true)

# 2. Ver policies
psql $DATABASE_URL -c "
  SELECT *
  FROM pg_policies
  WHERE tablename = 'tu_tabla';
"

# 3. Test manual con role
psql $DATABASE_URL
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '<user-id>';
SELECT * FROM tu_tabla;

# 4. Si retorna vacío, policy está muy restrictivo
# Si retorna todo, falta policy

# 5. Ver query ejecutado por PostgREST
docker logs supabase_rest_COMERECO-WEBAPP -f
# Hacer request desde app
# Ver SQL generado

# 6. Copiar SQL y ejecutar manual
psql $DATABASE_URL
-- Pegar SQL
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
<SQL copiado>;
```

---

### Problema 4: Containers Usan Mucha RAM

```bash
# Ver uso
docker stats

# ═══════════════════════════════════════════════════
# SOLUCIÓN 1: Limit memoria
# ═══════════════════════════════════════════════════
# Editar: ~/.config/supabase/config.toml (No existe en Supabase)
# Docker Compose no expone limits fácilmente

# Alternativa: Usar Docker Desktop limits
# Settings → Resources → Memory Limit

# ═══════════════════════════════════════════════════
# SOLUCIÓN 2: Stop cuando no uses
# ═══════════════════════════════════════════════════
supabase stop  # RAM liberada inmediatamente

# ═══════════════════════════════════════════════════
# SOLUCIÓN 3: Cleanup logs
# ═══════════════════════════════════════════════════
docker exec supabase_db_COMERECO-WEBAPP psql -U postgres -c "
  TRUNCATE supabase_migrations.seed_files;
"

# ═══════════════════════════════════════════════════
# SOLUCIÓN 4: Disable analytics local
# ═══════════════════════════════════════════════════
# Analytics (Logflare) usa ~500MB
# Editar supabase/config.toml:
[analytics]
enabled = false

supabase stop
supabase start
```

---

### Problema 5: Datos Desincronizados

```bash
# Scenario: Studio muestra datos viejos

# ═══════════════════════════════════════════════════
# SOLUCIÓN 1: Refresh cache
# ═══════════════════════════════════════════════════
# En Studio: CMD+R (Mac) o CTRL+R (Windows)

# ═══════════════════════════════════════════════════
# SOLUCIÓN 2: Verificar directamente en DB
# ═══════════════════════════════════════════════════
psql $DATABASE_URL -c "SELECT * FROM tu_tabla"

# ═══════════════════════════════════════════════════
# SOLUCIÓN 3: Restart services
# ═══════════════════════════════════════════════════
supabase restart

# ═══════════════════════════════════════════════════
# SOLUCIÓN 4: Full reset
# ═══════════════════════════════════════════════════
supabase db reset
```

---

## ✅ Mejores Prácticas

### 1. Gestión de Migrations

```bash
# ✅ DO
# - Crear migrations pequeñas y frecuentes
supabase migration new add_single_table

# - Nombres descriptivos
add_inventory_tracking.sql
fix_products_rls_recursion.sql

# - Comentarios explicativos
-- Migration: Add inventory tracking
-- Purpose: Real-time stock management
-- Related: Issue #123

# - Idempotencia
CREATE TABLE IF NOT EXISTS ...
DROP POLICY IF EXISTS ...

# - Transacciones
BEGIN;
-- cambios relacionados
COMMIT;

# ❌ DON'T
# - Editar migrations aplicadas
# - Nombres genéricos: changes.sql, fix.sql
# - Migrations gigantes (>200 líneas)
# - Olvidar comentarios
```

### 2. Desarrollo Local First

```bash
# ✅ DO
# 1. Desarrollar en local
supabase start
# 2. Test exhaustivo
# 3. Commit
git push
# 4. Deploy a cloud
supabase db push

# ❌ DON'T
# 1. Hacer cambios directo en cloud Dashboard
# 2. Olvidar pull a local
# 3. Desincronización entre local y cloud
```

### 3. Manejo de Datos Sensibles

```bash
# ✅ DO
# - Service role key SOLO en server
# .env.local (no commitear):
SUPABASE_SERVICE_ROLE_KEY=xxx

# - Anon key puede ser pública
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# - RLS protege datos
# Anon key + RLS = Seguro

# ❌ DON'T
# - Service key en frontend
# - Commitear .env.local
# - Confiar en "security through obscurity"
```

### 4. Performance

```bash
# ✅ DO
# - Índices en columnas filtradas
CREATE INDEX idx_products_company ON products(company_id);

# - Límite en queries
.select('*').limit(50)

# - Pagination
.range(0, 49)

# ❌ DON'T
# - SELECT * en tablas grandes sin límite
# - Joins innecesarios
# - Filtros en columnas sin índices
```

### 5. Testing

```bash
# ✅ DO
# - Test RLS manualmente
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '<user-id>';

# - Seed data representativa
# supabase/seed.sql con casos reales

# - Test performance
EXPLAIN ANALYZE <query>

# ❌ DON'T
# - Asumir RLS funciona sin test
# - Solo test con Service Role (bypasses RLS)
# - Ignorar performance hasta producción
```

---

## 📊 Comparación: Local vs Cloud

```
┌─────────────────┬───────────────────┬───────────────────┐
│   Aspecto       │  Local (Docker)   │   Cloud           │
├─────────────────┼───────────────────┼───────────────────┤
│ Costo           │ Gratis            │ $25/mes (Pro)     │
├─────────────────┼───────────────────┼───────────────────┤
│ Latencia        │ <5ms              │ 50-200ms          │
├─────────────────┼───────────────────┼───────────────────┤
│ Internet        │ No necesario      │ Requerido         │
├─────────────────┼───────────────────┼───────────────────┤
│ Límites API     │ Ilimitado         │ 500 req/s (Pro)   │
├─────────────────┼───────────────────┼───────────────────┤
│ Storage         │ Disco local       │ 100GB (Pro)       │
├─────────────────┼───────────────────┼───────────────────┤
│ Backups         │ Manual            │ Automático diario │
├─────────────────┼───────────────────┼───────────────────┤
│ Escalabilidad   │ Limitada a PC     │ Auto-scale        │
├─────────────────┼───────────────────┼───────────────────┤
│ Uptime          │ Cuando PC on      │ 99.9% SLA         │
├─────────────────┼───────────────────┼───────────────────┤
│ Uso ideal       │ Desarrollo        │ Producción        │
├─────────────────┼───────────────────┼───────────────────┤
│ Database        │ PostgreSQL 17     │ PostgreSQL 15     │
│ Version         │ (más reciente)    │ (más estable)     │
└─────────────────┴───────────────────┴───────────────────┘
```

### Cuándo Usar Qué

```bash
# ═══════════════════════════════════════════════════
# USA LOCAL para:
# ═══════════════════════════════════════════════════
✅ Desarrollo diario
✅ Testing de features
✅ Experimentación (sin miedo a romper)
✅ Debugging profundo
✅ Desarrollo sin internet
✅ Crear migrations
✅ CI/CD pipelines
✅ Onboarding nuevos devs

# ═══════════════════════════════════════════════════
# USA CLOUD para:
# ═══════════════════════════════════════════════════
✅ Producción
✅ Staging
✅ Demos a clientes
✅ Testing con usuarios reales
✅ Datos persistentes
✅ Colaboración en tiempo real
✅ Webhooks externos
✅ Integraciones (n8n → BIND)
```

---

## ❓ FAQ

### ¿Debo commitear `.env.local`?

❌ **NO.** `.env.local` debe estar en `.gitignore`

```bash
# .gitignore
.env.local
.env*.local

# Commitear .env.example como template
```

### ¿Puedo usar Supabase Cloud sin local?

✅ **SÍ**, pero no es recomendado. Perderías:
- Testing rápido
- Desarrollo sin internet
- Experimentación segura

### ¿Cómo sincronizo DB entre local y cloud?

```bash
# Cloud → Local
supabase db pull  # Trae schema

# Local → Cloud
supabase db push  # Sube migrations
```

### ¿Los datos de local se sincronizan a cloud?

❌ **NO**. Solo el **schema** (migrations) se sincroniza.

Datos son independientes:
- Local: Datos de prueba (seed.sql)
- Cloud: Datos reales de usuarios

### ¿Cómo backup mi DB local?

```bash
# Backup completo
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql

# O usar supabase CLI
supabase db dump -f backup.sql
```

### ¿Puedo correr múltiples proyectos Supabase local?

✅ **SÍ**, pero en diferentes puertos

```bash
# Proyecto 1
cd ~/project1
supabase start  # Usa puertos 54321, 54322, 54323...

# Proyecto 2
cd ~/project2
supabase start  # Usa puertos 54421, 54422, 54423...
```

### ¿Qué pasa si elimino volúmenes Docker?

⚠️ **Pierdes todos los datos locales**

```bash
docker volume rm supabase_db_COMERECO-WEBAPP
# ❌ Todos los datos eliminados

# Solución:
supabase db reset  # Re-aplica migrations + seed
```

### ¿Cómo actualizar Supabase Local?

```bash
# Actualizar CLI
npm update -g supabase

# Actualizar imágenes Docker
supabase stop
docker pull public.ecr.aws/supabase/postgres:latest
# (Supabase CLI descarga automáticamente)
supabase start
```

### ¿Puedo usar otro DB en lugar de PostgreSQL local?

❌ **NO**. Supabase Local requiere PostgreSQL 17 con extensiones específicas.

### ¿Cómo debuggear RLS políticas?

```sql
-- Ver si RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Ver policies
SELECT * FROM pg_policies WHERE tablename = 'tu_tabla';

-- Test manual
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '<user-id>';
SELECT * FROM tu_tabla;
```

### ¿Cómo hacer que migrations sean reversibles?

Crear par de migrations:

```bash
# Up migration
supabase migration new add_column
# Contenido:
ALTER TABLE products ADD COLUMN new_field TEXT;

# Down migration (manual)
supabase migration new rollback_add_column
# Contenido:
ALTER TABLE products DROP COLUMN new_field;
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Docker Docs](https://docs.docker.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

### Guías Relacionadas

- [GUIA_PRUEBAS_LOCALES.md](./GUIA_PRUEBAS_LOCALES.md) - Testing local
- [GUIA_BEST_PRACTICES_SUPABASE.md](./GUIA_BEST_PRACTICES_SUPABASE.md) - Mejores prácticas
- [REFERENCIA_BD_SUPABASE.md](./REFERENCIA_BD_SUPABASE.md) - Schema completo

### Comunidad

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

## 📝 Changelog

### v1.0 - 2025-11-05
- ✅ Guía inicial completa
- ✅ Documentación de 12 servicios
- ✅ Comandos esenciales
- ✅ Casos de uso prácticos
- ✅ Troubleshooting exhaustivo
- ✅ FAQ completo

---

**¿Dudas o sugerencias?** Abre un issue o contacta al equipo de desarrollo.

**Última actualización:** 2025-11-05
