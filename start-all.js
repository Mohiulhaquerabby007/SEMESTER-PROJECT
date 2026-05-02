const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting QuickDrop Full Stack (Frontend & Backend)...');

// Start Backend
const backend = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start Frontend
const frontend = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

backend.on('close', (code) => console.log(`Backend exited with code ${code}`));
frontend.on('close', (code) => console.log(`Frontend exited with code ${code}`));
