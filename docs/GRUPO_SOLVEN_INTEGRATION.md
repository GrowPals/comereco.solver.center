# 🤝 Integración "Grupo Solven" – Visión General

## Objetivo
Mantener identidades separadas en la webapp (cada empresa con sus catálogos, tipos de producto, reportes) mientras que Bind ERP vea un único cliente fácil de operar. Así reducimos carga al proveedor y mantenemos control interno.

## Principios
- **Supabase/Webapp = fuente de verdad operativa.** Cada empresa vive como `company_id` distinto, con sus flujos, usuarios y reportes.
- **Bind = único cliente/grupo.** El proveedor trabaja con un solo `ClientID`, `WarehouseID` y `PriceListID` (“Grupo Solven”). Nada cambia para ellos.
- **Sincronización controlada.** Todo lo que sale a Bind pasa por la cola (`integration_queue`) y los RPC; lo que entra de Bind (catálogo, precios, stock) se trae vía n8n y se distribuye internamente.
- **Etiquetado interno.** Cada entidad en Supabase guarda `bind_group_id = 'grupo_solven'` y, al mandar órdenes, incluimos metadatos de “Empresa X” para que Bind pueda rastrear si lo necesita.

## Flujo alto nivel
```
Empresa A / Empresa B (webapp)
        │
        ▼ (requisiciones)
Supabase (cola integration_queue + vistas)
        │
        ▼ (n8n workflow)
Bind ERP – Cliente único "Grupo Solven"
```

## Cómo se implementa
1. **Campos de mapeo**
   - `companies.bind_group_id` → todas las empresas del grupo apuntan a `grupo_solven`.
   - `bind_mappings` mantiene la relación `company_id ↔ ClientID`, `product_id ↔ ProductID`, etc. Para Bind todo cae en el mismo `ClientID`.

2. **Catálogo & precios**
   - n8n trae `GET /Products`, `GET /PriceLists/{id}`, `GET /Warehouses` una sola vez (el warehouse exclusivo para el grupo). 
   - Supabase distribuye esos datos según la empresa que los usa (vistas/filters) sin pedirle al proveedor que duplique registros.

3. **Órdenes hacia Bind**
   - Requisición aprobada → `integration_queue` → n8n → `POST /Orders` en Bind.
   - El payload manda el mismo `ClientID`/`WarehouseID` pero agrega en `ExternalReference` o `Comments`: `empresa=Soluciones_A`.
   - El proveedor sólo ve “Orden Grupo Solven” con nota; no captura nada manual.

4. **Stock compartido**
   - El warehouse exclusivo “Grupo Solven” se actualiza según nuestro consumo.
   - Cada requisición descuenta stock en Supabase y se refleja en Bind automáticamente.
   - Conciliación semanal (n8n trae inventario de Bind y lo compara) para detectar si hubo consumos fuera de la app.

5. **Reportes para proveedor**
   - Nuestra app genera un resumen (PDF/dashboard) con “qué entregar hoy” y “consumos por empresa”. Ellos no tienen que entrar a la app ni modificar catálogos.

## Beneficios
- **Proveedor sin fricción:** un solo cliente, un solo warehouse, un solo price list. Sólo reciben órdenes y actualizan stock una vez a la semana (si es necesario).
- **Control interno:** cada empresa conserva su identidad, permisos y métricas. Los flujos y catálogos “viven” en Supabase.
- **Auditoría sencilla:** si Bind mueve stock sin pasar por la app, lo detectamos en la conciliación; podemos alertar o bloquear.
- **Escalabilidad:** si más empresas se suman, sólo les asignamos `bind_group_id='grupo_solven'` (o creamos nuevos grupos). Bind sigue viendo un cliente por grupo.

## Próximos pasos
1. Añadir `bind_group_id` a `companies` y documentarlo en `bind_mappings`.
2. Asegurar que todos los workflows n8n usen el mismo `ClientID`/`WarehouseID`/`PriceListID` globales.
3. Definir el formato estándar de `ExternalReference` al mandar órdenes (ej. `empresa=Soluciones_A;req=REQ-2025-001`).
4. Configurar conciliación semanal del warehouse exclusivo y alertas automáticas si Bind modifica stock fuera del flujo.

> **Nota:** este documento es vivo. Cualquier cambio en la estrategia (nuevos grupos, múltiples warehouses, etc.) deberá actualizarse aquí.
