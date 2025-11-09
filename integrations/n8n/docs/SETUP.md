# 🚀 Setup de n8n para Automatización de Inventario - Guía Completa

**Tiempo estimado:** 30-45 minutos
**Última actualización:** 2025-11-05
**Enfoque:** Sistema de monitoreo y reabastecimiento automático de inventario

---

## 🎯 ¿Qué vamos a automatizar?

Con el sistema de **Inventory Restock Monitoring** que acabamos de implementar en Supabase, n8n va a:

1. **Monitorear productos con stock bajo** (cada hora o en tiempo real)
2. **Enviar alertas** cuando el stock cae bajo el mínimo
3. **Crear órdenes de compra automáticamente** en BIND ERP
4. **Sincronizar requisiciones** aprobadas con BIND
5. **Registrar logs** de todas las operaciones

### El Flujo Completo

```
1. Supabase → check_products_below_min_stock()
   ↓ (encuentra productos bajo mínimo)

2. n8n → Detecta alertas
   ↓

3. n8n → Envía notificaciones (Email/Slack/WhatsApp)
   ↓

4. n8n → Crea orden de compra en BIND ERP
   ↓

5. n8n → Log en inventory_restock_rule_logs
   ↓

6. Dashboard actualizado en tiempo real
```

---

## 🧩 Componentes del Sistema

### 1. **Supabase (Base de Datos)**
- **Qué es:** Tu base de datos PostgreSQL con funciones personalizadas
- **Rol:** Almacena productos, reglas de restock, y detecta stock bajo
- **Funciones clave:**
  - `check_products_below_min_stock()` - Detecta productos que necesitan reorden
  - `log_restock_rule_trigger()` - Registra cada evento
  - Vista `restock_alerts_dashboard` - Dashboard con niveles de alerta

### 2. **n8n (Orquestador de Automatizaciones)**
- **Qué es:** Herramienta de automatización tipo Zapier/Make pero open-source
- **Rol:** Conecta Supabase con BIND, envía notificaciones, ejecuta lógica
- **Por qué n8n:**
  - ✅ Visual (drag & drop de nodos)
  - ✅ Self-hosted (no depende de servicios externos)
  - ✅ Triggers basados en tiempo (cron) o eventos (webhooks)
  - ✅ Conexión directa a Postgres/Supabase
  - ✅ Puede llamar APIs REST (BIND ERP)

### 3. **Docker (Contenedor para n8n)**
- **Qué es:** Plataforma para correr aplicaciones en contenedores aislados
- **Rol:** Ejecuta n8n de forma consistente en cualquier servidor
- **Por qué Docker:**
  - ✅ Instalación en 1 comando
  - ✅ Mismo comportamiento en desarrollo y producción
  - ✅ Fácil de actualizar y hacer backup
  - ✅ No contamina tu sistema con dependencias

### 4. **BIND ERP (Sistema Externo)**
- **Qué es:** Tu sistema ERP para gestión de compras/inventario
- **Rol:** Recibe órdenes de compra desde n8n
- **Integración:** n8n usa la API REST de BIND para crear órdenes

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

### En tu Servidor/Máquina de Producción
- [ ] **Docker y Docker Compose** instalados
  - Verificar: `docker --version` y `docker-compose --version`
  - Si no: [Instalar Docker](https://docs.docker.com/engine/install/)

- [ ] **Puerto 5678 disponible** (para n8n UI)
  - Verificar: `sudo lsof -i :5678` (debe estar vacío)

### Credenciales que Necesitas
- [ ] **Supabase Database Password**
  - Obtener de: Dashboard Supabase → Settings → Database
  - O del archivo `.env.supabase` (si ya lo configuraste)

- [ ] **BIND ERP API Token**
  - Obtener de: Dashboard BIND → Settings → API Keys
  - Formato: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- [ ] **Email SMTP Credentials** (opcional, para alertas)
  - Gmail, SendGrid, o cualquier SMTP

---

## 🎯 Opción 1: Docker en Servidor (Producción - RECOMENDADO)

### ¿Por qué Docker para Producción?

Docker nos permite:
- **Consistencia:** El mismo ambiente en desarrollo, staging y producción
- **Aislamiento:** n8n corre aislado sin afectar otros servicios
- **Persistencia:** Los workflows y credenciales se guardan en volúmenes
- **Fácil deployment:** Un solo comando para desplegar
- **Auto-restart:** Si n8n crashea, Docker lo reinicia automáticamente

### Paso 1: Preparar el Servidor

```bash
# 1. Conectar al servidor de producción
ssh user@tu-servidor.com

# 2. Crear directorio para n8n
mkdir -p ~/n8n-production
cd ~/n8n-production

# 3. Verificar Docker
docker --version
docker-compose --version

# Si no están instalados:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout y login de nuevo
```

### Paso 2: Crear docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-production
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=${WEBHOOK_URL}
      - GENERIC_TIMEZONE=America/Mexico_City
      - TZ=America/Mexico_City

      # Supabase Connection
      - SUPABASE_DB_HOST=${SUPABASE_DB_HOST}
      - SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}
      - SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF}

      # BIND ERP
      - BIND_API_URL=${BIND_API_URL}
      - BIND_API_TOKEN=${BIND_API_TOKEN}

      # Email (opcional)
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}

    volumes:
      - n8n_data:/home/node/.n8n
      - ./backup:/backup
    networks:
      - n8n-network

