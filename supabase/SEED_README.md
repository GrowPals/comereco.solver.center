# EnviteRP - Datos de Prueba Realistas en Español

Datos de prueba 100% en español simulando **3 meses de actividad real** en contexto mexicano.

## 📊 Contenido

### Datos Core
- **50 Productos** realistas mexicanos en 5 categorías:
  - 📝 Papelería y Oficina (10 productos)
  - 🧹 Limpieza (10 productos)
  - 🦺 Equipo de Seguridad (10 productos)
  - 🔧 Herramientas (10 productos)
  - ☕ Cocina/Despensa (10 productos)

### Operaciones de Negocio
- **4 Proyectos** realistas mexicanos:
  - Remodelación Oficinas Centro
  - Mantenimiento Preventivo Planta Norte
  - Equipamiento Almacén Zona Sur
  - Certificación ISO 9001:2015

- **12 Requisiciones** con estados variados:
  - 6 Aprobadas y sincronizadas
  - 2 Pendientes de aprobación
  - 1 Rechazada
  - 1 Cancelada
  - 1 En borrador
  - 1 Con error de sincronización

### Registros de Actividad
- **20 Logs de Auditoría**:
  - Entradas de inventario (compras, devoluciones, importaciones)
  - Salidas de inventario (requisiciones, transferencias)
  - Ajustes de inventario (conteos, mermas, correcciones)
  - Con proveedores mexicanos realistas

### Interacción de Usuario
- **18 Notificaciones** en español:
  - Requisiciones pendientes
  - Alertas de stock bajo/crítico
  - Estados de sincronización
  - Auditorías programadas
- **8 Productos favoritos** del usuario
- **5 Items en carrito** activo

## 📁 Estructura de Archivos

```
supabase/
├── seed_realista_es.sql    # ✅ Todos los datos en español
├── limpieza_total.sql      # Limpieza completa (preserva tu admin)
├── seed_cleanup.sql        # Limpieza antigua (deprecado)
└── SEED_README.md          # Este archivo
```

## 🚀 Cómo Ejecutar

### ⚠️ **IMPORTANTE: Pasos en Orden**

```bash
# 1. PRIMERO: Limpiar datos de prueba anteriores (OPCIONAL)
# 2. SEGUNDO: Cargar datos realistas en español
```

### Opción 1: Via Dashboard de Supabase (RECOMENDADO)

