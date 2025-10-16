#!/usr/bin/env node

/**
 * cPanel Entry Point for License Management System
 * This file is required by cPanel's Node.js Selector to start the application.
 * It spawns tsx to run the TypeScript server.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the TypeScript server using tsx
const serverPath = join(__dirname, 'server', 'index.ts');
const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');

const server = spawn(tsxPath, [serverPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
