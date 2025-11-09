# 🧼 Reset y Bootstrap de Supabase (Pre-Producción)

Guía operativa para dejar la base de datos `azjaehrdzdfgrumbqmuc` limpia y lista antes de cargar datos reales o sincronizar con Bind/n8n.

## 1. Preparar entorno local

```bash
cp .env.example .env            # si no existe
export DB_URL="postgresql://postgres.azjaehrdzdfgrumbqmuc:VicmaBigez2405.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

## 2. Camino corto (script automatizado)

```bash
DB_URL="postgresql://postgres.azjaehrdzdfgrumbqmuc:VicmaBigez2405.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  ./scripts/reset-supabase.sh
```

> El script ejecuta los tres pasos (limpieza → RLS → bootstrap). Revisa la salida para asegurarte de que no haya errores.

## 3. Pasos manuales (si se requiere granularidad)

### 3.1 Limpieza controlada

Ejecuta el script idempotente (maneja tablas faltantes y conserva solo `team@growpals.mx`).

```bash
psql "$DB_URL" -f supabase/limpieza_total.sql
```

Salida esperada:
- `Auth users: 1`
- `Compañías: 1` (Growpals)
- Todo lo demás en cero.

### 3.2 Sanity check de RLS

Usa los smoke tests de políticas; corren dentro de una transacción y no dejan residuos.

```bash
psql "$DB_URL" -f scripts/db/run_rls_checks.sql
```

Debe finalizar con `>> RLS smoke tests finished (no changes persisted)`.

### 3.3 Reinsertar admins core

`tools/bootstrap-core-admins.mjs` crea/actualiza:
| Empresa                 | Email                      | Rol   |
|------------------------ |--------------------------- |-------|
| Growpals                | team@growpals.mx           | dev   |
| ComerECO                | carmen@comereco-lab.com    | admin |
| Manny                   | team@manny.mx              | admin |
| Soluciones a la Orden   | le.velazquez95@gmail.com   | admin |

El script gestiona invitaciones cuando GoTrue lo exige.

```bash
node tools/bootstrap-core-admins.mjs
```

🔐 Variables utilizadas (defínelas en `.env` si cambian):

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CORE_PASSWORD_GROWPALS
CORE_PASSWORD_COMERECO
CORE_PASSWORD_MANNY
CORE_PASSWORD_SOLUCIONES
```

## 4. Validaciones rápidas

```bash
# Usuarios auth
psql "$DB_URL" -c "select email from auth.users order by email";

# Compañías
psql "$DB_URL" -c "select name from public.companies order by name";

# Invitaciones pendientes (debe ser 0 tras bootstrap)
psql "$DB_URL" -c "select email, status from public.user_invitations";
```

## 5. Sembrar dataset base (opcional pero recomendado)

Después del reset puedes cargar el catálogo/proyectos mínimos con el nuevo seed idempotente:

```bash
psql "$DB_URL" -f supabase/seed_realista_base.sql
```

Incluye productos con `bind_id`, proyectos activos y plantillas por empresa para que la app tenga datos reales antes de integrar Bind/n8n.

### 5.1 Importar catálogo completo desde Bind (CSV)

Si ya cuentas con los CSV exportados de Bind (`docs/csv_binderp/Productos.csv`), puedes poblar todo el catálogo real con:

```bash
psql "$DB_URL" -f supabase/import_bind_products_from_csv.sql
```

Esto genera ~480 productos por empresa y sus `bind_mappings`, listos para que n8n sólo tenga que actualizar precios/stock.

### 5.1.1 Lista de precios oficial (`products_2025-11-09.tsv`)

Si necesitas la lista de precios interna (la que realmente se usará en producción), ejecuta:

```bash
psql "$DB_URL" -f supabase/import_bind_products_from_tsv.sql
```

Este script toma `docs/csv_binderp/products_2025-11-09.tsv` y replica ~165 productos por empresa con el sourcing `bind_tsv_2025_11_09`, sustituyendo el catálogo genérico.

### 5.2 Importar clientes Bind (CSV)

```bash
psql "$DB_URL" -f supabase/import_bind_clients_from_csv.sql
```

Crea 363 compañías “Cliente XXXX” y sus `bind_mappings` de tipo `client`. Estos registros alimentarán los flujos multiempresa desde Bind sin tener que capturarlos manualmente.

### 5.3 Importar pedidos históricos (Pedidos (1).csv)

Para contar con historial real en la webapp:

```bash
psql "$DB_URL" -f supabase/import_bind_orders_from_csv.sql
```

Esto crea ~593 requisiciones archivadas (`requisitions`) bajo ComerECO, con sus items y logs en `bind_sync_logs`, listos para validar dashboards y reportes antes de conectar n8n.

### 5.4 Sembrar cola de integración (opcional)

Para simular pendientes rumbo a Bind:

```bash
psql "$DB_URL" -f supabase/generate_integration_queue_from_requisitions.sql
```

Inserta hasta 50 requisiciones `ordered/synced` en `integration_queue` con payload JSON listo para que n8n procese.

## 6. Próximo paso

Con la base limpia y los admins restablecidos, puedes ejecutar tus seeds realistas o iniciar los workflows de Bind/n8n sin ruido de datos dummy.

> Referencia complementaria: `docs/reports/SUPABASE_AUDIT_20250109.md` (detalla inventario de tablas/índices y recomendaciones de mantenimiento).
