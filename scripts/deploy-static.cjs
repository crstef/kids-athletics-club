#!/usr/bin/env node

/*
  Deploy static build to a target directory.
  Usage:
    DEPLOY_DIR=/path/to/public_html node scripts/deploy-static.cjs
    # or pass as arg
    node scripts/deploy-static.cjs /path/to/public_html

  Behavior:
  - Ensures dist/ exists
  - Preserves an existing .htaccess in target (if present)
  - Clears target directory contents
  - Copies all files from dist/ into target
*/

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const targetArg = process.argv[2];
const targetEnv = process.env.DEPLOY_DIR;
const targetDir = targetArg || targetEnv;

if (!targetDir) {
  console.error('ERROR: DEPLOY_DIR not set and no target directory argument provided.');
  console.error('Usage: DEPLOY_DIR=/path/to/public_html npm run deploy:static');
  console.error('   or: node scripts/deploy-static.cjs /path/to/public_html');
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error(`ERROR: Build output not found: ${distDir}`);
  console.error('Run: npm run build');
  process.exit(1);
}

const resolvedTarget = path.resolve(targetDir);
if (!fs.existsSync(resolvedTarget)) {
  fs.mkdirSync(resolvedTarget, { recursive: true });
}

// Preserve .htaccess if present
const htaccessPath = path.join(resolvedTarget, '.htaccess');
let htaccessBackup = null;
if (fs.existsSync(htaccessPath)) {
  htaccessBackup = fs.readFileSync(htaccessPath);
}

// Clean target directory contents (but keep directory itself)
for (const entry of fs.readdirSync(resolvedTarget)) {
  if (entry === '.' || entry === '..') continue;
  if (entry === '.htaccess') continue; // will restore later anyway
  const entryPath = path.join(resolvedTarget, entry);
  fs.rmSync(entryPath, { recursive: true, force: true });
}

// Copy dist -> target
fs.cpSync(distDir, resolvedTarget, { recursive: true });

// Restore .htaccess if it existed
if (htaccessBackup) {
  fs.writeFileSync(htaccessPath, htaccessBackup);
}

console.log(`✓ Deployed dist/ to ${resolvedTarget}`);
