const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readRootFile(name) {
  return fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
}

function parseStaticAssets(serviceWorkerSource) {
  const match = serviceWorkerSource.match(/const STATIC_ASSETS=(\[[^;]+\]);/);
  assert.ok(match, 'STATIC_ASSETS declaration must exist');
  return Function(`"use strict"; return ${match[1]};`)();
}

function collectIndexBootAssets(indexHtml) {
  const assets = new Set();
  for (const match of indexHtml.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    if (match[1].startsWith('/')) assets.add(match[1]);
  }
  for (const match of indexHtml.matchAll(/<link[^>]+href="([^"]+\.css)"/g)) {
    if (match[1].startsWith('/')) assets.add(match[1]);
  }
  return [...assets];
}

test('service worker precaches every local boot script and stylesheet', () => {
  const indexHtml = readRootFile('index.html');
  const serviceWorkerSource = readRootFile('sw.js');
  const cached = new Set(parseStaticAssets(serviceWorkerSource));
  const required = collectIndexBootAssets(indexHtml);

  assert.ok(required.length > 0, 'index.html must expose local boot assets');
  assert.deepEqual(required.filter((asset) => !cached.has(asset)), []);
});
