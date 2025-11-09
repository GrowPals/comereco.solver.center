# 🚀 Guía: Aplicar Migraciones y Ejecutar Tests RLS

**Última actualización**: 2025-02-07
**Propósito**: Guía paso a paso para aplicar migraciones de base de datos y ejecutar tests RLS en staging/producción

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Aplicar Migraciones](#aplicar-migraciones)
3. [Ejecutar Tests RLS](#ejecutar-tests-rls)
4. [Troubleshooting](#troubleshooting)
5. [Checklist de Validación](#checklist-de-validación)

---

## 🔧 Prerrequisitos

### Software Requerido

```bash
# 1. Supabase CLI instalado
# Verificar instalación:
supabase --version

# Si no está instalado:
# macOS/Linux:
brew install supabase/tap/supabase

# Windows:
scoop install supabase
```

### Credenciales Necesarias

- ✅ Sesión de Supabase CLI iniciada
- ✅ Project Ref del entorno (staging o producción)
- ✅ Service Role Key (para tests)
- ✅ Anon Key (para tests)
- ✅ Platform Admin ID (opcional, para tests de invitaciones)

---

## 📦 Aplicar Migraciones

### Paso 1: Ubicar el Proyecto

```bash
cd /ruta/al/proyecto/COMERECO-WEBAPP
```

**Verificar que estás en la raíz correcta:**
```bash
ls supabase/migrations/
# Deberías ver archivos .sql
```

---

### Paso 2: Iniciar Sesión en Supabase CLI

```bash
supabase login
```

**Salida esperada:**
```
Hello from Supabase! Press Enter to open browser and login automatically.
```

- Presiona Enter
- Se abrirá el navegador
- Autoriza el CLI
- Verás confirmación de login exitoso

---

### Paso 3: Enlazar el Proyecto al Entorno

**⚠️ IMPORTANTE**: Este paso se hace **una sola vez por entorno**.

#### Para Staging:

```bash
supabase link --project-ref <staging-project-ref>
```

#### Para Producción:

```bash
supabase link --project-ref <production-project-ref>
```

**Ejemplo:**
```bash
supabase link --project-ref azjaehrdzdfgrumbqmuc
```

> **Producción ComerECO (credenciales actuales)**  
> ```bash
> supabase link --project-ref azjaehrdzdfgrumbqmuc --password "$SUPABASE_DB_PASSWORD"
> ```

**Salida esperada:**
```
Enter your database password (or leave blank to skip):
Finished supabase link.
```

**Nota**: Puedes dejar la contraseña en blanco si solo necesitas aplicar migraciones (no hacer pull).

---

### Paso 4: Aplicar Migraciones Pendientes

```bash
supabase db push
```

**⏰ Ejecutar en ventana de mantenimiento**

Este comando:
- ✅ Lee todas las migraciones en `/supabase/migrations/`
- ✅ Compara con las ya aplicadas en la BD
- ✅ Aplica solo las pendientes en orden cronológico
- ✅ Registra cada migración aplicada

**Salida esperada:**
```
Applying migration 20250207_01_enhance_admin_and_onboarding.sql...
Applying migration 20250207_02_fix_rls_performance.sql...
Applying migration 20250207_03_remove_unused_indexes.sql...
✓ All migrations applied successfully!
```

**Si hay errores**, ver sección [Troubleshooting](#troubleshooting).

---

### Paso 5: Verificar Aplicación Exitosa

```bash
# Ver migraciones aplicadas
supabase migration list --linked
```

**Salida esperada:**
```
        LOCAL      │   REMOTE   │     TIME (UTC)
  ─────────────────┼────────────┼──────────────────────
   20250207_01... │ 20250207...│ 2025-02-07 10:30:00
   20250207_02... │ 20250207...│ 2025-02-07 10:30:15
   20250207_03... │ 20250207...│ 2025-02-07 10:30:30
```

---

## 🧪 Ejecutar Tests RLS

### Paso 1: Configurar Variables de Entorno

Crea el archivo `.env.test` en la raíz del proyecto:

```bash
# .env.test
SUPABASE_TEST_URL=https://<staging-ref>.supabase.co
SUPABASE_TEST_ANON_KEY=<anon-key>
SUPABASE_TEST_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_TEST_PLATFORM_ADMIN_ID=<uuid-de-un-platform-admin>
```

**Ejemplo:**
```bash
# .env.test
SUPABASE_TEST_URL=https://azjaehrdzdfgrumbqmuc.supabase.co
SUPABASE_TEST_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_TEST_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_TEST_PLATFORM_ADMIN_ID=550e8400-e29b-41d4-a716-446655440000
```

**Dónde obtener estas credenciales:**

1. **SUPABASE_TEST_URL**:
   - Dashboard de Supabase → Project Settings → API
   - URL: `https://[project-ref].supabase.co`

2. **SUPABASE_TEST_ANON_KEY**:
   - Dashboard → Project Settings → API → `anon` `public`
   - Clave pública (segura para cliente)

3. **SUPABASE_TEST_SERVICE_ROLE_KEY**:
   - Dashboard → Project Settings → API → `service_role` `secret`
   - ⚠️ **NUNCA COMPARTIR** - Bypass completo de RLS

4. **SUPABASE_TEST_PLATFORM_ADMIN_ID**:
   - ID de un usuario con rol `platform_admin`
   - Query en Supabase SQL Editor:
   ```sql
   SELECT id FROM platform_admins LIMIT 1;
   ```
   - O crear uno con: `npm run seed:platform-admins`

---

### Paso 2: Cargar Variables de Entorno

```bash
# Exportar variables al shell actual
export $(grep -v '^#' .env.test | xargs)
```

**Verificar carga exitosa:**
```bash
echo $SUPABASE_TEST_URL
# Debería mostrar: https://azjaehrdzdfgrumbqmuc.supabase.co
```

---

### Paso 3: Instalar Dependencias

```bash
npm install
```

---

### Paso 4: Ejecutar Suite de Tests RLS

```bash
npm run test:rls
```

**⚠️ Consideraciones Importantes**:

1. **Horario de Ejecución**: Ejecutar fuera de horas pico
2. **Datos Temporales**: Los tests crean datos que luego eliminan
3. **Duración**: ~30-60 segundos dependiendo de la suite
4. **Staging First**: SIEMPRE ejecutar en staging antes de producción

---

### Salida Esperada de Tests

```bash
 RUN  v1.6.0 /home/user/COMERECO-WEBAPP

 ✓ tests/rls/profiles.test.ts (5 tests) 234ms
   ✓ Admin puede ver todos los profiles
   ✓ Supervisor solo ve su compañía
   ✓ User solo ve su profile
   ✓ Platform admin puede ver todo
   ✓ Usuario sin autenticar no ve nada

 ✓ tests/rls/projects.test.ts (4 tests) 189ms
   ✓ Admin puede crear proyectos
   ✓ Supervisor puede ver proyectos de su compañía
   ✓ User solo ve proyectos donde es miembro
   ✓ RLS previene acceso a proyectos de otras compañías

 ✓ tests/rls/requisitions.test.ts (6 tests) 312ms
   ✓ User puede crear requisición
   ✓ Supervisor puede aprobar requisiciones
   ✓ Admin puede ver todas las requisiciones
   ✓ User no puede ver requisiciones de otros
   ✓ Platform admin tiene acceso global
   ✓ RLS previene modificación por no autorizados

 Test Files  3 passed (3)
      Tests  15 passed (15)
   Start at  10:30:00
   Duration  1.45s (transform 123ms, setup 0ms, collect 456ms, tests 735ms)

 PASS  Waiting for file changes...
```

---

### Paso 5: Interpretar Resultados

#### ✅ Tests Exitosos

```bash
✓ tests/rls/profiles.test.ts (5 tests) 234ms
```

- Todos los tests pasaron
- Las políticas RLS funcionan correctamente
- Seguro aplicar en producción

#### ❌ Tests Fallidos

```bash
✗ tests/rls/profiles.test.ts (5 tests) 234ms
   ✗ Admin puede ver todos los profiles
     Expected 10, received 5
```

- **NO aplicar en producción**
- Revisar política RLS afectada
- Ver logs detallados en consola
- Corregir migración y re-ejecutar

---

## 🔍 Troubleshooting

### Error: "Database password required"

```bash
Error: Database password required for supabase link
```

**Solución**:
```bash
# Obtén la contraseña de:
# Dashboard → Project Settings → Database → Connection String
supabase link --project-ref <ref> --password <db-password>
```

---

### Error: "Migration already applied"

```bash
Error: Migration 20250207_01_enhance_admin_and_onboarding.sql already applied
```

**Solución**:
- Es normal, la migración ya está aplicada
- `supabase db push` solo aplica pendientes
- Verificar con: `supabase migration list --linked`

---

### Error: "Syntax error in migration"

```bash
Error: syntax error at or near "CREAT"
```

**Solución**:
1. Revisar archivo de migración mencionado
2. Corregir error de sintaxis SQL
3. Commit la corrección
4. Re-ejecutar `supabase db push`

---

### Error: "infinite recursion detected in policy"

```bash
ERROR: 42P17: infinite recursion detected in policy for relation "profiles"
```

**Solución**:
- Ver [INSTRUCCIONES_FIX_RLS_RECURSION.md](../troubleshooting/INSTRUCCIONES_FIX_RLS_RECURSION.md)
- Este error indica dependencia circular en políticas RLS
- Requiere rediseño de las políticas afectadas

---

### Tests Fallan por Timeout

```bash
Error: Test timeout exceeded (30000ms)
```

**Solución**:
```bash
# Aumentar timeout en vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000  // 60 segundos
  }
})
```

---

### Tests Fallan por Variables de Entorno

```bash
Error: SUPABASE_TEST_URL is not defined
```

**Solución**:
```bash
# Verificar que las variables se exportaron
echo $SUPABASE_TEST_URL

# Si está vacío, re-exportar:
export $(grep -v '^#' .env.test | xargs)
```

---

## ✅ Checklist de Validación

### Antes de Aplicar Migraciones

- [ ] Backup de base de datos realizado
- [ ] Ventana de mantenimiento comunicada al equipo
- [ ] Migraciones probadas en staging
- [ ] Tests RLS pasaron en staging
- [ ] Sesión Supabase CLI activa
- [ ] Proyecto enlazado correctamente

### Después de Aplicar Migraciones

- [ ] `supabase db push` ejecutado exitosamente
- [ ] Todas las migraciones listadas como aplicadas
- [ ] Tests RLS ejecutados y pasados
- [ ] Funcionalidad básica verificada manualmente
- [ ] Dashboard de Supabase sin errores
- [ ] Logs de aplicación sin errores 500

### Rollback (si algo falla)

- [ ] Detener despliegue inmediatamente
- [ ] Restaurar backup de BD
- [ ] Notificar al equipo
- [ ] Investigar causa raíz
- [ ] Corregir y re-probar en staging

---

## 📊 Orden de Ejecución Recomendado

### 1. Desarrollo Local

```bash
# Aplicar migraciones localmente
supabase db reset
supabase start
```

### 2. Staging

```bash
# 1. Aplicar migraciones
supabase link --project-ref <staging-ref>
supabase db push

# 2. Ejecutar tests
export $(grep -v '^#' .env.test | xargs)
npm run test:rls

# 3. Validar manualmente
# Abrir staging en navegador
# Probar flujos críticos
```

### 3. Producción

```bash
# 1. Comunicar ventana de mantenimiento
# 2. Hacer backup
# 3. Aplicar migraciones
supabase link --project-ref <production-ref>
supabase db push

# 4. Ejecutar tests (opcional, si no afecta a usuarios)
npm run test:rls

# 5. Validación manual crítica
# 6. Monitorear logs por 30 minutos
```

---

## 🔗 Referencias

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [ROADMAP_MEJORAS_DB.md](../ROADMAP_MEJORAS_DB.md) - Plan de mejoras de BD
- [REFERENCIA_BD_SUPABASE.md](REFERENCIA_BD_SUPABASE.md) - Referencia técnica
- [INSTRUCCIONES_FIX_RLS_RECURSION.md](../troubleshooting/INSTRUCCIONES_FIX_RLS_RECURSION.md) - Fix recursión RLS

---

## 📝 Notas Importantes

### Sobre Migraciones

1. **Orden Importa**: Las migraciones se aplican alfabéticamente
   - Por eso usamos prefijo `20250207_01_`, `20250207_02_`, etc.
   - NUNCA renombrar migraciones ya aplicadas

2. **Idempotencia**: Las migraciones deben ser idempotentes
   - Usar `CREATE TABLE IF NOT EXISTS`
   - Usar `CREATE OR REPLACE FUNCTION`
   - Manejar casos donde la migración se ejecute dos veces

3. **Rollback**: Las migraciones NO tienen rollback automático
   - Si necesitas revertir, crear nueva migración que lo haga
   - O restaurar backup completo

### Sobre Tests RLS

1. **No son tests de integración completos**
   - Solo validan políticas RLS
   - Validación manual sigue siendo necesaria

2. **Crean datos temporales**
   - Los datos se eliminan al final
   - Pero pueden fallar y dejar datos huérfanos
   - Revisar staging después de ejecutar

3. **Service Role Key**
   - Bypass completo de RLS
   - NUNCA usar en código de aplicación
   - Solo para tests y admin scripts

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisar sección [Troubleshooting](#troubleshooting)
2. Verificar logs de Supabase Dashboard
3. Consultar documentación oficial de Supabase
4. Revisar issues en el repositorio

---

**Última actualización**: 2025-02-07
**Mantenedor**: Equipo Backend
**Versión**: 1.0
