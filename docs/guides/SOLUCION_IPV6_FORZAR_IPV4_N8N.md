# 🔧 Solución Definitiva: Forzar IPv4 en n8n con Supabase

## 🐛 Problema Persistente

Aunque cambiaste al puerto 6543 (Transaction Pooler), sigues recibiendo:

```
connect ENETUNREACH 2600:1f16:1cd0:3337:4ab7:9386:ae67:252b:6543 - Local (:::0)
```

**Causa raíz:** El DNS de Supabase solo está resolviendo a IPv6 desde tu ubicación/servidor, y n8n no puede alcanzar IPv6.

---

## ✅ Solución: Usar Dirección IPv4 Directa del Pooler

### Paso 1: Obtener la Dirección IPv4 del Pooler

El Transaction Pooler de Supabase tiene una dirección IPv4 específica. Necesitas obtenerla desde el Dashboard de Supabase.

**Método 1: Desde Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc
2. Ve a **Settings** → **Database**
3. Busca la sección **Connection Pooling**
4. Copia la **Connection String** del Transaction Pooler
5. Extrae la dirección IP del hostname

**Método 2: Usar Connection String Directo**

Supabase proporciona connection strings que incluyen el host correcto. Usa este formato:

```
postgresql://postgres.azjaehrdzdfgrumbqmuc:[PASSWORD]@db.azjaehrdzdfgrumbqmuc.supabase.co:6543/postgres?sslmode=require
```

Pero necesitamos forzar IPv4...

---

## 🔧 Solución: Configurar Docker para Usar Solo IPv4

Si n8n corre en Docker, necesitas configurar el contenedor para que use solo IPv4.

### Opción 1: Modificar docker-compose.yml

Agrega configuración de red para forzar IPv4:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    
    # ... otras configuraciones ...
    
    # Configuración de red para forzar IPv4
    dns:
      - 8.8.8.8  # Google DNS (IPv4)
      - 8.8.4.4
    extra_hosts:
      - "db.azjaehrdzdfgrumbqmuc.supabase.co:YOUR_IPV4_ADDRESS"
    
    # Deshabilitar IPv6 en el contenedor
    sysctls:
      - net.ipv6.conf.all.disable_ipv6=1
      - net.ipv6.conf.default.disable_ipv6=1
    
    networks:
      - n8n_network

networks:
  n8n_network:
    driver: bridge
    enable_ipv6: false  # Deshabilitar IPv6 en la red
```

### Opción 2: Usar Variable de Entorno NODE_OPTIONS

Agrega esta variable de entorno al contenedor n8n:

```yaml
environment:
  # ... otras variables ...
  - NODE_OPTIONS=--dns-result-order=ipv4first
```

Esto fuerza a Node.js (que usa n8n) a preferir IPv4 sobre IPv6.

---

## 🎯 Solución Recomendada: Usar Connection String Completo

En lugar de configurar Host/Port/User/Password por separado, usa el **Connection String** completo en n8n.

### En n8n UI:

1. **Credentials** → **New** → **Postgres**
2. En lugar de llenar campos individuales, busca la opción **"Connection String"** o **"Connection URI"**
3. Usa este formato:

```
postgresql://postgres.azjaehrdzdfgrumbqmuc:[TU_PASSWORD]@db.azjaehrdzdfgrumbqmuc.supabase.co:6543/postgres?sslmode=require
```

**Nota:** Reemplaza `[TU_PASSWORD]` con tu contraseña real de Supabase.

### Si n8n no tiene opción de Connection String:

Algunas versiones de n8n no tienen esta opción. En ese caso:

1. Usa los campos individuales
2. Pero agrega esta configuración adicional si está disponible:
   - **Connection Options:** `?sslmode=require&preferIPv4=true`

---

## 🔍 Verificar Resolución DNS

Antes de aplicar la solución, verifica qué está resolviendo el DNS:

```bash
# Verificar resolución IPv4
dig +short db.azjaehrdzdfgrumbqmuc.supabase.co A

# Verificar resolución IPv6
dig +short db.azjaehrdzdfgrumbqmuc.supabase.co AAAA

# Si solo hay IPv6, necesitas usar una de las soluciones arriba
```

---

## 🛠️ Solución Alternativa: Usar Supabase REST API

Si ninguna solución de conexión directa funciona, puedes usar la **Supabase REST API** en lugar de conexión directa a Postgres:

1. En n8n, usa el nodo **HTTP Request** en lugar de **Postgres**
2. Configura la URL de Supabase REST API:
   ```
   https://azjaehrdzdfgrumbqmuc.supabase.co/rest/v1/
   ```
3. Usa autenticación con API Key (Header: `apikey`)

**Ventajas:**
- No depende de IPv4/IPv6
- Funciona a través de HTTPS
- Más simple de configurar

**Desventajas:**
- No puedes ejecutar SQL directo
- Solo puedes hacer queries REST a las tablas
- Menos flexible que Postgres directo

---

## 📋 Checklist de Solución

- [ ] Verificar resolución DNS (debe tener IPv4)
- [ ] Si solo hay IPv6, aplicar solución de Docker (Opción 1 o 2)
- [ ] Probar conexión con Connection String completo
- [ ] Si nada funciona, considerar usar Supabase REST API
- [ ] Verificar que n8n puede conectarse después de cambios

---

## 🆘 Si Nada Funciona

1. **Verificar desde dónde corre n8n:**
   - ¿Es en Docker local?
   - ¿Es en un servidor remoto?
   - ¿Es n8n Cloud?

2. **Contactar soporte de Supabase:**
   - Explicar el problema de IPv6
   - Pedir dirección IPv4 directa del pooler
   - O solicitar que habiliten IPv4 en el DNS

3. **Considerar alternativa:**
   - Usar Supabase REST API en lugar de conexión directa
   - O usar un proxy/VPN que tenga IPv4

---

**Última actualización:** 2025-01-27

