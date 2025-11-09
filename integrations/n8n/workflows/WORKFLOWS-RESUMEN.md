# 📦 Resumen de Workflows - COMERECO n8n

**Fecha:** 2025-11-05
**Estado:** 3 workflows listos, 3 pendientes

---

## ✅ Workflows Listos para Importar

### 🎯 WF-01: Monitoreo de Stock Bajo
**Archivo:** `WF-01-Stock-Monitoring.json`

**¿Qué hace?**
- Detecta productos con stock por debajo del mínimo
- Clasifica alertas: CRITICAL, HIGH, MEDIUM
- **CRITICAL/HIGH**: Crea requisición automáticamente
- **MEDIUM**: Solo registra log

**Trigger:** Lunes a Viernes, 8am y 2pm

**Nodos:** 14 nodos

**Credenciales:**
- ✅ Supabase Production (Postgres)

**Variables:**
- Ninguna requerida

---

### 🚀 WF-02: Sincronización de Requisiciones a BIND
**Archivo:** `WF-02-Requisition-Sync-to-BIND.json`

**¿Qué hace?**
- Lee requisiciones aprobadas (`approved` + `pending_sync`)
- Transforma al formato de BIND
- POST a BIND API
- Actualiza estados y registra logs
- Retry automático hasta 3 veces

**Trigger:** Cada 15 minutos

**Nodos:** 15 nodos

**Credenciales:**
- ✅ Supabase Production (Postgres)
- ✅ BIND ERP API (HTTP Header Auth)

**Variables:**
- `BIND_API_URL` - URL base de BIND API

**Documentación:**
- 📖 [WF-02-README.md](./WF-02-README.md)
- ⚡ [WF-02-CONFIGURACION-RAPIDA.md](./WF-02-CONFIGURACION-RAPIDA.md)

---

### 📦 WF-03: Sincronizar Productos desde BIND
**Archivo:** `WF-03-Products-Sync-from-BIND.json`

**¿Qué hace?**
- GET products desde BIND API
- Transforma productos al formato Supabase
- UPSERT en tabla `products` (crea o actualiza)
- Procesa en batches de 10

**Trigger:** Diario a las 2am

**Nodos:** 10 nodos

**Credenciales:**
- ✅ Supabase Production (Postgres)
- ✅ BIND ERP API (HTTP Header Auth)

**Variables:**
- `BIND_API_URL` - URL base de BIND API
- `BIND_COMPANY_ID` - ID de empresa en BIND
- `COMPANY_ID` - UUID de empresa en Supabase

---

## ⏳ Workflows Pendientes

### WF-04: Actualización de Inventario (solo stock)
**Estado:** 🟡 Pendiente
**Prioridad:** Media
**Complejidad:** Baja

**¿Qué hará?**
- Actualiza SOLO stock de productos existentes
- Más rápido que WF-03 (no sincroniza todo el producto)
- Recomendado: Cada hora

---

### WF-05: Notificaciones de Requisiciones
**Estado:** 🟡 Pendiente
**Prioridad:** Media
**Complejidad:** Baja

**¿Qué hará?**
- Envía emails cuando cambia estado de requisiciones
- Notificaciones in-app
- Eventos: aprobada, rechazada, sincronizada, error

**Requiere:**
- Credencial SMTP (Gmail, SendGrid, etc.)

---

### WF-06: Retry de Sincronizaciones Fallidas
**Estado:** 🟡 Pendiente
**Prioridad:** Baja
**Complejidad:** Media

**¿Qué hará?**
- Busca requisiciones con `sync_failed`
- Reintenta automáticamente
- Alerta si falla 3+ veces

---

## 🎯 Orden de Implementación Recomendado

### Fase 1: MVP (Esta Semana)
```
1. ✅ WF-02: Requisition Sync
   - El más crítico
   - Sincroniza requisiciones a BIND

2. ✅ WF-01: Stock Monitoring
   - Detecta stock bajo
   - Crea requisiciones automáticas

3. ✅ WF-03: Products Sync
   - Mantiene catálogo actualizado
```

### Fase 2: Optimización (Próxima Semana)
```
4. WF-04: Inventory Sync
   - Actualización rápida de stock

5. WF-05: Notifications
   - Mejora comunicación con usuarios
```

### Fase 3: Mantenimiento (Futuro)
```
6. WF-06: Retry Failed Syncs
   - Reducir intervención manual
```

---

## 📊 Comparación Rápida

| Workflow | Trigger | Frecuencia | Nodos | Prioridad |
|----------|---------|------------|-------|-----------|
| WF-01 | Schedule | 8am & 2pm | 14 | 🟡 Media |
| WF-02 | Schedule | Cada 15 min | 15 | 🔴 Alta |
| WF-03 | Schedule | Diario 2am | 10 | 🟡 Media |
| WF-04 | Schedule | Cada hora | ~8 | 🟢 Baja |
| WF-05 | Webhook | Real-time | ~12 | 🟡 Media |
| WF-06 | Schedule | Cada 2 horas | ~10 | 🟢 Baja |

---

## 🚀 Cómo Empezar

### 1. Configurar Credenciales (Una Sola Vez)

