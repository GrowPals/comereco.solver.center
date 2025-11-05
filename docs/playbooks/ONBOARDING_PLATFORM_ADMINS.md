# Playbook: Alta inicial de Platform Admins

Este playbook describe cómo otorgar permisos globales (`platform_admin`) utilizando la clave de servicio y cómo validar que el flujo de invitación/onboarding funciona extremo a extremo en el entorno de staging.

## 1. Preparar variables de entorno

Crea un archivo `.env.platform-admins` (no se versiona) con las credenciales de staging:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PLATFORM_ADMIN_GRANTED_BY_ID=<uuid-del-admin-que-otorga>
```

> `PLATFORM_ADMIN_GRANTED_BY_ID` es opcional. Si no se define, el script registrará como `granted_by` al propio usuario al que se le asigna el rol.

## 2. Ejecutar el script de bootstrap

```
export $(grep -v '^#' .env.platform-admins | xargs)
npm run seed:platform-admins -- admin1@tu-dominio.com admin2@tu-dominio.com
```

El script:
- Normaliza los correos (lowercase).
- Crea el usuario en `auth.users` si no existía (contraseña temporal, email confirmado).
- Valida si tiene perfil en `public.profiles` y emite advertencia si falta.
- Inserta o actualiza el registro en `public.platform_admins`.

Al finalizar mostrará el `uuid` y, si aplica, la contraseña temporal generada.

## 3. Validar onboarding completo

1. **Invitación**: con un usuario admin existente, crea una invitación desde la app o llamando a `user_invitations.insert` (ver `tests/rls/products.spec.ts` como referencia).
2. **Registro**: ingresa al enlace de invitación y completa el registro. El trigger `create_profile_after_signup` debe generar el `profile` y marcar la invitación como `completed`.
3. **Accesos**:
   - Verifica en dashboard que puede listar compañías (`companies_select_access`), productos inactivos (`products_select_access`) y registros de auditoría (`audit_log_select_access`).
   - Confirma que puede administrar invitaciones de cualquier empresa (`user_invitations_*`).
4. **Regresión**: ejecuta `npm run test:rls` apuntando a staging para asegurarte de que las políticas clave siguen respetando visibilidad por rol.

## 4. Checklist de salida

- [ ] Usuarios objetivo figuran en `public.platform_admins` y aparecen en la vista de administración.
- [ ] Invitaciones completadas sin errores en logs (`auth.invites`, `audit_log`).
- [ ] Acceso de platform admin validado para compañías y productos.
- [ ] Script y credenciales guardados de forma segura (Vault).
- [ ] Se documentó la ejecución en `docs/reports` o en el runbook de operaciones.

## Referencias

- `tools/seed-platform-admins.mjs`
- `docs/ROADMAP_MEJORAS_DB.md`
- `docs/guides/REFERENCIA_BD_SUPABASE.md` (sección roles y políticas)