volumes:
  n8n_data:
    driver: local

networks:
  n8n-network:
    driver: bridge
EOF
```

### Paso 3: Configurar Variables de Entorno

```bash
cat > .env << 'EOF'
# ========================================
# n8n Configuration
# ========================================
N8N_PASSWORD=TuPasswordSeguro2025!
N8N_HOST=n8n.tu-dominio.com
WEBHOOK_URL=https://n8n.tu-dominio.com/

# ========================================
# Supabase Database
# ========================================
SUPABASE_DB_HOST=db.azjaehrdzdfgrumbqmuc.supabase.co
SUPABASE_DB_PASSWORD=<SUPABASE_DB_PASSWORD>
SUPABASE_PROJECT_REF=azjaehrdzdfgrumbqmuc

# ========================================
# BIND ERP API
# ========================================
BIND_API_URL=https://api.bind-erp.com
BIND_API_TOKEN=Bearer tu-token-aqui

# ========================================
# Email Notifications (Opcional)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password

EOF

# ⚠️ IMPORTANTE: Editar con tus valores reales
nano .env
```

### Paso 4: Iniciar n8n

```bash
# Iniciar n8n en background
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Esperar a ver:
# "Editor is now accessible via: http://localhost:5678"
# Presiona Ctrl+C para salir de logs
```

### Paso 5: Verificar Instalación

```bash
# 1. Verificar que está corriendo
docker ps

# Debería mostrar:
# CONTAINER ID   IMAGE              STATUS          PORTS
# abc123...      n8nio/n8n:latest   Up 30 seconds   0.0.0.0:5678->5678/tcp

# 2. Health check
curl http://localhost:5678/healthz

# Debería retornar: {"status":"ok"}

# 3. Ver versión
docker exec -it n8n-production n8n --version
```

### Paso 6: Acceder a n8n UI

```bash
# Opción A: Si estás en el servidor
# Abrir túnel SSH desde tu máquina local:
ssh -L 5678:localhost:5678 user@tu-servidor.com

# Luego abrir en tu navegador local:
# http://localhost:5678

