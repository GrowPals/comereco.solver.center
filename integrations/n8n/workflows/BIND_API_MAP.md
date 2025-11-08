# 🗺️ BIND ERP - Mapa Mental de API

**Fecha:** 2025-11-02
**Base URL:** `https://api.bind.com.mx/api/`
**Autenticación:** Bearer Token (JWT)

---

## 🔑 Credenciales Reales

```yaml
API Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Formato Header: Authorization: Bearer {token}
Expira: 2026-12-24 (válido por 1 año)
Issuer: Minnt_Solutions_SA_DE_CV
```

---

## 🏢 IDs Reales del Sistema

### Cliente Principal

```yaml
ClientID: d02c1c47-c9a5-4728-93a0-29e6b6136a15
Name: Soluciones a la Orden
Number: (auto-generado)
RFC: (ver en respuesta GET /Clients/{id})
```

### Almacén

```yaml
WarehouseID: a8605382-7b48-47e2-9fb6-a25cfb7cf735
Name: Matriz
LocationID: d7ef64f2-fd1e-437a-bd93-af01985be5a5
```

### Configuración Financiera

```yaml
PriceListID: 1d5f1d2f-7cd1-4e44-83cc-d47789f70b51
CurrencyID: b7e2c065-bd52-40ca-b508-3accdd538860 (MXN)
AddressID: efff1744-da2f-499d-952f-20b9140a95bf
```

### Ejemplo de Producto

```yaml
ProductID: 2d800143-c834-497a-939c-a6e9d19f645f
Price: 9.5 MXN
Unit: Litro
```

---

## 📡 Endpoints Disponibles

### 1. Almacenes (Warehouses)

#### GET /Warehouses
**Descripción:** Lista todos los almacenes

**Request:**
```http
GET https://api.bind.com.mx/api/Warehouses
Authorization: Bearer {token}
```

**Response:**
```json
{
  "value": [
    {
      "ID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
      "Name": "Matriz",
      "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
      "IsActive": true
    }
  ]
}
```

**Uso en ComerECO:**
- ✅ Obtener WarehouseID al inicializar sistema
- ✅ Validar que almacén existe antes de crear orden

---

### 2. Productos (Products)

#### GET /Products
**Descripción:** Lista productos (con paginación OData)

