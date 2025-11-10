## Arquitectura MCP para Hostinger + n8n + Supabase/BIND

Vamos a trabajar en tres capas. Cada capa expone herramientas MCP distintas pero se alimentan entre sí.

### 1. Capa base: acceso SSH al VPS
- **Cliente MCP**: `hostinger-ssh` (wrapper que vive en `tools/mcp/hostinger-ssh.sh`).
- **Servidor MCP**: [`ssh-mcp`](https://www.npmjs.com/package/ssh-mcp).
- **Variables**: duplica `.env.mcp.hostinger.example` → `.env.mcp.hostinger` y completa `HOSTINGER_VPS_HOST`, `HOSTINGER_VPS_USER`, `HOSTINGER_VPS_SSH_KEY_PATH` o `HOSTINGER_VPS_PASSWORD`. Añade `HOSTINGER_VPS_SUDO_PASSWORD` si necesitas `sudo` (Docker, BIND, reinicios de servicios).
- **Uso**: desde Claude/Cursor pide herramientas del server `hostinger-ssh` (`exec`, `sudo-exec`, `ssh-read-lines`, `ssh-edit-block`, etc.). Esto cubre:
  - Control del demonio `n8n` dentro del contenedor: `sudo docker ps`, `docker compose`, etc.
  - Gestión de BIND (`sudo rndc reload`, edición de `/etc/bind/named.conf.local`, etc.) con cambios atómicos gracias a `ssh-edit-block`.
  - Gestión avanzada (túneles, inspección de logs, mantenimiento del sistema).

### 2. Capa de proveedor: Hostinger API
- **Cliente MCP**: `hostinger-api` apuntando a [`hostinger-api-mcp`](https://github.com/hostinger/api-mcp-server).
- **Credenciales**: genera un token personal en Hostinger y colócalo en `~/.cursor/mcp.json` (`API_TOKEN`). No guardamos el valor en el repo.
- **Capacidades**:
  - Arrancar/detener el VPS, gestionar snapshots, reinstalaciones, backups, etc.
  - Consultar IPs, plantillas, facturación de servicios vinculados.
  - Integrar alertas o workflows (ej. disparar un snapshot antes de desplegar algo vía SSH).

### 3. Capa de aplicación: n8n + Supabase + BIND
- **Cliente MCP**: `n8n-mcp` (paquete [`n8n-mcp`](https://github.com/czlonkowski/n8n-mcp)).
- **Credenciales**: define `N8N_API_URL` (ej. `https://automations.midominio.com`) y `N8N_API_KEY`. El API key lo genera n8n en *Settings → API*.
- **Uso típico**:
  - Listar workflows, activarlos/desactivarlos, disparar ejecuciones y revisar ejecuciones fallidas sin entrar al panel web.
  - Documentación contextual de cada nodo, lo que ayuda a mantener integraciones Supabase/BIND sincronizadas.
  - Combinarlo con la capa SSH para reiniciar el contenedor si la API deja de responder.
- **Supabase**: ya tienes `supabaseLocal` registrado. Úsalo junto con la capa n8n para inspeccionar tu base, regenerar policies o llaves y exponerlas a n8n cuando automatices tareas.
- **BIND**: orquesta los cambios desde n8n (por ejemplo, flujos que escriben nuevos `zone files` en Supabase y luego, vía SSH, actualizan `named.conf`). Mantén las plantillas DNS versionadas en Supabase o en el repo, y deja que n8n genere los cambios.

### Flujo sugerido
1. **Planea** un cambio (ej. agregar dominio en BIND). Verifica el estado del VPS con `hostinger-api` y crea un snapshot antes de tocar nada.
2. **Ejecuta** el cambio dentro del servidor mediante `hostinger-ssh` (`ssh-edit-block` sobre `/etc/bind` → `sudo rndc reload`).
3. **Sincroniza** o automatiza el proceso en n8n (`n8n-mcp`) usando Supabase como fuente de verdad.
4. **Verifica** logs del contenedor n8n o servicios BIND con `hostinger-ssh` y, si algo falla, restaura snapshot con `hostinger-api`.

### Notas de seguridad
- Los secretos viven en `.env.mcp.hostinger` (git-ignored) y en tu config local de Cursor/Claude.
- Usa llaves SSH con passphrase. Puedes apuntar `HOSTINGER_VPS_SSH_KEY_PATH` al archivo desencriptado gestionado por `ssh-agent`.
- Para Hostinger API usa tokens de corta duración cuando sea posible y rota accesos periódicamente.
- Para n8n crea un usuario técnico con permisos mínimos y evita usar el owner global.
