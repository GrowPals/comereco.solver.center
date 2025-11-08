# ✅ RLS Smoke Tests

Archivo: `scripts/db/run_rls_checks.sql`

## ¿Qué valida?
1. **Visibilidad de productos** – un admin sólo ve los productos de su compañía (aunque existan más en la tabla).
2. **Mutaciones restringidas** – un usuario estándar no puede actualizar productos de otra empresa.
3. **Ops automation** – el rol `ops_automation` puede operar sobre `integration_queue` pero no leer `products`.

## Cómo ejecutarlo
```bash
psql "postgresql://postgres.azjaehrdzdfgrumbqmuc:VicmaBigez2405.@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f scripts/db/run_rls_checks.sql
```

- El script corre dentro de una transacción y termina con `ROLLBACK`, por lo que **no deja datos residuales**.
- Si alguna política falla se lanza `RAISE EXCEPTION` con el detalle del problema.

## Personalizar
- Cambia los UUIDs de prueba si necesitas ejecutar en paralelo.
- Puedes añadir más bloques `DO $$ ... $$` reutilizando las configuraciones JWT:
  ```sql
  SELECT set_config('request.jwt.claim.sub', '<user-id>', true);
  SELECT set_config('request.jwt.claim.role', '<role>', true);
  ```
- Usa este script como base para integrar con `pg_tap`, `supabase test db` o pipelines CI/CD.
