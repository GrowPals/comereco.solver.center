# 🧭 Plan Detallado de Implementación – Grupo Solven ↔ Bind ERP

> Documento vivo para entender **qué haremos**, **por qué lo haremos así** y **cómo afecta a cada actor** (cliente, comercializadora, Supabase, n8n, Bind).

---

## 1. Fase de Diagnóstico y Resguardo

| Paso | Qué hacemos | Por qué se hace así |
|------|-------------|---------------------|
| 1.1 | Respaldar catálogos y configuraciones actuales de Bind (productos, clientes, listas de precio, inventarios). | Si algo falla al crear nuevos objetos, podemos restaurar manualmente; Bind no tiene sandbox. |
| 1.2 | Documentar en `integrations/n8n/RESUMEN_BIND_REAL.md` los IDs existentes. | Nos permite mapear cualquier flujo sin depender de la memoria del equipo. |
| 1.3 | Mapear visualmente las pantallas usadas (ya se hizo). Guardar en `docs/bind/USO_ACTUAL.md`. | Así podemos diseñar cambios que no obliguen al proveedor a aprender pantallas nuevas. |

> **Decisión:** No tocamos ninguna configuración histórica todavía. Todo es observación + documentación para asegurar que conocemos el terreno.

---

## 2. Fase de Configuración “Grupo Solven” en Bind

| Paso | Detalle | Motivo |
|------|---------|--------|
| 2.1 | Crear (o confirmar) un **Cliente único** llamado “Grupo Solven”. | Evita que el proveedor tenga 10 clientes por planta/proyecto; simplifica facturación y cobros. |
| 2.2 | Reutilizar o crear una **Lista de precios exclusiva** (ej. “SOLUCIONES”). | Queremos garantizar tarifas internas sin depender de la lista “A” pública; Bind soporta múltiples listas por cliente. |
| 2.3 | **Warehouse**: mantener “Matriz” por ahora. | Abrir un almacén nuevo requiere ajustes contables; para minimizar resistencia, seguiremos con Matriz y haremos control virtual desde nuestra app. |
| 2.4 | Establecer formato estándar de `ExternalReference/Comments` (ej. `empresa=SolucionesA;proyecto=PlantaX`). | Bind seguirá viendo un solo cliente, pero nosotros sabremos a qué empresa/proyecto corresponde cada pedido. |

> **Decisión:** No exigimos un nuevo warehouse hoy. Si más adelante el proveedor se siente cómodo, podemos crear “Grupo Solven” como almacén separado, pero arrancamos con lo que ya conocen.

---

## 3. Fase de Preparación en Supabase

| Paso | Detalle | Motivo |
|------|---------|--------|
| 3.1 | Añadir columna `bind_group_id` a `companies` y setear `grupo_solven`. | Permite que nuestra app sepa qué empresas comparten identidad en Bind. |
| 3.2 | Completar `bind_mappings` con ClientID, PriceListID, WarehouseID nuevos. | Todas las funciones/RPC de Supabase y n8n dependen de estos IDs; necesitamos un solo lugar de verdad. |
| 3.3 | Ajustar vistas/materialized views para filtrar por `bind_group_id` cuando sea necesario (ej. reportes). | Así podemos seguir ofreciendo reportes por empresa sin confundir al proveedor. |

> **Decisión:** La webapp mantiene la personalidad de cada empresa; Bind sólo ve el grupo. Esto se logra con un campo de mapeo en la base y no requiere cambios de UI para los usuarios internos.

---

## 4. Fase de Ingesta (Bind → Supabase)

| Workflow | Qué hace | Por qué así |
|----------|----------|-------------|
| WF-B1 `bind-sync-products` | `GET /Products` y sincroniza catálogo (IDs, nombres, stock, etc.) | Bind ya es la fuente oficial de SKU/stock; traerlo automático evita que el proveedor capture doble. |
| WF-B2 `bind-sync-pricelist` | `GET /PriceLists/{id}` (lista Grupo Solven) y actualiza precios internos. | Garantiza que las requisiciones calculen exactamente lo que Bind cobrará. |
| WF-B4 `bind-sync-current-inventory` | Lee `CurrentInventory` y actualiza `products.stock` en Supabase. | Da visibilidad diaria a los usuarios internos sin pedir reportes manuales. |

> **Decisión:** Los workflows GET corren antes de hacer cualquier POST para asegurar que Supabase refleje lo que hay en Bind. Esto reduce “sorpresas” al enviar pedidos.

