#!/usr/bin/env node

/**
 * Genera informe final completo de auditoría
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const requiredSecrets = ['PLAYWRIGHT_TEST_EMAIL', 'PLAYWRIGHT_TEST_PASSWORD'];
const missingSecrets = requiredSecrets.filter((key) => !process.env[key] || !process.env[key]?.trim());

if (missingSecrets.length) {
  console.error(`❌ Faltan variables sensibles: ${missingSecrets.join(', ')}. Configúralas antes de continuar.`);
  process.exit(1);
}

const PLAYWRIGHT_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL.trim();
const PLAYWRIGHT_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD.trim();

const informe = {
  timestamp: new Date().toISOString(),
  resumenEjecutivo: {},
  entorno: {},
  dependencias: {},
  variables: {},
  tests: {},
  pwa: {},
  performance: {},
  problemas: [],
  warnings: [],
  proximosPasos: []
};

console.log('📊 GENERANDO INFORME FINAL DE AUDITORÍA\n');
console.log('='.repeat(60));

// 1. Entorno
console.log('\n1. Recolectando información de entorno...');
const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
const minorVersion = parseInt(nodeVersion.replace('v', '').split('.')[1]);

informe.entorno = {
  nodeVersion,
  npmVersion,
  cumpleRequisito: majorVersion > 18 || (majorVersion === 18 && minorVersion >= 18),
  nvm: 'No verificado (no necesario con Node >=18.18)'
};

// 2. Dependencias
console.log('2. Verificando dependencias...');
informe.dependencias = {
  instaladas: existsSync(join(rootDir, 'node_modules')),
  packageLock: existsSync(join(rootDir, 'package-lock.json'))
};

// 3. Variables
console.log('3. Verificando variables de entorno...');
informe.variables = {
  PLAYWRIGHT_TEST_EMAIL: '✅ Configurada',
  PLAYWRIGHT_TEST_PASSWORD: '✅ Configurada'
};

// 4. Tests - leer resultados
console.log('4. Recolectando resultados de tests...');

// Ejecutar tests y capturar resultados
const testResults = {
  smoke: { estado: 'PENDIENTE', duracion: '0s', passed: 0, failed: 0 },
  routes: { estado: 'PENDIENTE', duracion: '0s', passed: 0, failed: 0 },
  sync: { estado: 'PENDIENTE', duracion: '0s', passed: 0, failed: 0 },
  performance: { estado: 'PENDIENTE', duracion: '0s', passed: 0, failed: 0 }
};

// Ejecutar smoke
try {
  const start = Date.now();
  const output = execSync('npm run test:smoke', { 
    encoding: 'utf-8', 
    cwd: rootDir,
    env: { ...process.env, PLAYWRIGHT_TEST_EMAIL: PLAYWRIGHT_EMAIL, PLAYWRIGHT_TEST_PASSWORD: PLAYWRIGHT_PASSWORD },
    timeout: 60000
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const passed = (output.match(/passed/g) || []).length;
  const failed = (output.match(/failed/g) || []).length;
  testResults.smoke = { estado: failed === 0 ? '✅ PASÓ' : '❌ FALLÓ', duracion: `${duration}s`, passed, failed };
} catch (error) {
  testResults.smoke = { estado: '❌ ERROR', duracion: 'N/A', error: error.message.substring(0, 200) };
}

// Ejecutar routes
try {
  const start = Date.now();
  const output = execSync('npm run test:routes -- --project=chromium --workers=1', { 
    encoding: 'utf-8', 
    cwd: rootDir,
    env: { ...process.env, PLAYWRIGHT_TEST_EMAIL: PLAYWRIGHT_EMAIL, PLAYWRIGHT_TEST_PASSWORD: PLAYWRIGHT_PASSWORD },
    timeout: 300000
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const passed = (output.match(/passed/g) || []).length;
  const failed = (output.match(/failed/g) || []).length;
  testResults.routes = { estado: failed === 0 ? '✅ PASÓ' : '❌ FALLÓ', duracion: `${duration}s`, passed, failed };
} catch (error) {
  testResults.routes = { estado: '❌ ERROR', duracion: 'N/A', error: error.message.substring(0, 200) };
}

// Ejecutar sync
try {
  const start = Date.now();
  const output = execSync('npm run test:sync -- --project=chromium --workers=1', { 
    encoding: 'utf-8', 
    cwd: rootDir,
    env: { ...process.env, PLAYWRIGHT_TEST_EMAIL: PLAYWRIGHT_EMAIL, PLAYWRIGHT_TEST_PASSWORD: PLAYWRIGHT_PASSWORD },
    timeout: 300000
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const passed = (output.match(/passed/g) || []).length;
  const failed = (output.match(/failed/g) || []).length;
  testResults.sync = { estado: failed === 0 ? '✅ PASÓ' : '❌ FALLÓ', duracion: `${duration}s`, passed, failed };
} catch (error) {
  testResults.sync = { estado: '❌ ERROR', duracion: 'N/A', error: error.message.substring(0, 200) };
}

// Ejecutar performance
try {
  const start = Date.now();
  const output = execSync('npm run test:performance -- --project=chromium --workers=1', { 
    encoding: 'utf-8', 
    cwd: rootDir,
    env: { ...process.env, PLAYWRIGHT_TEST_EMAIL: PLAYWRIGHT_EMAIL, PLAYWRIGHT_TEST_PASSWORD: PLAYWRIGHT_PASSWORD },
    timeout: 300000
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  const passed = (output.match(/passed/g) || []).length;
  const failed = (output.match(/failed/g) || []).length;
  testResults.performance = { estado: failed === 0 ? '✅ PASÓ' : '❌ FALLÓ', duracion: `${duration}s`, passed, failed };
} catch (error) {
  testResults.performance = { estado: '❌ ERROR', duracion: 'N/A', error: error.message.substring(0, 200) };
}

informe.tests = testResults;

// 5. Verificar PWA en producción
console.log('5. Verificando PWA en producción...');

// Asegurar que hay build
if (!existsSync(join(rootDir, 'dist'))) {
  console.log('   Ejecutando build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });
}

// Iniciar preview
execSync('pkill -f "vite preview" || true', { cwd: rootDir });
execSync('npm run preview > /dev/null 2>&1 &', { cwd: rootDir });
await new Promise(resolve => setTimeout(resolve, 5000));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Service Worker
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
  
  informe.pwa.serviceWorker = swStatus;
  
  // Manifest
  const manifestLink = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);
  if (manifestLink) {
    const manifestResponse = await page.goto(manifestLink);
    if (manifestResponse.ok()) {
      const manifest = await manifestResponse.json();
      informe.pwa.manifest = {
        name: manifest.name,
        icons: manifest.icons?.length || 0,
        shortcuts: manifest.shortcuts?.length || 0,
        display: manifest.display
      };
    }
  }
  
  // Offline
  await context.setOffline(true);
  try {
    const offlineResponse = await page.goto('http://localhost:4173', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    informe.pwa.offline = { funciona: offlineResponse?.status() === 200 };
  } catch {
    const hasContent = await page.evaluate(() => document.body.textContent.length > 0);
    informe.pwa.offline = { funciona: hasContent };
  }
  await context.setOffline(false);
  
  // Performance
  const perfMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    };
  });
  
  informe.performance = perfMetrics;
  
  await browser.close();
} catch (error) {
  informe.problemas.push(`Error verificando PWA: ${error.message}`);
  await browser.close();
}

// Resumen ejecutivo
const totalTests = Object.values(testResults).reduce((sum, t) => sum + (t.passed || 0) + (t.failed || 0), 0);
const totalPassed = Object.values(testResults).reduce((sum, t) => sum + (t.passed || 0), 0);
const totalFailed = Object.values(testResults).reduce((sum, t) => sum + (t.failed || 0), 0);

informe.resumenEjecutivo = {
  estadoGeneral: totalFailed === 0 && informe.pwa.serviceWorker?.registered ? '✅ LISTO PARA PRODUCCIÓN' : '⚠️ REQUIERE ATENCIÓN',
  totalTests,
  totalPassed,
  totalFailed,
  pwaFuncional: informe.pwa.serviceWorker?.registered && informe.pwa.offline?.funciona,
  problemasEncontrados: informe.problemas.length
};

// Proximos pasos
if (totalFailed > 0) {
  informe.proximosPasos.push('Corregir tests fallidos');
}
if (!informe.pwa.serviceWorker?.registered) {
  informe.proximosPasos.push('Verificar registro de Service Worker en producción');
}
if (!informe.pwa.offline?.funciona) {
  informe.proximosPasos.push('Verificar funcionalidad offline');
}
informe.proximosPasos.push('Ejecutar Lighthouse audit manualmente');
informe.proximosPasos.push('Probar instalación PWA en diferentes dispositivos');

// Guardar informe JSON
const jsonPath = join(rootDir, 'informe-auditoria-final.json');
writeFileSync(jsonPath, JSON.stringify(informe, null, 2));

// Generar informe HTML
const htmlReport = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Auditoría - ComerECO</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #10b981; margin-bottom: 10px; }
    .timestamp { color: #666; margin-bottom: 30px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 20px 0; }
    .success { background: #d1fae5; color: #065f46; }
    .warning { background: #fef3c7; color: #92400e; }
    .error { background: #fee2e2; color: #991b1b; }
    h2 { color: #333; margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #10b981; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #10b981; color: white; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px 25px; background: #f3f4f6; border-radius: 6px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #10b981; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    ul { margin: 10px 0 10px 20px; }
    li { margin: 5px 0; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
    .section { margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Informe de Auditoría Completa - ComerECO</h1>
    <p class="timestamp"><strong>Fecha:</strong> ${new Date(informe.timestamp).toLocaleString('es-MX')}</p>
    
    <div class="status-badge ${informe.resumenEjecutivo.estadoGeneral.includes('LISTO') ? 'success' : 'warning'}">
      ${informe.resumenEjecutivo.estadoGeneral}
    </div>
    
    <div class="section">
      <div class="metric">
        <div class="metric-value">${informe.resumenEjecutivo.totalPassed}/${informe.resumenEjecutivo.totalTests}</div>
        <div class="metric-label">Tests Pasados</div>
      </div>
      <div class="metric">
        <div class="metric-value">${informe.resumenEjecutivo.totalFailed}</div>
        <div class="metric-label">Tests Fallidos</div>
      </div>
      <div class="metric">
        <div class="metric-value">${informe.pwa.serviceWorker?.registered ? '✅' : '❌'}</div>
        <div class="metric-label">Service Worker</div>
      </div>
      <div class="metric">
        <div class="metric-value">${informe.pwa.offline?.funciona ? '✅' : '❌'}</div>
        <div class="metric-label">Offline</div>
      </div>
    </div>
    
    <h2>📋 Entorno</h2>
    <table>
      <tr><th>Item</th><th>Valor</th><th>Estado</th></tr>
      <tr><td>Node Version</td><td>${informe.entorno.nodeVersion}</td><td>${informe.entorno.cumpleRequisito ? '✅' : '❌'}</td></tr>
      <tr><td>npm Version</td><td>${informe.entorno.npmVersion}</td><td>✅</td></tr>
      <tr><td>nvm</td><td>${informe.entorno.nvm}</td><td>✅</td></tr>
    </table>
    
    <h2>🧪 Resultados de Tests</h2>
    <table>
      <tr><th>Suite</th><th>Estado</th><th>Duración</th><th>Passed</th><th>Failed</th></tr>
      ${Object.entries(informe.tests).map(([name, data]) => `
        <tr>
          <td><strong>${name}</strong></td>
          <td>${data.estado}</td>
          <td>${data.duracion}</td>
          <td>${data.passed || 0}</td>
          <td>${data.failed || 0}</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>🚀 PWA</h2>
    <div class="section">
      <p><strong>Service Worker:</strong> ${informe.pwa.serviceWorker?.registered ? '✅ Registrado' : '❌ No registrado'}</p>
      ${informe.pwa.serviceWorker?.scope ? `<p><strong>Scope:</strong> ${informe.pwa.serviceWorker.scope}</p>` : ''}
      ${informe.pwa.serviceWorker?.state ? `<p><strong>State:</strong> ${informe.pwa.serviceWorker.state}</p>` : ''}
      
      <p><strong>Manifest:</strong> ${informe.pwa.manifest ? '✅ Presente' : '❌ Faltante'}</p>
      ${informe.pwa.manifest ? `
        <ul>
          <li>Name: ${informe.pwa.manifest.name}</li>
          <li>Icons: ${informe.pwa.manifest.icons}</li>
          <li>Shortcuts: ${informe.pwa.manifest.shortcuts}</li>
          <li>Display: ${informe.pwa.manifest.display}</li>
        </ul>
      ` : ''}
      
      <p><strong>Offline:</strong> ${informe.pwa.offline?.funciona ? '✅ Funciona' : '❌ No funciona'}</p>
    </div>
    
    <h2>📊 Performance</h2>
    <div class="section">
      <div class="metric">
        <div class="metric-value">${informe.performance.domContentLoaded?.toFixed(0) || 'N/A'}ms</div>
        <div class="metric-label">DOM Content Loaded</div>
      </div>
      <div class="metric">
        <div class="metric-value">${informe.performance.loadComplete?.toFixed(0) || 'N/A'}ms</div>
        <div class="metric-label">Load Complete</div>
      </div>
      <div class="metric">
        <div class="metric-value">${informe.performance.totalTime?.toFixed(0) || 'N/A'}ms</div>
        <div class="metric-label">Total Time</div>
      </div>
    </div>
    
    ${informe.problemas.length > 0 ? `
    <h2>❌ Problemas Encontrados</h2>
    <ul>
      ${informe.problemas.map(p => `<li>${p}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${informe.warnings.length > 0 ? `
    <h2>⚠️ Warnings</h2>
    <ul>
      ${informe.warnings.map(w => `<li>${w}</li>`).join('')}
    </ul>
    ` : ''}
    
    <h2>📝 Próximos Pasos</h2>
    <ol>
      ${informe.proximosPasos.map(p => `<li>${p}</li>`).join('')}
    </ol>
    
    <h2>📄 Reportes</h2>
    <p>Para ver el reporte HTML de Playwright:</p>
    <pre>npx playwright show-report</pre>
    
    <p>Para ejecutar Lighthouse manualmente:</p>
    <ol>
      <li>Abre http://localhost:4173 en Chrome</li>
      <li>DevTools → Lighthouse</li>
      <li>Selecciona PWA y Performance</li>
      <li>Click en Generate report</li>
    </ol>
  </div>
</body>
</html>
`;

const htmlPath = join(rootDir, 'informe-auditoria-final.html');
writeFileSync(htmlPath, htmlReport);

console.log('\n' + '='.repeat(60));
console.log('✅ INFORME GENERADO');
console.log('='.repeat(60));
console.log(`📄 JSON: ${jsonPath}`);
console.log(`📄 HTML: ${htmlPath}`);
console.log(`\nEstado General: ${informe.resumenEjecutivo.estadoGeneral}`);
console.log(`Tests: ${totalPassed}/${totalTests} pasaron`);

process.exit(0);
