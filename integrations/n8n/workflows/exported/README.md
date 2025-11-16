# Exportados n8n (WF-01 → WF-08)

Los siguientes workflows viven actualmente en el servidor n8n (`https://n8n-n8n.jpayvn.easypanel.host`).
Para versionarlos en Git, exporta cada uno con el mismo ID y copia el JSON bruto dentro de esta carpeta usando el nombre indicado.

| Archivo | Workflow ID | Descripción |
|---------|-------------|-------------|
| `WF-01-Restock-Alerts-Monitor.json` | `l0RhJzxd17PClZVY` | Monitorea `restock_alerts_dashboard` y registra alertas / heartbeats. |
| `WF-02-Bind-Catalog-Reset.json` | `P4uq4H6KGNHvs6jY` | Resetea el catálogo completo desde Bind (manual). |
| `WF-03-Bind-Catalog-Sync.json` | `eVPtTUuTuX45mVet` | Cron nocturno para sincronizar catálogo. |
| `WF-04-Integration-Queue-to-BIND.json` | `XyjztQy25NyGFPJC` | Flujo principal que consume `integration_queue` y crea órdenes en Bind. |
| `WF-05-Queue-and-Bind-Monitor.json` | `WcmJUbnXE9Tz1dxs` | KPI/monitor de la cola y errores recientes. |
| `WF-06-Bind-Stock-Sync.json` | `7J2cDFs6deW7aDOz` | Cron nocturno para refrescar inventarios. |
| `WF-07-Bind-Alerts-Notifier.json` | `MIcjSFDy95C3T03D` | Notifica (Slack opcional) cuando hay `log_bind_sync_event` pendientes/error. |
| `WF-08-Bind-Maintenance.json` | `chO10AmKskTrJupr` | Tarea semanal: refresca MVs y purga logs antiguos. |

## Cómo exportar (desde la CLI del repositorio)

a) Con el CLI de Codex (ya autenticado en n8n):
```bash
# Reemplaza WF_ID y archivo destino
codex tools call n8n_get_workflow '{"id":"WF_ID"}' > tmp.json
jq '.' tmp.json > integrations/n8n/workflows/exported/WF-0X-*.json
rm tmp.json
```

b) Con la API pública de n8n:
```bash
curl -s \
  -H "n8n-api-key: <API_KEY>" \
  https://n8n-n8n.jpayvn.easypanel.host/rest/workflows/WF_ID \
  | jq '.' > integrations/n8n/workflows/exported/WF-0X-*.json
```

> Usa siempre los mismos IDs para que `n8n_get_workflow` devuelva la versión correcta. Cada vez que edites un workflow en producción, vuelve a exportarlo y haz commit del JSON.
