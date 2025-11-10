# 🔧 Troubleshooting: Hostinger SSH MCP

## Problema: El MCP `@hostinger-ssh` no está funcionando

### ✅ Verificaciones Básicas

1. **Verificar que el script existe y es ejecutable:**
```bash
ls -la /home/bigez/COMERECO-WEBAPP/tools/mcp/hostinger-ssh.sh
chmod +x /home/bigez/COMERECO-WEBAPP/tools/mcp/hostinger-ssh.sh
```

2. **Verificar que el archivo `.env.mcp.hostinger` existe:**
```bash
ls -la /home/bigez/COMERECO-WEBAPP/.env.mcp.hostinger
```

3. **Verificar que la llave SSH existe y tiene permisos correctos:**
```bash
ls -la /home/bigez/.ssh/mcp-access
chmod 600 /home/bigez/.ssh/mcp-access
```

4. **Probar conexión SSH manualmente:**
```bash
ssh -i /home/bigez/.ssh/mcp-access -o StrictHostKeyChecking=no root@217.21.78.11 "echo 'Test OK'"
```

### 🔍 Diagnóstico

#### Problema 1: Variables de entorno incorrectas

**Síntoma:** El script no encuentra las variables necesarias.

**Solución:** El script lee variables desde `.env.mcp.hostinger`, NO desde las variables de entorno pasadas en `mcp.json`. Asegúrate de que el archivo `.env.mcp.hostinger` tenga:

```bash
HOSTINGER_VPS_HOST=217.21.78.11
HOSTINGER_VPS_USER=root
HOSTINGER_VPS_PORT=22
HOSTINGER_VPS_SSH_KEY_PATH=/home/bigez/.ssh/mcp-access
```

#### Problema 2: El MCP no responde

**Síntoma:** `@hostinger-ssh` no devuelve recursos o comandos.

**Solución:** 
1. **Reiniciar Cursor completamente** (no solo recargar ventana)
2. Verificar que el script se ejecuta correctamente:
```bash
cd /home/bigez/COMERECO-WEBAPP
timeout 3 tools/mcp/hostinger-ssh.sh
```

#### Problema 3: Error de permisos SSH

**Síntoma:** Error "Permission denied" al conectar.

**Solución:**
```bash
chmod 600 /home/bigez/.ssh/mcp-access
ssh-add /home/bigez/.ssh/mcp-access
```

#### Problema 4: El script se cuelga

**Síntoma:** El script no termina y se queda esperando.

**Causa:** El script está diseñado para ejecutarse como servidor MCP que se mantiene corriendo. Esto es normal.

**Solución:** No hay problema, el script debe mantenerse corriendo para que el MCP funcione.

### 🛠️ Configuración Correcta

#### En `~/.cursor/mcp.json`:

```json
{
  "hostinger-ssh": {
    "command": "/home/bigez/COMERECO-WEBAPP/tools/mcp/hostinger-ssh.sh",
    "type": "stdio"
  }
}
```

**Nota:** Las variables de entorno en `mcp.json` NO se usan. El script lee todo desde `.env.mcp.hostinger`.

#### En `.env.mcp.hostinger`:

```bash
HOSTINGER_VPS_HOST=217.21.78.11
HOSTINGER_VPS_USER=root
HOSTINGER_VPS_PORT=22
HOSTINGER_VPS_SSH_KEY_PATH=/home/bigez/.ssh/mcp-access
HOSTINGER_VPS_TIMEOUT=60000
HOSTINGER_VPS_MAX_CHARS=200000
HOSTINGER_VPS_DISABLE_SUDO=false
HOSTINGER_VPS_ALLOW_COMPOUND_COMMANDS=true
HOSTINGER_VPS_EXTRA_FLAGS="--strictHostKeyChecking=no --batchMode"
```

### 📋 Checklist de Verificación

- [ ] Script existe y es ejecutable
- [ ] Archivo `.env.mcp.hostinger` existe y tiene las variables correctas
- [ ] Llave SSH existe y tiene permisos 600
- [ ] Conexión SSH manual funciona
- [ ] Cursor ha sido reiniciado completamente después de cambios en `mcp.json`
- [ ] No hay errores en `tools/mcp/hostinger-ssh.log`

### 🔄 Pasos para Reiniciar el MCP

1. Cerrar Cursor completamente
2. Verificar configuración en `~/.cursor/mcp.json`
3. Verificar archivo `.env.mcp.hostinger`
4. Abrir Cursor nuevamente
5. Probar con `@hostinger-ssh uptime`

### 📝 Logs

Revisar logs del script:
```bash
tail -f /home/bigez/COMERECO-WEBAPP/tools/mcp/hostinger-ssh.log
```

### 🆘 Si Nada Funciona

1. Verificar que `npx ssh-mcp` funciona:
```bash
npx -y ssh-mcp --host=217.21.78.11 --user=root --port=22 --key=/home/bigez/.ssh/mcp-access
```

2. Verificar versión de Node.js:
```bash
node --version  # Debe ser >= 18
```

3. Limpiar cache de npx:
```bash
rm -rf ~/.npm/_npx
```

