# 🛠️ n8n - Scripts de Utilidad

Scripts útiles para gestión de n8n.

---

## 📜 Scripts Disponibles

### 1. backup.sh

**Descripción:**
Crea backup completo de n8n (workflows, credenciales, ejecuciones).

**Uso:**
```bash
./scripts/backup.sh
```

**Qué hace:**
1. Copia toda la carpeta `/home/node/.n8n` del container
2. Comprime en `.tar.gz`
3. Guarda en `backups/n8n_backup_YYYYMMDD_HHMMSS.tar.gz`
4. Limpia backups antiguos (mantiene últimos 7)

**Restaurar backup:**
```bash
# Descomprimir
cd backups
tar -xzf n8n_backup_20251102_103000.tar.gz

# Copiar al container
docker cp n8n_backup_20251102_103000 n8n:/home/node/.n8n

# Reiniciar n8n
docker restart n8n
```

**Frecuencia recomendada:**
- Desarrollo: Semanal
- Producción: Diario (automatizar con cron)

---

### 2. export-workflows.sh

**Descripción:**
Exporta todos los workflows de n8n a archivos JSON.

**Uso:**
```bash
./scripts/export-workflows.sh
```

**Qué hace:**
1. Busca workflows en `/home/node/.n8n/*.json`
2. Copia a carpeta local `workflows/`
3. Muestra lista de workflows exportados

**Cuándo usar:**
- Después de crear/modificar workflows en n8n UI
- Antes de hacer commit al repositorio
- Para compartir workflows con el equipo

**Nota:** Renombra los archivos a nombres descriptivos:
```bash
cd workflows
mv My_Workflow.json bind-create-order.json
```

---

### 3. import-workflows.sh

**Descripción:**
Importa workflows desde carpeta local a n8n.

**Uso:**
```bash
./scripts/import-workflows.sh
```

**Qué hace:**
1. Copia workflows de `workflows/` al container
2. Reinicia n8n
3. Workflows aparecen automáticamente en n8n UI

**Cuándo usar:**
- Al configurar n8n por primera vez
- Después de clonar el repositorio
- Para restaurar workflows desde backup

**Nota:** Después de importar, debes:
1. Configurar credenciales en cada workflow
2. Activar workflows manualmente

---

## 🤖 Automatización

### Backup Automático Diario

```bash
# Agregar a crontab
crontab -e

# Agregar línea:
0 2 * * * cd /path/to/integrations/n8n && ./scripts/backup.sh >> logs/backup.log 2>&1
```

### Health Check Automático

```bash
# Verificar n8n cada 5 minutos
*/5 * * * * curl -f http://localhost:5678/healthz || docker restart n8n
```

---

## 🐛 Troubleshooting

### Error: "Container n8n no está corriendo"

```bash
# Iniciar n8n
cd integrations/n8n
docker-compose up -d

# Verificar
docker ps | grep n8n
```

### Error: "Permission denied"

```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh
```

### Error al importar workflows

```bash
# Verificar que archivos existen
ls -la workflows/*.json

# Verificar que son archivos válidos JSON
cat workflows/bind-create-order.json | jq .

# Si no tienes jq:
apt-get install jq  # Debian/Ubuntu
brew install jq      # macOS
```

---

## 📚 Referencias

- [Docker CP Command](https://docs.docker.com/engine/reference/commandline/cp/)
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [Cron Guide](https://crontab.guru/)

---

**Última actualización:** 2025-11-02
