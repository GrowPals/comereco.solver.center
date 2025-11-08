# 🚀 EMPIEZA AQUÍ - Setup de Datos Reales

---

## ✅ Paso 1: Limpiar Datos de Prueba

Ejecuta en Supabase SQL Editor:

```bash
integrations/n8n/workflows/CLEANUP-ALL-EXCEPT-ADMIN.sql
```

**Resultado:** Base de datos limpia, solo con tu usuario admin.

---

## 📊 Paso 2: Obtener IDs de BIND

Necesitas estos IDs de BIND antes de cargar datos:

### Para la empresa (companies):
- [ ] `bind_client_id` - ID de tu cliente en BIND
- [ ] `bind_location_id` - ID de ubicación en BIND
- [ ] `bind_price_list_id` - ID de lista de precios en BIND

### Para cada producto (products):
- [ ] `bind_product_id` - ID del producto en BIND

**¿Cómo obtenerlos?**
```bash
# API de BIND
GET /api/Clients       → bind_client_id
GET /api/Locations     → bind_location_id
GET /api/PriceLists    → bind_price_list_id
GET /api/Products      → bind_product_id (de cada producto)
```

---

## 🏢 Paso 3: Cargar Empresa

Edita y ejecuta en Supabase:

```sql
INSERT INTO companies (
  name,
  legal_name,
  tax_id,
  bind_client_id,         -- ⚠️ CAMBIAR por ID real de BIND
  bind_location_id,       -- ⚠️ CAMBIAR por ID real de BIND
  bind_price_list_id,     -- ⚠️ CAMBIAR por ID real de BIND
  is_active
) VALUES (
  'ComerECO',
  'ComerECO S.A. de C.V.',
  'CECO850101ABC',
  'd02c1c47-c9a5-4728-93a0-29e6b6136a15',
  'd7ef64f2-fd1e-437a-bd93-af01985be5a5',
  '1d5f1d2f-7cd1-4e44-83cc-d47789f70b51',
  true
);
```

---

## 📁 Paso 4: Cargar Proyectos/Obras

```sql
INSERT INTO projects (
  company_id,              -- ID de la empresa creada arriba
  name,
  code,
  location,
  status,
  is_active
) VALUES
  ('<company_id>', 'Residencial Las Palmas', 'PROJ-001', 'Querétaro', 'active', true),
  ('<company_id>', 'Torre Centro', 'PROJ-002', 'CDMX', 'active', true);
```

---

## 📦 Paso 5: Cargar Productos

```sql
INSERT INTO products (
  company_id,
  sku,
  name,
  price,
  stock,
  unit,
  bind_product_id,         -- ⚠️ CAMBIAR por ID real de BIND
  is_active
) VALUES
  ('<company_id>', 'CEM-001', 'Cemento 50kg', 180.00, 500, 'bulto', '30ef79f4-...', true),
  ('<company_id>', 'VAR-001', 'Varilla 3/8"', 85.00, 200, 'pza', 'aaaaaaaa-...', true);
```

**⚠️ CRÍTICO:** Cada producto DEBE tener su `bind_product_id` correcto.

---

## 🔧 Paso 6: Configurar Workflow WF-02

1. Abre n8n
2. Busca: `WF-02: Sync Requisitions to BIND`
3. Verifica:
   - ✅ Credenciales BIND configuradas
   - ✅ Variable `BIND_API_URL` correcta
   - ✅ Workflow **ACTIVO**

---

## ✅ Paso 7: Probar

### Desde la App:
1. Crea una requisición
2. Agrégale productos (que tengan `bind_product_id`)
3. Apruébala
4. Estado cambia a: `approved` + `pending_sync`

### WF-02 Sincroniza Automáticamente:
- Se ejecuta cada 15 minutos
- Busca requisiciones con `pending_sync`
- Las envía a BIND
- Actualiza estado a `synced`

### Verificar en Supabase:
```sql
-- Ver requisición sincronizada
SELECT
  internal_folio,
  integration_status,  -- Debe ser 'synced'
  bind_order_id,       -- UUID de la orden en BIND
  bind_folio,          -- Folio de BIND (PO-2025-XXXX)
  bind_synced_at
FROM requisitions
WHERE integration_status = 'synced'
ORDER BY bind_synced_at DESC;
```

---

## 📚 Documentación Completa

- [DATA-LOADING-GUIDE.md](./DATA-LOADING-GUIDE.md) - Guía detallada de carga
- [DATA-FLOW-DIAGRAM.md](./DATA-FLOW-DIAGRAM.md) - Diagrama de flujo visual
- [WF-02-README.md](./WF-02-README.md) - Documentación del workflow
- [WF-02-WORKFLOWS-COMPARISON.md](./WF-02-WORKFLOWS-COMPARISON.md) - Workflows TEST vs PROD

---

## ❓ FAQ

### ¿Dónde obtengo los bind_*_id?
Consulta la API de BIND o pregunta a tu proveedor de BIND ERP.

### ¿Puedo probar sin datos reales?
Sí, usa `WF-02-TEST` con mocks. Ver [QUICK-START-TESTING.md](./QUICK-START-TESTING.md)

### ¿Qué pasa si no configuro bind_product_id?
El workflow fallará. BIND rechazará la orden porque el producto no existe.

### ¿Cómo sé si se sincronizó correctamente?
- Revisa `integration_status = 'synced'` en requisitions
- Revisa la orden en BIND usando `bind_folio`
- Revisa los logs en `bind_sync_logs`

---

**Última actualización:** 2025-11-05
**Estado:** ✅ Listo para producción
