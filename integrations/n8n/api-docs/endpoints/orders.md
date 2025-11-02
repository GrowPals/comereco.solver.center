# 📦 Endpoint: Orders

## Información General

**Base URL:** `https://api.bind.com.mx/api/Orders`

**Autenticación:** Bearer Token requerido

---

## POST - Crear Orden

### Request

```http
POST /api/Orders
Authorization: Bearer {token}
Content-Type: application/json
```

### Payload

Ver [create-order-request.json](../examples/create-order-request.json) para ejemplo completo.

**Campos Requeridos:**
- `AddressID` (UUID)
- `ClientID` (UUID)
- `CurrencyID` (UUID)
- `LocationID` (UUID)
- `OrderDate` (ISO 8601)
- `PriceListID` (UUID)
- `WarehouseID` (UUID)
- `Products` (Array, mínimo 1 producto)

**Campos Opcionales:**
- `Comments` (string)
- `PurchaseOrder` (string o null)
- `Services` (Array, generalmente vacío)

### Response

**Success (200):**
```json
{
  "status": "success",
  "data": "a4ae8fa0-342d-4793-b298-0007023decb8"
}
```

**Errores Comunes:**
- `400` - Payload malformado o campos faltantes
- `401` - Token inválido o expirado
- `404` - Producto/Cliente no encontrado
- `500` - Error interno del servidor

---

## GET - Listar Órdenes

### Request

```http
GET /api/Orders
Authorization: Bearer {token}
```

### Query Parameters (OData)

```
?$top=100          # Límite de registros
&$skip=0           # Offset (paginación)
&$filter=StatusCode eq 0    # Filtrar por estado
&$orderby=OrderDate desc    # Ordenamiento
```

### Response

```json
{
  "value": [
    {
      "ID": "uuid",
      "OrderDate": "2025-11-02T10:30:00Z",
      "ClientID": "uuid",
      "WarehouseID": "uuid",
      "StatusCode": 0,
      "Total": 95.00,
      "Comments": "Requisición ComerECO #REQ-2025-001",
      ...
    }
  ]
}
```

### Estados de Orden (StatusCode)

| Código | Estado | Descripción |
|--------|--------|-------------|
| `0` | Pendiente | Orden recién creada |
| `1` | Surtido | Orden completada |
| `2` | Cancelado | Orden cancelada (soft delete) |

---

## GET - Obtener Orden por ID

### Request

```http
GET /api/Orders/{order-id}
Authorization: Bearer {token}
```

### Response

```json
{
  "ID": "a4ae8fa0-342d-4793-b298-0007023decb8",
  "OrderDate": "2025-11-02T10:30:00Z",
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "StatusCode": 0,
  "Total": 95.00,
  "Products": [...],
  ...
}
```

---

## DELETE - Cancelar Orden

### Request

```http
DELETE /api/Orders/{order-id}
Authorization: Bearer {token}
```

### Comportamiento

⚠️ **IMPORTANTE:** DELETE NO elimina físicamente la orden.

- Cambia `StatusCode` de `0` (Pendiente) a `2` (Cancelado)
- La orden sigue siendo accesible vía GET
- Para filtrar órdenes activas: `?$filter=StatusCode ne 2`

### Response

```json
{
  "status": "success"
}
```

---

## Ejemplos de Uso

### Crear orden con múltiples productos

```javascript
const payload = {
  AddressID: "efff1744-da2f-499d-952f-20b9140a95bf",
  ClientID: "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  CurrencyID: "b7e2c065-bd52-40ca-b508-3accdd538860",
  LocationID: "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
  OrderDate: new Date().toISOString(),
  PriceListID: "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
  WarehouseID: "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  Comments: "Orden de prueba",
  PurchaseOrder: null,
  Products: [
    {
      ID: "2d800143-c834-497a-939c-a6e9d19f645f",
      Price: 9.5,
      Qty: 10,
      VAT: 0,
      Comments: "",
      Unit: "Litro"
    },
    {
      ID: "otro-producto-uuid",
      Price: 15.75,
      Qty: 5,
      VAT: 0,
      Comments: "",
      Unit: "Pieza"
    }
  ],
  Services: []
};

const response = await fetch('https://api.bind.com.mx/api/Orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const result = await response.json();
console.log('Order ID:', result.data);
```

### Listar órdenes pendientes

```javascript
const response = await fetch(
  'https://api.bind.com.mx/api/Orders?$filter=StatusCode eq 0&$orderby=OrderDate desc&$top=50',
  {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }
);

const data = await response.json();
const orders = data.value;
```

---

## Notas

- Todos los UUIDs deben ser válidos y existir en BIND
- `OrderDate` debe estar en formato ISO 8601
- `Products` debe tener al menos 1 producto
- `Services` generalmente va vacío `[]`
- El campo `data` en la respuesta contiene el UUID de la orden creada

---

**Última actualización:** 2025-11-02