#### Supabase Production
```yaml
Type: Postgres
Name: Supabase Production
Host: aws-1-us-east-2.pooler.supabase.com
Port: 5432
Database: postgres
User: postgres.azjaehrdzdfgrumbqmuc
Password: <SUPABASE_DB_PASSWORD>
SSL: Disable
```

#### BIND ERP API
```yaml
Type: HTTP Header Auth
Name: BIND ERP API
Header Name: Authorization
Header Value: Bearer [TU_TOKEN]
```

---

### 2. Configurar Variables de Entorno

Agrega en tu n8n (docker-compose.yml o Settings → Variables):

```bash
BIND_API_URL=https://api.bind.com.mx/v1
BIND_COMPANY_ID=[ID de tu empresa en BIND]
COMPANY_ID=[UUID de tu empresa en Supabase]
```

---

### 3. Importar Workflows

**Orden recomendado:**

1. **WF-02 primero** (el más importante)
   ```
   Import → WF-02-Requisition-Sync-to-BIND.json
   ```

2. **WF-01 segundo** (crea requisiciones automáticas)
   ```
   Import → WF-01-Stock-Monitoring.json
   ```

3. **WF-03 tercero** (mantiene productos actualizados)
   ```
   Import → WF-03-Products-Sync-from-BIND.json
   ```

---

### 4. Probar Manualmente

Para cada workflow:
1. Abre en n8n
2. Click "Execute Workflow"
3. Verifica que no hay errores
4. Revisa logs en Supabase

---

### 5. Activar en Producción

Solo cuando estés seguro:
```
Toggle "Active" → ON
```

---

## 🔍 Queries de Verificación

### Ver últimas sincronizaciones a BIND
```sql
SELECT
  sync_type,
  entity_id,
  status,
  error_message,
  synced_at
FROM bind_sync_logs
ORDER BY synced_at DESC
LIMIT 10;
```

### Ver requisiciones pendientes de sincronizar
```sql
SELECT COUNT(*) as pending
FROM requisitions
WHERE business_status = 'approved'
  AND integration_status = 'pending_sync';
```

### Ver alertas de stock bajo activas
```sql
SELECT
  product_name,
  current_stock,
  min_stock,
  alert_level
FROM restock_alerts_dashboard
WHERE alert_level IN ('CRITICAL', 'HIGH')
ORDER BY alert_level;
```

### Ver logs de restock automático
```sql
SELECT
  trigger_type,
  stock_at_trigger,
  min_stock_at_trigger,
  requisition_id,
  created_at
FROM inventory_restock_rule_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📈 Métricas Esperadas

### WF-01: Stock Monitoring
- **Ejecuciones:** 10 por semana (2 al día, 5 días)
- **Alertas:** 0-20 por ejecución (depende de inventario)
- **Requisiciones creadas:** 0-5 automáticas por día

### WF-02: Requisition Sync
- **Ejecuciones:** ~96 por día (cada 15 min)
- **Requisiciones procesadas:** 1-10 por ejecución
- **Tasa de éxito esperada:** >95%

### WF-03: Products Sync
- **Ejecuciones:** 1 por día (2am)
- **Productos sincronizados:** 50-500 (depende de catálogo)
- **Duración:** 2-10 minutos

---

## 🚨 Alertas Importantes

### ⚠️ Si WF-02 falla
**Impacto:** Requisiciones no llegan a BIND
**Acción:** Revisar token de BIND y logs

### ⚠️ Si WF-01 no crea requisiciones
**Impacto:** Stock puede agotarse sin alerta
**Acción:** Verificar que hay reglas de restock activas

### ⚠️ Si WF-03 falla
**Impacto:** Catálogo desactualizado
**Acción:** Verificar endpoint de BIND

---

## 📚 Documentación Completa

- [WORKFLOWS_MASTER_PLAN.md](../docs/WORKFLOWS_MASTER_PLAN.md) - Plan arquitectónico completo
- [SETUP.md](../docs/SETUP.md) - Instalación de n8n
- [WF-02-README.md](./WF-02-README.md) - Documentación WF-02
- [WF-02-CONFIGURACION-RAPIDA.md](./WF-02-CONFIGURACION-RAPIDA.md) - Setup rápido

---

## ✅ Checklist de Producción

Antes de ir a producción, verifica:

**Credenciales:**
- [ ] Supabase Production configurada y probada
- [ ] BIND ERP API configurada y probada
- [ ] IP del servidor autorizada en Supabase

**Variables:**
- [ ] BIND_API_URL definida
- [ ] BIND_COMPANY_ID definida
- [ ] COMPANY_ID definida

**Workflows:**
- [ ] WF-02 importado y probado
- [ ] WF-01 importado y probado
- [ ] WF-03 importado y probado
- [ ] Al menos 1 ejecución exitosa de cada uno

**Base de Datos:**
- [ ] Tabla `bind_sync_logs` existe
- [ ] Tabla `inventory_restock_rule_logs` existe
- [ ] Función `create_full_requisition()` existe
- [ ] Vista `restock_alerts_dashboard` existe

**Testing:**
- [ ] Requisición de prueba sincronizada OK a BIND
- [ ] Productos sincronizados OK desde BIND
- [ ] Logs verificados en Supabase

---

**Última Actualización:** 2025-11-05
**Workflows Listos:** 3/6
**Estado:** ✅ MVP Completo - Listo para Testing
