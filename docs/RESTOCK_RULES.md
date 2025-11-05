# Reglas de reabastecimiento automático

Este módulo permite que supervisores y administradores definan cuándo debe levantarse una requisición automática (vía n8n) para cada producto.

## Tablas nuevas

### `inventory_restock_rules`

| Campo | Descripción |
| -- | -- |
| `company_id` | Empresa propietaria. Se completa de forma automática con `get_user_company_id()` en inserciones manuales. |
| `product_id` | Producto al que aplica la regla. FK a `products`. |
| `project_id` | Proyecto opcional para reglas específicas. `NULL` representa regla general. |
| `min_stock` | Unidades que disparan la alerta. >= 0. |
| `reorder_quantity` | Unidades sugeridas para la requisición automática. > 0. |
| `status` | `active` / `paused`. Controla si la automatización externa debe considerar la regla. |
| `notes` | Notas internas visibles en la UI. |
| `preferred_vendor`, `preferred_warehouse` | Campos libres para sugerencias operativas. |
| `created_by`, `updated_by`, `created_at`, `updated_at` | Metadatos de auditoría. `updated_at` se mantiene con `set_updated_at()`. |

Restricciones destacadas:

- RLS habilitado. Solo `admin` y `supervisor` con la misma `company_id` pueden leer y mutar.
- Índice único parcial que impide más de una regla **activa** por `(company_id, product_id, project_id)`.
- Índices secundarios para filtros (`company_id,status` y `company_id,project_id`).

### `inventory_restock_rule_logs`

Tabla pensada para registrar futuras ejecuciones cuando n8n dispare una requisición. Incluye:

- FK opcional a `inventory_restock_rules` (`rule_id`).
- Campos contextuales (`triggered_stock`, `status_before`, `status_after`, `event_type`, `metadata`).
- `company_id` default `get_user_company_id()` y `created_by` default `auth.uid()`.
- RLS: lectura para admin/supervisor; inserción permitida para admin/supervisor o `service_role` (n8n).

## API / integración con n8n

El flujo externo puede consumir la tabla `inventory_restock_rules` directamente (REST `GET /rest/v1/inventory_restock_rules`). Recomendaciones:

- Filtrar por `status=eq.active` y la `company_id` correspondiente.
- Opcional: aplicar filtro `min_stock=lte.{stock_actual}` para identificar reglas que requieren acción.
- Al generar una requisición, registrar el evento en `inventory_restock_rule_logs` con `service_role`.
- Respetar el índice parcial: pausar la regla (`status = 'paused'`) antes de crear otra activa para el mismo producto + proyecto.

## Interfaz

### Ficha de producto

- Componente `ProductRestockRuleSection` en `src/components/inventory/ProductRestockRuleSection.jsx`.
- Muestra estado, stock actual vs mínimo y permite crear/editar/pausar la regla.
- Supervisores y administradores pueden elegir el alcance (`Regla general` o un proyecto específico) y abrir un formulario modal.

### Panel central

- Ruta protegida `/inventory/restock-rules` (solo admin/supervisor).
- Listado con filtros por estado, proyecto, categoría y búsqueda.
- Cada fila permite editar, pausar/reactivar, eliminar o abrir la ficha del producto.

## Permisos

- Reutiliza `canManageRestockRules` (admin o supervisor) definido en `useUserPermissions`.
- Sidebar añade acceso directo “Reabastecimiento” para roles con permiso.
- Usuarios sin permiso solo pueden visualizar el estado (sin acciones) desde la ficha del producto.

## Próximos pasos sugeridos

1. Implementar flujo en n8n que consulte `inventory_restock_rules` y registre activaciones en `inventory_restock_rule_logs`.
2. Exponer métricas/historial en la UI utilizando la tabla de logs.
3. Añadir edición masiva desde el panel central (UI preparada para filtros y selección múltiple).

