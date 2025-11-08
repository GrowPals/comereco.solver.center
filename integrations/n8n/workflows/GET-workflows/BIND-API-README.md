# 🔌 Bind ERP - API Complete Reference Workflow

## 📋 Descripción

Workflow completo de N8n que contiene **TODOS** los endpoints públicos del API de Bind ERP, organizados por método HTTP y con configuración profesional lista para producción.

## 🎯 Características

### ✅ Organización Visual
- **5 secciones separadas** con colores distintos
- **Notas descriptivas** en cada sección
- **Espaciado uniforme** para fácil navegación
- **Grid ordenado** de nodos

### ✅ Configuración Profesional
Todos los nodos incluyen:
- ✅ **Autenticación:** Header Authorization configurado
- ✅ **Reintentos:** 3 intentos automáticos
- ✅ **Delay:** 2 segundos entre reintentos
- ✅ **Timeout:** 30 segundos por petición
- ✅ **Continue on fail:** No rompe el workflow
- ✅ **Notas descriptivas:** Cada nodo documenta su función

### ✅ Cobertura Completa
- 📥 **57 GET** - Endpoints de lectura
- 📤 **25 POST** - Endpoints de creación
- 📝 **10 PUT** - Endpoints de actualización completa
- ✏️ **4 PATCH** - Endpoints de actualización parcial
- 🗑️ **12 DELETE** - Endpoints de eliminación

**Total: 108 nodos HTTP Request**

## 🚀 Cómo Usar

### 1. Importar a N8n

```bash
# Copiar el archivo JSON
cp BIND-API-COMPLETE-WORKFLOW.json /ruta/a/n8n/workflows/

# O importar desde la UI de N8n:
# Workflows > Import from File > Seleccionar JSON
```

### 2. Configurar Credenciales

1. Ir a **Credentials** en N8n
2. Crear **HTTP Header Auth**
3. Configurar:
   ```
   Name: Bind API Authorization
   Header Name: Authorization
   Header Value: Bearer {TU_TOKEN_JWT}
   ```

### 3. Usar los Nodos

#### Para consultas (GET)
1. Copiar el nodo deseado
2. Conectarlo a tu flujo
3. Ejecutar directamente

#### Para creación/actualización (POST/PUT/PATCH)
1. Copiar el nodo deseado
2. Agregar un nodo anterior que prepare el JSON
3. Configurar el body con tus datos
4. Ejecutar

#### Para nodos con IDs dinámicos
```json
// Nodos con {client_id}, {product_id}, etc.
// Reemplazar en la URL:

// Antes:
"url": "http://api.bind.com.mx/api/Clients/{client_id}"

// Después (con expresión):
"url": "http://api.bind.com.mx/api/Clients/{{ $json.clientId }}"
```

## 📊 Estructura del Workflow

