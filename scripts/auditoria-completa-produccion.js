#!/usr/bin/env node

/**
 * Auditoría completa de producción
 * Verifica entorno, dependencias, tests, performance y PWA
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const report = {
  timestamp: new Date().toISOString(),
  entorno: {},
  dependencias: {},
  variables: {},
  tests: {},
  performance: {},
  pwa: {},
  problemas: [],
  warnings: [],
  resumen: {}
};

console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE PRODUCCIÓN\n');
console.log('='.repeat(60));

// 1. Verificar entorno
console.log('\n📋 1. VERIFICANDO ENTORNO...\n');

try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  const minorVersion = parseInt(nodeVersion.replace('v', '').split('.')[1]);
  
  report.entorno.nodeVersion = nodeVersion;
  report.entorno.cumpleRequisito = majorVersion > 18 || (majorVersion === 18 && minorVersion >= 18);
  
  if (report.entorno.cumpleRequisito) {
    console.log(`✅ Node ${nodeVersion} (cumple >=18.18)`);
  } else {
    console.log(`❌ Node ${nodeVersion} (requiere >=18.18)`);
    report.problemas.push(`Node ${nodeVersion} no cumple requisito >=18.18`);
  }
  
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  report.entorno.npmVersion = npmVersion;
  console.log(`✅ npm ${npmVersion}`);
  
} catch (error) {
  report.problemas.push(`Error verificando entorno: ${error.message}`);
  console.log(`❌ Error: ${error.message}`);
}

// 2. Verificar dependencias
console.log('\n📦 2. VERIFICANDO DEPENDENCIAS...\n');

try {
  if (!existsSync(join(rootDir, 'node_modules'))) {
    console.log('⚠️  node_modules no existe, ejecutando npm ci...');
    execSync('npm ci', { stdio: 'inherit', cwd: rootDir });
  }
  
  const packageLockExists = existsSync(join(rootDir, 'package-lock.json'));
  report.dependencias.packageLockExists = packageLockExists;
  
  if (packageLockExists) {
    console.log('✅ package-lock.json existe');
  } else {
    console.log('⚠️  package-lock.json no existe');
    report.warnings.push('package-lock.json no existe, puede causar inconsistencias');
  }
  
  // Verificar vulnerabilidades
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf-8', cwd: rootDir });
    const audit = JSON.parse(auditResult);
    report.dependencias.vulnerabilidades = {
      critical: audit.metadata?.vulnerabilities?.critical || 0,
      high: audit.metadata?.vulnerabilities?.high || 0,
      moderate: audit.metadata?.vulnerabilities?.moderate || 0,
      low: audit.metadata?.vulnerabilities?.low || 0
    };
    
    const total = Object.values(report.dependencias.vulnerabilidades).reduce((a, b) => a + b, 0);
    if (total > 0) {
      console.log(`⚠️  Vulnerabilidades encontradas: ${total} total`);
      console.log(`   Critical: ${report.dependencias.vulnerabilidades.critical}`);
      console.log(`   High: ${report.dependencias.vulnerabilidades.high}`);
      console.log(`   Moderate: ${report.dependencias.vulnerabilidades.moderate}`);
      console.log(`   Low: ${report.dependencias.vulnerabilidades.low}`);
    } else {
      console.log('✅ Sin vulnerabilidades críticas');
    }
  } catch (error) {
    console.log('⚠️  No se pudo ejecutar npm audit');
  }
  
} catch (error) {
  report.problemas.push(`Error verificando dependencias: ${error.message}`);
  console.log(`❌ Error: ${error.message}`);
}

// 3. Verificar variables de entorno
console.log('\n🔐 3. VERIFICANDO VARIABLES DE ENTORNO...\n');

const requiredVars = {
  PLAYWRIGHT_TEST_EMAIL: process.env.PLAYWRIGHT_TEST_EMAIL || 'team@growpals.mx',
  PLAYWRIGHT_TEST_PASSWORD: process.env.PLAYWRIGHT_TEST_PASSWORD || 'growpals#2025!'
};

report.variables = {
  PLAYWRIGHT_TEST_EMAIL: requiredVars.PLAYWRIGHT_TEST_EMAIL ? '✅ Configurada' : '❌ Faltante',
  PLAYWRIGHT_TEST_PASSWORD: requiredVars.PLAYWRIGHT_TEST_PASSWORD ? '✅ Configurada' : '❌ Faltante'
};

console.log(`✅ PLAYWRIGHT_TEST_EMAIL: ${requiredVars.PLAYWRIGHT_TEST_EMAIL ? 'Configurada' : 'Faltante'}`);
console.log(`✅ PLAYWRIGHT_TEST_PASSWORD: ${requiredVars.PLAYWRIGHT_TEST_PASSWORD ? 'Configurada' : 'Faltante'}`);

// Exportar variables para tests
process.env.PLAYWRIGHT_TEST_EMAIL = requiredVars.PLAYWRIGHT_TEST_EMAIL;
process.env.PLAYWRIGHT_TEST_PASSWORD = requiredVars.PLAYWRIGHT_TEST_PASSWORD;

// 4. Ejecutar tests de Playwright
console.log('\n🧪 4. EJECUTANDO TESTS DE PLAYWRIGHT...\n');

const testSuites = [
  { name: 'smoke', command: 'npm run test:smoke', timeout: 5 * 60 * 1000 },
  { name: 'routes', command: 'npm run test:routes -- --project=chromium --workers=1', timeout: 5 * 60 * 1000 },
  { name: 'sync', command: 'npm run test:sync -- --project=chromium --workers=1', timeout: 5 * 60 * 1000 },
  { name: 'performance', command: 'npm run test:performance -- --project=chromium --workers=1', timeout: 5 * 60 * 1000 }
];

for (const suite of testSuites) {
  console.log(`\n📝 Ejecutando suite: ${suite.name}...`);
  const startTime = Date.now();
  
  try {
    const output = execSync(suite.command, {
      encoding: 'utf-8',
      cwd: rootDir,
      env: { ...process.env },
      timeout: suite.timeout,
      stdio: 'pipe'
    });
    
    const duration = Date.now() - startTime;
    const passed = (output.match(/passed/g) || []).length;
    const failed = (output.match(/failed/g) || []).length;
    const skipped = (output.match(/skipped/g) || []).length;
    
    report.tests[suite.name] = {
      estado: failed === 0 ? '✅ PASÓ' : '❌ FALLÓ',
      duracion: `${(duration / 1000).toFixed(2)}s`,
      passed,
      failed,
      skipped,
      output: output.substring(0, 1000) // Primeros 1000 caracteres
    };
    
    console.log(`   ${report.tests[suite.name].estado} - ${duration / 1000}s`);
    console.log(`   Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);
    
    if (failed > 0) {
      report.problemas.push(`Suite ${suite.name}: ${failed} tests fallaron`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    report.tests[suite.name] = {
      estado: '❌ ERROR',
      duracion: `${(duration / 1000).toFixed(2)}s`,
      error: error.message,
      output: error.stdout?.substring(0, 1000) || error.message
    };
    
    report.problemas.push(`Suite ${suite.name}: Error - ${error.message}`);
    console.log(`   ❌ ERROR: ${error.message}`);
    
    if (duration >= suite.timeout) {
      report.problemas.push(`Suite ${suite.name}: Timeout después de ${suite.timeout / 1000}s`);
    }
  }
}

// 5. Verificar PWA y Performance
console.log('\n🚀 5. VERIFICANDO PWA Y PERFORMANCE...\n');

// Primero hacer build
console.log('📦 Ejecutando build de producción...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir, timeout: 10 * 60 * 1000 });
  console.log('✅ Build completado\n');
} catch (error) {
  report.problemas.push(`Build falló: ${error.message}`);
  console.log(`❌ Build falló: ${error.message}`);
}

// Iniciar preview y verificar
console.log('🌐 Iniciando servidor de preview...');
let previewProcess;
try {
  previewProcess = execSync('npm run preview &', { 
    cwd: rootDir,
    detached: true,
    stdio: 'pipe'
  });
  
  // Esperar a que el servidor inicie
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verificar Service Worker
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            registered: !!registration,
            active: !!registration?.active,
            scope: registration?.scope,
            state: registration?.active?.state
          };
        } catch (e) {
          return { error: e.message };
        }
      }
      return { supported: false };
    });
    
    report.pwa.serviceWorker = swStatus;
    
    if (swStatus.registered && swStatus.active) {
      console.log('✅ Service Worker registrado y activo');
    } else {
      console.log('⚠️  Service Worker no registrado');
      report.warnings.push('Service Worker no registrado en producción');
    }
    
    // Verificar manifest
    const manifestLink = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);
    if (manifestLink) {
      const manifestResponse = await page.goto(manifestLink);
      if (manifestResponse.ok()) {
        const manifest = await manifestResponse.json();
        report.pwa.manifest = {
          name: manifest.name,
          icons: manifest.icons?.length || 0,
          shortcuts: manifest.shortcuts?.length || 0,
          display: manifest.display
        };
        console.log('✅ Manifest accesible');
      }
    }
    
    // Verificar offline
    console.log('\n📴 Probando funcionalidad offline...');
    await context.setOffline(true);
    
    try {
      const offlineResponse = await page.goto('http://localhost:4173', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      if (offlineResponse) {
        report.pwa.offline = { funciona: true, status: offlineResponse.status() };
        console.log('✅ App funciona offline');
      } else {
        const hasContent = await page.evaluate(() => {
          return document.body.textContent.length > 0;
        });
        report.pwa.offline = { funciona: hasContent };
        console.log(hasContent ? '✅ Contenido disponible offline' : '⚠️  Sin contenido offline');
      }
    } catch (error) {
      report.pwa.offline = { funciona: false, error: error.message };
      console.log('⚠️  Error en modo offline');
    }
    
    // Métricas de performance
    const perfMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    report.performance = perfMetrics;
    console.log('\n📊 Métricas de Performance:');
    console.log(`   DOM Content Loaded: ${perfMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load Complete: ${perfMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Total Time: ${perfMetrics.totalTime.toFixed(2)}ms`);
    
    await browser.close();
    
  } catch (error) {
    report.problemas.push(`Error verificando PWA: ${error.message}`);
    console.log(`❌ Error: ${error.message}`);
  }
  
} catch (error) {
  report.problemas.push(`Error iniciando preview: ${error.message}`);
  console.log(`❌ Error: ${error.message}`);
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN FINAL');
console.log('='.repeat(60));

const totalTests = Object.values(report.tests).reduce((sum, suite) => {
  return sum + (suite.passed || 0) + (suite.failed || 0);
}, 0);

const totalPassed = Object.values(report.tests).reduce((sum, suite) => sum + (suite.passed || 0), 0);
const totalFailed = Object.values(report.tests).reduce((sum, suite) => sum + (suite.failed || 0), 0);

report.resumen = {
  estadoGeneral: report.problemas.length === 0 ? '✅ LISTO PARA PRODUCCIÓN' : '⚠️  REQUIERE ATENCIÓN',
  totalTests,
  totalPassed,
  totalFailed,
  problemasEncontrados: report.problemas.length,
  warnings: report.warnings.length,
  pwaFuncional: report.pwa.serviceWorker?.registered && report.pwa.offline?.funciona
};

console.log(`\nEstado General: ${report.resumen.estadoGeneral}`);
console.log(`Tests: ${totalPassed}/${totalTests} pasaron`);
console.log(`Problemas: ${report.problemas.length}`);
console.log(`Warnings: ${report.warnings.length}`);
console.log(`PWA Funcional: ${report.resumen.pwaFuncional ? '✅' : '❌'}`);

// Guardar reporte
const reportPath = join(rootDir, 'auditoria-produccion-report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Reporte guardado en: ${reportPath}`);

// Generar HTML
const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auditoría de Producción - ComerECO</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #10b981; }
    h2 { color: #333; margin-top: 30px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
    .success { background: #d1fae5; color: #065f46; }
    .error { background: #fee2e2; color: #991b1b; }
    .warning { background: #fef3c7; color: #92400e; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #10b981; color: white; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 20px; background: #f3f4f6; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Auditoría de Producción - ComerECO</h1>
    <p><strong>Fecha:</strong> ${new Date(report.timestamp).toLocaleString('es-MX')}</p>
    
    <div class="status ${report.resumen.estadoGeneral.includes('LISTO') ? 'success' : 'error'}">
      <h2>Estado General: ${report.resumen.estadoGeneral}</h2>
    </div>
    
    <h2>📋 Entorno</h2>
    <table>
      <tr><th>Item</th><th>Valor</th><th>Estado</th></tr>
      <tr><td>Node Version</td><td>${report.entorno.nodeVersion}</td><td>${report.entorno.cumpleRequisito ? '✅' : '❌'}</td></tr>
      <tr><td>npm Version</td><td>${report.entorno.npmVersion}</td><td>✅</td></tr>
    </table>
    
    <h2>🧪 Tests</h2>
    <table>
      <tr><th>Suite</th><th>Estado</th><th>Duración</th><th>Passed</th><th>Failed</th></tr>
      ${Object.entries(report.tests).map(([name, data]) => `
        <tr>
          <td>${name}</td>
          <td>${data.estado}</td>
          <td>${data.duracion}</td>
          <td>${data.passed || 0}</td>
          <td>${data.failed || 0}</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>🚀 PWA</h2>
    <div class="metric">
      <strong>Service Worker:</strong> ${report.pwa.serviceWorker?.registered ? '✅ Registrado' : '❌ No registrado'}
    </div>
    <div class="metric">
      <strong>Offline:</strong> ${report.pwa.offline?.funciona ? '✅ Funciona' : '❌ No funciona'}
    </div>
    <div class="metric">
      <strong>Manifest:</strong> ${report.pwa.manifest ? '✅ Presente' : '❌ Faltante'}
    </div>
    
    <h2>📊 Performance</h2>
    <div class="metric">
      <strong>DOM Content Loaded:</strong> ${report.performance.domContentLoaded?.toFixed(2) || 'N/A'}ms
    </div>
    <div class="metric">
      <strong>Load Complete:</strong> ${report.performance.loadComplete?.toFixed(2) || 'N/A'}ms
    </div>
    <div class="metric">
      <strong>Total Time:</strong> ${report.performance.totalTime?.toFixed(2) || 'N/A'}ms
    </div>
    
    ${report.problemas.length > 0 ? `
    <h2>❌ Problemas Encontrados</h2>
    <ul>
      ${report.problemas.map(p => `<li>${p}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${report.warnings.length > 0 ? `
    <h2>⚠️ Warnings</h2>
    <ul>
      ${report.warnings.map(w => `<li>${w}</li>`).join('')}
    </ul>
    ` : ''}
  </div>
</body>
</html>
`;

const htmlPath = join(rootDir, 'auditoria-produccion-report.html');
writeFileSync(htmlPath, htmlReport);
console.log(`📄 Reporte HTML guardado en: ${htmlPath}`);

process.exit(report.problemas.length > 0 ? 1 : 0);

