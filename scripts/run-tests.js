#!/usr/bin/env node

/**
 * Test runner script for Icemap plugin
 * Usage: node scripts/run-tests.js [options]
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const options = {
  visual: args.includes('--visual'),
  headed: args.includes('--headed'),
  update: args.includes('--update'),
  help: args.includes('--help')
};

if (options.help) {
  console.log(`
Icemap Plugin Test Runner

Usage: node scripts/run-tests.js [options]

Options:
  --visual    Run only visual regression tests
  --headed    Run tests in headed mode (browser visible)
  --update    Update screenshot baselines
  --help      Show this help message
`);
  process.exit(0);
}

const commandArgs = ['playwright', 'test'];

if (options.visual) {
  commandArgs.push('--grep', '@visual');
}

if (options.headed) {
  commandArgs.push('--headed');
}

if (options.update) {
  commandArgs.push('--update-snapshots');
}

console.log(`Running: npx ${commandArgs.join(' ')}\n`);

const testProcess = spawn('npx', commandArgs, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

testProcess.on('close', (code) => {
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Failed to start test process:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  testProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  testProcess.kill('SIGTERM');
});