```
┌─────────────────────────────────────────────────────────┐
│  📥 GET ENDPOINTS (Azul)                                │
│  - 57 nodos de solo lectura                            │
│  - Idempotentes y seguros                              │
├─────────────────────────────────────────────────────────┤
│  📤 POST ENDPOINTS (Verde)                              │
│  - 25 nodos de creación                                │
│  - Requieren body JSON                                  │
├─────────────────────────────────────────────────────────┤
│  📝 PUT ENDPOINTS (Naranja)                             │
│  - 10 nodos de actualización completa                  │
│  - Reemplazan todos los campos                         │
├─────────────────────────────────────────────────────────┤
│  ✏️ PATCH ENDPOINTS (Rosa/Magenta)                      │
│  - 4 nodos de actualización parcial                    │
│  - Solo modifican campos enviados                      │
├─────────────────────────────────────────────────────────┤
│  🗑️ DELETE ENDPOINTS (Rojo)                             │
│  - 12 nodos de eliminación                             │
│  - ⚠️ CUIDADO: Algunos son irreversibles               │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Colores de Secciones

| Color         | Sección  | Descripción                    |
|---------------|----------|--------------------------------|
| 🔵 Azul       | GET      | Lectura - Seguro               |
| 🟢 Verde      | POST     | Creación - Modifica datos      |
| 🟠 Naranja    | PUT      | Actualización completa         |
| 🔴 Rosa       | PATCH    | Actualización parcial          |
| 🔴 Rojo       | DELETE   | Eliminación - ⚠️ DESTRUCTIVO   |
| 🟡 Amarillo   | INFO     | Información general            |

## 💡 Tips y Best Practices

### ✅ DO's
- ✅ Usa GET para consultas sin efectos secundarios
- ✅ Usa PATCH en lugar de PUT cuando solo necesites actualizar campos específicos
- ✅ Verifica el StatusCode de Orders después de DELETE (será 2, no 404)
- ✅ Usa los parámetros OData en GET: `$top`, `$skip`, `$filter`, `$orderby`
- ✅ Maneja los reintentos automáticos del workflow
- ✅ Revisa las notas de cada nodo antes de usar

### ❌ DON'Ts
- ❌ No uses PUT cuando solo necesites actualizar un campo (usa PATCH)
- ❌ No asumas que DELETE elimina físicamente los datos
- ❌ No ejecutes DELETE sin verificar dependencias
- ❌ No omitas campos requeridos en POST
- ❌ No olvides reemplazar los IDs dinámicos `{xxx_id}`

## 🔐 Autenticación

Todos los endpoints requieren:
```http
Authorization: Bearer {tu_token_jwt}
```

El token debe obtenerse de Bind ERP y configurarse en las credenciales de N8n.

## ⚙️ Configuración de Reintentos

Todos los nodos están configurados con:
```json
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetween": 2000,
  "options": {
    "timeout": 30000,
    "retry": {
      "maxRetries": 3,
      "retryDelay": 2000
    }
  }
}
```

- **Max intentos:** 3
- **Delay entre intentos:** 2 segundos
- **Timeout por request:** 30 segundos
- **Continue on fail:** Sí (no rompe el workflow)

## 📖 Endpoints Destacados

### POST /Orders (⭐ Crítico)
Crea órdenes de compra en Bind ERP.

**Campos requeridos:**
- `ClientID` - UUID del cliente
- `WarehouseID` - UUID del almacén
- `LocationID` - UUID de ubicación
- `PriceListID` - UUID de lista de precios
- `CurrencyID` - UUID de moneda
- `OrderDate` - Fecha ISO 8601
- `Products[]` - Array de productos

### GET /ProductsPriceAndInventory
Obtiene productos con precio e inventario en tiempo real.

**Query params:**
- `warehouseId` - UUID del almacén
- `priceListId` - UUID de lista de precios

### DELETE /Orders/{order_id} (⚠️ Importante)
**NO elimina físicamente la orden**, solo cambia el `StatusCode` a `2` (Cancelado).

## 📊 Estados de Orden

| StatusCode | Status     | Descripción              |
|------------|------------|--------------------------|
| 0          | Pendiente  | Recién creada, editable  |
| 1          | Surtido    | Completada, no editable  |
| 2          | Cancelado  | Cancelada (soft delete)  |

## 🐛 Troubleshooting

### Error: 401 Unauthorized
- ✅ Verifica que el token JWT sea válido
- ✅ Verifica que el header Authorization esté configurado
- ✅ Verifica que el token no haya expirado

### Error: 400 Bad Request
- ✅ Verifica que todos los campos requeridos estén presentes
- ✅ Verifica el formato de los UUIDs
- ✅ Verifica el formato de fechas (ISO 8601)

### Error: 404 Not Found
- ✅ Verifica que el endpoint exista
- ✅ Verifica que el ID sea correcto
- ✅ Recuerda que DELETE Orders NO retorna 404

### Nodo no ejecuta
- ✅ Verifica que las credenciales estén configuradas
- ✅ Verifica que el nodo esté conectado
- ✅ Revisa los logs de N8n

## 📝 Personalización

### Cambiar Base URL
Si tu instancia de Bind usa otra URL:

```javascript
// Buscar y reemplazar en todos los nodos:
// De: http://api.bind.com.mx/api/
// A: https://tu-instancia.bind.com.mx/api/
```

### Agregar Logging
Agrega un nodo después de cada request para logging:

```javascript
// Nodo Function
return {
  json: {
    timestamp: new Date().toISOString(),
    endpoint: $node["GET Clients"].json,
    status: $node["GET Clients"].statusCode
  }
};
```

## 📅 Mantenimiento

### Última Actualización
- **Fecha:** 2025-11-06
- **Versión:** 2.0
- **Validado:** ✅ Con API Real de Bind ERP

### Changelog
- **v2.0 (2025-11-06):**
  - ✅ Agregados 108 endpoints completos
  - ✅ Organización en 5 secciones con colores
  - ✅ Configuración profesional de reintentos
  - ✅ Documentación completa en cada nodo
  - ✅ PATCH endpoints agregados
  - ✅ Notas informativas mejoradas

## 🤝 Contribuciones

Para agregar nuevos endpoints:
1. Agregar a la lista correspondiente en el script Python
2. Regenerar el workflow: `python3 generate_bind_workflow.py`
3. Actualizar este README

## 📚 Referencias

- [Bind ERP API Docs](BIND_API_MAP.md)
- [N8n Documentation](https://docs.n8n.io/)
- [OData Protocol](https://www.odata.org/)

## ⚖️ Licencia

Este workflow es parte del proyecto ComerECO.

---

**Generado con:** Script Python automatizado
**Para:** ComerECO-WEBAPP
**Fecha:** 2025-11-06