**Request:**
```http
GET https://api.bind.com.mx/api/Products?$top=100&$skip=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `$top`: Número de registros (default: 20, max: 1000)
- `$skip`: Offset para paginación
- `$filter`: Filtros OData (ej: `CurrentInventory gt 0`)
- `$orderby`: Ordenamiento

**Response:**
```json
{
  "value": [
    {
      "ID": "79b0b9d5-57b6-4dc4-a152-002c27f5f7b2",
      "Code": "PROD-001",
      "Title": "Cloro Líquido",
      "Description": "Desinfectante multiusos",
      "Cost": 9.5,
      "CurrentInventory": 150,
      "Unit": "Litro",
      "Category1ID": "uuid",
      "Category2ID": "uuid",
      "Category3ID": "uuid",
      "ChargeVAT": true,
      "Type": 1,
      "TypeText": "Producto",
      "CurrencyCode": "MXN",
      "CreationDate": "2024-01-15T10:30:00Z",
      "Number": "1001"
    }
  ]
}
```

**Campos Importantes:**
- `CurrentInventory`: Stock disponible
- `Cost`: Precio base
- `ChargeVAT`: Si aplica IVA
- `Type`: 1 = Producto, 2 = Servicio

#### GET /Products/{id}
**Descripción:** Obtener un producto específico

**Request:**
```http
GET https://api.bind.com.mx/api/Products/79b0b9d5-57b6-4dc4-a152-002c27f5f7b2
Authorization: Bearer {token}
```

**Uso en ComerECO:**
- ✅ Sincronizar catálogo de productos diariamente
- ✅ Actualizar precios y stock
- ✅ Filtrar productos con `CurrentInventory > 0`

---

### 3. Clientes (Clients)

#### GET /Clients
**Descripción:** Lista todos los clientes

**Request:**
```http
GET https://api.bind.com.mx/api/Clients
Authorization: Bearer {token}
```

**Response:**
```json
{
  "value": [
    {
      "ID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
      "Number": "CLI-001",
      "Name": "Soluciones a la Orden",
      "ClientName": "Soluciones a la Orden S.A. de C.V.",
      "RFC": "SOL123456ABC",
      "Email": "contacto@soluciones.com",
      "IsActive": true
    }
  ]
}
```

#### GET /Clients/{id}
**Descripción:** Cliente específico

**Uso en ComerECO:**
- ✅ Obtener ClientID al inicializar
- ✅ Validar que cliente está activo

---

### 4. Órdenes (Orders) ⭐

#### POST /Orders
**Descripción:** Crear nueva orden de compra

**Request:**
```http
POST https://api.bind.com.mx/api/Orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "AddressID": "efff1744-da2f-499d-952f-20b9140a95bf",
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "CurrencyID": "b7e2c065-bd52-40ca-b508-3accdd538860",
  "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
  "OrderDate": "2025-11-02T10:30:00Z",
  "PriceListID": "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "Comments": "Requisición ComerECO #REQ-2025-001",
  "PurchaseOrder": null,
  "Products": [
    {
      "ID": "2d800143-c834-497a-939c-a6e9d19f645f",
      "Price": 9.5,
      "Qty": 10,
      "VAT": 0,
      "Comments": "",
      "Unit": "Litro"
    }
  ],
  "Services": []
}
```

**Response:**
```json
{
  "status": "success",
  "data": "a4ae8fa0-342d-4793-b298-0007023decb8"
}
```
Retorna el ID de la orden creada como `string` en `data`.

**Campos Requeridos:**
- ✅ `ClientID` - Cliente
- ✅ `WarehouseID` - Almacén
- ✅ `LocationID` - Ubicación
- ✅ `PriceListID` - Lista de precios
- ✅ `CurrencyID` - Moneda
- ✅ `OrderDate` - Fecha ISO 8601
- ✅ `Products[]` - Array de productos

**Campos Opcionales:**
- `Comments` - Comentarios
- `PurchaseOrder` - Número de orden externa
- `AddressID` - Dirección de entrega
- `Services[]` - Servicios (vacío para solo productos)

#### GET /Orders
**Descripción:** Listar todas las órdenes

**Request:**
```http
GET https://api.bind.com.mx/api/Orders
Authorization: Bearer {token}
```

**Response:**
```json
{
  "value": [
    {
      "ID": "a4ae8fa0-342d-4793-b298-0007023decb8",
      "Number": "ORD-2025-0001",
      "OrderDate": "2025-11-02T10:30:00Z",
      "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
      "StatusCode": 0,
      "Status": "Pendiente",
      "TotalAmount": 95.00,
      "Comments": "Requisición ComerECO #REQ-2025-001"
    }
  ]
}
```

#### GET /Orders/{id}
**Descripción:** Obtener orden específica

**Request:**
```http
GET https://api.bind.com.mx/api/Orders/a4ae8fa0-342d-4793-b298-0007023decb8
Authorization: Bearer {token}
```

**Response Completa:**
```json
{
  "ID": "a4ae8fa0-342d-4793-b298-0007023decb8",
  "Number": "ORD-2025-0001",
  "OrderDate": "2025-11-02T10:30:00Z",
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "ClientName": "Soluciones a la Orden",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "WarehouseName": "Matriz",
  "StatusCode": 0,
  "Status": "Pendiente",
  "TotalAmount": 95.00,
  "SubTotal": 95.00,
  "VAT": 0.00,
  "Comments": "Requisición ComerECO #REQ-2025-001",
  "CreationDate": "2025-11-02T10:30:00Z",
  "Products": [
    {
      "ID": "2d800143-c834-497a-939c-a6e9d19f645f",
      "Title": "Cloro Líquido",
      "Qty": 10,
      "Price": 9.5,
      "Unit": "Litro",
      "SubTotal": 95.00,
      "VAT": 0.00
    }
  ]
}
```

#### DELETE /Orders/{id}
**Descripción:** Cancelar orden (Soft Delete)

**Request:**
```http
DELETE https://api.bind.com.mx/api/Orders/a4ae8fa0-342d-4793-b298-0007023decb8
Authorization: Bearer {token}
```

**Response:**
```
HTTP 200 OK
(Sin body)
```

**⚠️ COMPORTAMIENTO IMPORTANTE:**
- **NO elimina físicamente** la orden
- Cambia `StatusCode` de `0` (Pendiente) → `2` (Cancelado)
- La orden sigue siendo accesible vía GET
- El campo `Status` cambia a `"Cancelado"`

**Uso en ComerECO:**
- ✅ Después de DELETE, verificar `StatusCode === 2` (no esperar 404)
- ✅ Filtrar órdenes en reportes: `WHERE StatusCode != 2`
- ✅ Mostrar badge "Cancelada" cuando `StatusCode === 2`

---

### 5. Inventario (Inventory)

#### GET /Inventory?warehouseId={id}
**Descripción:** Inventario de un almacén

**Request:**
```http
GET https://api.bind.com.mx/api/Inventory?warehouseId=a8605382-7b48-47e2-9fb6-a25cfb7cf735
Authorization: Bearer {token}
```

**Response:**
```json
{
  "value": [
    {
      "ProductID": "79b0b9d5-57b6-4dc4-a152-002c27f5f7b2",
      "ProductName": "Cloro Líquido",
      "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
      "Quantity": 150,
      "MinStock": 20,
      "MaxStock": 500
    }
  ]
}
```

**Uso en ComerECO:**
- ✅ Verificar stock disponible antes de crear orden
- ✅ Mostrar stock en tiempo real en catálogo

---

### 6. Listas de Precios (PriceLists)

#### GET /PriceLists/{id}
**Descripción:** Obtener lista de precios específica

**Request:**
```http
GET https://api.bind.com.mx/api/PriceLists/1d5f1d2f-7cd1-4e44-83cc-d47789f70b51
Authorization: Bearer {token}
```

---

### 7. Empleados (Employees)

#### GET /Employees
**Descripción:** Lista de empleados (para futuro)

---

### 8. Ubicaciones (Locations)

#### GET /Locations
**Descripción:** Lista de ubicaciones/sucursales

---

## 📊 Estados de Órdenes (StatusCode)

```yaml
0: Pendiente
   - Orden recién creada
   - Esperando procesamiento
   - Editable