# Opción B: Configurar dominio (recomendado para producción)
# Ver sección "Configurar Dominio con HTTPS" más abajo
```

**Credenciales de acceso:**
- Usuario: `admin`
- Password: El que pusiste en `N8N_PASSWORD` del `.env`

---

## 🎯 Opción 2: n8n Cloud (Más Fácil pero con Limitaciones)

### Ventajas
- ✅ Sin instalar nada
- ✅ Backup automático
- ✅ Actualizaciones automáticas
- ✅ HTTPS incluido
- ✅ Plan gratuito: 5000 ejecuciones/mes

### Desventajas
- ❌ Latencia ligeramente mayor
- ❌ No puede acceder a `localhost` (Supabase debe ser público)
- ❌ Límite de ejecuciones en plan gratuito
- ❌ Menos control sobre la infraestructura

### Pasos

1. **Crear cuenta:** https://n8n.cloud
2. **Verificar email**
3. **Importar workflows** (ver sección más abajo)
4. **Configurar credenciales** (mismos pasos que Docker)

**Recomendación:** Usa n8n Cloud solo para pruebas o si tu Supabase ya es público.
Para producción con Supabase privado, usa Docker.

---

## 🔑 Configurar Credenciales en n8n

Una vez que n8n esté corriendo, configura las credenciales:

### Credencial 1: Supabase PostgreSQL

1. En n8n UI: **Credentials** → **+ Add Credential** → Buscar **"Postgres"**

2. Llenar formulario:

```yaml
Credential Name: Supabase Production DB
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres.azjaehrdzdfgrumbqmuc
Password: <tu password de Supabase>
Port: 5432
SSL: Require  # ← IMPORTANTE para Supabase
```

3. Click **Test Connection**
   - ✅ "Connection successful" → Excelente
   - ❌ Error → Ver troubleshooting abajo

4. **Save**

### Credencial 2: BIND ERP API

1. En n8n UI: **Credentials** → **+ Add Credential** → Buscar **"Header Auth"**

2. Llenar formulario:

```yaml
Credential Name: BIND ERP API Token
Header Name: Authorization
Header Value: Bearer <tu-token-de-bind>
```

**IMPORTANTE:** Incluir "Bearer " antes del token

3. **Save**

### Credencial 3: Email SMTP (Opcional)

1. **Credentials** → **+ Add Credential** → Buscar **"SMTP"**

2. Ejemplo con Gmail:

```yaml
Credential Name: Gmail Alerts
User: tu-email@gmail.com
Password: <app password de Gmail>
Host: smtp.gmail.com
Port: 587
Security: STARTTLS
```

3. **Save**

---

## 📦 Crear Workflows de Inventario

Ahora vamos a crear los workflows que automatizan el monitoreo de inventario.

### Workflow 1: Daily Stock Check (Revisión Diaria)

**Propósito:** Revisa productos bajo stock mínimo y envía alertas

**Cómo crearlo:**

1. En n8n: **Workflows** → **+ Add Workflow**
2. Nombre: `Daily Inventory Stock Check`
3. Agregar nodos:

#### Nodo 1: Schedule Trigger
```yaml
Type: Schedule Trigger
Trigger Interval: Every Day
Time: 08:00 AM (hora de México)
```

#### Nodo 2: Postgres (Check Low Stock)
```yaml
Type: Postgres
Credential: Supabase Production DB
Operation: Execute Query
Query:
  SELECT * FROM check_products_below_min_stock();
```

Esto ejecuta la función SQL que creamos y retorna productos bajo mínimo.

#### Nodo 3: IF (¿Hay productos bajo stock?)
```yaml
Type: IF
Condition: {{ $json.product_id }} is not empty
```

#### Nodo 4A: Email Alert (Si hay productos)
```yaml
Type: Send Email
Credential: Gmail Alerts
To: inventory@tu-empresa.com
Subject: 🚨 {{ $items().length }} productos bajo stock mínimo
Body:
  Productos que necesitan reorden:

  {% for item in $items() %}
  - {{ item.product_name }} (SKU: {{ item.product_sku }})
    Stock actual: {{ item.current_stock }}
    Mínimo: {{ item.min_stock }}
    Déficit: {{ item.stock_deficit }} unidades
    Reordenar: {{ item.reorder_quantity }} unidades
    Proveedor preferido: {{ item.preferred_vendor }}
  {% endfor %}

  Ver dashboard: https://tu-app.vercel.app/inventory/alerts
```

#### Nodo 5: Log Trigger (Registrar evento)
```yaml
Type: Postgres
Credential: Supabase Production DB
Operation: Execute Query
Query:
  SELECT log_restock_rule_trigger(
    '{{ $json.rule_id }}'::uuid,
    '{{ $json.product_id }}'::uuid,
    {{ $json.project_id ? "'" + $json.project_id + "'::uuid" : "NULL" }},
    {{ $json.current_stock }},
    'triggered',
    '{"source": "n8n_daily_check", "alert_sent": true}'::jsonb
  );
```

4. **Save Workflow**
5. **Activate** (toggle switch arriba a la derecha)

---

### Workflow 2: Real-Time Critical Alerts

**Propósito:** Detecta stock crítico (0 unidades) y alerta inmediatamente

#### Nodo 1: Schedule Trigger
```yaml
Trigger Interval: Every 15 minutes
```

#### Nodo 2: Query Critical Stock
```yaml
Query:
  SELECT * FROM restock_alerts_dashboard
  WHERE alert_level = 'CRITICAL'
  AND last_trigger_date < NOW() - INTERVAL '1 hour';
