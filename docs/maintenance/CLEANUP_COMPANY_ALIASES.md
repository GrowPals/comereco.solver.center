# Limpieza de empresas duplicadas (`ComerECO - *`)

Los ambientes legacy contienen empresas creadas vía scripts antiguos con el prefijo `ComerECO -` (por ejemplo `ComerECO - Soluciones a la Orden`). Estas entradas duplican compañías reales y generan inconsistencias en catálogos y filtros.

## Cómo ejecutar la limpieza

1. Exporta variables de entorno con permisos de `service_role` (por ejemplo desde `.env.test`).
2. Ejecuta el script SQL:

```bash
psql "$SUPABASE_DB_URL" -f supabase/scripts/cleanup_company_aliases.sql
# o pégalo en el editor SQL de Supabase
```

El script:

1. Identifica las filas cuyo nombre coincide con `ComerECO - %` y encuentra la compañía canónica (misma cadena sin prefijo).
2. Actualiza todas las tablas que referencian `company_id` (`profiles`, `projects`, `products`, `requisitions`, etc.) para que apunten al registro canónico.
3. Elimina las filas alias de `public.companies`.

> **Nota:** El script usa un `regexp_replace` con el prefijo `ComerECO -`. Si existieran otros patrones de alias, ajusta la expresión antes de ejecutar.

## Verificación posterior

- `select id, name from public.companies order by lower(name);`
- Revisa el selector de empresas en la app; sólo debería aparecer una entrada por compañía real.
- Ejecuta `npm run test:rls` para asegurar que las políticas siguen consistentes tras la limpieza.