---

## 5. Fase de Egresos (Supabase → Bind)

| Paso | Detalle | Motivo |
|------|---------|--------|
| 5.1 | Cada requisición aprobada inserta un job en `integration_queue` con el payload completo (productos, cantidades, notas). | Centralizamos la salida en una cola con reintentos; es más seguro que disparar desde el frontend. |
| 5.2 | n8n consume la cola vía `dequeue_integration_jobs`, formatea `POST /Orders` con ClientID/WarehouseID/ListID “Grupo Solven”. | Bind recibe pedidos formateados igual que si los capturaran manualmente; el proveedor no nota la diferencia. |
| 5.3 | Manejo de resultados: `complete_integration_job` marca success/error, y los logs van a `bind_sync_logs`. | Permite trazabilidad y reintentos controlados; si Bind falla, no perdemos el pedido. |

> **Decisión:** Usar la cola + RPC evita escribir lógica en el frontend y permite pausar/reanudar workflows sin perder trabajos.

---

## 6. Fase de Conciliación y Comunicación

| Paso | Detalle | Por qué es clave |
|------|---------|------------------|
| 6.1 | Workflow semanal que compara stock de Bind vs. Supabase y genera un reporte. | Detecta si alguien vendió “externo” sin pasar por nuestra app; mantiene confianza. |
| 6.2 | Reporte automático para la comercializadora (PDF/Slack) con pedidos pendientes + notas. | Les evita entrar a la webapp; reciben la lista ya filtrada “Grupo Solven”. |
| 6.3 | Manual operativo breve (10 min) para las 4 personas que usan Bind: dónde ver el cliente, cómo leer comments. | Minimiza resistencia; ellos siguen en la misma pantalla (Ventas → Pedidos) y sólo revisan el comentario. |

> **Decisión:** La comunicación se apoya en reportes automáticos. No se les pide operar n8n ni Supabase; sólo verificar pedidos y stock como siempre.

---

## 7. Estrategia de Cambio Gradual

1. **Modo “paralelo”** (prueba):
   - Genera 1-2 pedidos piloto desde la app hacia Bind (cliente Grupo Solven) pero aún confirma manualmente con el proveedor.
   - Ajusta flujos según feedback.

2. **Modo “semiproducción”**:
   - Parte de las requisiciones se envían por la app; el resto sigue por el canal tradicional. Compara tiempos y errores.

3. **Modo “full”**:
   - Todo pedido debe pasar por la app. Bind recibe únicamente los pedidos “Grupo Solven”.

> **Decisión:** Evitamos “big bang” para no asustar al proveedor. Cada modo dura lo que necesites hasta que todos se sientan cómodos.

---

## 8. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Proveedor no actualiza stock en Bind. | Workflow de conciliación + alertas + reporte semanal con acciones sugeridas. |
| Cambios de precio sin avisar. | Workflow `bind-sync-pricelist` diario + notificación si detecta variaciones > X%. |
| Usuarios internos saltan la app y piden por WhatsApp. | Política interna + la app muestra “pedido en proceso”; si se detecta pedido directo, se registra incidente. |
| Bind falla (API down). | Jobs quedan en `integration_queue`; n8n reintenta; soporte manual sólo si falla >24h. |

---

## 9. Checklist final antes de “activar” Grupo Solven

- [ ] Cliente, Price List y (opcional) Warehouse exclusivos creados en Bind y documentados.
- [ ] `bind_group_id` + `bind_mappings` actualizados en Supabase.
- [ ] Workflows GET corriendo en n8n (productos, precios, stock).
- [ ] Cola `integration_queue` en producción y workflows POST probados con pedidos piloto.
- [ ] Reporte semanal / conciliación configurados.
- [ ] Manual de operación entregado a la comercializadora y verificado en sesión corta.

---

## 📌 Notas finales
- Este plan prioriza **mínima disrupción** a la comercializadora: no duplicamos almacenes ni forzamos nuevos procesos; sólo creamos un cliente/lista exclusivos.
- Supabase/n8n actúan como “capa inteligente”: reservan stock virtual, generan pedidos autoformateados y vigilan desvíos.
- Cualquier ajuste futuro (ej. warehouse exclusivo, integración con otras empresas) se agrega como versión 2.0 del mismo plan.

> Cualquier cambio o avance se debe reflejar tanto en este documento como en `docs/GRUPO_SOLVEN_INTEGRATION.md` para mantener un solo historial.