```

Esto evita alertas duplicadas (solo si no hubo alerta en la última hora).

#### Nodo 3: IF (¿Hay críticos?)
```yaml
Condition: {{ $items().length }} > 0
```

#### Nodo 4: Multiple Alerts (Slack + Email + WhatsApp)

**Slack:**
```yaml
Type: Slack
Message: 🚨 CRÍTICO: {{ $json.product_name }} sin stock
```

**Email:**
```yaml
Type: Send Email
Subject: 🆘 CRÍTICO: Stock agotado
Priority: High
```

**WhatsApp (vía Twilio o similar):**
```yaml
Type: HTTP Request
URL: https://api.whatsapp.com/send
Method: POST
Body: {...}
```

---

### Workflow 3: Auto Create Purchase Orders

**Propósito:** Crea órdenes de compra automáticamente en BIND cuando stock < 50% del mínimo

#### Nodo 1: Schedule Trigger
```yaml
Every 1 hour
```

#### Nodo 2: Query High Priority
```yaml
Query:
  SELECT * FROM restock_alerts_dashboard
  WHERE alert_level IN ('CRITICAL', 'HIGH')
  AND triggers_last_30_days < 5  -- No crear si ya se crearon muchas
  ORDER BY stock_deficit DESC
  LIMIT 20;
```

#### Nodo 3: Loop Over Products
```yaml
Type: Loop Over Items
```

#### Nodo 4: Create BIND Order
```yaml
Type: HTTP Request
Credential: BIND ERP API Token
Method: POST
URL: {{ $env.BIND_API_URL }}/api/v1/purchase-orders
Headers:
  Content-Type: application/json
Body:
  {
    "client_id": "{{ $json.company_id }}",
    "items": [
      {
        "product_id": "{{ $json.product_sku }}",
        "quantity": {{ $json.reorder_quantity }},
        "unit_price": 0,  // BIND calcula precio
        "notes": "Reorden automático - Stock crítico"
      }
    ],
    "vendor": "{{ $json.preferred_vendor }}",
    "warehouse": "{{ $json.preferred_warehouse }}",
    "notes": "Orden creada automáticamente por n8n - Stock deficit: {{ $json.stock_deficit }}"
  }
```

#### Nodo 5: Log Success
```sql
SELECT log_restock_rule_trigger(
  '{{ $json.rule_id }}'::uuid,
  '{{ $json.product_id }}'::uuid,
  {{ $json.project_id }},
  {{ $json.current_stock }},
  'auto_order_created',
  json_build_object(
    'source', 'n8n_auto_purchase',
    'bind_order_id', '{{ $response.order_id }}',
    'quantity_ordered', {{ $json.reorder_quantity }}
  )::jsonb
);
```

---

## ✅ Testing y Verificación

### Test 1: Verificar Conexión a Supabase

En n8n, crea workflow temporal de test:

1. **Schedule Trigger Manual**
2. **Postgres Node:**
```sql
SELECT NOW() as current_time,
       current_database() as db_name,
       current_user;
```
3. **Execute Workflow**
4. Verifica output:
```json
{
  "current_time": "2025-11-05T14:30:00Z",
  "db_name": "postgres",
  "current_user": "postgres"
}
```

### Test 2: Probar Función de Stock Bajo

```sql
-- En nodo Postgres
SELECT * FROM check_products_below_min_stock();
```

Si retorna 0 filas → No hay productos bajo mínimo (perfecto!)
Si retorna filas → Esos productos necesitan reorden

### Test 3: Ver Dashboard de Alertas

```sql
SELECT
  product_name,
  alert_level,
  current_stock,
  min_stock,
  stock_deficit
FROM restock_alerts_dashboard
ORDER BY
  CASE alert_level
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    ELSE 4
  END;
```

### Test 4: Simular Stock Bajo

Para probar los workflows sin esperar a que realmente baje el stock:

```sql
-- 1. Crear regla de restock temporal
INSERT INTO inventory_restock_rules (
  company_id,
  product_id,
  min_stock,
  reorder_quantity,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  100,  -- Mínimo alto para forzar alerta
  50,
  'active'
);

-- 2. Esperar 1 minuto

-- 3. Ejecutar workflow manualmente en n8n

-- 4. Verificar que llegó email/alerta

-- 5. Limpiar regla de prueba
DELETE FROM inventory_restock_rules
WHERE notes LIKE '%test%';
```

---

## 🌐 Configurar Dominio con HTTPS (Producción)

Para acceder a n8n desde cualquier lugar con HTTPS:

### Opción A: Usar Nginx como Reverse Proxy

```bash
# 1. Instalar Nginx
sudo apt install nginx certbot python3-certbot-nginx

# 2. Crear config de Nginx
sudo nano /etc/nginx/sites-available/n8n