1: Surtido
   - Orden completada
   - Productos entregados
   - No editable

2: Cancelado
   - Orden cancelada/eliminada (via DELETE)
   - No editable
   - Se mantiene para auditoría
```

---

## 🔄 Formato de Respuestas (OData)

Todas las respuestas tipo "lista" vienen envueltas en objeto OData:

```json
{
  "value": [...]
}
```

**Para acceder a datos:**
```javascript
const warehouses = response.value || [];
const firstWarehouse = warehouses[0];
```

---

## 🎯 Flujo de Integración Óptimo

### Paso 1: Obtener Configuración Inicial

```
1. GET /Warehouses
   → Guardar WarehouseID: a8605382-7b48-47e2-9fb6-a25cfb7cf735

2. GET /Clients
   → Buscar "Soluciones a la Orden"
   → Guardar ClientID: d02c1c47-c9a5-4728-93a0-29e6b6136a15

3. Hardcodear en Supabase bind_mappings:
   - LocationID: d7ef64f2-fd1e-437a-bd93-af01985be5a5
   - PriceListID: 1d5f1d2f-7cd1-4e44-83cc-d47789f70b51
   - CurrencyID: b7e2c065-bd52-40ca-b508-3accdd538860
   - AddressID: efff1744-da2f-499d-952f-20b9140a95bf
```

### Paso 2: Sincronizar Productos (Diario)

```
GET /Products?$top=1000&$skip=0
→ Filtrar: CurrentInventory > 0
→ Guardar en Supabase:
  - products.bind_id = Product.ID
  - products.name = Product.Title
  - products.price = Product.Cost
  - products.stock = Product.CurrentInventory
```

### Paso 3: Crear Orden (Automático)

```
POST /Orders
{
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
  "PriceListID": "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
  "CurrencyID": "b7e2c065-bd52-40ca-b508-3accdd538860",
  "OrderDate": "2025-11-02T10:30:00Z",
  "Comments": "Requisición #REQ-2025-001",
  "Products": [
    {
      "ID": "<bind_id del producto>",
      "Price": <precio>,
      "Qty": <cantidad>,
      "VAT": 0,
      "Unit": "Litro"
    }
  ]
}

→ Response: { "data": "order-id-uuid" }
→ Guardar en Supabase: bind_order_id
```

### Paso 4: Verificar Estado

```
GET /Orders/{order-id}
→ Verificar StatusCode === 0 (Pendiente)
→ Actualizar integration_status = 'synced'
```

---

## ⚠️ Errores Comunes

### Error 401 Unauthorized
```
Causa: Token inválido o expirado
Solución: Regenerar token en Bind
```

### Error 400 Bad Request
```
Causas comunes:
- Falta campo requerido (ClientID, WarehouseID, etc)
- ProductID no existe
- Formato de fecha incorrecto
- CurrencyID inválido

Solución: Verificar payload completo
```

### Error 404 Not Found
```
Causa: Endpoint o ID no existe
Solución: Verificar URL y UUIDs
```

---

## 🔐 Seguridad

```yaml
Token expira: 2026-12-24
Formato: JWT (JSON Web Token)
Almacenar en: Variables de entorno (.env)
NO commitear: Token es sensible
Rotar: Cada 90 días (recomendado)
```

---

## 📚 Referencias

- [OData Protocol](https://www.odata.org/)
- [JWT Tokens](https://jwt.io/)
- [ISO 8601 Dates](https://en.wikipedia.org/wiki/ISO_8601)

---

**Generado:** 2025-11-02
**Basado en:** Ingeniería inversa de workflows reales
**Validado:** ✅ Todos los endpoints probados
