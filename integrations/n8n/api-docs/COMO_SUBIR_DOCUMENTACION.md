# 📤 Cómo Subir Documentación de la API BIND

Esta guía te ayudará a organizar y subir documentación oficial de BIND a este repositorio.

---

## 🖼️ Screenshots y Capturas

### Dónde subir
```
api-docs/screenshots/
```

### Formato recomendado
```
nombre-descriptivo-fecha.png
```

### Ejemplos de nombres
```
bind-dashboard-overview-2025-11-02.png
bind-create-order-form-2025-11-02.png
bind-product-list-view-2025-11-02.png
bind-api-docs-orders-endpoint-2025-11-02.png
```

### Cómo subir

**Opción 1: Arrastrar y soltar**
1. Abrir carpeta `api-docs/screenshots/` en tu explorador de archivos
2. Arrastrar imágenes a la carpeta
3. Renombrar según formato recomendado

**Opción 2: Línea de comandos**
```bash
cd integrations/n8n/api-docs/screenshots
cp ~/Downloads/captura.png ./bind-orders-endpoint-2025-11-02.png
```

**Opción 3: VS Code**
1. Abrir VS Code
2. Arrastrar imagen a carpeta `screenshots/`
3. Renombrar en el explorador de archivos

### Referenciar en documentación

```markdown
# Endpoint Orders

![Vista de formulario](../screenshots/bind-create-order-form-2025-11-02.png)

## Ejemplo de respuesta

Ver captura completa:

![Respuesta exitosa](../screenshots/bind-response-success-2025-11-02.png)
```

---

## 📄 Documentación de Endpoints

### Dónde subir
```
api-docs/endpoints/
```

### Template
Ver [endpoints/orders.md](endpoints/orders.md) para ejemplo completo.

### Crear nuevo endpoint

```bash
# Copiar template
cp api-docs/endpoints/orders.md api-docs/endpoints/products.md

# Editar con información del endpoint
nano api-docs/endpoints/products.md
```

### Estructura recomendada

```markdown
# Nombre del Endpoint

## Información General
- Base URL
- Autenticación

## GET - Operación
- Request
- Query parameters
- Response
- Ejemplo

## POST - Operación
- Request
- Payload
- Response
- Ejemplo

## Errores Comunes
- Código y descripción

## Notas
```

---

## 🔧 Ejemplos JSON

### Dónde subir
```
api-docs/examples/
```

### Formato de nombres
```
operacion-tipo-descripcion.json
```

### Ejemplos
```
create-order-request.json
create-order-response.json
get-products-response.json
error-401-unauthorized.json
error-400-bad-request.json
```

### Ejemplo de archivo

```json
{
  "_comment": "GET /api/Products - Response",
  "_fecha": "2025-11-02",
  "_validado": true,
  "value": [
    {
      "ID": "uuid",
      "Name": "Producto Ejemplo",
      "Price": 9.5,
      "Stock": 150
    }
  ]
}
```

**Nota:** Los campos con `_` son metadatos (comentarios) y no son parte del JSON real.

---

## 📋 JSON Schemas

### Dónde subir
```
api-docs/schemas/
```

### Cuándo crear schemas
- Cuando hay un payload complejo
- Para validación automática
- Para referencia de tipos

### Ejemplo básico

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product",
  "type": "object",
  "required": ["ID", "Name", "Price"],
  "properties": {
    "ID": {
      "type": "string",
      "format": "uuid"
    },
    "Name": {
      "type": "string",
      "minLength": 1
    },
    "Price": {
      "type": "number",
      "minimum": 0
    }
  }
}
```

---

## 📮 Colecciones Postman

### Dónde subir
```
api-docs/postman/
```

### Exportar desde Postman

1. Abrir Postman
2. Seleccionar colección
3. Click en `...` → Export
4. Elegir formato: Collection v2.1
5. Guardar en `api-docs/postman/`

### Formato de nombres
```
bind-api-collection-v1.json
bind-orders-endpoints.json
```

### Importar a Postman

1. Abrir Postman
2. Import → File
3. Seleccionar archivo desde `api-docs/postman/`

---

## 📝 Documentación Textual (PDFs, Docs)

### Si tienes PDFs o Word docs de BIND

**Opción 1: Convertir a Markdown**
1. Usar herramienta de conversión (pandoc, online converters)
2. Guardar como `.md` en carpeta relevante
3. Limpiar formato

**Opción 2: Extraer información relevante**
1. Leer documento oficial
2. Crear archivo `.md` con información clave
3. Agregar referencia al documento original

```markdown
# Endpoint Products

> Basado en documentación oficial BIND v2.3 (PDF)
> Fecha: 2025-11-02

## GET /api/Products
...
```

---

## ✅ Checklist de Subida

Antes de commitear:

- [ ] Imágenes en formato PNG o JPG
- [ ] Nombres descriptivos (sin espacios)
- [ ] JSON válido (sin errores de sintaxis)
- [ ] Schemas probados con JSON válido
- [ ] Información sensible removida (tokens, passwords)
- [ ] Referencias actualizadas en `.md` files
- [ ] Fecha agregada en metadatos

---

## 🔒 Seguridad

### ⚠️ NO subir:
- ❌ Tokens reales de API
- ❌ Passwords
- ❌ Información de clientes reales
- ❌ Datos financieros sensibles

### ✅ Sí subir:
- ✅ Estructura de requests/responses (con datos de ejemplo)
- ✅ IDs de ejemplo (fake UUIDs)
- ✅ Capturas de pantalla (con información sensible pixelada)

### Limpiar datos sensibles en screenshots

**Herramientas:**
- macOS: Preview → Tools → Annotate → Shapes (rectángulo negro)
- Windows: Paint → Formas → Rectángulo relleno
- Online: photopea.com, pixlr.com

---

## 🎯 Workflow Recomendado

```bash
# 1. Tomar captura de pantalla
# 2. Limpiar información sensible
# 3. Subir a screenshots/
cp ~/Downloads/captura.png ./screenshots/bind-feature-2025-11-02.png

# 4. Crear/actualizar documentación
nano endpoints/nuevo-endpoint.md

# 5. Agregar ejemplos JSON si aplica
nano examples/nuevo-endpoint-request.json

# 6. Verificar
git status
git add api-docs/
git commit -m "docs: Agregar documentación de endpoint X"
```

---

## 💡 Tips

1. **Organiza por fecha**: Agrega fecha a nombres de archivo para tracking
2. **Describe claramente**: Nombres descriptivos > nombres cortos
3. **Valida JSON**: Usa jsonlint.com antes de subir
4. **Referencia todo**: Si subes un screenshot, referéncialo en un .md
5. **Mantén actualizado**: Marca fecha de última revisión

---

## 📞 Ayuda

Si tienes dudas sobre qué subir o cómo organizar, consulta:
- [README.md](README.md) - Índice general
- [endpoints/orders.md](endpoints/orders.md) - Ejemplo completo

---

**Creado:** 2025-11-02
**Última actualización:** 2025-11-02
