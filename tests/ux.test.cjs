const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'ux-refresh.css'), 'utf8');

function position(fragment) {
  const index = html.indexOf(fragment);
  assert.ok(index >= 0, `${fragment} should exist`);
  return index;
}

test('forecast prioritizes decision and action before secondary detail', () => {
  const order = [
    'hero-card',
    'best-time-card',
    'advice-card',
    'companion-card',
    'timeline-card',
    'week-card',
    'feedback-card'
  ].map(position);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('mobile UX keeps large touch targets and narrow-screen fallback', () => {
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /:focus-visible/);
});

test('secondary data notes are collapsed behind a disclosure', () => {
  assert.match(html, /<details class="footer-details">/);
  assert.match(html, /예보 기준과 데이터 안내/);
});
