const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'delight.css'), 'utf8');

test('generated fairy artwork is inset and clipped inside its visual hosts', () => {
  assert.match(css, /\.fairy-svg \.fairy-artwork\s*\{[\s\S]*transform:\s*scale\(\.9\)/);
  assert.match(css, /\.companion-art\.fairy-host,[\s\S]*\.fairy-book-art,[\s\S]*\.fairy-detail-art\s*\{[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.fairy-svg,[\s\S]*\.hair-roller-svg,[\s\S]*\.mascot-svg\s*\{[\s\S]*overflow:\s*hidden/);
});

test('decorative pseudo elements cannot overlap live mobile copy', () => {
  assert.match(css, /\.app-shell \.topbar::after,[\s\S]*\.hero-card\.card::before,[\s\S]*\.companion-card\.card::before\s*\{[\s\S]*content:\s*none/);
  assert.match(css, /\.permission-card\.card::after\s*\{[\s\S]*content:\s*none/);
});

test('revealed fairy copy keeps a bounded text column on phones', () => {
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.companion-card \.companion-copy\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\) 100px/);
  assert.match(css, /\.companion-card \.companion-copy > div:first-child,[\s\S]*min-width:\s*0/);
  assert.match(css, /\.companion-card \.companion-message,[\s\S]*overflow-wrap:\s*anywhere/);
});
