# Pruebas RLS

Suite básica para validar reglas RLS clave utilizando usuarios reales contra un entorno Supabase (staging/local).

## Variables requeridas

Crear un archivo `.env.test` (o exportar variables antes de ejecutar `npm run test:rls`) con:

```
SUPABASE_TEST_URL=...
SUPABASE_TEST_ANON_KEY=...
SUPABASE_TEST_SERVICE_ROLE_KEY=...
# Opcional: UUID de un usuario existente con permisos elevados para registrar invitaciones
SUPABASE_TEST_PLATFORM_ADMIN_ID=a9b3c244-9400-4d5c-8ce2-3ee9400a0af6
```

> ⚠️ Ejecuta estas pruebas en una base de datos de staging o temporal. Se crean compañías, usuarios e invitaciones de prueba y se eliminan al finalizar.

## Ejecución

```
npm install
npm run test:rls
```

La suite creará:
- Una compañía temporal
- Un usuario con rol `user` y otro con rol `admin`
- Productos activos/inactivos para validar la política `products_select_access`

Los recursos se limpian automáticamente en `afterAll`, pero si la ejecución se interrumpe, revisa y purga la compañía/usuarios creados.
