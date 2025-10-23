#!/usr/bin/env node

// Ensure root index.html is the dev entry (loads /src/main.tsx) before vite build
// Copies from src/index.html to ./index.html if contents differ.

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcIndex = path.join(repoRoot, 'src/index.html');
const rootIndex = path.join(repoRoot, 'index.html');

try {
  if (!fs.existsSync(srcIndex)) {
    console.error('ensure-dev-index: src/index.html not found');
    process.exit(0);
  }
  const src = fs.readFileSync(srcIndex, 'utf8');
  const root = fs.existsSync(rootIndex) ? fs.readFileSync(rootIndex, 'utf8') : '';
  if (src !== root) {
    fs.writeFileSync(rootIndex, src, 'utf8');
    console.log('ensure-dev-index: restored dev index.html from src/index.html');
  } else {
    console.log('ensure-dev-index: dev index.html already in place');
  }
} catch (e) {
  console.error('ensure-dev-index: error', e.message);
}
