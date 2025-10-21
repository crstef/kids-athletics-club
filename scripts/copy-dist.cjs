#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy dist/assets to root/assets
const distAssetsPath = path.join(__dirname, '../dist/assets');
const rootAssetsPath = path.join(__dirname, '../assets');

if (fs.existsSync(distAssetsPath)) {
  // Remove existing assets if any
  if (fs.existsSync(rootAssetsPath)) {
    fs.rmSync(rootAssetsPath, { recursive: true });
  }
  
  // Copy dist/assets to root/assets
  fs.cpSync(distAssetsPath, rootAssetsPath, { recursive: true });
  console.log('✓ Copied dist/assets to root/assets');
}

// Copy dist/index.html to root/index.html
const distIndexPath = path.join(__dirname, '../dist/index.html');
const rootIndexPath = path.join(__dirname, '../index.html');

if (fs.existsSync(distIndexPath)) {
  fs.copyFileSync(distIndexPath, rootIndexPath);
  console.log('✓ Copied dist/index.html to root/index.html');
}

console.log('✓ Build artifacts ready for deployment');
