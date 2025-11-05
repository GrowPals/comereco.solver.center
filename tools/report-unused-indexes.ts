#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const connectionString = process.env.SUPABASE_DB_REPORT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Define la variable SUPABASE_DB_REPORT_URL (o DATABASE_URL) con la cadena de conexión completa.');
  process.exit(1);
}

const client = new Client({ connectionString });

const query = `
  SELECT schemaname,
         relname,
         indexrelname,
         idx_scan,
         idx_tup_read,
         idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
  ORDER BY schemaname, relname, indexrelname;
`;

(async () => {
  await client.connect();
  const { rows } = await client.query(query);
  await client.end();

  const now = new Date();
  const stamp = now.toISOString().replace(/[:]/g, '-').split('.')[0];
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const reportsDir = path.resolve(__dirname, '..', 'docs', 'reports');

  await fs.mkdir(reportsDir, { recursive: true });

  const filePath = path.join(reportsDir, `unused-indexes-${stamp}.md`);

  const header = `# Reporte de índices sin uso\n\n` +
    `> Generado: ${now.toISOString()}\n\n` +
    `Se listan los índices con \`idx_scan = 0\` desde \\`pg_stat_user_indexes\\`.\n\n`;

  const body = rows.length === 0
    ? '✅ No se encontraron índices sin uso según las estadísticas actuales.\n'
    : rows.map(row => `- **${row.indexrelname}** (${row.schemaname}.${row.relname}) — scans: ${row.idx_scan}, tuplas leídas: ${row.idx_tup_read}, fetch: ${row.idx_tup_fetch}`).join('\n');

  await fs.writeFile(filePath, header + body, 'utf8');
  console.log(`📄 Reporte generado: ${filePath}`);
})();
