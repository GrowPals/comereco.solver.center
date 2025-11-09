#!/usr/bin/env node

/**
 * Script para ejecutar Lighthouse audit automáticamente
 * Requiere: npm install -g @lhci/cli
 * O usar: npx @lhci/cli autorun
 */

import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const BASE_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:5174';

async function runLighthouseAudit() {
  console.log('🔍 Iniciando Lighthouse audit...');
  console.log(`📍 URL: ${BASE_URL}\n`);

  try {
    // Verificar si lhci está instalado
    try {
      await execa('npx', ['@lhci/cli', '--version'], { cwd: projectRoot });
    } catch {
      console.log('📦 Instalando @lhci/cli...');
      await execa('npm', ['install', '-g', '@lhci/cli'], { cwd: projectRoot });
    }

    // Ejecutar Lighthouse
    console.log('🚀 Ejecutando Lighthouse...\n');
    
    const result = await execa('npx', [
      '@lhci/cli',
      'autorun',
      '--collect.url=' + BASE_URL,
      '--collect.numberOfRuns=1',
      '--upload.target=temporary-public-storage',
      '--output=html',
      '--output-path=./lighthouse-report.html'
    ], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    console.log('\n✅ Lighthouse audit completado');
    console.log('📄 Reporte guardado en: lighthouse-report.html');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando Lighthouse:', error.message);
    console.log('\n💡 Alternativa manual:');
    console.log('   1. Abre Chrome DevTools');
    console.log('   2. Ve a la pestaña "Lighthouse"');
    console.log('   3. Selecciona "PWA" y "Performance"');
    console.log('   4. Haz clic en "Generate report"');
    process.exit(1);
  }
}

runLighthouseAudit();

