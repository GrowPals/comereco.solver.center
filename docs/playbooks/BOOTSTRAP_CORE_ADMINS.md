# Playbook: Bootstrap de Empresas y Admins Core

Este playbook crea las cuatro empresas base y sus cuentas administradoras (más el rol `dev`), usando el script `tools/bootstrap-core-admins.mjs`.

## 1. Variables necesarias

```bash
export SUPABASE_URL="https://azjaehrdzdfgrumbqmuc.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service_role>"
# Define contraseñas únicas por compañía antes de ejecutar el script
export CORE_PASSWORD_GROWPALS="<password-growpals>"
export CORE_PASSWORD_COMERECO="<password-comereco>"
export CORE_PASSWORD_MANNY="<password-manny>"
export CORE_PASSWORD_SOLUCIONES="<password-soluciones>"
```

> **Nota:** El script ya no incluye contraseñas predeterminadas; si alguna variable falta, la ejecución se detendrá para evitar crear cuentas inseguras.

## 2. Ejecutar el bootstrap

```bash
npm run seed:core-admins
```

El script hará lo siguiente por cada compañía:

1. Crear (o reutilizar) el registro en `public.companies`.
2. Crear/actualizar el usuario en `auth.users` con la contraseña indicada y `email_confirm=true`.
3. Upsert en `public.profiles` con `role_v2` y `company_id` correctos.
4. Insertar en `public.platform_admins` si el rol es `dev`.

Al finalizar se imprime una tabla con los IDs generados.

## 3. Cuentas resultantes

| Empresa                 | Email                      | Rol   |
|------------------------|----------------------------|-------|
| Growpals               | team@growpals.mx           | dev   |
| ComerECO               | carmen@comereco-lab.com    | admin |
| Manny                  | team@manny.mx              | admin |
| Soluciones a la Orden  | le.velazquez95@gmail.com   | admin |

- El usuario `team@growpals.mx` actúa como **Developer** (super-admin) y queda registrado en `platform_admins`.
- Para sumar un segundo developer basta con ejecutar de nuevo el script agregando otra entrada o invitarlo desde la app (rol `dev`).

## 4. Verificaciones rápidas

1. Supabase Studio → Auth → Users: verifica los correos y las fechas de confirmación.
2. Tabla `public.profiles`: cada usuario debe tener `role_v2` y `company_id` correctos.
3. Tabla `public.platform_admins`: debe haber un registro con `user_id = team@growpals.mx`.

Si algo falla, revisa el log que imprime el script (se detiene en el primer error). Repite el comando tras corregir la causa.
