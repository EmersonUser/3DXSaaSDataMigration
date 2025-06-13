import fs from 'fs';
import path from 'path';
import util from 'util';
import { fileURLToPath } from 'url';

// Define the absolute path for the log file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, 'logs', 'app.log');

// Ensure the logs directory exists
const logsDir = path.dirname(logFilePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream (append mode)
const logFile = fs.createWriteStream(logFilePath, { flags: 'a' });

// Override console methods
console.log = function (...args) {
  logFile.write(`[LOG] ${new Date().toISOString()} ${util.format(...args)}\n`);
  process.stdout.write(`[LOG] ${util.format(...args)}\n`);
};

console.error = function (...args) {
  logFile.write(`[ERROR] ${new Date().toISOString()} ${util.format(...args)}\n`);
  process.stderr.write(`[ERROR] ${util.format(...args)}\n`);
};