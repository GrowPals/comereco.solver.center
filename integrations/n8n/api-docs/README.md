# 📚 Documentación API BIND ERP

Esta carpeta contiene toda la documentación relacionada con la API de BIND ERP.

## 📤 Subir Documentos Oficiales

**¿Tienes PDFs, capturas o documentos oficiales de BIND?**

👉 Súbelos en la carpeta [oficiales/](oficiales/)

Ver instrucciones: [oficiales/README.md](oficiales/README.md)

---

## 📁 Estructura

```
api-docs/
├── README.md                    # Este archivo
├── oficiales/                   # 📂 SUBE AQUÍ documentos oficiales de BIND
│   └── README.md               # Instrucciones de cómo subir archivos
├── endpoints/                   # Documentación de endpoints
│   └── orders.md               # POST/GET/DELETE /Orders
├── examples/                    # Ejemplos de requests/responses
│   ├── create-order-request.json
│   ├── create-order-response.json
│   └── error-responses.json
├── schemas/                     # JSON schemas
│   └── order-payload.json
├── screenshots/                 # Capturas de pantalla
└── postman/                     # Colecciones Postman
```

## 🔑 Información Rápida

**Base URL:** `https://api.bind.com.mx/api/`

**Autenticación:** Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token válido hasta:** 2026-12-24

## 📖 Documentación Disponible

- [BIND_API_MAP.md](../workflows/BIND_API_MAP.md) - Referencia completa de API
- [RESUMEN_BIND_REAL.md](../RESUMEN_BIND_REAL.md) - Resumen con IDs reales

## 🎯 Uso

Esta carpeta está diseñada para:
1. Subir capturas de pantalla de la documentación oficial de BIND
2. Guardar ejemplos de requests/responses reales
3. Documentar comportamientos específicos encontrados
4. Mantener schemas y contratos de la API

## 📝 Cómo Contribuir

📖 **Guía completa:** [COMO_SUBIR_DOCUMENTACION.md](COMO_SUBIR_DOCUMENTACION.md)

**Resumen rápido:**
1. **Screenshots:** Subir a carpeta `screenshots/` con nombres descriptivos
2. **Ejemplos:** Agregar a carpeta `examples/` en formato JSON válido
3. **Endpoints:** Documentar en `endpoints/` siguiendo [template de orders.md](endpoints/orders.md)
4. **Schemas:** Agregar JSON schemas a `schemas/` para validación

---

**Última actualización:** 2025-11-02