1. **Ve a tu proyecto** en [Supabase Dashboard](https://supabase.com/dashboard)
2. **SQL Editor** (menú lateral izquierdo)
3. **Ejecuta EN ORDEN**:

#### PASO 1 (Opcional): Limpieza Total
```sql
-- Solo si quieres limpiar datos de prueba anteriores
-- ⚠️ CUIDADO: Esto eliminará todos los datos excepto tu usuario admin
-- Copia y pega: supabase/limpieza_total.sql
-- Click "Run" ▶️
```

#### PASO 2: Cargar Datos Realistas
```sql
-- Copia y pega: supabase/seed_realista_es.sql
-- Click "Run" ▶️
```

### Opción 2: Via psql (línea de comandos)

```bash
cd /home/bigez/COMERECO-WEBAPP

# Obtén tu connection string de Supabase Dashboard
# Settings > Database > Connection string > URI
export DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# OPCIONAL: Limpieza primero
psql "$DB_URL" -f supabase/limpieza_total.sql

# EJECUTAR: Seed realista
psql "$DB_URL" -f supabase/seed_realista_es.sql
```

### Opción 3: Script automatizado (Linux/Mac)

```bash
cd /home/bigez/COMERECO-WEBAPP

# Crear script de ejecución
cat > run_seed_realista.sh << 'EOF'
#!/bin/bash
DB_URL="$1"

if [ -z "$DB_URL" ]; then
    echo "❌ Error: Proporciona la URL de conexión"
    echo "Uso: ./run_seed_realista.sh 'postgresql://postgres:password@host:5432/postgres'"
    exit 1
fi

echo "🧹 ¿Deseas limpiar datos anteriores? (s/N)"
read -r response
if [[ "$response" =~ ^([sS][iI]?|[yY][eE][sS]?)$ ]]; then
    echo "🧹 Limpiando datos anteriores..."
    psql "$DB_URL" -f supabase/limpieza_total.sql || exit 1
fi

echo "🚀 Cargando datos realistas en español..."
psql "$DB_URL" -f supabase/seed_realista_es.sql || exit 1

echo "🎉 ¡Seed completado exitosamente!"
EOF

chmod +x run_seed_realista.sh

# Ejecutar
./run_seed_realista.sh "tu-connection-string-aqui"
```

## 🇲🇽 Características Realistas

### Productos Mexicanos Auténticos
- Marcas locales: **Pinol**, **Cloralex**, **Pétalo**, **Legal**, **BIC**, **Stanley**, **DeWalt**
- Precios en **pesos mexicanos** (MXN)
- Unidades de medida apropiadas (caja, paquete, pieza, bolsa, par, etc.)
- Descripciones realistas y específicas

### Proveedores Mexicanos
- Papelería del Norte SA (Monterrey)
- Limpieza Industrial Monterrey
- Equipos de Seguridad Guadalajara
- Herramientas Industriales MTY
- Abastecedora del Centro
- Global Supplies Inc (importación)

### Escenarios de Negocio Reales
- Requisiciones por ciclo fiscal
- Mantenimiento preventivo
- Auditorías de Protección Civil
- Certificaciones ISO
- Cierre de mes contable
- Temporada alta de pedidos
- Brotes de enfermedades (influenza)

## ⚠️ Notas Importantes

### Antes de Ejecutar
1. ✅ El script usa tu **compañía existente** automáticamente
2. ✅ El script usa tu **usuario admin existente** automáticamente
3. ✅ No necesitas crear usuarios nuevos
4. ⚠️ Si ejecutas `limpieza_total.sql`, haz backup de tus datos reales primero

### Inconsistencias Realistas (Intencionales)

✅ **Escenarios "del Mundo Real":**
- Requisiciones con `sync_failed` (simulando errores de API)
- Niveles de stock variados (algunos bajos, otros altos)
- Requisiciones en borrador sin enviar
- Requisiciones rechazadas por presupuesto
- Notificaciones sin leer
- Productos sin actualizar hace meses
- Ajustes por merma y daños
- Diferencias en conteos físicos
- Productos próximos a vencer

## 📈 Consultas Útiles

### Verificar datos cargados:
```sql
SELECT 'Productos' as tabla, COUNT(*) as cantidad FROM products
UNION ALL SELECT 'Proyectos', COUNT(*) FROM projects
UNION ALL SELECT 'Requisiciones', COUNT(*) FROM requisitions
UNION ALL SELECT 'Items Requisición', COUNT(*) FROM requisition_items
UNION ALL SELECT 'Logs Auditoría', COUNT(*) FROM audit_log
UNION ALL SELECT 'Notificaciones', COUNT(*) FROM notifications
UNION ALL SELECT 'Favoritos', COUNT(*) FROM user_favorites
UNION ALL SELECT 'Carrito', COUNT(*) FROM user_cart_items;
```

### Ver resumen de requisiciones:
```sql
SELECT
    status as estado,
    integration_status as estado_integracion,
    COUNT(*) as cantidad,
    TO_CHAR(SUM(
        (SELECT SUM(quantity * unit_price)
         FROM requisition_items
         WHERE requisition_id = requisitions.id)
    ), 'FM$999,999,999.00') as total
FROM requisitions
GROUP BY status, integration_status
ORDER BY status, integration_status;
```

### Productos con stock bajo:
```sql
SELECT
    sku,
    name as nombre,
    stock as stock_actual,
    category as categoria,
    TO_CHAR(price, 'FM$999,999.00') as precio
FROM products
WHERE stock < 50
ORDER BY stock ASC
LIMIT 10;
```

### Movimientos de inventario recientes:
```sql
SELECT
    action as movimiento,
    details->>'movement' as descripcion,
    details->>'quantity' as cantidad,
    details->>'supplier' as proveedor,
    created_at as fecha
FROM audit_log
WHERE entity_type = 'product'
ORDER BY created_at DESC
LIMIT 20;
```

### Notificaciones pendientes:
```sql
SELECT
    type as tipo,
    title as titulo,
    message as mensaje,
    priority as prioridad,
    created_at as fecha
FROM notifications
WHERE NOT read
ORDER BY
    CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
    END,
    created_at DESC;
```

## 🎯 Casos de Prueba Soportados

Este seed data permite probar:

- ✅ **Temas oscuro/claro** - productos con categorías diversas
- ✅ **Movimientos de stock** - entradas, salidas, ajustes
- ✅ **Flujo de requisiciones** - todos los estados posibles
- ✅ **Aprobaciones** - pendientes, aprobadas, rechazadas
- ✅ **Fallos de sincronización** - manejo de errores con BIND
- ✅ **Alertas de stock** - productos con nivel bajo
- ✅ **Multi-proyecto** - items asignados a diferentes proyectos
- ✅ **Auditoría completa** - historial de cambios
- ✅ **Notificaciones** - críticas, advertencias, información
- ✅ **Favoritos y carrito** - preferencias de usuario
- ✅ **Localización español** - fechas, textos, formatos mexicanos

## 🔐 Seguridad

- ✅ El script **NO modifica** tu usuario admin existente
- ✅ El script **NO crea** usuarios nuevos de autenticación
- ✅ Los datos usan tu compañía real, no crea compañías falsas
- ⚠️ Los precios son de ejemplo, ajustar según necesidad

## 🐛 Troubleshooting

### Error: "No se encontró ninguna compañía"
- Asegúrate de tener al menos una compañía creada en el sistema
- Verifica con: `SELECT * FROM companies;`

### Error: "No se encontró tu usuario admin"
- Verifica que tu usuario tenga role_v2 = 'admin'
- Consulta con: `SELECT id, email, role_v2 FROM profiles;`

### Error: "duplicate key value"
- Ejecuta primero `limpieza_total.sql` para limpiar datos anteriores
- O verifica que no haya conflictos de SKU

### Error: "relation does not exist"
- Asegúrate de que todas las migraciones estén aplicadas
- Ejecuta las migraciones antes del seed

### Las fechas están incorrectas
- El script usa `NOW() - INTERVAL` para fechas relativas
- Los datos siempre estarán dentro de los últimos 3 meses

## 📞 Soporte

Para problemas o preguntas:
- Revisa los logs en Supabase Dashboard
- Verifica los mensajes de error SQL
- Asegúrate de que las políticas RLS permitan inserts
- Verifica que tienes permisos suficientes

---

**Generado para EnviteRP - Ambiente de pruebas realista en español**

🇲🇽 **Contexto 100% mexicano** | 💰 **Precios en pesos** | 📅 **3 meses de actividad**

Última actualización: 2025-01-07
