/**
 * 📝 SISTEMA DE LOGGING
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config) {
    this.config = config;
    this.level = config.logging?.level || 'info';
    this.saveToFile = config.logging?.saveToFile !== false;
    this.logFile = null;

    if (this.saveToFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      // Resolve from scripts/ directory (parent of core/)
      const logsDir = path.resolve(__dirname, '..', config.paths.logs);

      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      this.logFile = path.join(logsDir, `migration_${timestamp}.log`);
    }

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.currentLevel = this.levels[this.level] || 2;
  }

  _write(level, ...args) {
    if (this.levels[level] > this.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const fullMessage = `${prefix} ${message}`;

    // Console output
    console.log(fullMessage);

    // File output
    if (this.saveToFile && this.logFile) {
      fs.appendFileSync(this.logFile, fullMessage + '\n');
    }
  }

  error(...args) {
    this._write('error', ...args);
  }

  warn(...args) {
    this._write('warn', ...args);
  }

  info(...args) {
    this._write('info', ...args);
  }

  debug(...args) {
    this._write('debug', ...args);
  }

  section(title) {
    const separator = '═'.repeat(60);
    this.info('');
    this.info(separator);
    this.info(title);
    this.info(separator);
  }

  subsection(title) {
    this.info('');
    this.info(`─── ${title}`);
  }

  success(message) {
    this.info(`✅ ${message}`);
  }

  failure(message) {
    this.error(`❌ ${message}`);
  }

  progress(current, total, item = '') {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    this.info(`[${bar}] ${percentage}% (${current}/${total}) ${item}`);
  }

  summary(stats) {
    this.section('📊 RESUMEN DE MIGRACIÓN');
    Object.entries(stats).forEach(([key, value]) => {
      this.info(`   ${key}: ${value}`);
    });
  }
}

module.exports = Logger;