# Contenido:
server {
    listen 80;
    server_name n8n.tu-dominio.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Habilitar sitio
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Obtener certificado SSL (HTTPS)
sudo certbot --nginx -d n8n.tu-dominio.com

# 5. Renovación automática
sudo certbot renew --dry-run
```

### Opción B: Usar Cloudflare Tunnel (Más Fácil)

```bash
# 1. Instalar cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 2. Login
cloudflared tunnel login

# 3. Crear tunnel
cloudflared tunnel create n8n-prod

# 4. Configurar DNS
cloudflared tunnel route dns n8n-prod n8n.tu-dominio.com

# 5. Crear config
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: n8n.tu-dominio.com
    service: http://localhost:5678
  - service: http_status:404
EOF

# 6. Iniciar tunnel
cloudflared tunnel run n8n-prod
```

---

## 🐛 Troubleshooting

### Problema 1: "Connection Refused" al conectar a Supabase

**Causa:** IP del servidor no está whitelisted en Supabase

**Solución:**
```bash
# 1. Obtener IP pública del servidor
curl ifconfig.me

# 2. Ir a Supabase Dashboard:
# Settings → Database → Connection Pooling → Network Restrictions
# → Add Allowed IP: <tu-ip-del-servidor>

# 3. También agregar 0.0.0.0/0 temporalmente para testear
# (remover después por seguridad)
```

### Problema 2: n8n no guarda workflows

**Causa:** Volumen no montado correctamente

**Solución:**
```bash
docker-compose down
docker volume ls  # Ver volúmenes
docker volume inspect n8n-production_n8n_data  # Ver mountpoint
docker-compose up -d
```

### Problema 3: Workflow no ejecuta

**Verificar:**
- [ ] Workflow está **Activated** (toggle verde)
- [ ] Schedule Trigger tiene cron correcto
- [ ] No hay errores en nodos (íconos rojos)
- [ ] Ir a **Executions** tab para ver logs

### Problema 4: Error en función SQL

```sql
-- Test manual en Supabase SQL Editor
SELECT * FROM check_products_below_min_stock();

-- Si falla, verificar migración aplicada:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version = '20251106060000';

-- Debería retornar 1 fila
```

---

## 🔧 Comandos Útiles

```bash
# Ver logs de n8n
docker logs -f n8n-production

# Reiniciar n8n
docker restart n8n-production

# Backup de workflows
docker exec n8n-production tar -czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz /home/node/.n8n

# Copiar backup a host
docker cp n8n-production:/backup/n8n-backup-20251105.tar.gz ./

# Restaurar backup
docker cp ./n8n-backup-20251105.tar.gz n8n-production:/tmp/
docker exec n8n-production tar -xzf /tmp/n8n-backup-20251105.tar.gz -C /

# Ver uso de recursos
docker stats n8n-production

# Actualizar n8n a última versión
docker-compose pull
docker-compose up -d
```

---

## 📊 Monitoreo en Producción

### Health Check Automático

```bash
# Agregar a crontab
crontab -e

# Agregar esta línea:
*/5 * * * * curl -f http://localhost:5678/healthz || docker restart n8n-production
```

### Alertas de n8n Down

Usar servicio como UptimeRobot o crear workflow de auto-monitoreo:

```yaml
Schedule: Every 5 minutes
Check: curl http://localhost:5678/healthz
If Failed: Send urgent alert to Slack/Email/Phone
```

---

## 🚀 Próximos Pasos

1. ✅ n8n instalado en producción
2. ✅ Credenciales de Supabase configuradas
3. ✅ Workflows de inventario creados
4. → **Probar con datos reales**
5. → Configurar alertas de WhatsApp/Slack
6. → Dashboard de métricas en Grafana (opcional)
7. → Implementar workflow de sincronización con BIND

---

## 📚 Referencias

- [n8n Docker Docs](https://docs.n8n.io/hosting/installation/docker/)
- [Supabase Connection Guide](../../../docs/SUPABASE_CONNECTION_GUIDE.md)
- [Inventory Monitoring Docs](../../../docs/INVENTORY_RESTOCK_MONITORING.md)
- [Database Functions Reference](../../../docs/DATABASE_FUNCTIONS.md)

---

## ✍️ Notas de Implementación

**Setup completado por:** _______________________
**Fecha:** _______________________
**Servidor:** _______________________
**Dominio n8n:** _______________________

**Workflows activos:**
- [ ] Daily Stock Check
- [ ] Real-Time Critical Alerts
- [ ] Auto Purchase Orders
- [ ] BIND Requisition Sync

**Próxima revisión:** _______________________
