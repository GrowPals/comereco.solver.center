# Playbook: Suite Automatizada de Pruebas RLS

Objetivo: validar que las políticas RLS mantengan la segregación multi-tenant y la visibilidad correcta por rol tras cada cambio en base de datos o backend.

## 1. Requisitos

- Entorno Supabase apuntando a **staging** o a una instancia temporal.
- Variables de entorno en `.env.test` (ver `tests/rls/README.md`).
- `node >= 18` y dependencias instaladas (`npm install`).

```
SUPABASE_TEST_URL=https://<project-ref>.supabase.co
SUPABASE_TEST_ANON_KEY=...
SUPABASE_TEST_SERVICE_ROLE_KEY=...
SUPABASE_TEST_PLATFORM_ADMIN_ID=<uuid-de-platform-admin>
```

> Sugerencia: usa `direnv` o `doppler run` para inyectar las variables sin exponerlas en shell.

## 2. Ejecución

```
npm run test:rls
```

La suite actual valida:
- Acceso a `products`: usuarios ven sólo activos, admins ven todo.
- Se crean compañías, invitaciones y usuarios efímeros; se limpian al finalizar.

## 3. Roadmap de cobertura

- [ ] Añadir casos para `audit_log` (admins vs platform admins).
- [ ] Verificar `project_members` por rol supervisor.
- [ ] Cubrir `requisitions` (draft vs aprobadas).
- [ ] Validar `requisition_templates`.

Registra los avances marcando las casillas directamente en este documento o en issues.

## 4. Integración en CI/CD

1. Configurar un entorno Supabase temporal mediante `supabase branch create <name>`.
2. Exportar las variables anteriores como secrets en el pipeline (`SUPABASE_TEST_*`).
3. Añadir etapa `npm run test:rls` posterior a aplicar migraciones.

## 5. Troubleshooting

- **Falta platform admin**: usa `npm run seed:platform-admins` para crear uno y reutiliza su `uuid` como variable.
- **Datos residuales**: si la suite se detiene, revisa compañías `QA Company *` y pídelas en borrado masivo.
- **Rate limits**: agrupa suites RLS para evitar picos de creación de usuarios.

## Referencias

- `tests/rls/README.md`
- `tests/rls/products.spec.ts`
- `supabase/migrations/20250207_01_enhance_admin_and_onboarding.sql`
