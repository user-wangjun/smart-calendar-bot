import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  backend: {
    host: process.env.MCP_SERVER_HOST || '127.0.0.1',
    port: process.env.MCP_SERVER_PORT || 3001,
    healthPath: '/health'
  },
  mongodb: {
    host: process.env.MCP_DB_HOST || '127.0.0.1',
    port: process.env.MCP_DB_PORT || 27017
  },
  logFile: path.join(__dirname, '../mcp-services/logs/health-check.log'),
  alertFile: path.join(__dirname, '../mcp-services/logs/alerts.log')
};

// Logger helper
function log (message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(CONFIG.logFile, logMessage);

  if (type === 'ERROR' || type === 'CRITICAL') {
    fs.appendFileSync(CONFIG.alertFile, logMessage);
  }
}

// Check TCP connection
function checkPort (host, port, name) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to ${name} (${host}:${port}) timed out`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`Connection to ${name} (${host}:${port}) failed: ${err.message}`));
    });

    socket.connect(port, host);
  });
}

// Check HTTP endpoint
function checkHttp (host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port,
      path,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(JSON.parse(data)));
      } else {
        reject(new Error(`HTTP Health Check failed with status: ${res.statusCode}`));
      }
    });

    req.on('error', (e) => reject(new Error(`HTTP Request failed: ${e.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP Request timed out'));
    });

    req.end();
  });
}

async function runHealthCheck () {
  log('Starting System Health Check...', 'INFO');

  let hasErrors = false;

  // 1. Check MongoDB
  try {
    await checkPort(CONFIG.mongodb.host, CONFIG.mongodb.port, 'MongoDB');
    log('MongoDB Connection: OK', 'SUCCESS');
  } catch (error) {
    log(`MongoDB Connection: FAILED - ${error.message}`, 'CRITICAL');
    hasErrors = true;
  }

  // 2. Check Backend Service Port
  try {
    await checkPort(CONFIG.backend.host, CONFIG.backend.port, 'Backend Service TCP');
    log('Backend TCP Connection: OK', 'SUCCESS');
  } catch (error) {
    log(`Backend TCP Connection: FAILED - ${error.message}`, 'ERROR');
    hasErrors = true;
  }

  // 3. Check Backend API Health
  if (!hasErrors) { // Only check API if TCP is up
    try {
      const health = await checkHttp(CONFIG.backend.host, CONFIG.backend.port, CONFIG.backend.healthPath);
      log(`Backend API Health: OK (Status: ${health.status}, Uptime: ${health.uptime.toFixed(2)}s)`, 'SUCCESS');
    } catch (error) {
      log(`Backend API Health: FAILED - ${error.message}`, 'CRITICAL');
      hasErrors = true;
    }
  }

  // 4. System Resources (Basic)
  const memUsage = process.memoryUsage();
  log(`Health Check Process Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, 'INFO');

  if (hasErrors) {
    log('System Health Check completed with ERRORS', 'WARNING');
    process.exit(1);
  } else {
    log('System Health Check completed SUCCESSFULLY', 'SUCCESS');
    process.exit(0);
  }
}

// Ensure log directory exists
const logDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

runHealthCheck();
