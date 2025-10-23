#!/usr/bin/env node

/*
  publish-webroot.cjs
  After a frontend build, copy the minimal set of built files from dist/ to the repo root
  and stage them for commit, even if ignored. This replicates the old workflow so that a
  simple `npm run build` in Codespaces is followed by `git commit && git push` and the
  server can `git pull` without building.

  What it does:
  - Deletes old hashed JS/CSS chunks in the repo root matching known patterns
  - Copies dist/index.html and hashed assets (index-*.js/css and vendors chunks) to the root
  - Force-adds them with git so they are staged for commit

  Safe by default:
  - Only touches known hashed patterns and index.html in repo root
*/

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function run(cmd) {
  try {
    return cp.execSync(cmd, { stdio: 'pipe' }).toString();
  } catch (e) {
    return e.stdout ? e.stdout.toString() : '';
  }
}

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('publish-webroot: dist/ not found. Run `npm run build` first.');
  process.exit(0);
}

const rootFiles = fs.readdirSync(repoRoot);
const hashedPatterns = [
  /^index-[A-Za-z0-9._-]+\.js$/,
  /^index-[A-Za-z0-9._-]+\.css$/,
  // vendor chunk names
  /^react-vendors-[A-Za-z0-9._-]+\.js$/,
  /^ui-vendors-[A-Za-z0-9._-]+\.js$/,
  /^chart-vendors-[A-Za-z0-9._-]+\.js$/,
  // plain chunk names emitted by rollupOptions.manualChunks
  /^icons-[A-Za-z0-9._-]+\.js$/,
  /^utils-[A-Za-z0-9._-]+\.js$/
];

function isHashedAsset(name) {
  return hashedPatterns.some((re) => re.test(name));
}

// 1) Remove old hashed assets at root (keep .htaccess and other sources intact)
for (const name of rootFiles) {
  if (isHashedAsset(name)) {
    try {
      fs.unlinkSync(path.join(repoRoot, name));
    } catch (_) {}
  }
}

// 2) Copy new built files from dist to root (only hashed assets, NOT index.html)
const distFiles = fs.readdirSync(distDir);
const toCopy = distFiles.filter((name) => isHashedAsset(name));

for (const name of toCopy) {
  fs.copyFileSync(path.join(distDir, name), path.join(repoRoot, name));
}

// 3) Stage them for commit (force add in case of ignore rules)
if (toCopy.length > 0) {
  const filesArg = toCopy.map((f) => `'${f}'`).join(' ');
  const out = run(`git add -f ${filesArg}`);
  if (out) process.stdout.write(out);
  console.log(`publish-webroot: staged ${toCopy.length} file(s):`);
  for (const f of toCopy) console.log(`  - ${f}`);
} else {
  console.log('publish-webroot: nothing to copy/stage.');
}
